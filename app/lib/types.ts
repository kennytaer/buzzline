// Core data types for BuzzLine

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings: {
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    emailingEndpoint?: string;
    smsEndpoint?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  orgId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  metadata: Record<string, any>; // Industry-specific fields
  contactListIds: string[];
  optedOut: boolean;
  optedOutAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactList {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  contactIds: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'both';
  campaignType: 'sales' | 'company'; // New field for campaign type
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed';
  
  // Templates
  emailTemplate?: {
    subject: string;
    htmlBody: string;
    textBody?: string;
    fromEmail: string;
    fromName?: string;
    signature?: {
      salesPersonName?: string;
      salesPersonTitle?: string;
      salesPersonPhone?: string;
      companyLogoUrl?: string;
    };
  };
  
  smsTemplate?: {
    message: string;
    fromNumber?: string;
  };
  
  // Sales team settings (for sales campaigns)
  salesSettings?: {
    useRoundRobin: boolean;
    selectedMemberIds?: string[]; // If not round robin, use specific members
  };
  
  // Targeting
  contactListIds: string[];
  scheduledAt?: string;
  sentAt?: string;
  
  // Settings
  settings: {
    trackOpens?: boolean;
    trackClicks?: boolean;
    timezone?: string;
  };
  
  createdAt: string;
  updatedAt?: string;
}

export interface CampaignDelivery {
  deliveryId: string;
  orgId: string;
  campaignId: string;
  contactId: string;
  type: 'email' | 'sms';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  
  // Message details
  messageId?: string; // External provider message ID
  toAddress: string; // Email or phone number
  
  // Tracking
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  
  timestamp: string;
}

export interface CampaignAnalytics {
  orgId: string;
  campaignId: string;
  
  // Overall stats
  totalContacts: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  totalOptedOut: number;
  
  // Email specific
  emailStats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  };
  
  // SMS specific
  smsStats?: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  };
  
  updatedAt: string;
}

// CSV Upload types
export interface CSVImportJob {
  id: string;
  orgId: string;
  contactListId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  fieldMapping: Record<string, string>; // CSV column -> Contact field
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  
  errors?: Array<{
    row: number;
    error: string;
  }>;
  
  createdAt: string;
  completedAt?: string;
}

// Webhook types
export interface TwilioWebhookPayload {
  MessageSid: string;
  MessageStatus: string;
  To: string;
  From: string;
  Body?: string;
  AccountSid: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

export interface EmailWebhookPayload {
  event: string;
  email: string;
  timestamp: number;
  'message-id': string;
  tag?: string;
  [key: string]: any;
}