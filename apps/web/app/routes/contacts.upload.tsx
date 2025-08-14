import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import Papa from "papaparse";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { createRepositories } from "~/lib/repositories";

export const meta: MetaFunction = () => {
  return [
    { title: "Upload Contacts - BuzzLine" },
    { name: "description", content: "Upload and import contact lists from CSV with dynamic campaign tags" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAuthWithOrg({ request, context });
  return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const { userId, orgId } = await requireAuthWithOrg({ request, context });
    const formData = await request.formData();

    const listName = formData.get("listName") as string;
    const csvData = formData.get("csvData") as string;

    console.log("Upload action called:", { listName: !!listName, csvData: !!csvData, orgId });

    const errors: Record<string, string> = {};
    if (!listName) errors.listName = "Contact list name is required";
    if (!csvData) errors.csvData = "CSV data is required";

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return json({ errors }, { status: 400 });
    }
    // Parse CSV data - preserve original headers for metadata
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      // Don't transform headers to preserve original casing for campaign tags
    });

    if (parsedData.errors.length > 0) {
      return json(
        { errors: { csvData: "Invalid CSV format: " + parsedData.errors[0].message } },
        { status: 400 }
      );
    }

    const contacts = parsedData.data as Array<Record<string, any>>;
    
    if (contacts.length === 0) {
      return json(
        { errors: { csvData: "No valid contact data found in CSV" } },
        { status: 400 }
      );
    }

    const repositories = createRepositories(context.env, orgId);

    // Create contact list
    const contactList = await repositories.contactLists.create({ name: listName });

    // Process and create contacts
    let validContactCount = 0;
    const skippedContacts: string[] = [];

    for (const [index, row] of contacts.entries()) {
      // Extract standard fields - try different header variations (case-insensitive)
      const firstName = findFieldValue(row, ['firstName', 'first_name', 'first name', 'fname']);
      const lastName = findFieldValue(row, ['lastName', 'last_name', 'last name', 'lname']);
      const email = findFieldValue(row, ['email', 'email address', 'emailAddress']);
      const phone = findFieldValue(row, ['phone', 'mobile', 'phone number', 'phoneNumber', 'cell']);

      // REQUIRED: firstName and lastName are now mandatory
      if (!firstName || !lastName) {
        skippedContacts.push(`Row ${index + 2}: Missing required firstName or lastName`);
        continue;
      }

      // Require at least email or phone
      if (!email && !phone) {
        skippedContacts.push(`Row ${index + 2}: Missing both email and phone`);
        continue;
      }

      // Create metadata with ALL fields for dynamic campaign tags
      const metadata: Record<string, any> = {};
      
      // Add all columns to metadata for dynamic tags
      for (const [key, value] of Object.entries(row)) {
        if (value && value.toString().trim()) {
          // Use original header name for campaign tags (preserve casing)
          metadata[key] = value.toString().trim();
        }
      }

      try {
        await repositories.contacts.create({
          contactListId: contactList.id,
          firstName: firstName,
          lastName: lastName,
          email: email || undefined,
          phone: phone || undefined,
          status: 'active',
          subGroups: [],
          metadata,
          flags: {
            emailOptedOut: false,
            smsOptedOut: false,
            isVip: false,
          },
          tags: [],
        });

        validContactCount++;
      } catch (error) {
        console.error(`Failed to create contact ${firstName} ${lastName}:`, error);
        skippedContacts.push(`Row ${index + 2}: Failed to create contact`);
      }
    }

    if (validContactCount === 0) {
      // Clean up the contact list if no valid contacts
      await repositories.contactLists.delete(contactList.id);
      
      const errorMsg = skippedContacts.length > 0 
        ? `No valid contacts found. Issues: ${skippedContacts.slice(0, 3).join('; ')}${skippedContacts.length > 3 ? '...' : ''}`
        : "No valid contacts found. Each contact must have firstName, lastName, and either email or phone.";
        
      return json(
        { errors: { csvData: errorMsg } },
        { status: 400 }
      );
    }

    return redirect(`/contacts?imported=${validContactCount}&skipped=${skippedContacts.length}`);
  } catch (error) {
    console.error("Error processing CSV:", error);
    return json(
      { errors: { general: "An error occurred while processing the CSV file" } },
      { status: 500 }
    );
  }
}

// Helper function to find field value with case-insensitive matching
function findFieldValue(row: Record<string, any>, possibleKeys: string[]): string | null {
  for (const key of possibleKeys) {
    // Try exact match first
    if (row[key]) return row[key].toString().trim();
    
    // Try case-insensitive match
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
    if (foundKey && row[foundKey]) {
      return row[foundKey].toString().trim();
    }
  }
  return null;
}

export default function UploadContacts() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvData, setCsvData] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);

      // Parse for preview
      const parsed = Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
      });
      
      setCsvPreview(parsed.data.slice(0, 5) as string[][]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo Only */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <img 
                src="/Buzzline_Logo.png" 
                alt="BuzzLine" 
                className="h-12 w-auto"
              />
            </Link>
            <Link 
              to="/contacts"
              className="text-[#5EC0DA] hover:text-[#4a9fb5] font-medium transition-colors"
            >
              ← Back to Contacts
            </Link>
          </div>
        </div>
      </header>

      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#313131] mb-4">Upload Contact List</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Import your contacts from a CSV file with support for dynamic campaign personalization tags
            </p>
          </div>

          {/* General Error */}
          {actionData?.errors?.general && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{actionData.errors.general}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Upload Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-8">
                <h2 className="text-2xl font-semibold text-[#313131] mb-6">Upload CSV File</h2>
                
                <Form method="post" className="space-y-6">
                  <input type="hidden" name="csvData" value={csvData} />
                  
                  {/* Contact List Name */}
                  <div>
                    <label htmlFor="listName" className="block text-sm font-medium text-[#313131] mb-2">
                      Contact List Name *
                    </label>
                    <input
                      type="text"
                      id="listName"
                      name="listName"
                      required
                      className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                        actionData?.errors?.listName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Spring 2024 Newsletter Subscribers"
                    />
                    {actionData?.errors?.listName && (
                      <p className="text-red-600 text-sm mt-1">{actionData.errors.listName}</p>
                    )}
                  </div>

                  {/* CSV File Upload */}
                  <div>
                    <label htmlFor="csvFile" className="block text-sm font-medium text-[#313131] mb-2">
                      CSV File *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="csvFile"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#5EC0DA]/10 file:text-[#5EC0DA] hover:file:bg-[#5EC0DA]/20 transition-colors"
                      />
                    </div>
                    {actionData?.errors?.csvData && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{actionData.errors.csvData}</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      Upload a CSV file with your contact information
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <Link
                      to="/contacts"
                      className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting || !csvData}
                      className="px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] border border-transparent rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        'Import Contacts'
                      )}
                    </button>
                  </div>
                </Form>
              </div>
            </div>

            {/* Instructions and Tools */}
            <div className="space-y-8">
              {/* CSV Template Download */}
              <div className="bg-gradient-to-r from-[#5EC0DA]/10 to-[#ED58A0]/10 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-[#313131] mb-3 flex items-center">
                  <svg className="w-5 h-5 text-[#5EC0DA] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV Template
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get started with our pre-formatted CSV template that includes example data and all the recommended columns.
                </p>
                <a
                  href="/contacts/template"
                  download
                  className="inline-flex items-center space-x-2 bg-[#5EC0DA] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a9fb5] transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Template</span>
                </a>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#313131] mb-4 flex items-center">
                  <svg className="w-5 h-5 text-[#ED58A0] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  CSV Requirements
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-[#313131] mb-2">Required Columns:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#ED58A0] rounded-full"></div>
                        <span><code className="bg-gray-100 px-2 py-0.5 rounded">firstName</code> - Contact's first name</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#ED58A0] rounded-full"></div>
                        <span><code className="bg-gray-100 px-2 py-0.5 rounded">lastName</code> - Contact's last name</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#ED58A0] rounded-full"></div>
                        <span><code className="bg-gray-100 px-2 py-0.5 rounded">email</code> OR <code className="bg-gray-100 px-2 py-0.5 rounded">phone</code> (at least one)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-[#313131] mb-2">Contact Personalization:</p>
                    <ul className="space-y-1 ml-4 text-gray-600">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#5EC0DA] rounded-full"></div>
                        <span>All columns become dynamic tags: <code className="bg-gray-100 px-1 rounded">{"{firstName}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{company}"}</code></span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#5EC0DA] rounded-full"></div>
                        <span>Add columns titles like <code className="bg-gray-100 px-1 rounded">company</code>, <code className="bg-gray-100 px-1 rounded">industry</code>, <code className="bg-gray-100 px-1 rounded">city</code> for rich personalization</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {csvPreview.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-[#313131] mb-4 flex items-center">
                    <svg className="w-5 h-5 text-[#5EC0DA] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    CSV Preview
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <tbody className="divide-y divide-gray-200">
                        {csvPreview.map((row, i) => (
                          <tr key={i} className={i === 0 ? "bg-[#5EC0DA]/5 font-medium" : "hover:bg-gray-50"}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 border-r border-gray-200 last:border-r-0 text-xs">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvPreview.length === 5 && (
                    <p className="text-xs text-gray-500 mt-3 text-center">Showing first 5 rows...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}