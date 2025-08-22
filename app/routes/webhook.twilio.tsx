import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getContactService } from "~/lib/services/contact.server";
import { getKVService } from "~/lib/kv.server"; // TODO: Remove once webhook logging is migrated

// Twilio webhook for SMS status updates and responses
export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  
  try {
    // Parse the webhook payload from Twilio
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Extract Twilio webhook data
    const messageSid = params.get('MessageSid') || params.get('SmsSid');
    const messageStatus = params.get('MessageStatus') || params.get('SmsStatus');
    const from = params.get('From');
    const to = params.get('To');
    const body_text = params.get('Body');
    const errorCode = params.get('ErrorCode');
    const errorMessage = params.get('ErrorMessage');
    
    console.log('Twilio Webhook:', {
      messageSid,
      messageStatus,
      from,
      to,
      body: body_text,
      errorCode,
      errorMessage
    });

    const contactService = getContactService(args.context);
  const kvService = getKVService(args.context); // TODO: Remove once webhook logging is migrated
    
    // Handle incoming SMS responses (like STOP messages)
    if (body_text && from && to) {
      const responseText = body_text.toLowerCase().trim();
      
      // Check for opt-out keywords (STOP, UNSUBSCRIBE, etc.)
      const optOutKeywords = ['stop', 'unsubscribe', 'quit', 'cancel', 'end', 'opt-out', 'optout'];
      const isOptOut = optOutKeywords.some(keyword => responseText.includes(keyword));
      
      if (isOptOut) {
        console.log(`Opt-out detected from ${from} to ${to}: ${body_text}`);
        
        // Find which organization owns the phone number that received this message
        // The 'to' field is the business phone number that sent the original SMS
        await handleOptOut(contactService, kvService, from, to);
        
        // Log the opt-out event
        await logWebhookEvent(kvService, {
          type: 'sms_opt_out',
          phone: from,
          businessPhone: to,
          message: body_text,
          timestamp: new Date().toISOString(),
          messageSid
        });
      } else {
        // Log other SMS responses for analytics
        await logWebhookEvent(kvService, {
          type: 'sms_response',
          phone: from,
          businessPhone: to,
          message: body_text,
          timestamp: new Date().toISOString(),
          messageSid
        });
      }
    }
    
    // Handle delivery status updates
    if (messageStatus && messageSid) {
      await handleDeliveryStatus(kvService, messageSid, messageStatus, errorCode || undefined, errorMessage || undefined);
    }
    
    // Twilio expects a 200 response
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('Twilio webhook error:', error);
    
    // Still return 200 to prevent Twilio from retrying
    return new Response('Error processed', { status: 200 });
  }
}

// Handle opt-out by finding the specific organization that owns the business phone
async function handleOptOut(contactService: any, kvService: any, customerPhone: string, businessPhone: string) {
  try {
    console.log(`Processing opt-out for customer ${customerPhone} via business phone ${businessPhone}`);
    
    // Find which organization owns this business phone number
    const allOrgs = await getAllOrganizations(kvService);
    let targetOrgId = null;
    
    for (const orgId of allOrgs) {
      // Check if this org uses this business phone number in their settings
      const orgSettings = await kvService.getOrgSettings(orgId);
      if (orgSettings?.companyInfo?.fromPhoneNumber === businessPhone) {
        targetOrgId = orgId;
        console.log(`Found organization ${orgId} owns business phone ${businessPhone}`);
        break;
      }
    }
    
    if (!targetOrgId) {
      console.log(`No organization found for business phone ${businessPhone}`);
      return;
    }
    
    // Find the contact in this specific organization
    const contacts = await contactService.listContacts(targetOrgId);
    
    for (const contact of contacts) {
      if (contact.phone === customerPhone) {
        console.log(`Found contact ${contact.id} in org ${targetOrgId}, opting out from both SMS and Email`);
        
        // Opt out from BOTH SMS and Email (all-or-nothing approach)
        await contactService.updateContactOptOut(targetOrgId, contact.id, true);
        
        // Log the opt-out in analytics for both channels
        await kvService.setCache(`optout:sms:${contact.id}`, {
          contactId: contact.id,
          orgId: targetOrgId,
          channel: 'sms',
          timestamp: new Date().toISOString(),
          method: 'twilio_webhook',
          businessPhone
        });
        
        await kvService.setCache(`optout:email:${contact.id}`, {
          contactId: contact.id,
          orgId: targetOrgId,
          channel: 'email',
          timestamp: new Date().toISOString(),
          method: 'twilio_webhook_cascade',
          businessPhone
        });
        
        console.log(`Contact ${contact.id} opted out from organization ${targetOrgId} (both SMS and Email)`);
        return;
      }
    }
    
    console.log(`No contact found with phone ${customerPhone} in organization ${targetOrgId}`);
    
  } catch (error) {
    console.error('Error handling opt-out:', error);
  }
}

// Handle SMS delivery status updates
async function handleDeliveryStatus(
  kvService: any, 
  messageSid: string, 
  status: string, 
  errorCode?: string, 
  errorMessage?: string
) {
  try {
    // Log delivery status for analytics
    await logWebhookEvent(kvService, {
      type: 'sms_delivery_status',
      messageSid,
      status,
      errorCode,
      errorMessage,
      timestamp: new Date().toISOString()
    });
    
    // You could also update campaign analytics here based on delivery status
    console.log(`SMS ${messageSid} status: ${status}${errorCode ? ` (Error: ${errorCode})` : ''}`);
    
  } catch (error) {
    console.error('Error handling delivery status:', error);
  }
}

// Log webhook events for analytics and debugging
async function logWebhookEvent(kvService: any, event: any) {
  try {
    const eventId = crypto.randomUUID();
    const key = `webhook_event:${Date.now()}:${eventId}`;
    
    await kvService.setCache(key, event, 86400); // 24 hour TTL
    
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}

// Get all organization IDs by scanning KV keys
async function getAllOrganizations(kvService: any): Promise<string[]> {
  try {
    const list = await kvService.main.list({ prefix: 'org:', limit: 1000 });
    const orgIds = new Set<string>();
    
    for (const key of list.keys) {
      const match = key.name.match(/^org:([^:]+):/);
      if (match) {
        orgIds.add(match[1]);
      }
    }
    
    console.log(`Found ${orgIds.size} organizations for opt-out search`);
    return Array.from(orgIds);
  } catch (error) {
    console.error('Error getting organizations:', error);
    return [];
  }
}

// This endpoint should not be accessible via GET
export function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}