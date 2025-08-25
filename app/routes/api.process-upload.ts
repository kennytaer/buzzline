import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { getContactService } from "~/lib/services/contact.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { getKVService } from "~/lib/kv.server";
import { generateId } from "~/lib/utils";

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await getAuth({ request, context });
  
  if (!userId || !orgId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      uploadId, 
      validContacts, 
      listId, 
      listName,
      reactivateDuplicates 
    } = body;

    const contactService = getContactService(context);
    const contactListService = getContactListService(context);
    const kvService = getKVService(context);

    // Initialize upload status
    await updateUploadStatus(kvService, orgId, uploadId, {
      status: 'processing',
      stage: 'initializing',
      processed: 0,
      total: validContacts.length + duplicateUpdates.length,
      errors: [],
      startTime: new Date().toISOString()
    });

    // Start background processing
    processContactsAsync(
      orgId,
      uploadId, 
      validContacts,
      listId,
      listName,
      reactivateDuplicates,
      contactService,
      contactListService,
      kvService
    ).catch(error => {
      console.error("Background processing error:", error);
      updateUploadStatus(kvService, orgId, uploadId, {
        status: 'failed',
        error: error.message || 'Unknown error during processing'
      });
    });

    return json({ 
      success: true, 
      uploadId,
      message: "Processing started in background" 
    });

  } catch (error) {
    console.error("Error starting background processing:", error);
    return json({ error: "Failed to start processing" }, { status: 500 });
  }
}

async function processContactsAsync(
  orgId: string,
  uploadId: string,
  validContacts: Array<{rowIndex: number; contact: any; contactId: string}>,
  listId: string,
  listName: string,
  reactivateDuplicates: boolean,
  contactService: any,
  contactListService: any,
  kvService: any
) {
  const BATCH_SIZE = 15; // Reduced batch size for better rate limiting
  const DELAY_MS = 150;  // Rate limiting delay between batches
  const RETRY_DELAY_MS = 500; // Delay between retries
  const MAX_RETRIES = 3;

  let totalProcessed = 0;
  const contactIds: string[] = [];
  const duplicatesUpdated: string[] = [];
  const skippedDuplicates: string[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  try {
    // Stage 1: Check for duplicates in batches
    await updateUploadStatus(kvService, orgId, uploadId, {
      stage: 'checking_duplicates',
      processed: 0,
      total: validContacts.length
    });

    const emailsAndPhones = validContacts.map(({contact}) => ({
      email: contact.email || undefined,
      phone: contact.phone || undefined
    }));
    
    const existingContacts = await executeWithRetry(async () => {
      return await contactService.findContactsByEmailsOrPhones(orgId, emailsAndPhones);
    }, MAX_RETRIES, RETRY_DELAY_MS);
    
    const existingContactMap = new Map();
    existingContacts.forEach((item: any) => {
      const { email, phone, contact } = item;
      if (email) existingContactMap.set(email.toLowerCase(), contact);
      if (phone) existingContactMap.set(phone, contact);
    });

    // Separate new contacts from duplicates
    const newContacts: Array<{id: string, data: any}> = [];
    const duplicateUpdates: Array<{contact: any, updates: any}> = [];
    
    for (const {rowIndex, contact, contactId} of validContacts) {
      const existingByEmail = contact.email ? existingContactMap.get(contact.email.toLowerCase()) : null;
      const existingByPhone = contact.phone ? existingContactMap.get(contact.phone) : null;
      const existingContact = existingByEmail || existingByPhone;
      
      if (existingContact) {
        // Handle duplicate - prepare update
        const updatedListIds = existingContact.contactListIds || [];
        if (!updatedListIds.includes(listId)) {
          updatedListIds.push(listId);
        }
        
        // Merge metadata
        const mergedMetadata = { ...existingContact.metadata, ...contact.metadata };
        
        const updates: any = {
          firstName: contact.firstName || existingContact.firstName,
          lastName: contact.lastName || existingContact.lastName,
          email: contact.email || existingContact.email,
          phone: contact.phone || existingContact.phone,
          metadata: mergedMetadata,
          contactListIds: updatedListIds
        };
        
        // Reactivate if requested and currently opted out
        if (reactivateDuplicates && existingContact.optedOut) {
          updates.optedOut = false;
          updates.optedOutAt = null;
        }
        
        duplicateUpdates.push({contact: existingContact, updates});
      } else {
        // New contact
        newContacts.push({
          id: contactId,
          data: contact
        });
      }
    }

    const totalItems = newContacts.length + duplicateUpdates.length;

    // Stage 2: Process new contacts in batches
    await updateUploadStatus(kvService, orgId, uploadId, {
      stage: 'creating_contacts',
      processed: 0,
      total: totalItems
    });

    for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
      const batch = newContacts.slice(i, i + BATCH_SIZE);
      
      await executeWithRetry(async () => {
        const bulkResults = await contactService.createContactsBulk(orgId, batch);
        
        contactIds.push(...bulkResults.created);
        errors.push(...bulkResults.errors.map((e: any) => ({ row: -1, error: e.error })));
      }, MAX_RETRIES, RETRY_DELAY_MS);

      totalProcessed += batch.length;
      
      await updateUploadStatus(kvService, orgId, uploadId, {
        processed: totalProcessed,
        total: totalItems,
        stage: `creating_contacts (${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(newContacts.length/BATCH_SIZE)})`
      });

      // Rate limiting delay
      if (i + BATCH_SIZE < newContacts.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Stage 3: Process duplicate updates in smaller batches
    await updateUploadStatus(kvService, orgId, uploadId, {
      stage: 'updating_duplicates',
      processed: totalProcessed,
      total: totalItems
    });

    const UPDATE_BATCH_SIZE = 10; // Even smaller for updates
    
    for (let i = 0; i < duplicateUpdates.length; i += UPDATE_BATCH_SIZE) {
      const batch = duplicateUpdates.slice(i, i + UPDATE_BATCH_SIZE);
      
      await executeWithRetry(async () => {
        await Promise.all(batch.map(async ({contact, updates}) => {
          try {
            await contactService.updateContact(orgId, contact.id, updates);
            
            if (reactivateDuplicates && contact.optedOut) {
              duplicatesUpdated.push(contact.id);
            } else {
              skippedDuplicates.push(contact.id);
            }
          } catch (error) {
            console.error(`Failed to update duplicate contact ${contact.id}:`, error);
            errors.push({ row: -1, error: "Failed to update duplicate contact" });
          }
        }));
      }, MAX_RETRIES, RETRY_DELAY_MS);

      totalProcessed += batch.length;
      
      await updateUploadStatus(kvService, orgId, uploadId, {
        processed: totalProcessed,
        total: totalItems,
        stage: `updating_duplicates (${Math.floor(i/UPDATE_BATCH_SIZE) + 1}/${Math.ceil(duplicateUpdates.length/UPDATE_BATCH_SIZE)})`
      });

      // Rate limiting delay
      if (i + UPDATE_BATCH_SIZE < duplicateUpdates.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Stage 4: Assign contacts to segment
    await updateUploadStatus(kvService, orgId, uploadId, {
      stage: 'assigning_to_segment',
      processed: totalProcessed,
      total: totalItems
    });

    const allContactIds = [
      ...contactIds,
      ...duplicatesUpdated,
      ...skippedDuplicates
    ];

    if (allContactIds.length > 0) {
      await executeWithRetry(async () => {
        await contactListService.updateContactList(orgId, listId, {
          contactIds: allContactIds
        });

        // Verify assignment
        const updatedSegment = await contactListService.getContactList(orgId, listId);
        const assignmentWorked = (updatedSegment?.contactIds?.length || 0) === allContactIds.length;
        
        if (!assignmentWorked) {
          throw new Error(`Segment assignment verification failed. Expected: ${allContactIds.length}, Got: ${updatedSegment?.contactIds?.length || 0}`);
        }
      }, MAX_RETRIES, RETRY_DELAY_MS);
    }

    // Stage 5: Final index rebuild (only once at the end)
    await updateUploadStatus(kvService, orgId, uploadId, {
      stage: 'rebuilding_indexes',
      processed: totalProcessed,
      total: totalItems
    });

    await executeWithRetry(async () => {
      await contactService.forceRebuildMetadata(orgId);
    }, MAX_RETRIES, RETRY_DELAY_MS);

    // Mark as complete
    await updateUploadStatus(kvService, orgId, uploadId, {
      status: 'complete',
      stage: 'complete',
      processed: totalItems,
      total: totalItems,
      results: {
        listId,
        totalRows: validContacts.length + duplicateUpdates.length,
        successfulRows: contactIds.length,
        duplicatesUpdated: duplicatesUpdated.length,
        skippedDuplicates: skippedDuplicates.length,
        failedRows: errors.length,
        errors: errors.slice(0, 10) // Limit errors shown
      },
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Processing failed:", error);
    await updateUploadStatus(kvService, orgId, uploadId, {
      status: 'failed',
      stage: 'failed',
      error: error instanceof Error ? error.message : 'Unknown processing error',
      failedAt: new Date().toISOString()
    });
    throw error;
  }
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delayMs: number
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
      
      if (attempt < maxRetries) {
        const backoffDelay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError!;
}

async function updateUploadStatus(
  kvService: any,
  orgId: string,
  uploadId: string,
  updates: any
) {
  const key = `org:${orgId}:upload_status:${uploadId}`;
  
  try {
    const existing = await kvService.getCache(key) || {};
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kvService.setCache(key, updated, 7200); // 2 hour TTL
  } catch (error) {
    console.error("Failed to update upload status:", error);
    // Don't throw - status updates are non-critical
  }
}