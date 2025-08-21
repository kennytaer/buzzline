import { getKVService } from "./kv.server";
import { MessagingService } from "./messaging.server";
import { getSalesTeamService } from "./sales-team.server";
import { formatPhoneNumber } from "./utils";

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

export class CampaignSender {
  private kvService: any;
  private messagingService: MessagingService;
  private salesTeamService: any;

  constructor(context: any) {
    console.log('🏗️ CampaignSender constructor called');
    this.kvService = getKVService(context);
    this.messagingService = new MessagingService(context);
    this.salesTeamService = getSalesTeamService(context);
    console.log('✅ CampaignSender constructor completed');
  }

  async sendCampaign(orgId: string, campaignId: string, isIndividualSend = false): Promise<SendCampaignResult> {
    console.log('🚀 sendCampaign called:', { orgId, campaignId, isIndividualSend });
    
    const result: SendCampaignResult = {
      success: false,
      totalContacts: 0,
      emailsSent: 0,
      smsSent: 0,
      failures: 0,
      errors: []
    };

    try {
      // Get campaign details
      const campaign = await this.kvService.getCampaign(orgId, campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get organization settings for default from addresses
      const orgSettings = await this.kvService.getOrgSettings(orgId);
      const defaultFromEmail = orgSettings?.companyInfo?.fromEmail;
      const defaultFromPhone = orgSettings?.companyInfo?.fromPhoneNumber;

      // Get contacts based on targeting mode
      let allContacts: any[] = [];
      if (campaign.targetingMode === 'specific' && campaign.specificContactIds) {
        // Individual targeting mode - get specific contacts
        allContacts = await this.getSpecificContacts(orgId, campaign.specificContactIds);
      } else if (campaign.contactListIds) {
        // Bulk targeting mode - get contacts from lists
        allContacts = await this.getAllCampaignContacts(orgId, campaign.contactListIds);
      }
      
      result.totalContacts = allContacts.length;

      if (allContacts.length === 0) {
        const errorMsg = campaign.targetingMode === 'specific' 
          ? 'No contacts found with the specified IDs'
          : 'No contacts found in selected lists';
        throw new Error(errorMsg);
      }

      console.log(`Starting campaign ${campaignId}: ${campaign.type} to ${allContacts.length} contacts`);

      // Update campaign status only if this is not an individual send
      if (!isIndividualSend) {
        await this.kvService.updateCampaign(orgId, campaignId, {
          status: 'sending',
          sentAt: new Date().toISOString()
        });
      }

      // Get sales team members for sales campaigns
      let salesTeamMembers: any[] = [];
      if (campaign.campaignType === 'sales') {
        if (campaign.salesSettings?.useRoundRobin) {
          salesTeamMembers = await this.salesTeamService.getActiveMembers(orgId);
        } else if (campaign.salesSettings?.selectedMemberIds?.length) {
          // Get specific selected members
          const allMembers = await this.salesTeamService.getAllMembers(orgId);
          salesTeamMembers = allMembers.filter((member: any) => 
            campaign.salesSettings.selectedMemberIds.includes(member.id) && member.isActive
          );
        }
        
        if (salesTeamMembers.length === 0) {
          throw new Error('No active sales team members available for sales campaign');
        }
      }

      // Send messages based on campaign type
      for (let i = 0; i < allContacts.length; i++) {
        const contact = allContacts[i];
        
        // Skip opted-out contacts
        if (contact.optedOut) {
          console.log(`Skipping opted-out contact: ${contact.id}`);
          continue;
        }

        // Get sales team member for this contact (round-robin or specific)
        let salesMember = null;
        if (campaign.campaignType === 'sales' && salesTeamMembers.length > 0) {
          if (campaign.salesSettings?.useRoundRobin) {
            // Use round-robin from the service
            salesMember = await this.salesTeamService.getRoundRobinMember(orgId);
          } else {
            // Use simple rotation through selected members
            salesMember = salesTeamMembers[i % salesTeamMembers.length];
          }
        }

        // Send email if campaign includes email
        if ((campaign.type === 'email' || campaign.type === 'both') && campaign.emailTemplate) {
          try {
            await this.sendEmailToContact(orgId, campaignId, campaign, contact, salesMember, defaultFromEmail);
            result.emailsSent++;
          } catch (error) {
            console.error(`Email failed for contact ${contact.id}:`, error);
            result.failures++;
            result.errors.push({
              contactId: contact.id,
              error: error instanceof Error ? error.message : 'Unknown email error',
              type: 'email'
            });
          }
        }

        // Send SMS if campaign includes SMS
        if ((campaign.type === 'sms' || campaign.type === 'both') && campaign.smsTemplate) {
          try {
            await this.sendSmsToContact(orgId, campaignId, campaign, contact, salesMember, defaultFromPhone);
            result.smsSent++;
          } catch (error) {
            console.error(`SMS failed for contact ${contact.id}:`, error);
            result.failures++;
            result.errors.push({
              contactId: contact.id,
              error: error instanceof Error ? error.message : 'Unknown SMS error',
              type: 'sms'
            });
          }
        }

        // Add small delay to avoid rate limits
        await this.sleep(100);
      }

      // Update campaign status to completed only if this is not an individual send
      if (!isIndividualSend) {
        await this.kvService.updateCampaign(orgId, campaignId, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });

        // Update campaign analytics only for bulk sends
        await this.updateCampaignAnalytics(orgId, campaignId, result);
      }

      result.success = true;
      console.log(`Campaign ${campaignId} completed:`, result);

    } catch (error) {
      console.error(`Campaign ${campaignId} failed:`, error);
      
      // Mark campaign as failed only if this is not an individual send
      if (!isIndividualSend) {
        await this.kvService.updateCampaign(orgId, campaignId, {
          status: 'failed',
          failedAt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  private async getSpecificContacts(orgId: string, contactIds: string[]) {
    // Get specific contacts by their IDs
    const allContacts = await this.kvService.listContacts(orgId);
    const specificContacts: any[] = [];
    const seenContactIds = new Set<string>();

    // Filter contacts that match the specified IDs
    for (const contact of allContacts) {
      if (!contact || !contactIds.includes(contact.id)) continue;
      
      if (!seenContactIds.has(contact.id)) {
        specificContacts.push(contact);
        seenContactIds.add(contact.id);
      }
    }

    return specificContacts;
  }

  private async getAllCampaignContacts(orgId: string, contactListIds: string[]) {
    // Get all contacts for the organization
    const allContacts = await this.kvService.listContacts(orgId);
    const campaignContacts: any[] = [];
    const seenContactIds = new Set<string>();

    // Filter contacts that belong to the selected lists
    for (const contact of allContacts) {
      if (!contact || !contact.contactListIds) continue;

      // Check if this contact belongs to any of the campaign's lists
      const belongsToSelectedLists = contact.contactListIds.some((listId: string) => 
        contactListIds.includes(listId)
      );

      if (belongsToSelectedLists && !seenContactIds.has(contact.id)) {
        campaignContacts.push(contact);
        seenContactIds.add(contact.id);
      }
    }

    return campaignContacts;
  }

  private async sendEmailToContact(orgId: string, campaignId: string, campaign: any, contact: any, salesMember?: any, defaultFromEmail?: string) {
    if (!campaign.emailTemplate || !contact.email) {
      throw new Error('Email template or contact email missing');
    }

    // Replace variables in email content (including sales team variables)
    const subject = this.messagingService.replaceVariables(campaign.emailTemplate.subject, contact, campaign, salesMember);
    let htmlBody = this.messagingService.replaceVariablesWithSignature(campaign.emailTemplate.htmlBody, contact, campaign, salesMember);
    
    // Add unsubscribe link
    const unsubscribeUrl = this.messagingService.generateUnsubscribeUrl(orgId, contact.id, campaignId);
    htmlBody = htmlBody.replace(/\{unsubscribeUrl\}/g, unsubscribeUrl);
    htmlBody = htmlBody.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
    
    // Add unsubscribe footer if not already present
    if (!htmlBody.includes('unsubscribe') && !htmlBody.includes('opt-out')) {
      htmlBody += `<br><br><p style="font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a> from these emails.</p>`;
    }

    // Use sales member email for "from" if this is a sales campaign, otherwise use organization default or campaign template
    const fromEmail = salesMember ? salesMember.email : (defaultFromEmail || campaign.emailTemplate.fromEmail);
    const fromName = salesMember ? `${salesMember.firstName} ${salesMember.lastName}` : campaign.emailTemplate.fromName;

    const result = await this.messagingService.sendEmail({
      to: contact.email,
      from: fromEmail,
      subject,
      htmlBody,
      campaignId,
      contactId: contact.id,
      orgId
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    // Track delivery
    await this.kvService.trackDelivery(orgId, campaignId, contact.id, {
      type: 'email',
      status: 'sent',
      messageId: result.messageId,
      toAddress: contact.email,
      sentAt: new Date().toISOString(),
      salesMemberId: salesMember?.id // Track which sales member sent it
    });
  }

  private async sendSmsToContact(orgId: string, campaignId: string, campaign: any, contact: any, salesMember?: any, defaultFromPhone?: string) {
    if (!campaign.smsTemplate || !contact.phone) {
      throw new Error('SMS template or contact phone missing');
    }

    // Replace variables in SMS content (including sales team variables)
    const message = this.messagingService.replaceVariables(campaign.smsTemplate.message, contact, campaign, salesMember);
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(contact.phone);
    
    // Use sales member phone for "from" if available, otherwise use organization default or campaign template
    const fromNumber = (salesMember && salesMember.phone) 
      ? formatPhoneNumber(salesMember.phone)
      : formatPhoneNumber(defaultFromPhone || campaign.smsTemplate.fromNumber || process.env.DEFAULT_SMS_NUMBER || '+1234567890');

    const result = await this.messagingService.sendSMS({
      to: formattedPhone,
      from: fromNumber,
      message,
      campaignId,
      contactId: contact.id,
      orgId
    });

    if (!result.success) {
      throw new Error(result.error || 'SMS sending failed');
    }

    // Track delivery
    await this.kvService.trackDelivery(orgId, campaignId, contact.id, {
      type: 'sms',
      status: 'sent',
      messageId: result.messageId,
      toAddress: formattedPhone,
      sentAt: new Date().toISOString(),
      salesMemberId: salesMember?.id // Track which sales member sent it
    });
  }

  private async updateCampaignAnalytics(orgId: string, campaignId: string, result: SendCampaignResult) {
    const analytics = {
      totalContacts: result.totalContacts,
      totalSent: result.emailsSent + result.smsSent,
      totalDelivered: result.emailsSent + result.smsSent, // Will be updated by webhooks
      totalFailed: result.failures,
      totalOptedOut: 0, // Will be updated by webhooks
      
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
        deliveryRate: 100 // Will be updated by webhooks
      } : undefined
    };

    await this.kvService.updateCampaignAnalytics(orgId, campaignId, analytics);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}