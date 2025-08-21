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

export class CampaignService {
  private main: KVNamespace | MockKVNamespace;
  private analytics: KVNamespace | MockKVNamespace;

  constructor(env: CloudflareEnv) {
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace('main');
    this.analytics = env.BUZZLINE_ANALYTICS || new MockKVNamespace('analytics');
  }

  private getCampaignKey(orgId: string, campaignId: string): string {
    return `org:${orgId}:campaign:${campaignId}`;
  }

  async createCampaign(orgId: string, campaignId: string, campaign: any) {
    try {
      if (!orgId || !campaignId) {
        throw new Error('Organization ID and Campaign ID are required');
      }

      const key = this.getCampaignKey(orgId, campaignId);
      const campaignData = {
        ...campaign,
        id: campaignId,
        orgId,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
      
      await this.main.put(key, JSON.stringify(campaignData));
      return campaignData;
    } catch (error) {
      console.error(`Error creating campaign ${campaignId} for org ${orgId}:`, error);
      throw new Error(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCampaign(orgId: string, campaignId: string) {
    try {
      if (!orgId || !campaignId) {
        throw new Error('Organization ID and Campaign ID are required');
      }

      const key = this.getCampaignKey(orgId, campaignId);
      const data = await this.main.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting campaign ${campaignId} for org ${orgId}:`, error);
      throw new Error(`Failed to get campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateCampaign(orgId: string, campaignId: string, updates: any) {
    const campaign = await this.getCampaign(orgId, campaignId);
    if (campaign) {
      const updated = { ...campaign, ...updates, updatedAt: new Date().toISOString() };
      const key = this.getCampaignKey(orgId, campaignId);
      await this.main.put(key, JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  async listCampaigns(orgId: string, limit = 100) {
    try {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const prefix = `org:${orgId}:campaign:`;
      const list = await this.main.list({ prefix, limit });
      const campaigns = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          try {
            const data = await this.main.get(key.name);
            return data ? JSON.parse(data) : null;
          } catch (error) {
            console.error(`Error parsing campaign data for key ${key.name}:`, error);
            return null; // Skip corrupted entries
          }
        })
      );
      return campaigns.filter(Boolean);
    } catch (error) {
      console.error(`Error listing campaigns for org ${orgId}:`, error);
      return []; // Return empty array to prevent UI breakage
    }
  }

  async deleteCampaign(orgId: string, campaignId: string) {
    const key = this.getCampaignKey(orgId, campaignId);
    await this.main.delete(key);
    
    // Also delete related analytics
    const analyticsKey = `org:${orgId}:analytics:${campaignId}`;
    await this.analytics.delete(analyticsKey);
    
    return true;
  }

  // Campaign Delivery tracking
  async trackDelivery(orgId: string, campaignId: string, contactId: string, deliveryData: any) {
    const deliveryId = `${campaignId}-${contactId}`;
    const key = `org:${orgId}:delivery:${deliveryId}`;
    await this.analytics.put(key, JSON.stringify({
      ...deliveryData,
      orgId,
      campaignId,
      contactId,
      deliveryId,
      timestamp: new Date().toISOString()
    }));
  }

  async getDeliveryStatus(orgId: string, campaignId: string, contactId: string) {
    const deliveryId = `${campaignId}-${contactId}`;
    const key = `org:${orgId}:delivery:${deliveryId}`;
    const data = await this.analytics.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Analytics
  async getCampaignAnalytics(orgId: string, campaignId: string) {
    const key = `org:${orgId}:analytics:${campaignId}`;
    const data = await this.analytics.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateCampaignAnalytics(orgId: string, campaignId: string, analytics: any) {
    const key = `org:${orgId}:analytics:${campaignId}`;
    await this.analytics.put(key, JSON.stringify({
      ...analytics,
      orgId,
      campaignId,
      updatedAt: new Date().toISOString()
    }));
  }

  async getCampaignsWithAnalytics(orgId: string) {
    const campaigns = await this.listCampaigns(orgId);
    const campaignsWithAnalytics = await Promise.all(
      campaigns.map(async (campaign) => {
        const analytics = await this.getCampaignAnalytics(orgId, campaign.id);
        return {
          ...campaign,
          analytics
        };
      })
    );
    
    return campaignsWithAnalytics;
  }
}

export function getCampaignService(context: any): CampaignService {
  const env = context?.cloudflare?.env || {};
  return new CampaignService(env);
}