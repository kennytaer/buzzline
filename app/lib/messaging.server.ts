// Messaging service for SMS and Email sending via provided endpoints

export interface SMSMessage {
  to: string;
  from: string; // SMS phone number
  message: string;
  campaignId: string;
  contactId: string;
  orgId: string;
}

export interface EmailMessage {
  to: string;
  from: string; // Email address
  subject: string;
  htmlBody: string;
  campaignId: string;
  contactId: string;
  orgId: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'sms' | 'email';
}

export class MessagingService {
  private smsEndpoint: string;
  private emailEndpoint: string;
  private twilioAccountSid: string;
  private twilioAuthToken: string;

  constructor(context?: any) {
    // Use context.env for Cloudflare environment variables, fallback to process.env
    const env = context?.env || process.env;
    this.smsEndpoint = env.SMS_ENDPOINT || '';
    this.emailEndpoint = env.EMAILING_ENDPOINT || '';
    this.twilioAccountSid = env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = env.TWILIO_AUTH_TOKEN || '';
    
    // Debug logging
    console.log('MessagingService env check:', {
      hasContext: !!context,
      hasContextEnv: !!context?.env,
      smsEndpoint: this.smsEndpoint,
      emailEndpoint: this.emailEndpoint,
      processEnvSMS: process.env.SMS_ENDPOINT,
      processEnvEmail: process.env.EMAILING_ENDPOINT
    });
  }

  async sendSMS(message: SMSMessage): Promise<MessageResult> {
    if (!this.smsEndpoint) {
      return {
        success: false,
        error: 'SMS service not configured',
        provider: 'sms'
      };
    }

    try {
      const response = await fetch(`https://${this.smsEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'benchmetrics-3dc3c222-64ab-4d44-abd5-84f648e1d8af'
        },
        body: JSON.stringify({
          from: message.from, // SMS phone number
          to: message.to,
          text: message.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `SMS API error: ${response.status} ${errorData}`,
          provider: 'sms'
        };
      }

      const result = await response.json() as any;
      
      return {
        success: true,
        messageId: result.sid || result.messageId || result.id,
        provider: 'sms'
      };

    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: `SMS network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'sms'
      };
    }
  }

  async sendEmail(message: EmailMessage): Promise<MessageResult> {
    if (!this.emailEndpoint) {
      return {
        success: false,
        error: 'Email service not configured',
        provider: 'email'
      };
    }

    try {
      const response = await fetch(`https://${this.emailEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'google-sheet-for-leads-5d6811e4-6ba7-4822-919f-f3103c50f9d0'
        },
        body: JSON.stringify({
          from: message.from, // Email address
          to: message.to, // Customer email address  
          subject: message.subject,
          html: message.htmlBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `Email API error: ${response.status} ${errorData}`,
          provider: 'email'
        };
      }

      const result = await response.json() as any;
      
      return {
        success: true,
        messageId: result.id || result.messageId || result.message?.id,
        provider: 'email'
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: `Email network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'email'
      };
    }
  }

  // Template variable replacement
  replaceVariables(template: string, contact: any, campaign?: any, salesMember?: any): string {
    let result = template;
    
    // Basic contact variables
    result = result.replace(/\{firstName\}/g, contact.firstName || '');
    result = result.replace(/\{lastName\}/g, contact.lastName || '');
    result = result.replace(/\{email\}/g, contact.email || '');
    result = result.replace(/\{phone\}/g, contact.phone || '');
    
    // Support both {{}} and {} syntax for backward compatibility
    result = result.replace(/\{\{firstName\}\}/g, contact.firstName || '');
    result = result.replace(/\{\{lastName\}\}/g, contact.lastName || '');
    result = result.replace(/\{\{email\}\}/g, contact.email || '');
    result = result.replace(/\{\{phone\}\}/g, contact.phone || '');
    
    // Sales team member variables (for sales campaigns)
    if (salesMember) {
      result = result.replace(/\{salesTeamFirstName\}/g, salesMember.firstName || '');
      result = result.replace(/\{salesTeamLastName\}/g, salesMember.lastName || '');
      result = result.replace(/\{salesTeamEmail\}/g, salesMember.email || '');
      result = result.replace(/\{salesTeamPhone\}/g, salesMember.phone || '');
      result = result.replace(/\{salesTeamTitle\}/g, salesMember.title || '');
      
      // Support both {{}} and {} syntax
      result = result.replace(/\{\{salesTeamFirstName\}\}/g, salesMember.firstName || '');
      result = result.replace(/\{\{salesTeamLastName\}\}/g, salesMember.lastName || '');
      result = result.replace(/\{\{salesTeamEmail\}\}/g, salesMember.email || '');
      result = result.replace(/\{\{salesTeamPhone\}\}/g, salesMember.phone || '');
      result = result.replace(/\{\{salesTeamTitle\}\}/g, salesMember.title || '');
    }
    
    // Custom metadata variables
    if (contact.metadata) {
      Object.keys(contact.metadata).forEach(key => {
        if (!key.endsWith('_display_name')) {
          const displayName = contact.metadata[`${key}_display_name`] || key;
          const value = contact.metadata[key] || '';
          
          // Convert display name to camelCase for variable usage
          const camelCaseKey = this.toCamelCase(displayName);
          
          // Replace all possible variations
          const variations = [key, displayName, camelCaseKey];
          variations.forEach(variation => {
            const regex1 = new RegExp(`\\{${variation}\\}`, 'g');
            const regex2 = new RegExp(`\\{\\{${variation}\\}\\}`, 'g');
            result = result.replace(regex1, value);
            result = result.replace(regex2, value);
          });
        }
      });
    }
    
    // Signature handling - always append signature automatically
    if (campaign?.emailTemplate?.signature || salesMember) {
      const signatureData = salesMember ? {
        salesPersonName: `${salesMember.firstName} ${salesMember.lastName}`,
        salesPersonTitle: salesMember.title,
        salesPersonPhone: salesMember.phone,
        companyLogoUrl: campaign?.emailTemplate?.signature?.companyLogoUrl
      } : campaign?.emailTemplate?.signature;
      
      if (signatureData) {
        const signature = this.generateSignature(signatureData);
        
        // Replace signature variables if they exist
        result = result.replace(/\{signature\}/g, signature);
        result = result.replace(/\{\{signature\}\}/g, signature);
        
        // Always automatically append signature if not already included via variable
        if (!result.includes('{signature}') && !result.includes('{{signature}}') && 
            !result.toLowerCase().includes('chat soon') && // Avoid duplicate signatures
            !result.toLowerCase().includes('unsubscribe here')) {
          result += signature;
        }
      }
    }
    
    return result;
  }

  // Convert string to camelCase
  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  // Generate HTML signature
  private generateSignature(signatureData: any): string {
    if (!signatureData.salesPersonName) {
      return '';
    }

    let signature = `<br/>
<p style="margin:0px;">Chat soon,</p>
<p style="margin:0px;"><strong>${signatureData.salesPersonName}</strong></p>`;

    // Add position if provided
    if (signatureData.salesPersonTitle) {
      signature += `<p style="margin:0px;">${signatureData.salesPersonTitle}</p>`;
    }

    // Company logo - use provided default or custom URL
    const logoUrl = signatureData.companyLogoUrl || 'https://imagedelivery.net/fdADyrHW5AIzXwUyxun8dw/b95b1ebf-081b-454a-41f0-4ef26623c400/public';
    signature += `<img src="${logoUrl}" width="180px" style="display:block;margin:0px 0px 0px -8px;">`;
    
    // Unsubscribe footer - will be replaced with actual unsubscribe URL during sending
    signature += `<p style="display:block;margin:5px 0px;color:#343433;">No longer want to receive these types of emails? <a href="{unsubscribeUrl}" target="_blank" style="font-weight:600;">Unsubscribe here.</a></p>`;
    
    return signature;
  }

  // Generate unsubscribe URL
  generateUnsubscribeUrl(orgId: string, contactId: string, campaignId: string): string {
    // Generate a secure token for the unsubscribe link
    const token = Buffer.from(`${orgId}:${contactId}:${campaignId}:${Date.now()}`).toString('base64url');
    
    // Use environment variable for domain or fallback to localhost for development
    const domain = process.env.APP_DOMAIN || process.env.PUBLIC_URL || 'https://buzzline.app';
    
    return `${domain}/unsubscribe/${token}`;
  }
}