import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { parseCSV, generateId, isValidEmail, isValidPhone } from "~/lib/utils";
import { getSalesTeamService } from "~/lib/sales-team.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  return json({ orgId });
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const step = formData.get("step") as string;
  const hasHeaders = formData.get("hasHeaders") === "true";
  
  // Handle file upload for preview step
  let csvContent: string;
  const startTime = Date.now();
  
  if (step === "preview") {
    const csvFile = formData.get("csvFile") as File;
    if (!csvFile) {
      return json({ error: "CSV file is required" }, { status: 400 });
    }
    
    try {
      csvContent = await csvFile.text();
    } catch (error) {
      return json({ error: "Failed to read CSV file" }, { status: 500 });
    }
  } else {
    // For import step, get content from hidden field
    csvContent = formData.get("csvContent") as string;
    if (!csvContent) {
      return json({ error: "CSV content is required" }, { status: 400 });
    }
  }

  try {
    const salesTeamService = getSalesTeamService(args.context);
    
    const rows = parseCSV(csvContent, hasHeaders);
    
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

      // Process team members
      const validMembers: any[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // Create reverse mapping to find CSV columns for each member field
          const reverseMapping: Record<string, string> = {};
          for (const [csvCol, memberField] of Object.entries(fieldMapping)) {
            if (memberField) {
              reverseMapping[memberField] = csvCol;
            }
          }
          
          const member: any = {
            firstName: reverseMapping.firstName ? row[reverseMapping.firstName] || '' : '',
            lastName: reverseMapping.lastName ? row[reverseMapping.lastName] || '' : '',
            email: reverseMapping.email ? row[reverseMapping.email] || '' : '',
            phone: reverseMapping.phone ? row[reverseMapping.phone] || '' : '',
            title: reverseMapping.title ? row[reverseMapping.title] || '' : '',
            department: reverseMapping.department ? row[reverseMapping.department] || '' : '',
            bio: reverseMapping.bio ? row[reverseMapping.bio] || '' : '',
            isActive: true
          };

          // Validate required fields
          if (!member.firstName || !member.lastName || !member.email) {
            errors.push({ row: i + 1, error: "Missing required fields (firstName, lastName, email)" });
            continue;
          }

          // Validate email
          if (member.email && !isValidEmail(member.email)) {
            errors.push({ row: i + 1, error: "Invalid email format" });
            continue;
          }
          
          // Validate phone if provided
          if (member.phone && !isValidPhone(member.phone)) {
            errors.push({ row: i + 1, error: "Invalid phone format" });
            continue;
          }

          validMembers.push(member);
          
        } catch (error) {
          errors.push({ row: i + 1, error: "Failed to process team member" });
        }
      }

      if (validMembers.length === 0) {
        return json({
          step: "complete",
          totalRows: rows.length,
          successfulRows: 0,
          failedRows: errors.length,
          errors
        });
      }

      // Import team members
      try {
        await salesTeamService.importMembers(orgId, validMembers);
        
        return json({
          step: "complete",
          totalRows: rows.length,
          successfulRows: validMembers.length,
          failedRows: errors.length,
          errors: errors.slice(0, 10) // Limit errors shown
        });
      } catch (error) {
        return json({ error: "Failed to import team members" }, { status: 500 });
      }
    }

    return json({ error: "Invalid step" }, { status: 400 });
    
  } catch (error) {
    return json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}

export default function TeamUpload() {
  const { orgId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  
  // Determine loading state and current step
  const isSubmitting = navigation.state === "submitting";
  const formData = navigation.formData;
  const step = formData?.get("step") as string;
  const isPreviewStep = isSubmitting && step === "preview";
  const isImportStep = isSubmitting && step === "import";

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      setCsvFile(file);
    }
  };

  // Loading component
  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Processing CSV Upload</h3>
            <p className="text-sm text-gray-600">{message}</p>
            <p className="text-xs text-gray-500 mt-2">This may take a few minutes for large files...</p>
          </div>
        </div>
      </div>
    </div>
  );

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
                  <p>Successfully processed {actionData && 'totalRows' in actionData ? actionData.totalRows : 0} team members:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• {actionData && 'successfulRows' in actionData ? actionData.successfulRows : 0} team members imported</li>
                    {actionData && 'failedRows' in actionData && actionData.failedRows > 0 && (
                      <li className="text-yellow-700">• ⚠️ {actionData && 'failedRows' in actionData ? actionData.failedRows : 0} team members failed to import</li>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <a
                    href="/dashboard/team"
                    className="text-green-800 hover:text-green-900 font-medium"
                  >
                    View team →
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
        {isImportStep && <LoadingSpinner message="Processing team members..." />}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Map CSV Columns</h1>
          <p className="text-gray-600 mb-6">
            Map your CSV columns to team member fields. Preview shows the first 5 rows.
          </p>

          <Form method="post">
            <input type="hidden" name="step" value="import" />
            <input type="hidden" name="csvContent" value={actionData && 'csvContent' in actionData ? actionData.csvContent : ''} />
            <input type="hidden" name="hasHeaders" value={actionData && 'hasHeaders' in actionData ? actionData.hasHeaders.toString() : 'true'} />
            
            <div className="space-y-6">
              {/* Field Mapping */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Map CSV Columns</h3>
                <p className="text-sm text-gray-600 mb-6">
                  For each CSV column, choose what field to import it as. Select "Do not import" to skip columns you don't need.
                </p>

                <div className="space-y-4">
                  {actionData && 'headers' in actionData && actionData.headers.map((csvColumn: string) => (
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
                              setFieldMapping(prev => ({
                                ...prev,
                                [csvColumn]: e.target.value
                              }));
                            }}
                          >
                            <option value="">Do not import</option>
                            <optgroup label="Team Member Fields">
                              <option value="firstName">First Name</option>
                              <option value="lastName">Last Name</option>
                              <option value="email">Email Address</option>
                              <option value="phone">Phone Number</option>
                              <option value="title">Job Title</option>
                              <option value="department">Department</option>
                              <option value="bio">Bio/Description</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Status */}
                        <div>
                          {fieldMapping[csvColumn] && (
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

              <div className="flex justify-end space-x-3">
                <a
                  href="/dashboard/team/upload"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </a>
                <button
                  type="submit"
                  disabled={isImportStep}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isImportStep ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    "Import Team Members"
                  )}
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
      {isPreviewStep && <LoadingSpinner message="Reading and analyzing your CSV file..." />}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Upload Sales Team</h1>
        <p className="text-gray-600 mb-6">
          Upload a CSV file to import your sales team members. Make sure your CSV includes headers for proper field mapping.
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
              Upload a CSV file with team member information. Common columns include: First Name, Last Name, Email, Phone, Title, Department, etc.
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
              disabled={!csvFile || isPreviewStep}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isPreviewStep ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                "Preview Import"
              )}
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
              const csvContent = `First Name,Last Name,Email,Phone,Title,Department,Bio
John,Smith,john.smith@company.com,+15551234567,Sales Representative,Sales,Experienced sales professional
Jane,Doe,jane.doe@company.com,+15559876543,Account Manager,Sales,Customer relationship specialist`;
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'team-template.csv';
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