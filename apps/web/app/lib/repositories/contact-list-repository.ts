import type { ContactList } from '@buzzline/types';
import type { KVClient } from '../kv-client';
import { KVKeys } from '~/types/cloudflare';
import { v4 as uuidv4 } from 'uuid';

export class ContactListRepository {
  constructor(
    private kv: KVClient,
    private organizationId: string
  ) {}

  async create(listData: Omit<ContactList, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>): Promise<ContactList> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const contactList: ContactList = {
      id,
      ...listData,
      organizationId: this.organizationId,
      contactCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Store the contact list
    await this.kv.put(KVKeys.contactList(this.organizationId, id), contactList);

    // Update indexes
    await this.kv.addToIndex(
      KVKeys.contactListsByOrg(this.organizationId),
      id
    );

    return contactList;
  }

  async findById(id: string): Promise<ContactList | null> {
    return await this.kv.get<ContactList>(KVKeys.contactList(this.organizationId, id));
  }

  async update(id: string, updates: Partial<ContactList>): Promise<ContactList | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ContactList = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      organizationId: this.organizationId, // Ensure org doesn't change
      updatedAt: new Date().toISOString(),
    };

    await this.kv.put(KVKeys.contactList(this.organizationId, id), updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    // Remove from storage
    await this.kv.delete(KVKeys.contactList(this.organizationId, id));

    // Remove from indexes
    await this.kv.removeFromIndex(
      KVKeys.contactListsByOrg(this.organizationId),
      id
    );

    return true;
  }

  async findAll(): Promise<ContactList[]> {
    const listIds = await this.kv.getFromIndex(KVKeys.contactListsByOrg(this.organizationId));
    
    if (listIds.length === 0) return [];

    const promises = listIds.map(id => this.findById(id));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean) as ContactList[];
  }

  async findOrCreate(name: string): Promise<ContactList> {
    // Try to find existing list with this name
    const existingLists = await this.findAll();
    const existing = existingLists.find(list => list.name === name);
    
    if (existing) {
      return existing;
    }

    // Create new list
    return await this.create({ name });
  }

  async incrementContactCount(id: string, delta: number = 1): Promise<ContactList | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const newCount = Math.max(0, existing.contactCount + delta);
    return await this.update(id, { contactCount: newCount });
  }

  async decrementContactCount(id: string, delta: number = 1): Promise<ContactList | null> {
    return await this.incrementContactCount(id, -delta);
  }
}