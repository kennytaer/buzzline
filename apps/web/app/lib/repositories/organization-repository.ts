import type { Organization } from '@buzzline/types';
import type { KVClient } from '../kv-client';
import { KVKeys } from '~/types/cloudflare';

export class OrganizationRepository {
  constructor(
    private kv: KVClient,
    private organizationId: string
  ) {}

  async create(orgData: Omit<Organization, 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const now = new Date().toISOString();
    
    const organization: Organization = {
      ...orgData,
      phoneStatus: orgData.phoneStatus || 'pending',
      emailStatus: orgData.emailStatus || 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Store the organization
    await this.kv.put(KVKeys.organization(this.organizationId), organization);

    return organization;
  }

  async findById(): Promise<Organization | null> {
    return await this.kv.get<Organization>(KVKeys.organization(this.organizationId));
  }

  async update(updates: Partial<Organization>): Promise<Organization | null> {
    const existing = await this.findById();
    if (!existing) return null;

    const updated: Organization = {
      ...existing,
      ...updates,
      id: existing.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await this.kv.put(KVKeys.organization(this.organizationId), updated);
    return updated;
  }

  async delete(): Promise<boolean> {
    const existing = await this.findById();
    if (!existing) return false;

    await this.kv.delete(KVKeys.organization(this.organizationId));
    return true;
  }

  async upsert(orgData: Omit<Organization, 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const existing = await this.findById();
    
    if (existing) {
      return await this.update(orgData) as Organization;
    } else {
      return await this.create(orgData);
    }
  }

  // Communication settings helpers
  async updateTwilioSettings(settings: {
    twilioPhoneNumber?: string;
    phoneNumberSid?: string;
    phoneStatus?: Organization['phoneStatus'];
  }): Promise<Organization | null> {
    return await this.update(settings);
  }

  async updateMailgunSettings(settings: {
    emailDomain?: string;
    emailFromAddress?: string;
    mailgunDomainKey?: string;
    emailStatus?: Organization['emailStatus'];
  }): Promise<Organization | null> {
    return await this.update(settings);
  }
}