import type { User } from '@buzzline/types';
import type { KVClient } from '../kv-client';
import { KVKeys } from '~/types/cloudflare';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  constructor(
    private kv: KVClient,
    private organizationId: string
  ) {}

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    // Store the user
    await this.kv.put(KVKeys.user(this.organizationId, id), user);

    // Update indexes
    await this.kv.addToIndex(
      KVKeys.usersByOrg(this.organizationId),
      id
    );

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return await this.kv.get<User>(KVKeys.user(this.organizationId, id));
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    // For now, we'll do a simple search through all users
    // In a more complex system, you might want a separate index for clerkId
    const userIds = await this.kv.getFromIndex(KVKeys.usersByOrg(this.organizationId));
    
    for (const userId of userIds) {
      const user = await this.findById(userId);
      if (user && user.clerkId === clerkId) {
        return user;
      }
    }
    
    return null;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await this.kv.put(KVKeys.user(this.organizationId, id), updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    // Remove from storage
    await this.kv.delete(KVKeys.user(this.organizationId, id));

    // Remove from indexes
    await this.kv.removeFromIndex(
      KVKeys.usersByOrg(this.organizationId),
      id
    );

    return true;
  }

  async findAll(): Promise<User[]> {
    const userIds = await this.kv.getFromIndex(KVKeys.usersByOrg(this.organizationId));
    const promises = userIds.map(id => this.findById(id));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean) as User[];
  }

  async upsertByClerkId(
    clerkId: string, 
    userData: Omit<User, 'id' | 'clerkId' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const existing = await this.findByClerkId(clerkId);
    
    if (existing) {
      return await this.update(existing.id, userData) as User;
    } else {
      return await this.create({ ...userData, clerkId });
    }
  }
}