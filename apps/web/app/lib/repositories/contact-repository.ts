import type { Contact, ContactFilter, SearchResult, SubGroup } from '@buzzline/types';
import type { KVClient } from '../kv-client';
import { KVKeys } from '~/types/cloudflare';
import { v4 as uuidv4 } from 'uuid';

export class ContactRepository {
  constructor(
    private kv: KVClient,
    private organizationId: string
  ) {}

  async create(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const contact: Contact = {
      id,
      ...contactData,
      createdAt: now,
      updatedAt: now,
    };

    // Store the contact
    await this.kv.put(KVKeys.contact(this.organizationId, id), contact);

    // Update indexes
    await this.updateContactIndexes(contact, null);

    // Update contact list count
    await this.updateContactListCount(contact.contactListId, 1);

    return contact;
  }

  async findById(id: string): Promise<Contact | null> {
    return await this.kv.get<Contact>(KVKeys.contact(this.organizationId, id));
  }

  async update(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Contact = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Store updated contact
    await this.kv.put(KVKeys.contact(this.organizationId, id), updated);

    // Update indexes if relevant fields changed
    if (this.indexRelevantFieldsChanged(existing, updated)) {
      await this.updateContactIndexes(updated, existing);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    // Remove from storage
    await this.kv.delete(KVKeys.contact(this.organizationId, id));

    // Remove from all indexes
    await this.removeFromAllIndexes(existing);

    // Update contact list count
    await this.updateContactListCount(existing.contactListId, -1);

    return true;
  }

  async findByList(listId: string, limit: number = 100, offset: number = 0): Promise<SearchResult<Contact>> {
    const contactIds = await this.kv.getFromIndex(
      KVKeys.contactsByList(this.organizationId, listId)
    );

    const total = contactIds.length;
    const paginatedIds = contactIds.slice(offset, offset + limit);
    
    const contacts = await this.getContactsByIds(paginatedIds);

    return {
      items: contacts,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  async findByFilter(filter: ContactFilter, limit: number = 100, offset: number = 0): Promise<SearchResult<Contact>> {
    let contactIds: string[] = [];

    // Start with list filter if provided
    if (filter.listId) {
      contactIds = await this.kv.getFromIndex(
        KVKeys.contactsByList(this.organizationId, filter.listId)
      );
    } else {
      // Get all contacts for the organization
      const allContactKeys = await this.kv.list(`org:${this.organizationId}:contacts:`);
      contactIds = allContactKeys.map(key => key.split(':').pop()!).filter(Boolean);
    }

    // Apply status filter
    if (filter.status) {
      const statusContactIds = await this.kv.getFromIndex(
        KVKeys.contactsByStatus(this.organizationId, filter.status)
      );
      contactIds = contactIds.filter(id => statusContactIds.includes(id));
    }

    // Apply tag filters (AND logic)
    if (filter.tags && filter.tags.length > 0) {
      for (const tag of filter.tags) {
        const tagContactIds = await this.kv.getFromIndex(
          KVKeys.contactsByTag(this.organizationId, tag)
        );
        contactIds = contactIds.filter(id => tagContactIds.includes(id));
      }
    }

    // Apply subgroup filters (OR logic)
    if (filter.subGroups && filter.subGroups.length > 0) {
      const subGroupContactIds = new Set<string>();
      for (const subGroupId of filter.subGroups) {
        const subGroupIds = await this.kv.getFromIndex(
          KVKeys.contactsBySubGroup(this.organizationId, subGroupId)
        );
        subGroupIds.forEach(id => subGroupContactIds.add(id));
      }
      contactIds = contactIds.filter(id => subGroupContactIds.has(id));
    }

    // Apply metadata filters
    if (filter.metadata) {
      for (const [field, value] of Object.entries(filter.metadata)) {
        const metadataContactIds = await this.kv.getFromIndex(
          KVKeys.contactMetadataIndex(this.organizationId, field, String(value))
        );
        contactIds = contactIds.filter(id => metadataContactIds.includes(id));
      }
    }

    // Load contacts and apply remaining filters
    let contacts = await this.getContactsByIds(contactIds);

    // Apply hasEmail/hasPhone filters
    if (filter.hasEmail !== undefined) {
      contacts = contacts.filter(contact => 
        filter.hasEmail ? !!contact.email : !contact.email
      );
    }

    if (filter.hasPhone !== undefined) {
      contacts = contacts.filter(contact => 
        filter.hasPhone ? !!contact.phone : !contact.phone
      );
    }

    const total = contacts.length;
    const paginatedContacts = contacts.slice(offset, offset + limit);

    return {
      items: paginatedContacts,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  async addToSubGroup(contactId: string, subGroupId: string): Promise<boolean> {
    const contact = await this.findById(contactId);
    if (!contact) return false;

    if (!contact.subGroups.includes(subGroupId)) {
      contact.subGroups.push(subGroupId);
      await this.update(contactId, { subGroups: contact.subGroups });
    }

    return true;
  }

  async removeFromSubGroup(contactId: string, subGroupId: string): Promise<boolean> {
    const contact = await this.findById(contactId);
    if (!contact) return false;

    contact.subGroups = contact.subGroups.filter(id => id !== subGroupId);
    await this.update(contactId, { subGroups: contact.subGroups });

    return true;
  }

  async bulkUpdateStatus(contactIds: string[], status: Contact['status']): Promise<number> {
    let updatedCount = 0;

    for (const contactId of contactIds) {
      const success = await this.update(contactId, { status });
      if (success) updatedCount++;
    }

    return updatedCount;
  }

  async bulkAddTags(contactIds: string[], tags: string[]): Promise<number> {
    let updatedCount = 0;

    for (const contactId of contactIds) {
      const contact = await this.findById(contactId);
      if (contact) {
        const newTags = [...new Set([...contact.tags, ...tags])];
        await this.update(contactId, { tags: newTags });
        updatedCount++;
      }
    }

    return updatedCount;
  }

  // Private helper methods
  private async getContactsByIds(ids: string[]): Promise<Contact[]> {
    if (ids.length === 0) return [];

    const promises = ids.map(id => this.findById(id));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean) as Contact[];
  }

  private async updateContactIndexes(contact: Contact, previousContact: Contact | null): Promise<void> {
    const promises: Promise<void>[] = [];

    // List index
    promises.push(this.kv.addToIndex(
      KVKeys.contactsByList(this.organizationId, contact.contactListId),
      contact.id
    ));

    // Status index
    promises.push(this.kv.addToIndex(
      KVKeys.contactsByStatus(this.organizationId, contact.status),
      contact.id
    ));

    // Tag indexes
    for (const tag of contact.tags) {
      promises.push(this.kv.addToIndex(
        KVKeys.contactsByTag(this.organizationId, tag),
        contact.id
      ));
    }

    // SubGroup indexes
    for (const subGroupId of contact.subGroups) {
      promises.push(this.kv.addToIndex(
        KVKeys.contactsBySubGroup(this.organizationId, subGroupId),
        contact.id
      ));
    }

    // Metadata indexes
    for (const [field, value] of Object.entries(contact.metadata)) {
      promises.push(this.kv.addToIndex(
        KVKeys.contactMetadataIndex(this.organizationId, field, String(value)),
        contact.id
      ));
    }

    // Remove from old indexes if updating
    if (previousContact) {
      // Remove from old status if changed
      if (previousContact.status !== contact.status) {
        promises.push(this.kv.removeFromIndex(
          KVKeys.contactsByStatus(this.organizationId, previousContact.status),
          contact.id
        ));
      }

      // Remove from old tags
      const removedTags = previousContact.tags.filter(tag => !contact.tags.includes(tag));
      for (const tag of removedTags) {
        promises.push(this.kv.removeFromIndex(
          KVKeys.contactsByTag(this.organizationId, tag),
          contact.id
        ));
      }

      // Remove from old subgroups
      const removedSubGroups = previousContact.subGroups.filter(sg => !contact.subGroups.includes(sg));
      for (const subGroupId of removedSubGroups) {
        promises.push(this.kv.removeFromIndex(
          KVKeys.contactsBySubGroup(this.organizationId, subGroupId),
          contact.id
        ));
      }

      // Remove from old metadata indexes
      for (const [field, value] of Object.entries(previousContact.metadata)) {
        if (contact.metadata[field] !== value) {
          promises.push(this.kv.removeFromIndex(
            KVKeys.contactMetadataIndex(this.organizationId, field, String(value)),
            contact.id
          ));
        }
      }
    }

    await Promise.all(promises);
  }

  private async removeFromAllIndexes(contact: Contact): Promise<void> {
    const promises: Promise<void>[] = [];

    // Remove from list index
    promises.push(this.kv.removeFromIndex(
      KVKeys.contactsByList(this.organizationId, contact.contactListId),
      contact.id
    ));

    // Remove from status index
    promises.push(this.kv.removeFromIndex(
      KVKeys.contactsByStatus(this.organizationId, contact.status),
      contact.id
    ));

    // Remove from tag indexes
    for (const tag of contact.tags) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.contactsByTag(this.organizationId, tag),
        contact.id
      ));
    }

    // Remove from subgroup indexes
    for (const subGroupId of contact.subGroups) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.contactsBySubGroup(this.organizationId, subGroupId),
        contact.id
      ));
    }

    // Remove from metadata indexes
    for (const [field, value] of Object.entries(contact.metadata)) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.contactMetadataIndex(this.organizationId, field, String(value)),
        contact.id
      ));
    }

    await Promise.all(promises);
  }

  private indexRelevantFieldsChanged(old: Contact, updated: Contact): boolean {
    return (
      old.status !== updated.status ||
      JSON.stringify(old.tags) !== JSON.stringify(updated.tags) ||
      JSON.stringify(old.subGroups) !== JSON.stringify(updated.subGroups) ||
      JSON.stringify(old.metadata) !== JSON.stringify(updated.metadata) ||
      old.contactListId !== updated.contactListId
    );
  }

  private async updateContactListCount(listId: string, delta: number): Promise<void> {
    const listKey = KVKeys.contactList(this.organizationId, listId);
    await this.kv.atomicUpdate(listKey, (current: any) => {
      if (current) {
        current.contactCount = Math.max(0, current.contactCount + delta);
        current.updatedAt = new Date().toISOString();
      }
      return current;
    });
  }
}