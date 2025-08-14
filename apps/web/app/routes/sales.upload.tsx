import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import Papa from "papaparse";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";

export const meta: MetaFunction = () => {
  return [
    { title: "Upload Sales Team - BuzzLine" },
    { name: "description", content: "Upload your sales team data via CSV" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAuthWithOrg({ request, context });
  return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();

  const intent = formData.get("intent") as string;

  if (intent === "download-template") {
    // Generate CSV template for sales team
    const csvData = [
      ["firstName", "lastName", "email", "phone", "title", "companyName", "region", "territory"],
      ["John", "Smith", "john.smith@company.com", "+1-555-0123", "Senior Sales Rep", "BuzzLine Inc", "North America", "West Coast"],
      ["Sarah", "Johnson", "sarah.j@company.com", "+1-555-0124", "Account Manager", "BuzzLine Inc", "North America", "East Coast"],
      ["Mike", "Davis", "mike.davis@company.com", "+1-555-0125", "Sales Director", "BuzzLine Inc", "North America", "National"]
    ];
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    
    return new Response(blob, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=sales_team_template.csv"
      }
    });
  }

  if (intent === "upload") {
    const file = formData.get("csvFile") as File;
    const teamName = formData.get("teamName") as string;

    if (!file || file.size === 0) {
      return json({ 
        error: "Please select a CSV file to upload.",
        teamName 
      }, { status: 400 });
    }

    if (!teamName?.trim()) {
      return json({ 
        error: "Team name is required.",
        teamName 
      }, { status: 400 });
    }

    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { 
        header: true, 
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
      });

      if (parsed.errors.length > 0) {
        return json({ 
          error: "CSV parsing failed: " + parsed.errors[0].message,
          teamName 
        }, { status: 400 });
      }

      const rows = parsed.data as Record<string, string>[];
      
      if (rows.length === 0) {
        return json({ 
          error: "CSV file is empty or contains no valid data.",
          teamName 
        }, { status: 400 });
      }

      // Validate required fields
      const requiredFields = ['firstname', 'lastname', 'email'];
      const missingFields: string[] = [];
      
      requiredFields.forEach(field => {
        const hasField = parsed.meta.fields?.some(f => f.toLowerCase().includes(field));
        if (!hasField) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        return json({ 
          error: `CSV is missing required columns: ${missingFields.join(', ')}. Please ensure your CSV has firstName, lastName, and email columns.`,
          teamName 
        }, { status: 400 });
      }

      // Process sales team members
      const salesMembers = rows.map(row => {
        // Find firstName field (case-insensitive)
        const firstNameField = Object.keys(row).find(key => 
          key.toLowerCase().includes('firstname') || 
          key.toLowerCase() === 'first_name' ||
          key.toLowerCase() === 'first name'
        );
        
        // Find lastName field (case-insensitive) 
        const lastNameField = Object.keys(row).find(key => 
          key.toLowerCase().includes('lastname') || 
          key.toLowerCase() === 'last_name' ||
          key.toLowerCase() === 'last name'
        );
        
        // Find email field (case-insensitive)
        const emailField = Object.keys(row).find(key => 
          key.toLowerCase().includes('email')
        );

        const firstName = firstNameField ? row[firstNameField]?.trim() : '';
        const lastName = lastNameField ? row[lastNameField]?.trim() : '';
        const email = emailField ? row[emailField]?.trim() : '';

        if (!firstName || !lastName || !email) {
          throw new Error(`Missing required data for sales team member: ${firstName} ${lastName}`);
        }

        // Extract standard fields
        const phoneField = Object.keys(row).find(key => 
          key.toLowerCase().includes('phone')
        );
        const titleField = Object.keys(row).find(key => 
          key.toLowerCase().includes('title') || 
          key.toLowerCase().includes('position') ||
          key.toLowerCase().includes('role')
        );

        const phone = phoneField ? row[phoneField]?.trim() : null;
        const title = titleField ? row[titleField]?.trim() : null;

        // Store all other columns as metadata for dynamic tags
        const metadata: Record<string, string> = {};
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (!lowerKey.includes('firstname') && 
              !lowerKey.includes('lastname') && 
              !lowerKey.includes('email') &&
              !lowerKey.includes('phone') &&
              !lowerKey.includes('title') &&
              !lowerKey.includes('position') &&
              !lowerKey.includes('role')) {
            if (row[key]?.trim()) {
              // Use original key case but store the value
              metadata[key] = row[key].trim();
            }
          }
        });

        return {
          organizationId: orgId,
          firstName,
          lastName,
          email,
          phone,
          title,
          metadata,
          isActive: true,
        };
      });

      const repositories = createRepositories(context.env, orgId);
      
      // Create sales team members in KV storage
      const createdMembers = await repositories.salesAgents.bulkCreate(salesMembers);
      
      return redirect(`/sales?uploaded=${createdMembers.length}&team=${encodeURIComponent(teamName)}`);

    } catch (error) {
      console.error("Error processing sales team CSV:", error);
      return json({ 
        error: `Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        teamName 
      }, { status: 500 });
    }
  }

  return json({ error: "Invalid request" }, { status: 400 });
}

export default function SalesUpload() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      setSelectedFile(csvFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#313131]">Upload Sales Team</h1>
              <p className="text-gray-600 mt-1">Add your sales team members for campaign personalization</p>
            </div>
            <img 
              src="/Buzzline_Logo.png" 
              alt="BuzzLine" 
              className="h-12 w-auto"
            />
          </div>

          {/* Error Message */}
          {actionData?.error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{actionData.error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#313131]">Upload CSV File</h2>
                <p className="text-sm text-gray-600 mt-1">Upload a CSV file containing your sales team data</p>
              </div>
              <div className="p-6">
                <Form method="post" encType="multipart/form-data" className="space-y-6">
                  <input type="hidden" name="intent" value="upload" />
                  
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-[#313131] mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      name="teamName"
                      required
                      defaultValue={actionData?.teamName || ""}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors"
                      placeholder="e.g., Sales Team Q1 2024"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <label className="block text-sm font-medium text-[#313131] mb-2">
                      CSV File *
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        dragOver
                          ? "border-[#5EC0DA] bg-[#5EC0DA]/5"
                          : "border-gray-300 hover:border-[#5EC0DA] hover:bg-[#5EC0DA]/5"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                    >
                      {selectedFile ? (
                        <div className="space-y-2">
                          <svg className="w-8 h-8 text-[#5EC0DA] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium text-[#313131]">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="text-xs text-[#ED58A0] hover:text-[#d948a0] font-medium"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-[#313131]">
                              Drop your CSV file here, or{" "}
                              <label className="text-[#ED58A0] hover:text-[#d948a0] cursor-pointer">
                                browse
                                <input
                                  type="file"
                                  name="csvFile"
                                  accept=".csv"
                                  className="sr-only"
                                  onChange={handleFileSelect}
                                  required
                                />
                              </label>
                            </p>
                            <p className="text-xs text-gray-500">CSV files only</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      'Upload Sales Team'
                    )}
                  </button>
                </Form>
              </div>
            </div>

            {/* Template & Instructions */}
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#313131]">CSV Template</h2>
                  <p className="text-sm text-gray-600 mt-1">Download a template to get started</p>
                </div>
                <div className="p-6">
                  <Form method="post">
                    <input type="hidden" name="intent" value="download-template" />
                    <button
                      type="submit"
                      className="w-full px-6 py-3 text-sm font-semibold text-[#5EC0DA] bg-[#5EC0DA]/10 border border-[#5EC0DA]/20 rounded-xl hover:bg-[#5EC0DA]/20 transition-all duration-200"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download Template</span>
                      </div>
                    </button>
                  </Form>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#313131]">Requirements</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-[#ED58A0] rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-[#313131]">Required Fields</p>
                        <p className="text-gray-600">firstName, lastName, email</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-[#5EC0DA] rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-[#313131]">Optional Fields</p>
                        <p className="text-gray-600">phone, title, companyName, region, territory</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-[#313131]">Dynamic Tags</p>
                        <p className="text-gray-600">Any additional columns become campaign variables</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Examples */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#313131]">Campaign Usage</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-[#313131] mb-2">Example personalization:</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">
                          "Hi {"{customerFirstName}"}, it's {"{salespersonFirstName}"} from {"{companyName}"}! 
                          I wanted to reach out about your {"{territory}"} account..."
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-[#313131] mb-2">Available variables:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="bg-gray-100 px-2 py-1 rounded">{"{salespersonFirstName}"}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{"{salespersonLastName}"}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{"{salespersonEmail}"}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{"{salespersonTitle}"}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{"{companyName}"}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{"{region}"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}