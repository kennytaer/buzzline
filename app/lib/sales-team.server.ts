import { getKVService, KVService } from "./kv.server";

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
  private kv: KVService;

  constructor(kv: KVService) {
    this.kv = kv;
  }

  private getKey(orgId: string, type: string, id?: string): string {
    return id ? `org:${orgId}:salesteam:${id}` : `org:${orgId}:salesteam:list`;
  }

  async createMember(orgId: string, memberData: Omit<SalesTeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesTeamMember> {
    // Check for duplicate email first
    const existingMember = await this.kv.findSalesTeamMemberByEmail(orgId, memberData.email);
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

    // Store individual member
    const key = `org:${orgId}:salesteam:${id}`;
    await this.kv.putSalesTeamData(key, member);

    // Update indexes (new efficient system)
    await this.kv.updateSalesTeamIndexes(orgId, id, member);

    // Update legacy list for backward compatibility
    const membersList = await this.getAllMembers(orgId);
    membersList.push(member);
    const listKey = `org:${orgId}:salesteam:list`;
    await this.kv.putSalesTeamData(listKey, membersList);

    return member;
  }

  async getMember(orgId: string, id: string): Promise<SalesTeamMember | null> {
    const key = `org:${orgId}:salesteam:${id}`;
    return await this.kv.getSalesTeamData(key);
  }

  async getAllMembers(orgId: string): Promise<SalesTeamMember[]> {
    const key = `org:${orgId}:salesteam:list`;
    const data = await this.kv.getSalesTeamData(key);
    return data || [];
  }

  async getMembersPaginated(orgId: string, page: number = 1, limit: number = 20, search?: string) {
    return await this.kv.getSalesTeamPaginated(orgId, page, limit, search);
  }

  async getActiveMembers(orgId: string): Promise<SalesTeamMember[]> {
    // Use the same pagination method that works, but get all members
    const result = await this.kv.getSalesTeamPaginated(orgId, 1, 1000); // Get up to 1000 members (should be enough)
    const members = result.members || [];
    const activeMembers = members.filter(member => member.isActive);
    return activeMembers;
  }

  async updateMember(orgId: string, id: string, updates: Partial<Omit<SalesTeamMember, 'id' | 'createdAt'>>): Promise<SalesTeamMember | null> {
    const member = await this.getMember(orgId, id);
    if (!member) return null;

    // Check for duplicate email if email is being updated
    if (updates.email && updates.email !== member.email) {
      const existingMember = await this.kv.findSalesTeamMemberByEmail(orgId, updates.email);
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
    const key = `org:${orgId}:salesteam:${id}`;
    await this.kv.putSalesTeamData(key, updatedMember);

    // Update indexes (new efficient system)
    await this.kv.updateSalesTeamIndexes(orgId, id, updatedMember);

    // Update legacy list for backward compatibility
    const membersList = await this.getAllMembers(orgId);
    const index = membersList.findIndex(m => m.id === id);
    if (index >= 0) {
      membersList[index] = updatedMember;
      const listKey = `org:${orgId}:salesteam:list`;
      await this.kv.putSalesTeamData(listKey, membersList);
    }

    return updatedMember;
  }

  async deleteMember(orgId: string, id: string): Promise<boolean> {
    const member = await this.getMember(orgId, id);
    if (!member) return false;

    // Delete individual member
    const key = `org:${orgId}:salesteam:${id}`;
    await this.kv.deleteSalesTeamData(key);

    // Update members list
    const membersList = await this.getAllMembers(orgId);
    const filteredList = membersList.filter(m => m.id !== id);
    const listKey = `org:${orgId}:salesteam:list`;
    await this.kv.putSalesTeamData(listKey, filteredList);

    return true;
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
    const rrKey = `org:${orgId}:salesteam:round_robin_index`;
    const currentIndexData = await this.kv.getSalesTeamData(rrKey);
    let currentIndex = currentIndexData ? parseInt(currentIndexData) : 0;

    // Get member at current index
    const member = activeMembers[currentIndex];

    // Update index for next time
    const nextIndex = (currentIndex + 1) % activeMembers.length;
    await this.kv.putSalesTeamData(rrKey, nextIndex.toString());

    return member;
  }

  async importMembers(orgId: string, members: Array<Omit<SalesTeamMember, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SalesTeamMember[]> {
    const createdMembers: SalesTeamMember[] = [];

    for (const memberData of members) {
      const member = await this.createMember(orgId, memberData);
      createdMembers.push(member);
    }

    return createdMembers;
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
}

export function getSalesTeamService(context: any = {}): SalesTeamService {
  const kv = getKVService(context);
  return new SalesTeamService(kv);
}