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
    const contactList = await this.getContactList(orgId, listId);
    if (contactList) {
      const updated = { ...contactList, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getContactListKey(orgId, listId);
      await this.main.put(key, JSON.stringify(updated));
      return updated;
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
}

export function getContactListService(context: any): ContactListService {
  const env = context?.cloudflare?.env || {};
  return new ContactListService(env);
}