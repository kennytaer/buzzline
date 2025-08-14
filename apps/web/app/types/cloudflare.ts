import type { KVEnvironment } from '@buzzline/types';

// Extend the Remix AppLoadContext with Cloudflare bindings
declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    env: KVEnvironment;
  }
}

// For use in loaders and actions
export interface CloudflareContext {
  env: KVEnvironment;
}

// KV key patterns for organization-scoped data
export const KVKeys = {
  // Organizations
  organization: (orgId: string) => `org:${orgId}:meta`,
  
  // Users
  user: (orgId: string, userId: string) => `org:${orgId}:users:${userId}`,
  usersByOrg: (orgId: string) => `org:${orgId}:indexes:users`,
  
  // Contacts
  contact: (orgId: string, contactId: string) => `org:${orgId}:contacts:${contactId}`,
  contactsByList: (orgId: string, listId: string) => `org:${orgId}:indexes:contacts:list:${listId}`,
  contactsByStatus: (orgId: string, status: string) => `org:${orgId}:indexes:contacts:status:${status}`,
  contactsByTag: (orgId: string, tag: string) => `org:${orgId}:indexes:contacts:tag:${tag}`,
  contactsBySubGroup: (orgId: string, subGroupId: string) => `org:${orgId}:indexes:contacts:subgroup:${subGroupId}`,
  contactMetadataIndex: (orgId: string, field: string, value: string) => 
    `org:${orgId}:indexes:contacts:metadata:${field}:${value}`,
  
  // Contact Lists
  contactList: (orgId: string, listId: string) => `org:${orgId}:lists:${listId}`,
  contactListsByOrg: (orgId: string) => `org:${orgId}:indexes:lists`,
  
  // SubGroups
  subGroup: (orgId: string, subGroupId: string) => `org:${orgId}:subgroups:${subGroupId}`,
  subGroupsByList: (orgId: string, listId: string) => `org:${orgId}:indexes:subgroups:list:${listId}`,
  
  // Campaigns
  campaign: (orgId: string, campaignId: string) => `org:${orgId}:campaigns:${campaignId}`,
  campaignsByOrg: (orgId: string) => `org:${orgId}:indexes:campaigns`,
  campaignsByStatus: (orgId: string, status: string) => `org:${orgId}:indexes:campaigns:status:${status}`,
  
  // Campaign Deliveries
  campaignDelivery: (orgId: string, campaignId: string, contactId: string, type: 'email' | 'sms') => 
    `org:${orgId}:deliveries:${campaignId}:${contactId}:${type}`,
  deliveriesByCampaign: (orgId: string, campaignId: string) => 
    `org:${orgId}:indexes:deliveries:campaign:${campaignId}`,
  
  // Sales Agents
  salesAgent: (orgId: string, agentId: string) => `org:${orgId}:agents:${agentId}`,
  agentsByOrg: (orgId: string) => `org:${orgId}:indexes:agents`,
  agentsByStatus: (orgId: string, status: string) => `org:${orgId}:indexes:agents:status:${status}`,
  agentsByTerritory: (orgId: string, territory: string) => `org:${orgId}:indexes:agents:territory:${territory}`,
  
  // Analytics (stored in BUZZLINE_ANALYTICS namespace)
  campaignAnalytics: (campaignId: string) => `analytics:campaign:${campaignId}`,
  dailyAnalytics: (orgId: string, date: string) => `analytics:org:${orgId}:daily:${date}`,
  monthlyAnalytics: (orgId: string, month: string) => `analytics:org:${orgId}:monthly:${month}`,
} as const;

export type KVKeyType = keyof typeof KVKeys;