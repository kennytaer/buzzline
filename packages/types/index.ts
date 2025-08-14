export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Communication settings
  twilioPhoneNumber?: string;
  phoneNumberSid?: string;
  phoneStatus: 'pending' | 'active' | 'suspended';
  
  emailDomain?: string;
  emailFromAddress?: string;
  mailgunDomainKey?: string;
  emailStatus: 'pending' | 'verified' | 'failed';
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  role: 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  organizationId: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  contactListId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: 'active' | 'unsubscribed' | 'archived' | 'pending' | 'bounced';
  subGroups: string[];
  metadata: Record<string, any>;
  flags: {
    emailOptedOut: boolean;
    smsOptedOut: boolean;
    isVip: boolean;
    [key: string]: boolean;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  organizationId: string;
  contactListId: string;
  emailTemplate?: {
    subject: string;
    content: string;
    htmlContent?: string;
  };
  smsTemplate?: {
    content: string;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDelivery {
  id: string;
  campaignId: string;
  contactId: string;
  type: 'email' | 'sms';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  externalId?: string;
  errorMessage?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalContacts: number;
  emailsSent: number;
  smsSent: number;
  emailsDelivered: number;
  smsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  smsFailed: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

// New interfaces for enhanced functionality
export interface SubGroup {
  id: string;
  listId: string;
  name: string;
  description: string;
  contactIds: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SalesAgent {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  status: 'active' | 'inactive' | 'vacation';
  metadata: Record<string, any>;
  tags: string[];
  territories: string[];
  performance: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

// Cloudflare KV Environment interface
export interface KVEnvironment {
  BUZZLINE_MAIN: KVNamespace;
  BUZZLINE_ANALYTICS: KVNamespace;
  BUZZLINE_CACHE: KVNamespace;
}

// Search and filtering interfaces
export interface ContactFilter {
  listId?: string;
  status?: Contact['status'];
  tags?: string[];
  subGroups?: string[];
  metadata?: Record<string, any>;
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}