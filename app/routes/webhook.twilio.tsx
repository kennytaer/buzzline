import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getKVService } from "~/lib/kv.server";

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

    const kvService = getKVService(args.context);
    
    // Handle incoming SMS responses (like STOP messages)
    if (body_text && from && to) {
      const responseText = body_text.toLowerCase().trim();
      
      // Check for opt-out keywords (STOP, UNSUBSCRIBE, etc.)
      const optOutKeywords = ['stop', 'unsubscribe', 'quit', 'cancel', 'end', 'opt-out', 'optout'];
      const isOptOut = optOutKeywords.some(keyword => responseText.includes(keyword));
      
      if (isOptOut) {
        console.log(`Opt-out detected from ${from}: ${body_text}`);
        
        // Find contact by phone number and mark as opted out
        await handleOptOut(kvService, from, 'sms');
        
        // Log the opt-out event
        await logWebhookEvent(kvService, {
          type: 'sms_opt_out',
          phone: from,
          message: body_text,
          timestamp: new Date().toISOString(),
          messageSid
        });
      } else {
        // Log other SMS responses for analytics
        await logWebhookEvent(kvService, {
          type: 'sms_response',
          phone: from,
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

// Handle opt-out by finding contact and updating their status
async function handleOptOut(kvService: any, phone: string, channel: 'sms' | 'email') {
  try {
    // Search across all organizations for this contact
    // This is a simplified approach - in production you might want to optimize this
    const allOrgs = await getAllOrganizations(kvService);
    
    for (const orgId of allOrgs) {
      const contacts = await kvService.listContacts(orgId);
      
      for (const contact of contacts) {
        if (contact.phone === phone || contact.email === phone) {
          console.log(`Found contact ${contact.id} in org ${orgId}, marking as opted out`);
          
          // Update contact opt-out status
          await kvService.updateContactOptOut(orgId, contact.id, true);
          
          // Log the opt-out in analytics
          await kvService.setCache(`optout:${channel}:${contact.id}`, {
            contactId: contact.id,
            orgId,
            channel,
            timestamp: new Date().toISOString(),
            method: 'twilio_webhook'
          });
          
          return; // Found and updated
        }
      }
    }
    
    console.log(`No contact found for ${channel} opt-out: ${phone}`);
    
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

// Get all organization IDs (simplified - you might want to cache this)
async function getAllOrganizations(kvService: any): Promise<string[]> {
  // This is a simplified implementation
  // In practice, you might want to maintain an index of organization IDs
  // or use a different approach based on your KV structure
  
  try {
    // For now, return empty array - you'll need to implement this based on your needs
    // This could involve scanning KV keys with pattern matching
    return [];
  } catch (error) {
    console.error('Error getting organizations:', error);
    return [];
  }
}

// This endpoint should not be accessible via GET
export function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}