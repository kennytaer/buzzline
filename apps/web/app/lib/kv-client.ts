import type { KVEnvironment } from '@buzzline/types';
import { KVKeys } from '~/types/cloudflare';

export class KVClient {
  constructor(
    private env: KVEnvironment,
    private organizationId: string
  ) {}

  // Generic KV operations with automatic organization scoping
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.env.BUZZLINE_MAIN.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  }

  async put(key: string, value: any, options?: { expirationTtl?: number }): Promise<void> {
    try {
      await this.env.BUZZLINE_MAIN.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.error('KV put error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.env.BUZZLINE_MAIN.delete(key);
    } catch (error) {
      console.error('KV delete error:', error);
      throw error;
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const result = await this.env.BUZZLINE_MAIN.list({ prefix });
      return result.keys.map(k => k.name);
    } catch (error) {
      console.error('KV list error:', error);
      return [];
    }
  }

  // Analytics namespace operations
  async getAnalytics<T>(key: string): Promise<T | null> {
    try {
      const value = await this.env.BUZZLINE_ANALYTICS.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('KV analytics get error:', error);
      return null;
    }
  }

  async putAnalytics(key: string, value: any, options?: { expirationTtl?: number }): Promise<void> {
    try {
      await this.env.BUZZLINE_ANALYTICS.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.error('KV analytics put error:', error);
      throw error;
    }
  }

  // Cache namespace operations (with shorter TTL)
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const value = await this.env.BUZZLINE_CACHE.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('KV cache get error:', error);
      return null;
    }
  }

  async putCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.env.BUZZLINE_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } catch (error) {
      console.error('KV cache put error:', error);
      throw error;
    }
  }

  // Batch operations
  async batchPut(entries: Array<{ key: string; value: any }>): Promise<void> {
    const promises = entries.map(({ key, value }) => this.put(key, value));
    await Promise.all(promises);
  }

  async batchDelete(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.delete(key));
    await Promise.all(promises);
  }

  // Index management for search and filtering
  async addToIndex(indexKey: string, itemId: string): Promise<void> {
    const currentIndex = await this.get<string[]>(indexKey) || [];
    if (!currentIndex.includes(itemId)) {
      currentIndex.push(itemId);
      await this.put(indexKey, currentIndex);
    }
  }

  async removeFromIndex(indexKey: string, itemId: string): Promise<void> {
    const currentIndex = await this.get<string[]>(indexKey) || [];
    const updatedIndex = currentIndex.filter(id => id !== itemId);
    await this.put(indexKey, updatedIndex);
  }

  async getFromIndex(indexKey: string): Promise<string[]> {
    return await this.get<string[]>(indexKey) || [];
  }

  // Multi-index operations for complex queries
  async updateItemIndexes(
    itemId: string,
    oldIndexes: string[],
    newIndexes: string[]
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Remove from old indexes
    for (const indexKey of oldIndexes) {
      promises.push(this.removeFromIndex(indexKey, itemId));
    }

    // Add to new indexes
    for (const indexKey of newIndexes) {
      promises.push(this.addToIndex(indexKey, itemId));
    }

    await Promise.all(promises);
  }

  // Organization-scoped helper methods
  getOrganizationKey(key: string): string {
    return key.replace(':orgId:', `:${this.organizationId}:`);
  }

  // Atomic operations simulation
  async atomicUpdate<T>(
    key: string,
    updateFn: (current: T | null) => T
  ): Promise<T> {
    const current = await this.get<T>(key);
    const updated = updateFn(current);
    await this.put(key, updated);
    return updated;
  }
}

// Factory function to create organization-scoped KV clients
export function createKVClient(env: KVEnvironment, organizationId: string): KVClient {
  return new KVClient(env, organizationId);
}