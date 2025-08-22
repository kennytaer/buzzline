import { useState } from "react";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { parseCSV, generateId, isValidEmail, isValidPhone } from "~/lib/utils";
import { getContactService } from "~/lib/services/contact.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { getKVService } from "~/lib/kv.server"; // TODO: Remove once custom fields are migrated

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const kvService = getKVService(args.context); // TODO: Replace with custom field service
  const existingCustomFields = await kvService.getCustomFields(orgId);

  return json({ orgId, existingCustomFields });
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const step = formData.get("step") as string;
  const listName = formData.get("listName") as string;
  const hasHeaders = formData.get("hasHeaders") === "true";
  const reactivateDuplicates = formData.get("reactivateDuplicates") === "true";
  
  // Handle file upload for preview step
  let csvContent: string;
  const startTime = Date.now();
  
  if (step === "preview") {
    const csvFile = formData.get("csvFile") as File;
    if (!csvFile || !listName) {
      return json({ error: "CSV file and list name are required" }, { status: 400 });
    }
    
    console.log("🔍 CSV UPLOAD DEBUG - File Info:", {
      fileName: csvFile.name,
      fileSize: csvFile.size,
      fileSizeKB: Math.round(csvFile.size / 1024),
      fileSizeMB: Math.round(csvFile.size / (1024 * 1024) * 100) / 100,
      fileType: csvFile.type,
      step: step
    });
    
    try {
      csvContent = await csvFile.text();
      console.log("✅ CSV UPLOAD DEBUG - File read successful:", {
        contentLength: csvContent.length,
        contentSizeKB: Math.round(csvContent.length / 1024),
        readTimeMs: Date.now() - startTime
      });
    } catch (error) {
      console.error("❌ CSV UPLOAD DEBUG - File read failed:", error);
      return json({ error: "Failed to read CSV file" }, { status: 500 });
    }
  } else {
    // For import step, get content from hidden field (smaller, processed data)
    csvContent = formData.get("csvContent") as string;
    if (!csvContent || !listName) {
      return json({ error: "CSV content and list name are required" }, { status: 400 });
    }
    
    console.log("🔍 CSV UPLOAD DEBUG - Import step content:", {
      contentLength: csvContent.length,
      contentSizeKB: Math.round(csvContent.length / 1024),
      step: step
    });
  }

  try {
    const contactService = getContactService(args.context);
    const contactListService = getContactListService(args.context);
    const kvService = getKVService(args.context); // TODO: Remove once custom fields are migrated
    
    console.log("🔍 CSV UPLOAD DEBUG - Starting CSV parse:", {
      hasHeaders,
      contentPreview: csvContent.substring(0, 200) + (csvContent.length > 200 ? "..." : "")
    });
    
    const parseStartTime = Date.now();
    const rows = parseCSV(csvContent, hasHeaders);
    const parseTime = Date.now() - parseStartTime;
    
    console.log("✅ CSV UPLOAD DEBUG - CSV parsing complete:", {
      rowCount: rows.length,
      parseTimeMs: parseTime,
      avgTimePerRow: rows.length > 0 ? Math.round(parseTime / rows.length * 100) / 100 : 0,
      sampleRow: rows[0] || null,
      headers: rows.length > 0 ? Object.keys(rows[0]) : []
    });
    
    if (rows.length === 0) {
      console.error("❌ CSV UPLOAD DEBUG - Empty CSV detected");
      return json({ error: "CSV file appears to be empty or invalid" }, { status: 400 });
    }

    if (step === "preview") {
      // Return preview data and detected columns
      const headers = Object.keys(rows[0]);
      const preview = rows.slice(0, 5); // Show first 5 rows
      
      return json({
        step: "mapping",
        headers,
        preview,
        totalRows: rows.length,
        listName,
        hasHeaders,
        csvContent // Include CSV content for the import step
      });
    }

    if (step === "import") {
      // Get field mapping from form
      const fieldMapping: Record<string, string> = {};
      const mappingData = formData.get("mapping") as string;
      
      if (mappingData) {
        Object.assign(fieldMapping, JSON.parse(mappingData));
      }
      
      console.log("Field mapping debug:", {
        mappingDataExists: !!mappingData,
        fieldMappingKeys: Object.keys(fieldMapping),
        fieldMappingValues: Object.values(fieldMapping),
        sampleContact: rows[0],
        sampleContactKeys: Object.keys(rows[0] || {}),
        fullMapping: fieldMapping
      });

      // Debug each contact creation
      console.log("Creating contacts with field mapping:", fieldMapping);

      // Create contact list
      const listId = generateId();
      await contactListService.createContactList(orgId, listId, {
        name: listName,
        description: `Imported CSV with ${rows.length} contacts`
      });

      // Extract and save any new custom fields first
      const customFieldsToSave = Object.values(fieldMapping).filter(field => 
        field && !['firstName', 'lastName', 'email', 'phone'].includes(field)
      );
      
      if (customFieldsToSave.length > 0) {
        const existingCustomFields = await kvService.getCustomFields(orgId);
        const newFields = customFieldsToSave.filter(field => !existingCustomFields.includes(field));
        if (newFields.length > 0) {
          await kvService.saveCustomFields(orgId, [...existingCustomFields, ...newFields]);
        }
      }

      // Process contacts in optimized bulk operations
      const contactIds: string[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      const duplicatesUpdated: string[] = [];
      const skippedDuplicates: string[] = [];
      
      console.log("🔍 CSV UPLOAD DEBUG - Starting contact processing:", {
        totalRows: rows.length,
        fieldMapping,
        listId,
        reactivateDuplicates
      });
      
      // First pass: validate and prepare all contacts
      const validContacts: Array<{
        rowIndex: number;
        contact: any;
        contactId: string;
      }> = [];
      
      const validationStartTime = Date.now();
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        
        try {
          // Create reverse mapping to find CSV columns for each contact field
          const reverseMapping: Record<string, string> = {};
          for (const [csvCol, contactField] of Object.entries(fieldMapping)) {
            if (contactField) {
              reverseMapping[contactField] = csvCol;
            }
          }
          
          const contact: any = {
            firstName: reverseMapping.firstName ? row[reverseMapping.firstName] || '' : '',
            lastName: reverseMapping.lastName ? row[reverseMapping.lastName] || '' : '',
            email: reverseMapping.email ? row[reverseMapping.email] || '' : '',
            phone: reverseMapping.phone ? row[reverseMapping.phone] || '' : '',
            metadata: {},
            contactListIds: [listId]
          };

          // Debug field mapping extraction
          const debugInfo = {
            rowData: row,
            rowKeys: Object.keys(row),
            reverseMapping,
            firstNameCSVColumn: reverseMapping.firstName,
            lastNameCSVColumn: reverseMapping.lastName,
            emailCSVColumn: reverseMapping.email,
            phoneCSVColumn: reverseMapping.phone,
            extractedFirstName: reverseMapping.firstName ? row[reverseMapping.firstName] : 'NO_MAPPING',
            extractedLastName: reverseMapping.lastName ? row[reverseMapping.lastName] : 'NO_MAPPING',
            extractedEmail: reverseMapping.email ? row[reverseMapping.email] : 'NO_MAPPING',
            extractedPhone: reverseMapping.phone ? row[reverseMapping.phone] : 'NO_MAPPING',
            finalContact: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone
            }
          };
          
          console.log(`Contact ${i} creation debug:`, debugInfo);
          
          // Extra debug for first contact to understand the mapping issue
          if (i === 0) {
            console.log("FIRST CONTACT DETAILED DEBUG:");
            console.log("Available CSV columns:", Object.keys(row));
            console.log("Field mapping object:", fieldMapping);
            
            // Check if the mapped field exists in the row
            for (const [csvCol, contactField] of Object.entries(fieldMapping)) {
              console.log(`Mapping: "${csvCol}" -> "${contactField}", Value in row: "${row[csvCol]}"`);
            }
          }

          // Validate email and phone
          if (contact.email && !isValidEmail(contact.email)) {
            errors.push({ row: i + 1, error: "Invalid email format" });
            continue;
          }
          
          if (contact.phone && !isValidPhone(contact.phone)) {
            errors.push({ row: i + 1, error: "Invalid phone format" });
            continue;
          }

          // Add any additional mapped fields to metadata
          for (const [csvCol, contactField] of Object.entries(fieldMapping)) {
            if (!['firstName', 'lastName', 'email', 'phone'].includes(contactField) && contactField) {
              // Store custom field with original name (no cleaning needed)
              contact.metadata[contactField] = row[csvCol] || '';
            }
          }

          validContacts.push({
            rowIndex: i,
            contact,
            contactId: generateId()
          });
          
        } catch (error) {
          console.error("❌ CSV UPLOAD DEBUG - Error processing contact row:", {
            rowIndex: i,
            error: error instanceof Error ? error.message : error,
            rowData: row
          });
          errors.push({ row: i + 1, error: "Failed to process contact" });
        }
      }

      const validationTime = Date.now() - validationStartTime;
      console.log("✅ CSV UPLOAD DEBUG - Validation complete:", {
        totalRows: rows.length,
        validContacts: validContacts.length,
        errorCount: errors.length,
        validationTimeMs: validationTime,
        avgValidationTimePerRow: Math.round(validationTime / rows.length * 100) / 100
      });

      if (validContacts.length === 0) {
        console.error("❌ CSV UPLOAD DEBUG - No valid contacts to process");
        return json({
          step: "complete",
          listId,
          totalRows: rows.length,
          successfulRows: 0,
          duplicatesUpdated: 0,
          skippedDuplicates: 0,
          failedRows: errors.length,
          errors
        });
      }

      // Second pass: bulk duplicate checking
      const duplicateCheckStartTime = Date.now();
      console.log("🔍 CSV UPLOAD DEBUG - Starting duplicate check:", {
        validContactsCount: validContacts.length
      });
      
      const emailsAndPhones = validContacts.map(({contact}) => ({
        email: contact.email || undefined,
        phone: contact.phone || undefined
      }));
      
      try {
        const existingContacts = await contactService.findContactsByEmailsOrPhones(orgId, emailsAndPhones);
        const duplicateCheckTime = Date.now() - duplicateCheckStartTime;
        
        console.log("✅ CSV UPLOAD DEBUG - Duplicate check complete:", {
          contactsChecked: validContacts.length,
          duplicatesFound: existingContacts.length,
          duplicateCheckTimeMs: duplicateCheckTime,
          avgDuplicateCheckTimePerContact: Math.round(duplicateCheckTime / validContacts.length * 100) / 100
        });
        
        const existingContactMap = new Map();
        existingContacts.forEach(({email, phone, contact}) => {
          if (email) existingContactMap.set(email.toLowerCase(), contact);
          if (phone) existingContactMap.set(phone, contact);
        });

        // Third pass: separate new contacts from duplicates
        const newContacts: Array<{id: string, data: any}> = [];
        const duplicateUpdates: Array<{contact: any, updates: any}> = [];
        
        const separationStartTime = Date.now();
      
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
          
          if (reactivateDuplicates && existingContact.optedOut) {
            duplicatesUpdated.push(existingContact.id);
          } else {
            skippedDuplicates.push(existingContact.id);
          }
        } else {
          // New contact
          newContacts.push({
            id: contactId,
            data: contact
          });
          contactIds.push(contactId);
        }
      }

      const separationTime = Date.now() - separationStartTime;
      console.log("✅ CSV UPLOAD DEBUG - Contact separation complete:", {
        totalValidContacts: validContacts.length,
        newContacts: newContacts.length,
        duplicateUpdates: duplicateUpdates.length,
        separationTimeMs: separationTime
      });

      // Fourth pass: bulk create new contacts
      if (newContacts.length > 0) {
        const bulkCreateStartTime = Date.now();
        console.log("🔍 CSV UPLOAD DEBUG - Starting bulk contact creation:", {
          contactsToCreate: newContacts.length
        });
        
        try {
          const bulkResults = await contactService.createContactsBulk(orgId, newContacts);
          const bulkCreateTime = Date.now() - bulkCreateStartTime;
          
          console.log("✅ CSV UPLOAD DEBUG - Bulk contact creation complete:", {
            contactsCreated: bulkResults.created.length,
            creationErrors: bulkResults.errors.length,
            bulkCreateTimeMs: bulkCreateTime,
            avgCreateTimePerContact: Math.round(bulkCreateTime / newContacts.length * 100) / 100
          });
          
          // Handle any bulk creation errors
          for (const error of bulkResults.errors) {
            errors.push({ row: -1, error: `Failed to create contact: ${error.error}` });
          }
        } catch (error) {
          console.error("❌ CSV UPLOAD DEBUG - Bulk contact creation failed:", error);
          errors.push({ row: -1, error: `Bulk contact creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }

      // Fifth pass: update duplicates (can be done in smaller batches)
      if (duplicateUpdates.length > 0) {
        const duplicateUpdateStartTime = Date.now();
        console.log("🔍 CSV UPLOAD DEBUG - Starting duplicate updates:", {
          duplicatesToUpdate: duplicateUpdates.length
        });
        
        const UPDATE_BATCH_SIZE = 25;
        
        try {
          for (let i = 0; i < duplicateUpdates.length; i += UPDATE_BATCH_SIZE) {
            const batch = duplicateUpdates.slice(i, i + UPDATE_BATCH_SIZE);
            const batchStartTime = Date.now();
            
            await Promise.all(batch.map(async ({contact, updates}) => {
              try {
                await contactService.updateContact(orgId, contact.id, updates);
              } catch (error) {
                console.error("❌ CSV UPLOAD DEBUG - Failed to update duplicate contact:", {
                  contactId: contact.id,
                  error: error instanceof Error ? error.message : error
                });
                errors.push({ row: -1, error: "Failed to update duplicate contact" });
              }
            }));
            
            const batchTime = Date.now() - batchStartTime;
            console.log(`✅ CSV UPLOAD DEBUG - Batch ${Math.floor(i / UPDATE_BATCH_SIZE) + 1} complete:`, {
              batchSize: batch.length,
              batchTimeMs: batchTime,
              avgUpdateTimePerContact: Math.round(batchTime / batch.length * 100) / 100
            });
          }
          
          const duplicateUpdateTime = Date.now() - duplicateUpdateStartTime;
          console.log("✅ CSV UPLOAD DEBUG - All duplicate updates complete:", {
            totalDuplicatesUpdated: duplicateUpdates.length,
            duplicateUpdateTimeMs: duplicateUpdateTime
          });
        } catch (error) {
          console.error("❌ CSV UPLOAD DEBUG - Duplicate update process failed:", error);
          errors.push({ row: -1, error: `Duplicate update failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }

      const overallProcessingTime = Date.now() - startTime;
      console.log("🔍 CSV UPLOAD DEBUG - Processing summary before list assignment:", {
        totalProcessingTimeMs: overallProcessingTime,
        newContactsCreated: newContacts.length,
        duplicatesUpdated: duplicateUpdates.length,
        totalErrors: errors.length
      });

      // Update contact list with all contact IDs (new + updated duplicates)
      const listAssignmentStartTime = Date.now();
      const allContactIds = [
        ...contactIds, // New contacts
        ...duplicatesUpdated, // Reactivated duplicates 
        ...skippedDuplicates // Existing duplicates that were updated
      ];
      
      console.log("🔍 CSV UPLOAD DEBUG - Starting contact list assignment:", {
        listId,
        newContactIds: contactIds.length,
        duplicatesUpdated: duplicatesUpdated.length,
        skippedDuplicates: skippedDuplicates.length,
        totalContactsToAssign: allContactIds.length
      });
      
      if (allContactIds.length > 0) {
        try {
          await contactListService.updateContactList(orgId, listId, {
            contactIds: allContactIds
          });
          const listAssignmentTime = Date.now() - listAssignmentStartTime;
          console.log("✅ CSV UPLOAD DEBUG - Contact list assignment successful:", {
            contactsAssigned: allContactIds.length,
            listAssignmentTimeMs: listAssignmentTime
          });
        } catch (error) {
          console.error("❌ CSV UPLOAD DEBUG - Contact list assignment failed:", {
            error: error instanceof Error ? error.message : error,
            contactsToAssign: allContactIds.length,
            listId
          });
          errors.push({ row: -1, error: "Failed to assign contacts to segment" });
        }
      } else {
        console.log("⚠️ CSV UPLOAD DEBUG - No contact IDs to assign to segment");
      }

      const totalTime = Date.now() - startTime;
      console.log("🎉 CSV UPLOAD DEBUG - COMPLETE:", {
        totalTimeMs: totalTime,
        totalTimeSec: Math.round(totalTime / 1000 * 100) / 100,
        originalRowCount: rows.length,
        finalSuccessfulContacts: contactIds.length,
        finalDuplicatesUpdated: duplicatesUpdated.length,
        finalSkippedDuplicates: skippedDuplicates.length,
        finalErrors: errors.length,
        avgTimePerOriginalRow: Math.round(totalTime / rows.length * 100) / 100
      });

      return json({
        step: "complete",
        listId,
        totalRows: rows.length,
        successfulRows: contactIds.length,
        duplicatesUpdated: duplicatesUpdated.length,
        skippedDuplicates: skippedDuplicates.length,
        failedRows: errors.length,
        errors: errors.slice(0, 10) // Limit errors shown
      });
      
      } catch (error) {
        console.error("❌ CSV UPLOAD DEBUG - Duplicate check failed:", {
          error: error instanceof Error ? error.message : error,
          validContactsCount: validContacts?.length || 0
        });
        return json({ error: "Failed to check for duplicate contacts" }, { status: 500 });
      }
    }

    return json({ error: "Invalid step" }, { status: 400 });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("❌ CSV UPLOAD DEBUG - FATAL ERROR:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      totalTimeMs: totalTime,
      step,
      csvContentLength: csvContent?.length || 0
    });
    return json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}

export default function ContactUpload() {
  const { orgId, existingCustomFields } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [listName, setListName] = useState("");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [customKeys, setCustomKeys] = useState<string[]>(existingCustomFields || []);
  const [newCustomKeys, setNewCustomKeys] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      setCsvFile(file);
    }
  };

  if (actionData && 'step' in actionData && actionData.step === "complete") {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Import Successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Successfully processed {actionData && 'totalRows' in actionData ? actionData.totalRows : 0} contacts:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• {actionData && 'successfulRows' in actionData ? actionData.successfulRows : 0} new contacts imported</li>
                    {actionData && 'duplicatesUpdated' in actionData && actionData.duplicatesUpdated > 0 && (
                      <li>• {actionData && 'duplicatesUpdated' in actionData ? actionData.duplicatesUpdated : 0} duplicate contacts reactivated</li>
                    )}
                    {actionData && 'skippedDuplicates' in actionData && actionData.skippedDuplicates > 0 && (
                      <li>• {actionData && 'skippedDuplicates' in actionData ? actionData.skippedDuplicates : 0} duplicate contacts skipped (already in list)</li>
                    )}
                    {actionData && 'failedRows' in actionData && actionData.failedRows > 0 && (
                      <li className="text-yellow-700">• ⚠️ {actionData && 'failedRows' in actionData ? actionData.failedRows : 0} contacts failed to import</li>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <a
                    href={`/dashboard/contacts/segments/${actionData && 'listId' in actionData ? actionData.listId : ''}`}
                    className="text-green-800 hover:text-green-900 font-medium"
                  >
                    View segment →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (actionData && 'step' in actionData && actionData.step === "mapping") {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Map CSV Columns</h1>
          <p className="text-gray-600 mb-6">
            Map your CSV columns to contact fields. Preview shows the first 5 rows.
          </p>

          <Form method="post">
            <input type="hidden" name="step" value="import" />
            <input type="hidden" name="csvContent" value={actionData && 'csvContent' in actionData ? actionData.csvContent : ''} />
            <input type="hidden" name="listName" value={actionData && 'listName' in actionData ? actionData.listName : ''} />
            <input type="hidden" name="hasHeaders" value={actionData && 'hasHeaders' in actionData ? actionData.hasHeaders.toString() : 'true'} />
            
            <div className="space-y-6">
              {/* Field Mapping */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Map CSV Columns</h3>
                <p className="text-sm text-gray-600 mb-6">
                  For each CSV column, choose what field to import it as. Select "Do not import" to skip columns you don't need.
                </p>

                <div className="space-y-4">
                  {actionData && 'headers' in actionData && actionData.headers.map((csvColumn: string, index: number) => (
                    <div key={csvColumn} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* CSV Column (Fixed) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CSV Column
                          </label>
                          <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                            {csvColumn}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Sample: {actionData && 'preview' in actionData && actionData.preview[0]?.[csvColumn] || 'No data'}
                          </div>
                        </div>

                        {/* Import As (Dropdown) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Import as
                          </label>
                          <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
                            value={fieldMapping[csvColumn] || ''}
                            onChange={(e) => {
                              if (e.target.value === 'ADD_CUSTOM') {
                                setShowCustomInput(prev => ({
                                  ...prev,
                                  [csvColumn]: true
                                }));
                                return;
                              }
                              setFieldMapping(prev => ({
                                ...prev,
                                [csvColumn]: e.target.value
                              }));
                              setShowCustomInput(prev => ({
                                ...prev,
                                [csvColumn]: false
                              }));
                            }}
                          >
                            <option value="">Do not import</option>
                            <optgroup label="Standard Fields">
                              <option value="firstName">First Name</option>
                              <option value="lastName">Last Name</option>
                              <option value="email">Email Address</option>
                              <option value="phone">Phone Number</option>
                            </optgroup>
                            {customKeys.length > 0 && (
                              <optgroup label="Custom Fields">
                                {customKeys.map((key) => (
                                  <option key={key} value={key}>{key}</option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Actions">
                              <option value="ADD_CUSTOM">+ Add Custom Field</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Custom Field Input or Status */}
                        <div>
                          {showCustomInput[csvColumn] && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Custom Field
                              </label>
                              <div className="flex">
                                <input
                                  type="text"
                                  placeholder="e.g., Vehicle Year, Job Title"
                                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
                                  value={newCustomKeys[csvColumn] || ''}
                                  onChange={(e) => setNewCustomKeys(prev => ({
                                    ...prev,
                                    [csvColumn]: e.target.value
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newCustomKeys[csvColumn]?.trim()) {
                                      const cleanKey = newCustomKeys[csvColumn].trim();
                                      if (!customKeys.includes(cleanKey)) {
                                        setCustomKeys(prev => [...prev, cleanKey]);
                                      }
                                      setFieldMapping(prev => ({
                                        ...prev,
                                        [csvColumn]: cleanKey
                                      }));
                                      setShowCustomInput(prev => ({
                                        ...prev,
                                        [csvColumn]: false
                                      }));
                                      setNewCustomKeys(prev => {
                                        const newKeys = { ...prev };
                                        delete newKeys[csvColumn];
                                        return newKeys;
                                      });
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                  onClick={() => {
                                    if (newCustomKeys[csvColumn]?.trim()) {
                                      const cleanKey = newCustomKeys[csvColumn].trim();
                                      if (!customKeys.includes(cleanKey)) {
                                        setCustomKeys(prev => [...prev, cleanKey]);
                                      }
                                      setFieldMapping(prev => ({
                                        ...prev,
                                        [csvColumn]: cleanKey
                                      }));
                                      setShowCustomInput(prev => ({
                                        ...prev,
                                        [csvColumn]: false
                                      }));
                                      setNewCustomKeys(prev => {
                                        const newKeys = { ...prev };
                                        delete newKeys[csvColumn];
                                        return newKeys;
                                      });
                                    }
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                              <button
                                type="button"
                                className="mt-1 text-xs text-gray-600 hover:text-gray-800"
                                onClick={() => {
                                  setShowCustomInput(prev => ({
                                    ...prev,
                                    [csvColumn]: false
                                  }));
                                  setNewCustomKeys(prev => {
                                    const newKeys = { ...prev };
                                    delete newKeys[csvColumn];
                                    return newKeys;
                                  });
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          
                          {fieldMapping[csvColumn] && !showCustomInput[csvColumn] && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mapped Field
                              </label>
                              <div className="flex items-center">
                                <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-l-md text-sm font-medium text-green-800">
                                  ✓ {fieldMapping[csvColumn]}
                                </div>
                                <button
                                  type="button"
                                  className="px-3 py-2 border border-l-0 border-green-200 bg-red-50 text-red-700 rounded-r-md hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                  onClick={() => {
                                    setFieldMapping(prev => {
                                      const newMapping = { ...prev };
                                      delete newMapping[csvColumn];
                                      return newMapping;
                                    });
                                  }}
                                  title="Clear mapping"
                                >
                                  −
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Preview Table */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        {actionData && 'headers' in actionData && actionData.headers.map((header: string) => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {actionData && 'preview' in actionData && actionData.preview.map((row: any, index: number) => (
                        <tr key={index}>
                          {actionData && 'headers' in actionData && actionData.headers.map((header: string) => (
                            <td key={header} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <input
                type="hidden"
                name="mapping"
                value={JSON.stringify(fieldMapping)}
              />

              {/* Duplicate Handling Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Duplicate Handling</h4>
                <div className="space-y-2">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="reactivateDuplicates"
                      value="true"
                      className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">
                        Reactivate opted-out duplicates
                      </span>
                      <p className="text-xs text-gray-500">
                        If a contact with the same email or phone already exists but has opted out, 
                        reactivate them when importing. Otherwise, duplicates will be updated but remain opted out.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <a
                  href="/dashboard/contacts/upload"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </a>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
                >
                  Import Contacts
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Upload Contacts</h1>
        <p className="text-gray-600 mb-6">
          Upload a CSV file to import your contacts. Make sure your CSV includes headers for proper field mapping.
        </p>

        {actionData && 'error' in actionData && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{actionData.error}</p>
          </div>
        )}

        <Form method="post" encType="multipart/form-data" className="space-y-6">
          <input type="hidden" name="step" value="preview" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact List Name
            </label>
            <input
              type="text"
              name="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="form-input"
              placeholder="e.g., Newsletter Subscribers"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File
            </label>
            <input
              type="file"
              name="csvFile"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Upload a CSV file with contact information. Common columns include: Name, Email, Phone, Company, etc.
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={hasHeaders}
                onChange={(e) => setHasHeaders(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                My CSV file has header row
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Uncheck this if your CSV file doesn't have column headers in the first row
            </p>
          </div>

          <input type="hidden" name="hasHeaders" value={hasHeaders.toString()} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!csvFile || !listName}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Preview Import
            </button>
          </div>
        </Form>

        {/* Download Template */}
        <div className="mt-8 p-4 bg-primary-50 rounded-lg">
          <h3 className="text-sm font-medium text-primary-900 mb-2">Need a template?</h3>
          <p className="text-sm text-primary-700 mb-3">
            Download a sample CSV template with common fields to get started quickly.
          </p>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => {
              const csvContent = `First Name,Last Name,Email,Phone,Company,Notes
John,Doe,john@example.com,+15551234567,Acme Corp,Sample contact
Jane,Smith,jane@example.com,+15559876543,Tech Inc,Another sample`;
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'contacts-template.csv';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Template CSV
          </button>
        </div>
      </div>
    </div>
  );
}