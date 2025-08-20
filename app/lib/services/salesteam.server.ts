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

export interface SalesTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SalesTeamService {
  private main: KVNamespace | MockKVNamespace;
  private cache: KVNamespace | MockKVNamespace;

  constructor(env: CloudflareEnv) {
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace('main');
    this.cache = env.BUZZLINE_CACHE || new MockKVNamespace('cache');
  }

  private getMemberKey(orgId: string, memberId: string): string {
    return `org:${orgId}:salesteam:${memberId}`;
  }

  private getSalesTeamIndexKey(orgId: string, page: number): string {
    return `org:${orgId}:salesteam_index:page_${page}`;
  }

  private getSalesTeamMetaKey(orgId: string): string {
    return `org:${orgId}:salesteam_meta`;
  }

  private getSalesTeamSearchKey(orgId: string): string {
    return `org:${orgId}:salesteam_search`;
  }

  private getRoundRobinKey(orgId: string): string {
    return `org:${orgId}:salesteam:round_robin_index`;
  }

  private createSalesTeamIndexEntry(member: SalesTeamMember) {
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

  async createMember(orgId: string, memberData: Omit<SalesTeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesTeamMember> {
    // Check for duplicate email first
    const existingMember = await this.findMemberByEmail(orgId, memberData.email);
    if (existingMember) {
      throw new Error('A team member with this email already exists');
    }

    const id = `stm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const member: SalesTeamMember = {
      id,
      ...memberData,
      createdAt: now,
      updatedAt: now,
    };

    // Store individual member (single source of truth)
    const key = this.getMemberKey(orgId, id);
    await this.main.put(key, JSON.stringify(member));

    // Update indexes for efficient retrieval
    await this.updateSalesTeamIndexes(orgId, id, member);

    return member;
  }

  async getMember(orgId: string, id: string): Promise<SalesTeamMember | null> {
    const key = this.getMemberKey(orgId, id);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateMember(orgId: string, id: string, updates: Partial<Omit<SalesTeamMember, 'id' | 'createdAt'>>): Promise<SalesTeamMember | null> {
    const member = await this.getMember(orgId, id);
    if (!member) return null;

    // Check for duplicate email if email is being updated
    if (updates.email && updates.email !== member.email) {
      const existingMember = await this.findMemberByEmail(orgId, updates.email);
      if (existingMember && existingMember.id !== id) {
        throw new Error('A team member with this email already exists');
      }
    }

    const updatedMember: SalesTeamMember = {
      ...member,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update individual member
    const key = this.getMemberKey(orgId, id);
    await this.main.put(key, JSON.stringify(updatedMember));

    // Update indexes
    await this.updateSalesTeamIndexes(orgId, id, updatedMember);

    return updatedMember;
  }

  async deleteMember(orgId: string, id: string): Promise<boolean> {
    const member = await this.getMember(orgId, id);
    if (!member) return false;

    // Delete individual member
    const key = this.getMemberKey(orgId, id);
    await this.main.delete(key);

    // Clear caches to force rebuild
    await this.clearSalesTeamCaches(orgId);
    await this.rebuildSalesTeamIndexes(orgId);

    return true;
  }

  async getAllMembers(orgId: string): Promise<SalesTeamMember[]> {
    const prefix = `org:${orgId}:salesteam:`;
    const members: SalesTeamMember[] = [];
    let cursor: string | undefined = undefined;
    
    do {
      const list: any = await this.main.list({ prefix, limit: 1000, cursor });
      
      const batchMembers = await Promise.all(
        list.keys
          .filter((key: { name: string }) => !key.name.includes('_index') && !key.name.includes('_meta') && !key.name.includes('_search') && !key.name.includes('round_robin'))
          .map(async (key: { name: string }) => {
            const data = await this.main.get(key.name);
            return data ? JSON.parse(data) : null;
          })
      );
      
      members.push(...batchMembers.filter(Boolean));
      cursor = list.list_complete ? undefined : list.cursor;
      
    } while (cursor);
    
    return members;
  }

  async getMembersPaginated(orgId: string, page: number = 1, limit: number = 20, search?: string) {
    if (search) {
      return this.searchSalesTeamPaginated(orgId, page, limit, search);
    }
    
    const metaKey = this.getSalesTeamMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    let metadata = meta ? JSON.parse(meta) : await this.rebuildSalesTeamIndexes(orgId);
    
    const pageKey = this.getSalesTeamIndexKey(orgId, page);
    let pageData = await this.cache.get(pageKey);
    
    if (!pageData) {
      metadata = await this.rebuildSalesTeamIndexes(orgId);
      pageData = await this.cache.get(pageKey);
    }
    
    const members = pageData ? JSON.parse(pageData) : [];
    
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

  async getActiveMembers(orgId: string): Promise<SalesTeamMember[]> {
    const members = await this.getAllMembers(orgId);
    return members.filter(member => member.isActive);
  }

  async getRandomActiveMember(orgId: string): Promise<SalesTeamMember | null> {
    const activeMembers = await this.getActiveMembers(orgId);
    if (activeMembers.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * activeMembers.length);
    return activeMembers[randomIndex];
  }

  async getRoundRobinMember(orgId: string): Promise<SalesTeamMember | null> {
    const activeMembers = await this.getActiveMembers(orgId);
    if (activeMembers.length === 0) return null;

    // Get current round-robin index
    const rrKey = this.getRoundRobinKey(orgId);
    const currentIndexData = await this.main.get(rrKey);
    let currentIndex = currentIndexData ? parseInt(currentIndexData) : 0;

    // Get member at current index
    const member = activeMembers[currentIndex];

    // Update index for next time
    const nextIndex = (currentIndex + 1) % activeMembers.length;
    await this.main.put(rrKey, nextIndex.toString());

    return member;
  }

  async findMemberByEmail(orgId: string, email: string): Promise<SalesTeamMember | null> {
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (searchData) {
      const searchIndex = JSON.parse(searchData);
      
      for (const [memberId, indexEntry] of Object.entries(searchIndex) as [string, any][]) {
        if (indexEntry.email && indexEntry.email.toLowerCase() === email.toLowerCase()) {
          return await this.getMember(orgId, memberId);
        }
      }
    }
    
    // Fallback to direct search if no index
    const allMembers = await this.getAllMembers(orgId);
    return allMembers.find(m => m.email && m.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getMemberStats(orgId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const members = await this.getAllMembers(orgId);
    const active = members.filter(m => m.isActive).length;
    
    return {
      total: members.length,
      active,
      inactive: members.length - active,
    };
  }

  // Index management methods
  private async updateSalesTeamIndexes(orgId: string, memberId: string, memberData: SalesTeamMember) {
    const MEMBERS_PER_PAGE = 20;
    
    const metaKey = this.getSalesTeamMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    let metadata = meta ? JSON.parse(meta) : { totalMembers: 0, totalPages: 0, lastUpdated: new Date().toISOString() };
    
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    let searchIndex = searchData ? JSON.parse(searchData) : {};
    const isNewMember = !searchIndex[memberId];
    
    if (isNewMember) {
      metadata.totalMembers++;
      metadata.totalPages = Math.ceil(metadata.totalMembers / MEMBERS_PER_PAGE);
    }
    
    const pageKey = this.getSalesTeamIndexKey(orgId, 1);
    let pageData = await this.cache.get(pageKey);
    let members = pageData ? JSON.parse(pageData) : [];
    
    members = members.filter((m: any) => m.id !== memberId);
    const indexEntry = this.createSalesTeamIndexEntry(memberData);
    members.unshift(indexEntry);
    
    if (members.length > MEMBERS_PER_PAGE) {
      await this.redistributeSalesTeamPages(orgId, members, MEMBERS_PER_PAGE);
    } else {
      await this.cache.put(pageKey, JSON.stringify(members));
    }
    
    metadata.lastUpdated = new Date().toISOString();
    await this.cache.put(metaKey, JSON.stringify(metadata));
    
    await this.updateSalesTeamSearchIndex(orgId, memberData);
  }

  private async redistributeSalesTeamPages(orgId: string, allMembers: any[], membersPerPage: number) {
    for (let page = 1; page <= Math.ceil(allMembers.length / membersPerPage); page++) {
      const startIdx = (page - 1) * membersPerPage;
      const endIdx = startIdx + membersPerPage;
      const pageMembers = allMembers.slice(startIdx, endIdx);
      
      const pageKey = this.getSalesTeamIndexKey(orgId, page);
      if (pageMembers.length > 0) {
        await this.cache.put(pageKey, JSON.stringify(pageMembers));
      } else {
        await this.cache.delete(pageKey);
      }
    }
  }

  private async updateSalesTeamSearchIndex(orgId: string, memberData: SalesTeamMember) {
    const searchText = [
      memberData.firstName,
      memberData.lastName,
      memberData.email,
      memberData.phone,
      memberData.title,
      memberData.department
    ].filter(Boolean).join(' ').toLowerCase();
    
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    let searchIndex = searchData ? JSON.parse(searchData) : {};
    
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

  private async searchSalesTeamPaginated(orgId: string, page: number, limit: number, search: string) {
    const searchKey = this.getSalesTeamSearchKey(orgId);
    let searchData = await this.cache.get(searchKey);
    
    if (!searchData) {
      await this.rebuildSalesTeamIndexes(orgId);
      searchData = await this.cache.get(searchKey);
    }
    
    const searchIndex = searchData ? JSON.parse(searchData) : {};
    const searchLower = search.toLowerCase();
    
    const matchingMembers = Object.values(searchIndex)
      .filter((entry: any) => entry.searchText.includes(searchLower))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const totalMembers = matchingMembers.length;
    const totalPages = Math.ceil(totalMembers / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = matchingMembers.slice(offset, offset + limit);
    
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

  private async rebuildSalesTeamIndexes(orgId: string) {
    const MEMBERS_PER_PAGE = 20;
    const allMembers = await this.getAllMembers(orgId);
    
    allMembers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const totalMembers = allMembers.length;
    const totalPages = Math.ceil(totalMembers / MEMBERS_PER_PAGE);
    
    for (let page = 1; page <= totalPages; page++) {
      const startIdx = (page - 1) * MEMBERS_PER_PAGE;
      const endIdx = startIdx + MEMBERS_PER_PAGE;
      const pageMembers = allMembers.slice(startIdx, endIdx).map(member => this.createSalesTeamIndexEntry(member));
      
      const pageKey = this.getSalesTeamIndexKey(orgId, page);
      await this.cache.put(pageKey, JSON.stringify(pageMembers));
    }
    
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
    
    const metadata = {
      totalMembers,
      totalPages,
      lastUpdated: new Date().toISOString()
    };
    
    const metaKey = this.getSalesTeamMetaKey(orgId);
    await this.cache.put(metaKey, JSON.stringify(metadata));
    
    return metadata;
  }

  private async clearSalesTeamCaches(orgId: string) {
    const metaKey = this.getSalesTeamMetaKey(orgId);
    let meta = await this.cache.get(metaKey);
    if (meta) {
      const metadata = JSON.parse(meta);
      for (let page = 1; page <= metadata.totalPages + 1; page++) {
        const pageKey = this.getSalesTeamIndexKey(orgId, page);
        await this.cache.delete(pageKey);
      }
    }
    await this.cache.delete(metaKey);
    await this.cache.delete(this.getSalesTeamSearchKey(orgId));
  }
}

export function getSalesTeamService(context: any): SalesTeamService {
  const env = context?.cloudflare?.env || {};
  return new SalesTeamService(env);
}