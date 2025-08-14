import type { Campaign, CampaignDelivery, CampaignAnalytics, SearchResult } from '@buzzline/types';
import type { KVClient } from '../kv-client';
import { KVKeys } from '~/types/cloudflare';
import { v4 as uuidv4 } from 'uuid';

export class CampaignRepository {
  constructor(
    private kv: KVClient,
    private organizationId: string
  ) {}

  async create(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const campaign: Campaign = {
      id,
      ...campaignData,
      createdAt: now,
      updatedAt: now,
    };

    // Store the campaign
    await this.kv.put(KVKeys.campaign(this.organizationId, id), campaign);

    // Update indexes
    await this.updateCampaignIndexes(campaign, null);

    return campaign;
  }

  async findById(id: string): Promise<Campaign | null> {
    return await this.kv.get<Campaign>(KVKeys.campaign(this.organizationId, id));
  }

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Campaign = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await this.kv.put(KVKeys.campaign(this.organizationId, id), updated);

    // Update indexes if status changed
    if (existing.status !== updated.status) {
      await this.updateCampaignIndexes(updated, existing);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    // Remove campaign
    await this.kv.delete(KVKeys.campaign(this.organizationId, id));

    // Remove from indexes
    await this.removeFromAllIndexes(existing);

    // Clean up deliveries
    await this.deleteAllDeliveries(id);

    // Clean up analytics
    await this.kv.delete(KVKeys.campaignAnalytics(id));

    return true;
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<SearchResult<Campaign>> {
    const campaignIds = await this.kv.getFromIndex(
      KVKeys.campaignsByOrg(this.organizationId)
    );

    const total = campaignIds.length;
    const paginatedIds = campaignIds.slice(offset, offset + limit);
    const campaigns = await this.getCampaignsByIds(paginatedIds);

    return {
      items: campaigns,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  async findByStatus(status: Campaign['status'], limit: number = 100, offset: number = 0): Promise<SearchResult<Campaign>> {
    const campaignIds = await this.kv.getFromIndex(
      KVKeys.campaignsByStatus(this.organizationId, status)
    );

    const total = campaignIds.length;
    const paginatedIds = campaignIds.slice(offset, offset + limit);
    const campaigns = await this.getCampaignsByIds(paginatedIds);

    return {
      items: campaigns,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  // Campaign Delivery Methods
  async createDelivery(delivery: Omit<CampaignDelivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<CampaignDelivery> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const campaignDelivery: CampaignDelivery = {
      id,
      ...delivery,
      createdAt: now,
      updatedAt: now,
    };

    // Store delivery
    await this.kv.put(
      KVKeys.campaignDelivery(this.organizationId, delivery.campaignId, delivery.contactId, delivery.type),
      campaignDelivery
    );

    // Update delivery index
    await this.kv.addToIndex(
      KVKeys.deliveriesByCampaign(this.organizationId, delivery.campaignId),
      `${delivery.contactId}:${delivery.type}`
    );

    return campaignDelivery;
  }

  async updateDelivery(
    campaignId: string,
    contactId: string,
    type: 'email' | 'sms',
    updates: Partial<CampaignDelivery>
  ): Promise<CampaignDelivery | null> {
    const key = KVKeys.campaignDelivery(this.organizationId, campaignId, contactId, type);
    const existing = await this.kv.get<CampaignDelivery>(key);
    
    if (!existing) return null;

    const updated: CampaignDelivery = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.kv.put(key, updated);
    return updated;
  }

  async getDelivery(campaignId: string, contactId: string, type: 'email' | 'sms'): Promise<CampaignDelivery | null> {
    return await this.kv.get<CampaignDelivery>(
      KVKeys.campaignDelivery(this.organizationId, campaignId, contactId, type)
    );
  }

  async getCampaignDeliveries(campaignId: string): Promise<CampaignDelivery[]> {
    const deliveryKeys = await this.kv.getFromIndex(
      KVKeys.deliveriesByCampaign(this.organizationId, campaignId)
    );

    const deliveries: CampaignDelivery[] = [];
    
    for (const key of deliveryKeys) {
      const [contactId, type] = key.split(':');
      const delivery = await this.getDelivery(campaignId, contactId, type as 'email' | 'sms');
      if (delivery) deliveries.push(delivery);
    }

    return deliveries;
  }

  // Campaign Analytics Methods
  async updateAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    const deliveries = await this.getCampaignDeliveries(campaignId);
    
    const analytics: CampaignAnalytics = {
      campaignId,
      totalContacts: new Set(deliveries.map(d => d.contactId)).size,
      emailsSent: deliveries.filter(d => d.type === 'email' && d.status === 'sent').length,
      smsSent: deliveries.filter(d => d.type === 'sms' && d.status === 'sent').length,
      emailsDelivered: deliveries.filter(d => d.type === 'email' && d.status === 'delivered').length,
      smsDelivered: deliveries.filter(d => d.type === 'sms' && d.status === 'delivered').length,
      emailsOpened: deliveries.filter(d => d.type === 'email' && d.status === 'opened').length,
      emailsClicked: deliveries.filter(d => d.type === 'email' && d.status === 'clicked').length,
      emailsBounced: deliveries.filter(d => d.type === 'email' && d.status === 'bounced').length,
      smsFailed: deliveries.filter(d => d.type === 'sms' && d.status === 'failed').length,
      openRate: 0,
      clickRate: 0,
      deliveryRate: 0,
    };

    // Calculate rates
    const emailsDelivered = analytics.emailsDelivered;
    const totalSent = analytics.emailsSent + analytics.smsSent;
    const totalDelivered = analytics.emailsDelivered + analytics.smsDelivered;

    analytics.openRate = emailsDelivered > 0 ? (analytics.emailsOpened / emailsDelivered) * 100 : 0;
    analytics.clickRate = analytics.emailsOpened > 0 ? (analytics.emailsClicked / analytics.emailsOpened) * 100 : 0;
    analytics.deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    // Store analytics
    await this.kv.putAnalytics(KVKeys.campaignAnalytics(campaignId), analytics);

    return analytics;
  }

  async getAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    return await this.kv.getAnalytics<CampaignAnalytics>(KVKeys.campaignAnalytics(campaignId));
  }

  // Bulk operations
  async bulkUpdateStatus(campaignIds: string[], status: Campaign['status']): Promise<number> {
    let updatedCount = 0;

    for (const campaignId of campaignIds) {
      const success = await this.update(campaignId, { status });
      if (success) updatedCount++;
    }

    return updatedCount;
  }

  // Private helper methods
  private async getCampaignsByIds(ids: string[]): Promise<Campaign[]> {
    if (ids.length === 0) return [];

    const promises = ids.map(id => this.findById(id));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean) as Campaign[];
  }

  private async updateCampaignIndexes(campaign: Campaign, previousCampaign: Campaign | null): Promise<void> {
    const promises: Promise<void>[] = [];

    // Add to organization index
    promises.push(this.kv.addToIndex(
      KVKeys.campaignsByOrg(this.organizationId),
      campaign.id
    ));

    // Add to status index
    promises.push(this.kv.addToIndex(
      KVKeys.campaignsByStatus(this.organizationId, campaign.status),
      campaign.id
    ));

    // Remove from old status index if updating
    if (previousCampaign && previousCampaign.status !== campaign.status) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.campaignsByStatus(this.organizationId, previousCampaign.status),
        campaign.id
      ));
    }

    await Promise.all(promises);
  }

  private async removeFromAllIndexes(campaign: Campaign): Promise<void> {
    const promises: Promise<void>[] = [];

    // Remove from organization index
    promises.push(this.kv.removeFromIndex(
      KVKeys.campaignsByOrg(this.organizationId),
      campaign.id
    ));

    // Remove from status index
    promises.push(this.kv.removeFromIndex(
      KVKeys.campaignsByStatus(this.organizationId, campaign.status),
      campaign.id
    ));

    await Promise.all(promises);
  }

  private async deleteAllDeliveries(campaignId: string): Promise<void> {
    const deliveryKeys = await this.kv.getFromIndex(
      KVKeys.deliveriesByCampaign(this.organizationId, campaignId)
    );

    const deletePromises = deliveryKeys.map(key => {
      const [contactId, type] = key.split(':');
      return this.kv.delete(
        KVKeys.campaignDelivery(this.organizationId, campaignId, contactId, type as 'email' | 'sms')
      );
    });

    await Promise.all(deletePromises);

    // Clear the delivery index
    await this.kv.delete(KVKeys.deliveriesByCampaign(this.organizationId, campaignId));
  }
}