import { ContactService, getContactService } from "./contact.server";
import { CampaignService, getCampaignService } from "./campaign.server";
import { SalesTeamService, getSalesTeamService } from "./salesteam.server";
import { MessagingService } from "../messaging.server";
import { formatPhoneNumber } from "../utils";

export interface SendCampaignResult {
  success: boolean;
  totalContacts: number;
  emailsSent: number;
  smsSent: number;
  failures: number;
  errors: Array<{
    contactId: string;
    error: string;
    type: 'email' | 'sms';
  }>;
}

export class CampaignSenderService {
  private contactService: ContactService;
  private campaignService: CampaignService;
  private salesTeamService: SalesTeamService;
  private messagingService: MessagingService;

  constructor(context: any) {
    this.contactService = getContactService(context);
    this.campaignService = getCampaignService(context);
    this.salesTeamService = getSalesTeamService(context);
    this.messagingService = new MessagingService();
  }

  async sendCampaign(orgId: string, campaignId: string): Promise<SendCampaignResult> {
    const result: SendCampaignResult = {
      success: false,
      totalContacts: 0,
      emailsSent: 0,
      smsSent: 0,
      failures: 0,
      errors: []
    };

    try {
      const campaign = await this.campaignService.getCampaign(orgId, campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Optimized contact retrieval
      let allContacts: any[] = [];
      if (campaign.targetingMode === 'specific' && campaign.specificContactIds) {
        allContacts = await this.contactService.getContactsByIds(orgId, campaign.specificContactIds);
      } else if (campaign.contactListIds) {
        allContacts = await this.contactService.getContactsByListIds(orgId, campaign.contactListIds);
      }
      
      result.totalContacts = allContacts.length;

      if (allContacts.length === 0) {
        const errorMsg = campaign.targetingMode === 'specific' 
          ? 'No contacts found with the specified IDs'
          : 'No contacts found in selected lists';
        throw new Error(errorMsg);
      }

      await this.campaignService.updateCampaign(orgId, campaignId, {
        status: 'sending',
        sentAt: new Date().toISOString()
      });

      // Get sales team members for sales campaigns
      let salesTeamMembers: any[] = [];
      if (campaign.campaignType === 'sales') {
        if (campaign.salesSettings?.useRoundRobin) {
          salesTeamMembers = await this.salesTeamService.getActiveMembers(orgId);
        } else if (campaign.salesSettings?.selectedMemberIds?.length) {
          const allMembers = await this.salesTeamService.getAllMembers(orgId);
          salesTeamMembers = allMembers.filter((member: any) => 
            campaign.salesSettings.selectedMemberIds.includes(member.id) && member.isActive
          );
        }
        
        if (salesTeamMembers.length === 0) {
          throw new Error('No active sales team members available for sales campaign');
        }
      }

      // Send messages to contacts
      await this.sendMessagesToContacts(
        orgId, 
        campaignId, 
        campaign, 
        allContacts, 
        salesTeamMembers, 
        result
      );

      await this.campaignService.updateCampaign(orgId, campaignId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      await this.updateCampaignAnalytics(orgId, campaignId, result);
      result.success = true;

    } catch (error) {
      await this.campaignService.updateCampaign(orgId, campaignId, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  private async sendMessagesToContacts(
    orgId: string,
    campaignId: string,
    campaign: any,
    contacts: any[],
    salesTeamMembers: any[],
    result: SendCampaignResult
  ) {
    // Process contacts in batches to avoid overwhelming the system
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (contact, contactIndex) => {
        const globalIndex = i + contactIndex;
        
        if (contact.optedOut) {
          return; // Skip opted-out contacts
        }

        // Get sales team member for this contact
        let salesMember = null;
        if (campaign.campaignType === 'sales' && salesTeamMembers.length > 0) {
          if (campaign.salesSettings?.useRoundRobin) {
            salesMember = await this.salesTeamService.getRoundRobinMember(orgId);
          } else {
            salesMember = salesTeamMembers[globalIndex % salesTeamMembers.length];
          }
        }

        // Send email if needed
        if ((campaign.type === 'email' || campaign.type === 'both') && campaign.emailTemplate) {
          try {
            await this.sendEmailToContact(orgId, campaignId, campaign, contact, salesMember);
            result.emailsSent++;
          } catch (error) {
            result.failures++;
            result.errors.push({
              contactId: contact.id,
              error: error instanceof Error ? error.message : 'Unknown email error',
              type: 'email'
            });
          }
        }

        // Send SMS if needed
        if ((campaign.type === 'sms' || campaign.type === 'both') && campaign.smsTemplate) {
          try {
            await this.sendSmsToContact(orgId, campaignId, campaign, contact, salesMember);
            result.smsSent++;
          } catch (error) {
            result.failures++;
            result.errors.push({
              contactId: contact.id,
              error: error instanceof Error ? error.message : 'Unknown SMS error',
              type: 'sms'
            });
          }
        }
      });

      // Process batch and add small delay
      await Promise.all(batchPromises);
      await this.sleep(200); // Small delay between batches
    }
  }

  private async sendEmailToContact(orgId: string, campaignId: string, campaign: any, contact: any, salesMember?: any) {
    if (!campaign.emailTemplate || !contact.email) {
      throw new Error('Email template or contact email missing');
    }

    const subject = this.messagingService.replaceVariables(campaign.emailTemplate.subject, contact, campaign, salesMember);
    let htmlBody = this.messagingService.replaceVariables(campaign.emailTemplate.htmlBody, contact, campaign, salesMember);
    
    const unsubscribeUrl = this.messagingService.generateUnsubscribeUrl(orgId, contact.id, campaignId);
    htmlBody = htmlBody.replace(/\{unsubscribeUrl\}/g, unsubscribeUrl);
    htmlBody = htmlBody.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
    
    if (!htmlBody.includes('unsubscribe') && !htmlBody.includes('opt-out')) {
      htmlBody += `<br><br><p style="font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a> from these emails.</p>`;
    }

    const fromEmail = salesMember ? salesMember.email : campaign.emailTemplate.fromEmail;
    const fromName = salesMember ? `${salesMember.firstName} ${salesMember.lastName}` : campaign.emailTemplate.fromName;

    const messageResult = await this.messagingService.sendEmail({
      to: contact.email,
      from: fromEmail,
      subject,
      htmlBody,
      campaignId,
      contactId: contact.id,
      orgId
    });

    if (!messageResult.success) {
      throw new Error(messageResult.error || 'Email sending failed');
    }

    await this.campaignService.trackDelivery(orgId, campaignId, contact.id, {
      type: 'email',
      status: 'sent',
      messageId: messageResult.messageId,
      toAddress: contact.email,
      sentAt: new Date().toISOString(),
      salesMemberId: salesMember?.id
    });
  }

  private async sendSmsToContact(orgId: string, campaignId: string, campaign: any, contact: any, salesMember?: any) {
    if (!campaign.smsTemplate || !contact.phone) {
      throw new Error('SMS template or contact phone missing');
    }

    const message = this.messagingService.replaceVariables(campaign.smsTemplate.message, contact, campaign, salesMember);
    const formattedPhone = formatPhoneNumber(contact.phone);
    
    const fromNumber = (salesMember && salesMember.phone) 
      ? formatPhoneNumber(salesMember.phone)
      : campaign.smsTemplate.fromNumber || process.env.DEFAULT_SMS_NUMBER || '+1234567890';

    const messageResult = await this.messagingService.sendSMS({
      to: formattedPhone,
      from: fromNumber,
      message,
      campaignId,
      contactId: contact.id,
      orgId
    });

    if (!messageResult.success) {
      throw new Error(messageResult.error || 'SMS sending failed');
    }

    await this.campaignService.trackDelivery(orgId, campaignId, contact.id, {
      type: 'sms',
      status: 'sent',
      messageId: messageResult.messageId,
      toAddress: formattedPhone,
      sentAt: new Date().toISOString(),
      salesMemberId: salesMember?.id
    });
  }

  private async updateCampaignAnalytics(orgId: string, campaignId: string, result: SendCampaignResult) {
    const analytics = {
      totalContacts: result.totalContacts,
      totalSent: result.emailsSent + result.smsSent,
      totalDelivered: result.emailsSent + result.smsSent,
      totalFailed: result.failures,
      totalOptedOut: 0,
      
      emailStats: result.emailsSent > 0 ? {
        sent: result.emailsSent,
        delivered: result.emailsSent,
        opened: 0,
        clicked: 0,
        bounced: 0,
        openRate: 0,
        clickRate: 0
      } : undefined,
      
      smsStats: result.smsSent > 0 ? {
        sent: result.smsSent,
        delivered: result.smsSent,
        failed: result.errors.filter(e => e.type === 'sms').length,
        deliveryRate: 100
      } : undefined
    };

    await this.campaignService.updateCampaignAnalytics(orgId, campaignId, analytics);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function getCampaignSenderService(context: any): CampaignSenderService {
  return new CampaignSenderService(context);
}