import { KVNamespace, CloudflareEnv } from './types/cloudflare';

// Mock KV store for development - using global singletons for persistence
class MockKVNamespace {
  private store: Map<string, string>;
  
  constructor(storeName: string) {
    // Use global to persist data across requests in development
    if (!(global as any).__mockKVStores) {
      (global as any).__mockKVStores = {};
    }
    if (!(global as any).__mockKVStores[storeName]) {
      (global as any).__mockKVStores[storeName] = new Map<string, string>();
    }
    this.store = (global as any).__mockKVStores[storeName];
  }
  
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }
  
  async put(key: string, value: string, options?: any): Promise<void> {
    this.store.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async list(options?: any): Promise<{ keys: Array<{ name: string }> }> {
    const keys = Array.from(this.store.keys());
    const prefix = options?.prefix || '';
    const filteredKeys = keys.filter(key => key.startsWith(prefix));
    const limit = options?.limit || 1000; // Cloudflare KV limit
    
    return {
      keys: filteredKeys.slice(0, limit).map(name => ({ name }))
    };
  }
}

export class KVService {
  private main: KVNamespace | MockKVNamespace;
  private analytics: KVNamespace | MockKVNamespace;
  private cache: KVNamespace | MockKVNamespace;
  
  constructor(private env: CloudflareEnv) {
    // Prioritize real KV bindings, fallback to mock for pure local development
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace('main');
    this.analytics = env.BUZZLINE_ANALYTICS || new MockKVNamespace('analytics');
    this.cache = env.BUZZLINE_CACHE || new MockKVNamespace('cache');
    
    // Log which storage type we're using
    console.log('KV Service initialized:', {
      main: env.BUZZLINE_MAIN ? 'Cloudflare KV' : 'Mock KV',
      analytics: env.BUZZLINE_ANALYTICS ? 'Cloudflare KV' : 'Mock KV',
      cache: env.BUZZLINE_CACHE ? 'Cloudflare KV' : 'Mock KV'
    });
  }

  // Key patterns for organization-scoped data
  private getOrgKey(orgId: string, type: string, id?: string): string {
    return id ? `org:${orgId}:${type}:${id}` : `org:${orgId}:${type}`;
  }

  private getUserKey(orgId: string, userId: string): string {
    return `org:${orgId}:user:${userId}`;
  }

  // Organization management
  async createOrganization(orgId: string, data: any) {
    const key = this.getOrgKey(orgId, 'info');
    await this.main.put(key, JSON.stringify(data));
  }

  async getOrganization(orgId: string) {
    const key = this.getOrgKey(orgId, 'info');
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Contact management
  async createContact(orgId: string, contactId: string, contact: any) {
    const key = this.getOrgKey(orgId, 'contact', contactId);
    await this.main.put(key, JSON.stringify({
      ...contact,
      id: contactId,
      orgId,
      createdAt: new Date().toISOString(),
      optedOut: false
    }));
  }

  async getContact(orgId: string, contactId: string) {
    const key = this.getOrgKey(orgId, 'contact', contactId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateContactOptOut(orgId: string, contactId: string, optedOut: boolean) {
    const contact = await this.getContact(orgId, contactId);
    if (contact) {
      contact.optedOut = optedOut;
      contact.optedOutAt = optedOut ? new Date().toISOString() : null;
      const key = this.getOrgKey(orgId, 'contact', contactId);
      await this.main.put(key, JSON.stringify(contact));
    }
  }

  async listContacts(orgId: string, limit = 1000) {
    const prefix = this.getOrgKey(orgId, 'contact', '');
    const contacts: any[] = [];
    let cursor: string | undefined = undefined;
    
    // Paginate through all contacts
    do {
      const list: any = await this.main.list({ 
        prefix, 
        limit: Math.min(limit - contacts.length, 1000), // Respect KV API limit
        cursor 
      });
      
      const batchContacts = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          const data = await this.main.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );
      
      contacts.push(...batchContacts.filter(Boolean));
      cursor = list.list_complete ? undefined : list.cursor;
      
    } while (cursor && contacts.length < limit);
    
    return contacts;
  }

  async getContactsCount(orgId: string): Promise<number> {
    const prefix = this.getOrgKey(orgId, 'contact', '');
    let totalCount = 0;
    let cursor: string | undefined = undefined;
    
    // Count all contacts by paginating through keys only (more efficient)
    do {
      const list: any = await this.main.list({ 
        prefix, 
        limit: 1000,
        cursor 
      });
      
      totalCount += list.keys.length;
      cursor = list.list_complete ? undefined : list.cursor;
      
    } while (cursor);
    
    return totalCount;
  }

  async getContactsPaginated(orgId: string, page: number = 1, limit: number = 50, search?: string) {
    const prefix = this.getOrgKey(orgId, 'contact', '');
    const allContacts: any[] = [];
    let cursor: string | undefined = undefined;
    
    // Get ALL contacts first (we need to do filtering/search in memory since KV doesn't support complex queries)
    do {
      const list: any = await this.main.list({ 
        prefix, 
        limit: 1000,
        cursor 
      });
      
      const batchContacts = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          const data = await this.main.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );
      
      allContacts.push(...batchContacts.filter(Boolean));
      cursor = list.list_complete ? undefined : list.cursor;
      
    } while (cursor);
    
    // Apply search filter if provided
    let filteredContacts = allContacts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = allContacts.filter((contact: any) => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = (contact.email || "").toLowerCase();
        const phone = (contact.phone || "").toLowerCase();
        
        // Also search in metadata
        const metadataText = contact.metadata ? 
          Object.values(contact.metadata).join(" ").toLowerCase() : "";
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower) ||
               metadataText.includes(searchLower);
      });
    }
    
    // Apply pagination
    const totalContacts = filteredContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const offset = (page - 1) * limit;
    const paginatedContacts = filteredContacts.slice(offset, offset + limit);
    
    return {
      contacts: paginatedContacts,
      totalContacts,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async findContactByEmailOrPhone(orgId: string, email?: string, phone?: string) {
    if (!email && !phone) return null;
    
    const prefix = this.getOrgKey(orgId, 'contact', '');
    let cursor: string | undefined = undefined;
    
    // Search through contacts in batches to avoid memory issues with large datasets
    do {
      const list: any = await this.main.list({ 
        prefix, 
        limit: 1000, // Use max KV limit per batch
        cursor 
      });
      
      // Check this batch of contacts
      const batchContacts = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          const data = await this.main.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );
      
      // Look for match in this batch
      const match = batchContacts.find((contact: any) => {
        if (!contact) return false;
        if (email && contact.email && contact.email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
        if (phone && contact.phone && contact.phone === phone) {
          return true;
        }
        return false;
      });
      
      if (match) return match; // Found it, return immediately
      
      cursor = list.list_complete ? undefined : list.cursor;
      
    } while (cursor);
    
    return null; // No match found
  }

  async updateContact(orgId: string, contactId: string, updates: any) {
    const contact = await this.getContact(orgId, contactId);
    if (contact) {
      const updated = { ...contact, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getOrgKey(orgId, 'contact', contactId);
      await this.main.put(key, JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  // Contact List management
  async createContactList(orgId: string, listId: string, listData: any) {
    const key = this.getOrgKey(orgId, 'contactlist', listId);
    await this.main.put(key, JSON.stringify({
      ...listData,
      id: listId,
      orgId,
      createdAt: new Date().toISOString()
    }));
  }

  async getContactList(orgId: string, listId: string) {
    const key = this.getOrgKey(orgId, 'contactlist', listId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  async listContactLists(orgId: string, limit = 100) {
    const prefix = this.getOrgKey(orgId, 'contactlist', '');
    const list = await this.main.list({ prefix, limit });
    const lists = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const data = await this.main.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return lists.filter(Boolean);
  }

  // Campaign management
  async createCampaign(orgId: string, campaignId: string, campaign: any) {
    const key = this.getOrgKey(orgId, 'campaign', campaignId);
    await this.main.put(key, JSON.stringify({
      ...campaign,
      id: campaignId,
      orgId,
      createdAt: new Date().toISOString(),
      status: 'draft'
    }));
  }

  async getCampaign(orgId: string, campaignId: string) {
    const key = this.getOrgKey(orgId, 'campaign', campaignId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateCampaign(orgId: string, campaignId: string, updates: any) {
    const campaign = await this.getCampaign(orgId, campaignId);
    if (campaign) {
      const updated = { ...campaign, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getOrgKey(orgId, 'campaign', campaignId);
      await this.main.put(key, JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  async listCampaigns(orgId: string, limit = 100) {
    const prefix = this.getOrgKey(orgId, 'campaign', '');
    const list = await this.main.list({ prefix, limit });
    const campaigns = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const data = await this.main.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return campaigns.filter(Boolean);
  }

  // Campaign Delivery tracking
  async trackDelivery(orgId: string, campaignId: string, contactId: string, deliveryData: any) {
    const deliveryId = `${campaignId}-${contactId}`;
    const key = `org:${orgId}:delivery:${deliveryId}`;
    await this.analytics.put(key, JSON.stringify({
      ...deliveryData,
      orgId,
      campaignId,
      contactId,
      deliveryId,
      timestamp: new Date().toISOString()
    }));
  }

  async getDeliveryStatus(orgId: string, campaignId: string, contactId: string) {
    const deliveryId = `${campaignId}-${contactId}`;
    const key = `org:${orgId}:delivery:${deliveryId}`;
    const data = await this.analytics.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Analytics
  async getCampaignAnalytics(orgId: string, campaignId: string) {
    const key = `org:${orgId}:analytics:${campaignId}`;
    const data = await this.analytics.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateCampaignAnalytics(orgId: string, campaignId: string, analytics: any) {
    const key = `org:${orgId}:analytics:${campaignId}`;
    await this.analytics.put(key, JSON.stringify({
      ...analytics,
      orgId,
      campaignId,
      updatedAt: new Date().toISOString()
    }));
  }

  // Cache utilities
  async setCache(key: string, data: any, ttl = 3600) {
    await this.cache.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }

  async getCache(key: string) {
    const data = await this.cache.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteCache(key: string) {
    await this.cache.delete(key);
  }

  // Organization Settings and Signature management
  async getOrgSettings(orgId: string) {
    const key = this.getOrgKey(orgId, 'settings');
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : {
      emailSignature: {
        salesPersonName: '',
        salesPersonTitle: '',
        salesPersonPhone: '',
        companyLogoUrl: ''
      },
      companyInfo: {
        name: '',
        website: '',
        address: ''
      }
    };
  }

  async updateOrgSettings(orgId: string, settings: any) {
    const key = this.getOrgKey(orgId, 'settings');
    const currentSettings = await this.getOrgSettings(orgId);
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await this.main.put(key, JSON.stringify(updatedSettings));
    return updatedSettings;
  }

  // Sales Team management
  async getSalesTeam(orgId: string) {
    const key = this.getOrgKey(orgId, 'sales_team');
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : [];
  }


  // Custom Field mappings for CSV imports
  async getCustomFields(orgId: string): Promise<string[]> {
    const key = this.getOrgKey(orgId, 'custom_fields');
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : [];
  }

  async saveCustomFields(orgId: string, customFields: string[]) {
    const key = this.getOrgKey(orgId, 'custom_fields');
    await this.main.put(key, JSON.stringify(customFields));
  }

  async addCustomField(orgId: string, fieldName: string) {
    const existingFields = await this.getCustomFields(orgId);
    if (!existingFields.includes(fieldName)) {
      const updatedFields = [...existingFields, fieldName];
      await this.saveCustomFields(orgId, updatedFields);
      return updatedFields;
    }
    return existingFields;
  }

  // Sales Team management methods
  async putSalesTeamData(key: string, data: any) {
    await this.main.put(key, JSON.stringify(data));
  }

  async getSalesTeamData(key: string) {
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSalesTeamData(key: string) {
    await this.main.delete(key);
  }
}

// Utility function to get KV service from context
export function getKVService(context: any): KVService {
  // In development mode, context might not have cloudflare.env
  const env = context?.cloudflare?.env || {};
  return new KVService(env);
}