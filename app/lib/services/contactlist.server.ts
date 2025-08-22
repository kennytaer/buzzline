import { KVNamespace, CloudflareEnv } from '../types/cloudflare';

// Mock KV store for development
class MockKVNamespace {
  private store: Map<string, string>;
  
  constructor(storeName: string) {
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
    const limit = options?.limit || 1000;
    
    return {
      keys: filteredKeys.slice(0, limit).map(name => ({ name }))
    };
  }
}

export class ContactListService {
  private main: KVNamespace | MockKVNamespace;

  constructor(env: CloudflareEnv) {
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace('main');
  }

  private getContactListKey(orgId: string, listId: string): string {
    return `org:${orgId}:contactlist:${listId}`;
  }

  async createContactList(orgId: string, listId: string, listData: any) {
    const key = this.getContactListKey(orgId, listId);
    const contactListData = {
      ...listData,
      id: listId,
      orgId,
      createdAt: new Date().toISOString()
    };
    
    await this.main.put(key, JSON.stringify(contactListData));
    return contactListData;
  }

  async getContactList(orgId: string, listId: string) {
    const key = this.getContactListKey(orgId, listId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateContactList(orgId: string, listId: string, updates: any) {
    console.log("🔍 CONTACT LIST UPDATE DEBUG - Starting update:", {
      orgId,
      listId,
      updatesKeys: Object.keys(updates),
      contactIdsCount: updates.contactIds ? updates.contactIds.length : 'not provided'
    });
    
    const contactList = await this.getContactList(orgId, listId);
    if (contactList) {
      console.log("✅ CONTACT LIST UPDATE DEBUG - Found existing list:", {
        listId,
        currentContactIds: contactList.contactIds ? contactList.contactIds.length : 'not set',
        listName: contactList.name
      });
      
      const updated = { ...contactList, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getContactListKey(orgId, listId);
      
      console.log("🔍 CONTACT LIST UPDATE DEBUG - Saving updated list:", {
        listId,
        newContactIdsCount: updated.contactIds ? updated.contactIds.length : 'not set',
        key,
        updatedFields: Object.keys(updates)
      });
      
      await this.main.put(key, JSON.stringify(updated));
      
      console.log("✅ CONTACT LIST UPDATE DEBUG - Update complete:", {
        listId,
        finalContactIdsCount: updated.contactIds ? updated.contactIds.length : 'not set'
      });
      
      return updated;
    } else {
      console.error("❌ CONTACT LIST UPDATE DEBUG - Contact list not found:", {
        orgId,
        listId
      });
    }
    return null;
  }

  async listContactLists(orgId: string, limit = 100) {
    const prefix = `org:${orgId}:contactlist:`;
    const list = await this.main.list({ prefix, limit });
    const lists = await Promise.all(
      list.keys.map(async (key: { name: string }) => {
        const data = await this.main.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return lists.filter(Boolean);
  }

  async deleteContactList(orgId: string, listId: string) {
    const key = this.getContactListKey(orgId, listId);
    await this.main.delete(key);
    return true;
  }

  // Custom Field mappings for CSV imports
  async getCustomFields(orgId: string): Promise<string[]> {
    const key = `org:${orgId}:custom_fields`;
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : [];
  }

  async saveCustomFields(orgId: string, customFields: string[]) {
    const key = `org:${orgId}:custom_fields`;
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

  // Segment logic update functionality
  async refreshSegmentLogic(orgId: string, segmentId: string, allContacts: any[]) {
    const segment = await this.getContactList(orgId, segmentId);
    if (!segment || segment.type !== 'dynamic' || !segment.filters) {
      return null; // Only refresh dynamic segments with filters
    }

    // Re-evaluate segment filters against all contacts
    const matchingContacts = allContacts.filter(contact => {
      return this.evaluateSegmentFilters(contact, segment.filters);
    });

    const matchingContactIds = matchingContacts.map(c => c.id);
    
    // Update segment with new contact list
    const updatedSegment = await this.updateContactList(orgId, segmentId, {
      contactIds: matchingContactIds,
      contactCount: matchingContacts.length,
      lastRefreshed: new Date().toISOString()
    });

    return {
      segmentId,
      previousCount: segment.contactIds?.length || 0,
      newCount: matchingContacts.length,
      addedContacts: matchingContactIds.filter(id => !segment.contactIds?.includes(id)),
      removedContacts: segment.contactIds?.filter((id: string) => !matchingContactIds.includes(id)) || []
    };
  }

  async refreshAllDynamicSegments(orgId: string, allContacts: any[]) {
    const allSegments = await this.listContactLists(orgId);
    const dynamicSegments = allSegments.filter(s => s.type === 'dynamic' && s.filters);
    
    const results = [];
    for (const segment of dynamicSegments) {
      const result = await this.refreshSegmentLogic(orgId, segment.id, allContacts);
      if (result) results.push(result);
    }
    
    return results;
  }

  // Filter evaluation logic (moved from new segment route)
  private evaluateSegmentFilters(contact: any, filters: any[]): boolean {
    if (!filters || filters.length === 0) return true;
    
    let result = this.evaluateRule(contact, filters[0]);
    
    for (let i = 1; i < filters.length; i++) {
      const rule = filters[i];
      const ruleResult = this.evaluateRule(contact, rule);
      
      if (rule.logic === 'OR') {
        result = result || ruleResult;
      } else { // AND (default)
        result = result && ruleResult;
      }
    }
    
    return result;
  }

  private evaluateRule(contact: any, rule: any): boolean {
    let contactValue: any;
    
    // Get the value from contact
    if (['firstName', 'lastName', 'email', 'phone'].includes(rule.field)) {
      contactValue = contact[rule.field] || '';
    } else if (rule.field === 'optedOut') {
      contactValue = contact.optedOut ? 'true' : 'false';
    } else {
      // Custom metadata field
      contactValue = contact.metadata?.[rule.field] || '';
    }
    
    const filterValue = rule.value;
    
    // Convert to strings for comparison
    const contactStr = String(contactValue).toLowerCase();
    const filterStr = String(filterValue).toLowerCase();
    
    switch (rule.operator) {
      case 'equals':
        return contactStr === filterStr;
      case 'not_equals':
        return contactStr !== filterStr;
      case 'contains':
        return contactStr.includes(filterStr);
      case 'not_contains':
        return !contactStr.includes(filterStr);
      case 'starts_with':
        return contactStr.startsWith(filterStr);
      case 'ends_with':
        return contactStr.endsWith(filterStr);
      case 'greater_than':
        return parseFloat(contactValue) > parseFloat(filterValue);
      case 'less_than':
        return parseFloat(contactValue) < parseFloat(filterValue);
      case 'greater_equal':
        return parseFloat(contactValue) >= parseFloat(filterValue);
      case 'less_equal':
        return parseFloat(contactValue) <= parseFloat(filterValue);
      case 'is_empty':
        return !contactValue || contactValue === '';
      case 'is_not_empty':
        return contactValue && contactValue !== '';
      default:
        return false;
    }
  }
}

export function getContactListService(context: any): ContactListService {
  const env = context?.cloudflare?.env || {};
  return new ContactListService(env);
}