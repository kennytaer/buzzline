import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form, useSearchParams } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getKVService } from "~/lib/kv.server"; // TODO: Create OrganizationSettingsService
import { formatDate } from "~/lib/utils";

// Server-side file upload handler
async function serverUploadFile(formData: FormData, context: any): Promise<{ url: string; id: string }> {
  const apiKey = context.env?.BENCHMETRICS_API_KEY;
  if (!apiKey) {
    throw new Error('BENCHMETRICS_API_KEY not configured');
  }

  console.log('Uploading file server-side');

  const response = await fetch('https://file-uploader.benchmetrics.workers.dev/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'x-api-key': apiKey
    },
  });

  console.log('Upload response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('Upload error response:', errorText);
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  console.log('Raw response text:', responseText);
  
  const data = JSON.parse(responseText);
  console.log('Upload API response:', data);
  
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Unexpected response format - empty array or not an array');
    throw new Error('Upload failed: Empty response from server');
  }
  
  const uploadResult = data[0];
  console.log('Upload result:', uploadResult);
  
  if (!uploadResult) {
    throw new Error('Upload failed: No upload result in response');
  }
  
  return {
    url: uploadResult.imageUrl || uploadResult.fileUrl,
    id: uploadResult.imageId || uploadResult.fileId,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    const kvService = getKVService(args.context);
    const orgSettings = await kvService.getOrgSettings(orgId);
    
    return { 
      orgId,
      settings: orgSettings
    };
  } catch (error) {
    console.error("Error loading org settings:", error);
    return { 
      orgId,
      settings: {
        emailSignature: {
          salesPersonName: '',
          salesPersonTitle: '',
          salesPersonPhone: '',
          companyLogoUrl: '',
          unsubscribeUrl: ''
        },
        companyInfo: {
          name: '',
          website: '',
          address: ''
        }
      },
      salesTeam: []
    };
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  try {
    const kvService = getKVService(args.context);

    if (actionType === "uploadFile") {
      const file = formData.get("file") as File;
      if (!file) {
        return json({ error: "No file provided" }, { status: 400 });
      }

      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        return json({ error: "Please select an image file" }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) {
        return json({ error: "File size must be less than 5MB" }, { status: 400 });
      }

      const uploadFormData = new FormData();
      uploadFormData.append('files', file);

      const uploadResult = await serverUploadFile(uploadFormData, args.context);
      return json({ success: "File uploaded successfully", url: uploadResult.url });
    }

    if (actionType === "updateSignature") {
      const emailSignature = {
        salesPersonName: formData.get("salesPersonName") as string,
        salesPersonTitle: formData.get("salesPersonTitle") as string,
        salesPersonPhone: formData.get("salesPersonPhone") as string,
        companyLogoUrl: formData.get("companyLogoUrl") as string,
        unsubscribeUrl: formData.get("unsubscribeUrl") as string,
      };

      await kvService.updateOrgSettings(orgId, { emailSignature });
      return json({ success: "Email signature updated successfully" });
    }

    if (actionType === "updateCompany") {
      const companyInfo = {
        name: formData.get("companyName") as string,
        website: formData.get("companyWebsite") as string,
        address: formData.get("companyAddress") as string,
      };

      await kvService.updateOrgSettings(orgId, { companyInfo });
      return json({ success: "Company information updated successfully" });
    }

    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Error updating org settings:", error);
    return json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export default function OrganizationSettings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get tab from URL parameters
  const urlTab = searchParams.get('tab') as "signature" | "company" | null;
  const [activeTab, setActiveTab] = useState<"signature" | "company">(
    urlTab || "signature"
  );

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(settings.emailSignature?.companyLogoUrl || '');

  // Update URL when tab changes
  const handleTabChange = (tab: "signature" | "company") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('actionType', 'uploadFile');
      formData.append('file', file);

      const response = await fetch('/dashboard/settings', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as any;
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.url) {
        setLogoUrl(result.url);
        
        // Update the input field
        const input = document.getElementById('companyLogoUrl') as HTMLInputElement;
        if (input) {
          input.value = result.url;
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's email signature, company information, and sales team.
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {actionData && 'success' in actionData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-green-800">{actionData.success}</p>
          </div>
        </div>
      )}

      {actionData && 'error' in actionData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-800">{actionData.error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange("signature")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "signature"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Email Signature
          </button>
          <button
            onClick={() => handleTabChange("company")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "company"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Company Info
          </button>
        </nav>
      </div>

      {/* Email Signature Tab */}
      {activeTab === "signature" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Default Email Signature
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This signature will be used as the default for all email campaigns. 
              You can override it per campaign if needed.
            </p>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="updateSignature" />
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="salesPersonName" className="block text-sm font-medium text-gray-700">
                    Sales Person Name
                  </label>
                  <input
                    type="text"
                    name="salesPersonName"
                    id="salesPersonName"
                    defaultValue={settings.emailSignature?.salesPersonName || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="salesPersonTitle" className="block text-sm font-medium text-gray-700">
                    Sales Person Title
                  </label>
                  <input
                    type="text"
                    name="salesPersonTitle"
                    id="salesPersonTitle"
                    defaultValue={settings.emailSignature?.salesPersonTitle || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    placeholder="Sales Manager"
                  />
                </div>

                <div>
                  <label htmlFor="salesPersonPhone" className="block text-sm font-medium text-gray-700">
                    Sales Person Phone
                  </label>
                  <input
                    type="tel"
                    name="salesPersonPhone"
                    id="salesPersonPhone"
                    defaultValue={settings.emailSignature?.salesPersonPhone || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="unsubscribeUrl" className="block text-sm font-medium text-gray-700">
                    Unsubscribe URL
                  </label>
                  <input
                    type="url"
                    name="unsubscribeUrl"
                    id="unsubscribeUrl"
                    defaultValue={settings.emailSignature?.unsubscribeUrl || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    placeholder="https://yourcompany.com/unsubscribe"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Company Logo
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="url"
                        name="companyLogoUrl"
                        id="companyLogoUrl"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                        placeholder="https://yourcompany.com/logo.png"
                      />
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="logo-upload"
                        className={`cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                          isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload an image file (max 5MB) or enter a URL directly. Recommended size: 180px wide.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Save Email Signature
                </button>
              </div>
            </Form>

            {/* Signature Preview */}
            {settings.emailSignature?.salesPersonName && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preview:</h4>
                <div className="text-sm" dangerouslySetInnerHTML={{
                  __html: `
                    <br/>
                    <p style="margin:0px;">Chat soon,</p>
                    <p style="margin:0px;"><strong>${settings.emailSignature.salesPersonName}</strong></p>
                    ${settings.emailSignature.salesPersonTitle ? `<p style="margin:0px;">${settings.emailSignature.salesPersonTitle}</p>` : ''}
                    <img src="${logoUrl || 'https://imagedelivery.net/fdADyrHW5AIzXwUyxun8dw/b95b1ebf-081b-454a-41f0-4ef26623c400/public'}" width="180px" style="display:block;margin:0px 0px 0px -8px;">
                    <p style="display:block;margin:5px 0px;color:#343433;">No longer want to receive these types of emails? <a href="${settings.emailSignature.unsubscribeUrl || '#'}" target="_blank" style="font-weight:600;">Unsubscribe here.</a></p>
                  `
                }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Info Tab */}
      {activeTab === "company" && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Company Information
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Basic information about your company for campaigns and correspondence.
            </p>

            <Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="updateCompany" />
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  defaultValue={settings.companyInfo?.name || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  name="companyWebsite"
                  id="companyWebsite"
                  defaultValue={settings.companyInfo?.website || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="companyAddress"
                  id="companyAddress"
                  rows={3}
                  defaultValue={settings.companyInfo?.address || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Save Company Info
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

    </div>
  );
}