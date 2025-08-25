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

export class ContactService {
  private main: KVNamespace | MockKVNamespace;
  private cache: KVNamespace | MockKVNamespace;

  constructor(env: CloudflareEnv) {
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace('main');
    this.cache = env.BUZZLINE_CACHE || new MockKVNamespace('cache');
  }

  private getContactKey(orgId: string, contactId: string): string {
    return `org:${orgId}:contact:${contactId}`;
  }

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

  async createContact(orgId: string, contactId: string, contact: any) {
    try {
      if (!orgId || !contactId) {
        throw new Error('Organization ID and Contact ID are required');
      }

      const contactData = {
        ...contact,
        id: contactId,
        orgId,
        createdAt: new Date().toISOString(),
        optedOut: false
      };

      const key = this.getContactKey(orgId, contactId);
      await this.main.put(key, JSON.stringify(contactData));
      await this.updateContactIndexes(orgId, contactId, contactData);
      
      return contactData;
    } catch (error) {
      console.error(`Error creating contact ${contactId} for org ${orgId}:`, error);
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContact(orgId: string, contactId: string) {
    try {
      if (!orgId || !contactId) {
        throw new Error('Organization ID and Contact ID are required');
      }

      const key = this.getContactKey(orgId, contactId);
      const data = await this.main.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting contact ${contactId} for org ${orgId}:`, error);
      throw new Error(`Failed to get contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateContact(orgId: string, contactId: string, updates: any) {
    try {
      if (!orgId || !contactId) {
        throw new Error('Organization ID and Contact ID are required');
      }

      const contact = await this.getContact(orgId, contactId);
      if (!contact) {
        throw new Error(`Contact ${contactId} not found`);
      }

      const updated = { ...contact, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getContactKey(orgId, contactId);
      await this.main.put(key, JSON.stringify(updated));
      await this.updateContactIndexes(orgId, contactId, updated);
      
      // Auto-refresh dynamic segments when contact is updated
      await this.triggerSegmentRefresh(orgId);
      
      return updated;
    } catch (error) {
      console.error(`Error updating contact ${contactId} for org ${orgId}:`, error);
      throw new Error(`Failed to update contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteContact(orgId: string, contactId: string) {
    try {
      if (!orgId || !contactId) {
        throw new Error('Organization ID and Contact ID are required');
      }

      const contact = await this.getContact(orgId, contactId);
      if (!contact) {
        return false; // Contact doesn't exist, consider it already deleted
      }

      const key = this.getContactKey(orgId, contactId);
      await this.main.delete(key);

      // Remove from search index
      const searchKey = this.getContactSearchKey(orgId);
      let searchData = await this.cache.get(searchKey);
      if (searchData) {
        const searchIndex = JSON.parse(searchData);
        delete searchIndex[contactId];
        await this.cache.put(searchKey, JSON.stringify(searchIndex));
      }

      // Clear page caches to force rebuild
      await this.clearContactCaches(orgId);
      await this.rebuildContactIndexes(orgId);

      return true;
    } catch (error) {
      console.error(`Error deleting contact ${contactId} for org ${orgId}:`, error);
      throw new Error(`Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContactsPaginated(orgId: string, page: number = 1, limit: number = 50, search?: string) {
    try {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      if (page < 1) {
        page = 1;
      }
      if (limit < 1 || limit > 100) {
        limit = 50; // Reasonable default and max
      }

      if (search) {
        return this.searchContactsPaginated(orgId, page, limit, search);
      }
      
      const metaKey = this.getContactMetaKey(orgId);
      let meta = await this.cache.get(metaKey);
      let metadata = meta ? JSON.parse(meta) : await this.rebuildContactIndexes(orgId);
      
      const pageKey = this.getContactIndexKey(orgId, page);
      let pageData = await this.cache.get(pageKey);
      
      if (!pageData) {
        metadata = await this.rebuildContactIndexes(orgId);
        pageData = await this.cache.get(pageKey);
      }
      
      const contacts = pageData ? JSON.parse(pageData) : [];
      
      return {
        contacts,
        totalContacts: metadata.totalContacts || 0,
        totalPages: metadata.totalPages || 0,
        currentPage: page,
        limit,
        hasNextPage: page < (metadata.totalPages || 0),
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error(`Error getting paginated contacts for org ${orgId}:`, error);
      // Return empty result rather than throwing to prevent UI breakage
      return {
        contacts: [],
        totalContacts: 0,
        totalPages: 0,
        currentPage: page,
        limit,
        hasNextPage: false,
        hasPrevPage: false
      };
    }
  }

  async searchContactsPaginated(orgId: string, page: number, limit: number, search: string) {
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (!searchData) {
      await this.rebuildContactIndexes(orgId);
      searchData = await this.cache.get(searchKey);
    }
    
    const searchIndex = searchData ? JSON.parse(searchData) : {};
    const searchLower = search.toLowerCase();
    
    const matchingContacts = Object.values(searchIndex)
      .filter((entry: any) => entry.searchText.includes(searchLower))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const totalContacts = matchingContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = matchingContacts.slice(offset, offset + limit);
    
    const contacts = paginatedResults.map((entry: any) => ({
      id: entry.id || entry.contactId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      phone: entry.phone,
      createdAt: entry.createdAt,
      optedOut: false,
      hasMetadata: false
    }));
    
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

  async getContactsByListIds(orgId: string, listIds: string[]) {
    const allContacts = await this.listAllContacts(orgId);
    return allContacts.filter(contact => 
      contact.contactListIds?.some((listId: string) => listIds.includes(listId))
    );
  }

  async getContactsByIds(orgId: string, contactIds: string[]) {
    const contacts = [];
    for (const id of contactIds) {
      const contact = await this.getContact(orgId, id);
      if (contact) contacts.push(contact);
    }
    return contacts;
  }

  async findContactByEmailOrPhone(orgId: string, email?: string, phone?: string) {
    if (!email && !phone) return null;
    
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (searchData) {
      const searchIndex = JSON.parse(searchData);
      
      for (const [contactId, indexEntry] of Object.entries(searchIndex) as [string, any][]) {
        if (email && indexEntry.email && indexEntry.email.toLowerCase() === email.toLowerCase()) {
          return await this.getContact(orgId, contactId);
        }
        if (phone && indexEntry.phone && indexEntry.phone === phone) {
          return await this.getContact(orgId, contactId);
        }
      }
    }
    
    return null;
  }

  async updateContactOptOut(orgId: string, contactId: string, optedOut: boolean) {
    const contact = await this.getContact(orgId, contactId);
    if (contact) {
      const updated = { 
        ...contact, 
        optedOut, 
        optOutDate: optedOut ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString() 
      };
      const key = this.getContactKey(orgId, contactId);
      await this.main.put(key, JSON.stringify(updated));
      await this.updateContactIndexes(orgId, contactId, updated);
      return updated;
    }
    return null;
  }

  async listContacts(orgId: string) {
    return await this.listAllContacts(orgId, 10000); // Increase limit for stats calculation
  }

  async findContactsByEmailsOrPhones(orgId: string, emailsAndPhones: Array<{email?: string, phone?: string}>) {
    const results = [];
    const BATCH_SIZE = 100; // Process in smaller batches to avoid timeouts
    
    console.log("🔍 DUPLICATE CHECK DEBUG - Starting batch processing:", {
      totalContacts: emailsAndPhones.length,
      batchSize: BATCH_SIZE,
      expectedBatches: Math.ceil(emailsAndPhones.length / BATCH_SIZE)
    });
    
    // Get search index once for all lookups (much more efficient)
    const searchKey = this.getContactSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (!searchData) {
      console.log("⚠️ DUPLICATE CHECK DEBUG - No search index found, rebuilding...");
      await this.rebuildContactIndexes(orgId);
      searchData = await this.cache.get(searchKey);
    }
    
    const searchIndex = searchData ? JSON.parse(searchData) : {};
    const indexSize = Object.keys(searchIndex).length;
    
    console.log("✅ DUPLICATE CHECK DEBUG - Search index loaded:", {
      indexSize,
      hasIndex: !!searchData
    });
    
    // Process in batches to avoid memory/timeout issues
    for (let i = 0; i < emailsAndPhones.length; i += BATCH_SIZE) {
      const batch = emailsAndPhones.slice(i, i + BATCH_SIZE);
      const batchStartTime = Date.now();
      
      console.log(`🔍 DUPLICATE CHECK DEBUG - Processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, {
        batchStart: i,
        batchEnd: Math.min(i + BATCH_SIZE, emailsAndPhones.length),
        batchSize: batch.length
      });
      
      // Check each item in the batch against the search index (in memory, very fast)
      const batchPromises = batch.map(async ({email, phone}) => {
        if (!email && !phone) return null;
        
        // Search in the index first (fast in-memory lookup)
        for (const [contactId, indexEntry] of Object.entries(searchIndex) as [string, any][]) {
          const emailMatch = email && indexEntry.email && indexEntry.email.toLowerCase() === email.toLowerCase();
          const phoneMatch = phone && indexEntry.phone && indexEntry.phone === phone;
          
          if (emailMatch || phoneMatch) {
            // Found a match, get the full contact
            const contact = await this.getContact(orgId, contactId);
            if (contact) {
              return { email, phone, contact };
            }
          }
        }
        
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(Boolean);
      results.push(...validResults);
      
      const batchTime = Date.now() - batchStartTime;
      console.log(`✅ DUPLICATE CHECK DEBUG - Batch ${Math.floor(i / BATCH_SIZE) + 1} complete:`, {
        batchProcessingTime: batchTime,
        duplicatesFound: validResults.length,
        avgTimePerContact: Math.round(batchTime / batch.length * 100) / 100
      });
      
      // Small delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < emailsAndPhones.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log("✅ DUPLICATE CHECK DEBUG - All batches complete:", {
      totalChecked: emailsAndPhones.length,
      totalDuplicatesFound: results.length,
      duplicateRate: Math.round((results.length / emailsAndPhones.length) * 100)
    });
    
    return results;
  }

  async createContactsBulk(orgId: string, contacts: Array<{id: string, data: any}>) {
    const BATCH_SIZE = 50;
    const results = {
      created: [] as string[],
      errors: [] as {id: string, error: string}[]
    };

    console.log('🚀 BULK CREATE DEBUG - Starting bulk contact creation:', {
      orgId,
      totalContacts: contacts.length,
      batchSize: BATCH_SIZE
    });

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      console.log(`📦 BULK CREATE DEBUG - Processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, {
        batchStart: i,
        batchSize: batch.length
      });
      
      const batchPromises = batch.map(async ({id, data}) => {
        try {
          const contactData = {
            ...data,
            id,
            orgId,
            createdAt: new Date().toISOString(),
            optedOut: false
          };

          const key = this.getContactKey(orgId, id);
          await this.main.put(key, JSON.stringify(contactData));
          
          results.created.push(id);
          return {success: true, id, contactData};
        } catch (error) {
          console.error(`❌ BULK CREATE DEBUG - Failed to store contact ${id}:`, error);
          const errorMsg = error instanceof Error ? error.message : 'Failed to store contact';
          results.errors.push({id, error: errorMsg});
          return {success: false, id, error};
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      const successfulContacts = batchResults.filter(r => r.success);
      console.log(`📊 BULK CREATE DEBUG - Batch ${Math.floor(i / BATCH_SIZE) + 1} results:`, {
        successful: successfulContacts.length,
        failed: batchResults.length - successfulContacts.length,
        totalCreatedSoFar: results.created.length
      });
    }

    // Rebuild indexes once after all contacts are created
    if (results.created.length > 0) {
      console.log('🔄 BULK CREATE DEBUG - Rebuilding contact indexes after bulk creation:', {
        createdCount: results.created.length,
        errorCount: results.errors.length
      });
      
      try {
        await this.rebuildContactIndexes(orgId);
        console.log('✅ BULK CREATE DEBUG - Contact indexes rebuilt successfully');
      } catch (indexError) {
        console.error('❌ BULK CREATE DEBUG - Failed to rebuild contact indexes:', indexError);
        // Don't fail the entire operation for index rebuild issues
      }
    }

    console.log('🎉 BULK CREATE DEBUG - Bulk creation complete:', {
      totalRequested: contacts.length,
      successful: results.created.length,
      failed: results.errors.length,
      successRate: Math.round((results.created.length / contacts.length) * 100)
    });

    return results;
  }

  private async listAllContacts(orgId: string, limit = 1000) {
    const prefix = `org:${orgId}:contact:`;
    const contacts: any[] = [];
    let cursor: string | undefined = undefined;
    
    console.log('📋 LIST CONTACTS DEBUG - Starting contact enumeration:', {
      orgId,
      prefix,
      limit
    });
    
    do {
      const list: any = await this.main.list({ 
        prefix, 
        limit: Math.min(limit - contacts.length, 1000),
        cursor 
      });
      
      console.log('📋 LIST CONTACTS DEBUG - KV list result:', {
        keysFound: list.keys.length,
        listComplete: list.list_complete,
        hasCursor: !!list.cursor,
        sampleKeys: list.keys.slice(0, 3).map((k: any) => k.name)
      });
      
      const batchContacts = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          try {
            const data = await this.main.get(key.name);
            return data ? JSON.parse(data) : null;
          } catch (error) {
            console.error(`❌ LIST CONTACTS DEBUG - Failed to parse contact from key ${key.name}:`, error);
            return null;
          }
        })
      );
      
      const validContacts = batchContacts.filter(Boolean);
      contacts.push(...validContacts);
      cursor = list.list_complete ? undefined : list.cursor;
      
      console.log('📋 LIST CONTACTS DEBUG - Batch processed:', {
        batchSize: list.keys.length,
        validContacts: validContacts.length,
        totalSoFar: contacts.length,
        willContinue: !!cursor
      });
      
    } while (cursor && contacts.length < limit);
    
    console.log('✅ LIST CONTACTS DEBUG - Contact enumeration complete:', {
      totalContacts: contacts.length,
      orgId
    });
    
    return contacts;
  }

  private async updateContactIndexes(orgId: string, contactId: string, contactData: any) {
    // For reliability, always rebuild indexes when contacts change
    // This ensures complete consistency between direct enumeration and indexes
    console.log("CONTACT INDEX UPDATE - Rebuilding for org:", orgId, "contact:", contactId);
    await this.rebuildContactIndexes(orgId);
  }


  // Removed redistributeContactPages and updateContactSearchIndex methods
  // These are no longer needed since updateContactIndexes now does a full rebuild

  private async rebuildContactIndexes(orgId: string) {
    console.log('🔄 INDEX REBUILD DEBUG - Starting contact index rebuild for org:', orgId);
    
    const CONTACTS_PER_PAGE = 50;
    
    try {
      const allContacts = await this.listAllContacts(orgId);
      console.log('📊 INDEX REBUILD DEBUG - Retrieved contacts:', {
        totalContacts: allContacts.length,
        sampleContact: allContacts[0] ? {
          id: allContacts[0].id,
          firstName: allContacts[0].firstName,
          email: allContacts[0].email
        } : null
      });
      
      allContacts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const totalContacts = allContacts.length;
      const totalPages = Math.ceil(totalContacts / CONTACTS_PER_PAGE);
      
      console.log('📄 INDEX REBUILD DEBUG - Rebuilding page indexes:', {
        totalContacts,
        totalPages,
        contactsPerPage: CONTACTS_PER_PAGE
      });
      
      // Clear existing page caches first
      await this.clearContactCaches(orgId);
      console.log('🧹 INDEX REBUILD DEBUG - Cleared existing caches');
      
      // Rebuild page indexes
      for (let page = 1; page <= totalPages; page++) {
        const startIdx = (page - 1) * CONTACTS_PER_PAGE;
        const endIdx = startIdx + CONTACTS_PER_PAGE;
        const pageContacts = allContacts.slice(startIdx, endIdx).map(this.createContactIndexEntry);
        
        const pageKey = this.getContactIndexKey(orgId, page);
        await this.cache.put(pageKey, JSON.stringify(pageContacts));
      }
      
      // Build search index
      console.log('🔍 INDEX REBUILD DEBUG - Building search index...');
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
      console.log('🔍 INDEX REBUILD DEBUG - Search index built with', Object.keys(searchIndex).length, 'contacts');
      
      // Save metadata
      const metadata = {
        totalContacts,
        totalPages,
        lastUpdated: new Date().toISOString()
      };
      
      const metaKey = this.getContactMetaKey(orgId);
      await this.cache.put(metaKey, JSON.stringify(metadata));
      
      console.log('✅ INDEX REBUILD DEBUG - Index rebuild completed successfully:', metadata);
      return metadata;
    } catch (error) {
      console.error('❌ INDEX REBUILD DEBUG - Index rebuild failed:', error);
      throw error;
    }
  }

  private async clearContactCaches(orgId: string) {
    const metaKey = this.getContactMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    if (meta) {
      const metadata = JSON.parse(meta);
      for (let page = 1; page <= metadata.totalPages + 1; page++) {
        const pageKey = this.getContactIndexKey(orgId, page);
        await this.cache.delete(pageKey);
      }
    }
    await this.cache.delete(metaKey);
  }

  // Force rebuild of contact metadata and indexes after mass operations
  async forceRebuildMetadata(orgId: string) {
    console.log('🔄 Forcing metadata rebuild for org:', orgId);
    try {
      // Clear existing cache entries
      await this.clearContactCaches(orgId);
      
      // Rebuild all indexes and metadata
      const metadata = await this.rebuildContactIndexes(orgId);
      
      console.log('✅ Metadata rebuild complete:', {
        totalContacts: metadata.totalContacts,
        totalPages: metadata.totalPages
      });
      
      return metadata;
    } catch (error) {
      console.error('Failed to rebuild metadata:', error);
      throw error;
    }
  }

  // Trigger dynamic segment refresh when contacts are updated
  private async triggerSegmentRefresh(orgId: string) {
    try {
      // Import here to avoid circular dependency
      const { getContactListService } = await import('./contactlist.server');
      const contactListService = getContactListService({ cloudflare: { env: { BUZZLINE_MAIN: this.main } } });
      
      // Get all contacts and refresh all dynamic segments
      const allContacts = await this.listAllContacts(orgId);
      await contactListService.refreshAllDynamicSegments(orgId, allContacts);
    } catch (error) {
      console.warn('Failed to auto-refresh segments:', error);
      // Don't throw error - segment refresh is a nice-to-have feature
    }
  }
}

export function getContactService(context: any): ContactService {
  const env = context?.cloudflare?.env || {};
  return new ContactService(env);
}