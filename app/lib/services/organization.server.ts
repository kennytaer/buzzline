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
}

export class OrganizationService {
  private main: KVNamespace | MockKVNamespace;

  constructor(env: CloudflareEnv) {
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace('main');
  }

  private getOrgKey(orgId: string, type: string): string {
    return `org:${orgId}:${type}`;
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

  async updateOrganization(orgId: string, updates: any) {
    const org = await this.getOrganization(orgId);
    if (org) {
      const updated = { ...org, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getOrgKey(orgId, 'info');
      await this.main.put(key, JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  // Organization Settings management
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
}

export function getOrganizationService(context: any): OrganizationService {
  const env = context?.cloudflare?.env || {};
  return new OrganizationService(env);
}