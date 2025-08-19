import { useState } from "react";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { parseCSV, generateId, isValidEmail, isValidPhone } from "~/lib/utils";
import { getKVService } from "~/lib/kv.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const kvService = getKVService(args.context);
  const existingCustomFields = await kvService.getCustomFields(orgId);

  return { orgId, existingCustomFields };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const csvContent = formData.get("csvContent") as string;
  const listName = formData.get("listName") as string;
  const step = formData.get("step") as string;
  const reactivateDuplicates = formData.get("reactivateDuplicates") === "true";

  if (!csvContent || !listName) {
    return json({ error: "CSV content and list name are required" }, { status: 400 });
  }

  try {
    const kvService = getKVService(args.context);
    const rows = parseCSV(csvContent);
    
    if (rows.length === 0) {
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
        listName
      });
    }

    if (step === "import") {
      // Get field mapping from form
      const fieldMapping: Record<string, string> = {};
      const mappingData = formData.get("mapping") as string;
      
      if (mappingData) {
        Object.assign(fieldMapping, JSON.parse(mappingData));
      }

      // Create contact list
      const listId = generateId();
      await kvService.createContactList(orgId, listId, {
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

      // Process and import contacts
      const contactIds: string[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      const duplicatesUpdated: string[] = [];
      const skippedDuplicates: string[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          const contact: any = {
            firstName: row[fieldMapping.firstName] || '',
            lastName: row[fieldMapping.lastName] || '',
            email: row[fieldMapping.email] || '',
            phone: row[fieldMapping.phone] || '',
            metadata: {},
            contactListIds: [listId]
          };

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
              // Clean up the field name for metadata storage
              const cleanFieldName = contactField.toLowerCase().replace(/[^a-z0-9]/g, '_');
              contact.metadata[cleanFieldName] = row[csvCol] || '';
              // Also store the original display name for UI purposes
              contact.metadata[`${cleanFieldName}_display_name`] = contactField;
            }
          }

          // Check for existing contact by email or phone
          const existingContact = await kvService.findContactByEmailOrPhone(orgId, contact.email, contact.phone);
          
          if (existingContact) {
            // Check if it's an exact duplicate (same email AND same phone if both provided)
            const isExactDuplicate = 
              (contact.email && existingContact.email === contact.email) &&
              (contact.phone && existingContact.phone === contact.phone);
            
            if (isExactDuplicate) {
              // Complete duplicate - add to list if not already there
              const updatedListIds = existingContact.contactListIds || [];
              if (!updatedListIds.includes(listId)) {
                updatedListIds.push(listId);
                
                const updates: any = { contactListIds: updatedListIds };
                
                // Reactivate if requested and currently opted out
                if (reactivateDuplicates && existingContact.optedOut) {
                  updates.optedOut = false;
                  updates.optedOutAt = null;
                }
                
                await kvService.updateContact(orgId, existingContact.id, updates);
                
                if (reactivateDuplicates && existingContact.optedOut) {
                  duplicatesUpdated.push(existingContact.id);
                } else {
                  skippedDuplicates.push(existingContact.id);
                }
              } else {
                skippedDuplicates.push(existingContact.id);
              }
            } else {
              // Partial duplicate (email or phone match) - update the existing contact
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
              
              await kvService.updateContact(orgId, existingContact.id, updates);
              
              if (reactivateDuplicates && existingContact.optedOut) {
                duplicatesUpdated.push(existingContact.id);
              } else {
                contactIds.push(existingContact.id);
              }
            }
          } else {
            // New contact - create it
            const contactId = generateId();
            await kvService.createContact(orgId, contactId, contact);
            contactIds.push(contactId);
          }
          
        } catch (error) {
          console.error("Error processing contact row:", error);
          errors.push({ row: i + 1, error: "Failed to process contact" });
        }
      }

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
    }

    return json({ error: "Invalid step" }, { status: 400 });
    
  } catch (error) {
    console.error("CSV import error:", error);
    return json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}

export default function ContactUpload() {
  const { orgId, existingCustomFields } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [csvContent, setCsvContent] = useState("");
  const [listName, setListName] = useState("");
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [customKeys, setCustomKeys] = useState<string[]>(existingCustomFields || []);
  const [newCustomKeys, setNewCustomKeys] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
      };
      reader.readAsText(file);
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
            <input type="hidden" name="csvContent" value={csvContent} />
            <input type="hidden" name="listName" value={listName} />
            
            <div className="space-y-6">
              {/* Field Mapping */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Map CSV Columns</h3>
                <p className="text-sm text-gray-600 mb-6">
                  For each CSV column, choose what field it should map to. You can use standard fields or create custom ones.
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

                        {/* Maps to (Dropdown) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maps to Field
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
                            <option value="">-- Select Field --</option>
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

        <Form method="post" className="space-y-6">
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
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
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Upload a CSV file with contact information. Common columns include: Name, Email, Phone, Company, etc.
            </p>
          </div>

          <input type="hidden" name="csvContent" value={csvContent} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!csvContent || !listName}
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