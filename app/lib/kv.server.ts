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
    const contactData = {
      ...contact,
      id: contactId,
      orgId,
      createdAt: new Date().toISOString(),
      optedOut: false
    };

    // Store the contact
    const key = this.getOrgKey(orgId, 'contact', contactId);
    await this.main.put(key, JSON.stringify(contactData));

    // Update indexes
    await this.updateContactIndexes(orgId, contactId, contactData);
  }

  // Contact indexing system
  private getContactIndexKey(orgId: string, page: number): string {
    return `org:${orgId}:contact_index:page_${page}`;
  }

  private getContactMetaKey(orgId: string): string {
    return `org:${orgId}:contact_meta`;
  }

  private getContactSearchKey(orgId: string): string {
    return `org:${orgId}:contact_search`;
  }

  private createContactIndexEntry(contact: any) {
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      createdAt: contact.createdAt,
      optedOut: contact.optedOut,
      hasMetadata: contact.metadata && Object.keys(contact.metadata).length > 0
    };
  }

  async updateContactIndexes(orgId: string, contactId: string, contactData: any) {
    const CONTACTS_PER_PAGE = 50;
    
    // Get current metadata
    const metaKey = this.getContactMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    let metadata = meta ? JSON.parse(meta) : { totalContacts: 0, totalPages: 0, lastUpdated: new Date().toISOString() };
    
    // Check if this is a new contact by looking for existing index entry
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    let searchIndex = searchData ? JSON.parse(searchData) : {};
    const isNewContact = !searchIndex[contactId];
    
    if (isNewContact) {
      metadata.totalContacts++;
      metadata.totalPages = Math.ceil(metadata.totalContacts / CONTACTS_PER_PAGE);
    }
    
    // Determine which page this contact should go on (newest first)
    const targetPage = 1; // Always add new contacts to page 1
    
    // Get the current page
    const pageKey = this.getContactIndexKey(orgId, targetPage);
    let pageData = await this.cache.get(pageKey);
    let contacts = pageData ? JSON.parse(pageData) : [];
    
    // Remove existing entry if updating
    contacts = contacts.filter((c: any) => c.id !== contactId);
    
    // Add new entry at the beginning (newest first)
    const indexEntry = this.createContactIndexEntry(contactData);
    contacts.unshift(indexEntry);
    
    // If page 1 is full, shift contacts to next pages
    if (contacts.length > CONTACTS_PER_PAGE) {
      await this.redistributeContactPages(orgId, contacts, CONTACTS_PER_PAGE);
    } else {
      // Just update this page
      await this.cache.put(pageKey, JSON.stringify(contacts));
    }
    
    // Update metadata
    metadata.lastUpdated = new Date().toISOString();
    await this.cache.put(metaKey, JSON.stringify(metadata));
    
    // Update search index
    await this.updateContactSearchIndex(orgId, contactData);
  }

  async redistributeContactPages(orgId: string, allContacts: any[], contactsPerPage: number) {
    // Redistribute contacts across pages
    for (let page = 1; page <= Math.ceil(allContacts.length / contactsPerPage); page++) {
      const startIdx = (page - 1) * contactsPerPage;
      const endIdx = startIdx + contactsPerPage;
      const pageContacts = allContacts.slice(startIdx, endIdx);
      
      const pageKey = this.getContactIndexKey(orgId, page);
      if (pageContacts.length > 0) {
        await this.cache.put(pageKey, JSON.stringify(pageContacts));
      } else {
        // Clean up empty pages
        await this.cache.delete(pageKey);
      }
    }
  }

  async updateContactSearchIndex(orgId: string, contactData: any) {
    // Create searchable text for this contact
    const searchText = [
      contactData.firstName,
      contactData.lastName,
      contactData.email,
      contactData.phone,
      contactData.metadata ? Object.values(contactData.metadata).join(' ') : ''
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Get current search index
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    let searchIndex = searchData ? JSON.parse(searchData) : {};
    
    // Update search index for this contact
    searchIndex[contactData.id] = {
      searchText,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      createdAt: contactData.createdAt
    };
    
    await this.cache.put(searchKey, JSON.stringify(searchIndex));
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
      contact.updatedAt = new Date().toISOString();
      const key = this.getOrgKey(orgId, 'contact', contactId);
      await this.main.put(key, JSON.stringify(contact));
      
      // Update indexes
      await this.updateContactIndexes(orgId, contactId, contact);
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
    console.log("FAST PAGINATION - OrgId:", orgId, "Page:", page, "Search:", search);
    
    if (search) {
      return this.searchContactsPaginated(orgId, page, limit, search);
    }
    
    // Get metadata for total counts
    const metaKey = this.getContactMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    let metadata = meta ? JSON.parse(meta) : await this.rebuildContactIndexes(orgId);
    
    // Get the specific page from cache
    const pageKey = this.getContactIndexKey(orgId, page);
    let pageData = await this.cache.get(pageKey);
    
    if (!pageData) {
      // Page doesn't exist in cache, might need to rebuild indexes
      console.log("INDEX MISS - Page", page, "not found, checking if rebuild needed");
      metadata = await this.rebuildContactIndexes(orgId);
      pageData = await this.cache.get(pageKey);
    }
    
    const contacts = pageData ? JSON.parse(pageData) : [];
    
    // For contacts that have metadata, we need to fetch just the hasMetadata flag is enough for display
    // The full metadata will be fetched only when viewing individual contact details
    
    console.log("FAST RESULT - Page:", page, "Contacts:", contacts.length, "Total:", metadata.totalContacts);
    
    return {
      contacts,
      totalContacts: metadata.totalContacts,
      totalPages: metadata.totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < metadata.totalPages,
      hasPrevPage: page > 1
    };
  }

  async searchContactsPaginated(orgId: string, page: number, limit: number, search: string) {
    console.log("SEARCH PAGINATION - Query:", search);
    
    // Get search index
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (!searchData) {
      // Search index doesn't exist, rebuild it
      await this.rebuildContactIndexes(orgId);
      searchData = await this.cache.get(searchKey);
    }
    
    const searchIndex = searchData ? JSON.parse(searchData) : {};
    const searchLower = search.toLowerCase();
    
    // Find matching contact IDs
    const matchingContacts = Object.values(searchIndex)
      .filter((entry: any) => entry.searchText.includes(searchLower))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
    
    // Apply pagination to search results
    const totalContacts = matchingContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = matchingContacts.slice(offset, offset + limit);
    
    // Convert back to contact format expected by frontend
    const contacts = paginatedResults.map((entry: any) => ({
      id: entry.id || entry.contactId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      phone: entry.phone,
      createdAt: entry.createdAt,
      optedOut: false, // Will be fetched from full contact if needed
      hasMetadata: false // Search index doesn't track this, but it's not critical for listing
    }));
    
    console.log("SEARCH RESULT - Found:", totalContacts, "Returning page:", contacts.length);
    
    return {
      contacts,
      totalContacts,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async rebuildContactIndexes(orgId: string) {
    console.log("REBUILDING INDEXES for org:", orgId);
    const CONTACTS_PER_PAGE = 50;
    
    // Get all contacts using the old method (fallback)
    const prefix = this.getOrgKey(orgId, 'contact', '');
    const allContacts: any[] = [];
    let cursor: string | undefined = undefined;
    
    do {
      const list: any = await this.main.list({ prefix, limit: 1000, cursor });
      const batchContacts = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          const data = await this.main.get(key.name);
          return data ? JSON.parse(data) : null;
        })
      );
      allContacts.push(...batchContacts.filter(Boolean));
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);
    
    // Sort by creation date (newest first)
    allContacts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Build page indexes
    const totalContacts = allContacts.length;
    const totalPages = Math.ceil(totalContacts / CONTACTS_PER_PAGE);
    
    for (let page = 1; page <= totalPages; page++) {
      const startIdx = (page - 1) * CONTACTS_PER_PAGE;
      const endIdx = startIdx + CONTACTS_PER_PAGE;
      const pageContacts = allContacts.slice(startIdx, endIdx).map(this.createContactIndexEntry);
      
      const pageKey = this.getContactIndexKey(orgId, page);
      await this.cache.put(pageKey, JSON.stringify(pageContacts));
    }
    
    // Build search index
    const searchIndex: any = {};
    for (const contact of allContacts) {
      const searchText = [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.metadata ? Object.values(contact.metadata).join(' ') : ''
      ].filter(Boolean).join(' ').toLowerCase();
      
      searchIndex[contact.id] = {
        searchText,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        createdAt: contact.createdAt
      };
    }
    
    const searchKey = this.getContactSearchKey(orgId);
    await this.cache.put(searchKey, JSON.stringify(searchIndex));
    
    // Save metadata
    const metadata = {
      totalContacts,
      totalPages,
      lastUpdated: new Date().toISOString()
    };
    
    const metaKey = this.getContactMetaKey(orgId);
    await this.cache.put(metaKey, JSON.stringify(metadata));
    
    console.log("REBUILD COMPLETE - Total contacts:", totalContacts, "Pages:", totalPages);
    return metadata;
  }

  async findContactByEmailOrPhone(orgId: string, email?: string, phone?: string) {
    if (!email && !phone) return null;
    
    console.log("FAST DUPLICATE CHECK - Email:", email, "Phone:", phone);
    
    // Try to use search index first (much faster)
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (searchData) {
      const searchIndex = JSON.parse(searchData);
      
      // Check search index for matches
      for (const [contactId, indexEntry] of Object.entries(searchIndex) as [string, any][]) {
        if (email && indexEntry.email && indexEntry.email.toLowerCase() === email.toLowerCase()) {
          console.log("DUPLICATE FOUND via index - Email match");
          return await this.getContact(orgId, contactId);
        }
        if (phone && indexEntry.phone && indexEntry.phone === phone) {
          console.log("DUPLICATE FOUND via index - Phone match");
          return await this.getContact(orgId, contactId);
        }
      }
      
      console.log("NO DUPLICATE via index");
      return null;
    }
    
    // Fallback to old method if search index doesn't exist
    console.log("DUPLICATE CHECK fallback - no search index");
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
      
      // Update indexes
      await this.updateContactIndexes(orgId, contactId, updated);
      
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

  // Sales Team indexing system
  private getSalesTeamIndexKey(orgId: string, page: number): string {
    return `org:${orgId}:salesteam_index:page_${page}`;
  }

  private getSalesTeamMetaKey(orgId: string): string {
    return `org:${orgId}:salesteam_meta`;
  }

  private getSalesTeamSearchKey(orgId: string): string {
    return `org:${orgId}:salesteam_search`;
  }

  private createSalesTeamIndexEntry(member: any) {
    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      title: member.title,
      department: member.department,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    };
  }

  async updateSalesTeamIndexes(orgId: string, memberId: string, memberData: any) {
    const MEMBERS_PER_PAGE = 20; // Smaller pages for team members
    
    // Get current metadata
    const metaKey = this.getSalesTeamMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    let metadata = meta ? JSON.parse(meta) : { totalMembers: 0, totalPages: 0, lastUpdated: new Date().toISOString() };
    
    // Check if this is a new member by looking for existing index entry
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    let searchIndex = searchData ? JSON.parse(searchData) : {};
    const isNewMember = !searchIndex[memberId];
    
    if (isNewMember) {
      metadata.totalMembers++;
      metadata.totalPages = Math.ceil(metadata.totalMembers / MEMBERS_PER_PAGE);
    }
    
    // Always add new members to page 1 (newest first)
    const targetPage = 1;
    
    // Get the current page
    const pageKey = this.getSalesTeamIndexKey(orgId, targetPage);
    let pageData = await this.cache.get(pageKey);
    let members = pageData ? JSON.parse(pageData) : [];
    
    // Remove existing entry if updating
    members = members.filter((m: any) => m.id !== memberId);
    
    // Add new entry at the beginning (newest first)
    const indexEntry = this.createSalesTeamIndexEntry(memberData);
    members.unshift(indexEntry);
    
    // If page 1 is full, redistribute across pages
    if (members.length > MEMBERS_PER_PAGE) {
      await this.redistributeSalesTeamPages(orgId, members, MEMBERS_PER_PAGE);
    } else {
      // Just update this page
      await this.cache.put(pageKey, JSON.stringify(members));
    }
    
    // Update metadata
    metadata.lastUpdated = new Date().toISOString();
    await this.cache.put(metaKey, JSON.stringify(metadata));
    
    // Update search index
    await this.updateSalesTeamSearchIndex(orgId, memberData);
  }

  async redistributeSalesTeamPages(orgId: string, allMembers: any[], membersPerPage: number) {
    // Redistribute members across pages
    for (let page = 1; page <= Math.ceil(allMembers.length / membersPerPage); page++) {
      const startIdx = (page - 1) * membersPerPage;
      const endIdx = startIdx + membersPerPage;
      const pageMembers = allMembers.slice(startIdx, endIdx);
      
      const pageKey = this.getSalesTeamIndexKey(orgId, page);
      if (pageMembers.length > 0) {
        await this.cache.put(pageKey, JSON.stringify(pageMembers));
      } else {
        // Clean up empty pages
        await this.cache.delete(pageKey);
      }
    }
  }

  async updateSalesTeamSearchIndex(orgId: string, memberData: any) {
    // Create searchable text for this member
    const searchText = [
      memberData.firstName,
      memberData.lastName,
      memberData.email,
      memberData.phone,
      memberData.title,
      memberData.department
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Get current search index
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    let searchIndex = searchData ? JSON.parse(searchData) : {};
    
    // Update search index for this member
    searchIndex[memberData.id] = {
      searchText,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      phone: memberData.phone,
      title: memberData.title,
      department: memberData.department,
      isActive: memberData.isActive,
      createdAt: memberData.createdAt
    };
    
    await this.cache.put(searchKey, JSON.stringify(searchIndex));
  }

  async getSalesTeamPaginated(orgId: string, page: number = 1, limit: number = 20, search?: string) {
    console.log("FAST SALES TEAM PAGINATION - OrgId:", orgId, "Page:", page, "Search:", search);
    
    if (search) {
      return this.searchSalesTeamPaginated(orgId, page, limit, search);
    }
    
    // Get metadata for total counts
    const metaKey = this.getSalesTeamMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    let metadata = meta ? JSON.parse(meta) : await this.rebuildSalesTeamIndexes(orgId);
    
    // Get the specific page from cache
    const pageKey = this.getSalesTeamIndexKey(orgId, page);
    let pageData = await this.cache.get(pageKey);
    
    if (!pageData) {
      // Page doesn't exist in cache, might need to rebuild indexes
      console.log("SALES TEAM INDEX MISS - Page", page, "not found, rebuilding");
      metadata = await this.rebuildSalesTeamIndexes(orgId);
      pageData = await this.cache.get(pageKey);
    }
    
    const members = pageData ? JSON.parse(pageData) : [];
    
    console.log("SALES TEAM FAST RESULT - Page:", page, "Members:", members.length, "Total:", metadata.totalMembers);
    
    return {
      members,
      totalMembers: metadata.totalMembers,
      totalPages: metadata.totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < metadata.totalPages,
      hasPrevPage: page > 1
    };
  }

  async searchSalesTeamPaginated(orgId: string, page: number, limit: number, search: string) {
    console.log("SALES TEAM SEARCH PAGINATION - Query:", search);
    
    // Get search index
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (!searchData) {
      // Search index doesn't exist, rebuild it
      await this.rebuildSalesTeamIndexes(orgId);
      searchData = await this.cache.get(searchKey);
    }
    
    const searchIndex = searchData ? JSON.parse(searchData) : {};
    const searchLower = search.toLowerCase();
    
    // Find matching member IDs
    const matchingMembers = Object.values(searchIndex)
      .filter((entry: any) => entry.searchText.includes(searchLower))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
    
    // Apply pagination to search results
    const totalMembers = matchingMembers.length;
    const totalPages = Math.ceil(totalMembers / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = matchingMembers.slice(offset, offset + limit);
    
    // Convert back to member format expected by frontend
    const members = paginatedResults.map((entry: any) => ({
      id: entry.id || entry.memberId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      phone: entry.phone,
      title: entry.title,
      department: entry.department,
      isActive: entry.isActive,
      createdAt: entry.createdAt
    }));
    
    console.log("SALES TEAM SEARCH RESULT - Found:", totalMembers, "Returning page:", members.length);
    
    return {
      members,
      totalMembers,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async rebuildSalesTeamIndexes(orgId: string) {
    console.log("REBUILDING SALES TEAM INDEXES for org:", orgId);
    const MEMBERS_PER_PAGE = 20;
    
    // Get all members using the old method (fallback)
    const listKey = `org:${orgId}:salesteam:list`;
    const existingData = await this.main.get(listKey);
    const allMembers = existingData ? JSON.parse(existingData) : [];
    
    // Sort by creation date (newest first)
    allMembers.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Build page indexes
    const totalMembers = allMembers.length;
    const totalPages = Math.ceil(totalMembers / MEMBERS_PER_PAGE);
    
    for (let page = 1; page <= totalPages; page++) {
      const startIdx = (page - 1) * MEMBERS_PER_PAGE;
      const endIdx = startIdx + MEMBERS_PER_PAGE;
      const pageMembers = allMembers.slice(startIdx, endIdx).map(this.createSalesTeamIndexEntry.bind(this));
      
      const pageKey = this.getSalesTeamIndexKey(orgId, page);
      await this.cache.put(pageKey, JSON.stringify(pageMembers));
    }
    
    // Build search index
    const searchIndex: any = {};
    for (const member of allMembers) {
      const searchText = [
        member.firstName,
        member.lastName,
        member.email,
        member.phone,
        member.title,
        member.department
      ].filter(Boolean).join(' ').toLowerCase();
      
      searchIndex[member.id] = {
        searchText,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        title: member.title,
        department: member.department,
        isActive: member.isActive,
        createdAt: member.createdAt
      };
    }
    
    const searchKey = this.getSalesTeamSearchKey(orgId);
    await this.cache.put(searchKey, JSON.stringify(searchIndex));
    
    // Save metadata
    const metadata = {
      totalMembers,
      totalPages,
      lastUpdated: new Date().toISOString()
    };
    
    const metaKey = this.getSalesTeamMetaKey(orgId);
    await this.cache.put(metaKey, JSON.stringify(metadata));
    
    console.log("SALES TEAM REBUILD COMPLETE - Total members:", totalMembers, "Pages:", totalPages);
    return metadata;
  }

  async findSalesTeamMemberByEmail(orgId: string, email: string) {
    console.log("FAST SALES TEAM DUPLICATE CHECK - Email:", email);
    
    // Try to use search index first (much faster)
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (searchData) {
      const searchIndex = JSON.parse(searchData);
      
      // Check search index for matches
      for (const [memberId, indexEntry] of Object.entries(searchIndex) as [string, any][]) {
        if (indexEntry.email && indexEntry.email.toLowerCase() === email.toLowerCase()) {
          console.log("SALES TEAM DUPLICATE FOUND via index - Email match");
          return await this.getSalesTeamData(`org:${orgId}:salesteam:${memberId}`);
        }
      }
      
      console.log("NO SALES TEAM DUPLICATE via index");
      return null;
    }
    
    // Fallback to old method if search index doesn't exist
    console.log("SALES TEAM DUPLICATE CHECK fallback - no search index");
    const listKey = `org:${orgId}:salesteam:list`;
    const data = await this.main.get(listKey);
    const members = data ? JSON.parse(data) : [];
    
    return members.find((m: any) => m.email && m.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Sales Team management methods (updated to use indexing)
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