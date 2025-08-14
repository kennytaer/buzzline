import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";

export const meta: MetaFunction = () => {
  return [
    { title: "Settings - BuzzLine" },
    { name: "description", content: "Manage your organization communication settings" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  
  const repositories = createRepositories(context.env, orgId);
  let organization = await repositories.organization.findById();
  
  // Create organization if it doesn't exist
  if (!organization) {
    organization = await repositories.organization.create({
      id: orgId,
      name: "My Organization",
    });
  }

  return json({ organization });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();

  const action = formData.get("_action") as string;

  if (action === "updateEmail") {
    const emailDomain = formData.get("emailDomain") as string;
    const emailFromAddress = formData.get("emailFromAddress") as string;

    const errors: Record<string, string> = {};

    if (!emailDomain) {
      errors.emailDomain = "Email domain is required";
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(emailDomain)) {
      errors.emailDomain = "Please enter a valid domain (e.g., yourdomain.com)";
    }

    if (!emailFromAddress) {
      errors.emailFromAddress = "From email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFromAddress)) {
      errors.emailFromAddress = "Please enter a valid email address";
    } else if (!emailFromAddress.endsWith(`@${emailDomain}`)) {
      errors.emailFromAddress = `Email address must be from domain @${emailDomain}`;
    }

    if (Object.keys(errors).length > 0) {
      return json({ errors, success: false }, { status: 400 });
    }

    try {
      const repositories = createRepositories(context.env, orgId);
      
      await repositories.organization.updateMailgunSettings({
        emailDomain,
        emailFromAddress,
        emailStatus: "pending" // Reset to pending for re-verification
      });

      return json({ 
        success: true, 
        message: "Email settings saved. Domain verification pending." 
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      return json({ 
        errors: { general: "Failed to update email settings" }, 
        success: false 
      }, { status: 500 });
    }
  }

  if (action === "requestPhone") {
    // In a real implementation, this would call Twilio API to purchase a phone number
    try {
      const repositories = createRepositories(context.env, orgId);
      
      // Simulate phone number assignment
      const mockPhoneNumber = `+1${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 9000) + 1000}`;
      const mockSid = `PN${Math.random().toString(36).substr(2, 32)}`;

      await repositories.organization.updateTwilioSettings({
        twilioPhoneNumber: mockPhoneNumber,
        phoneNumberSid: mockSid,
        phoneStatus: "active"
      });

      return json({ 
        success: true, 
        message: `Phone number ${mockPhoneNumber} has been assigned to your organization.` 
      });
    } catch (error) {
      console.error("Error requesting phone number:", error);
      return json({ 
        errors: { general: "Failed to assign phone number" }, 
        success: false 
      }, { status: 500 });
    }
  }

  return json({ errors: { general: "Invalid action" }, success: false }, { status: 400 });
}

export default function Settings() {
  const { organization } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#313131]">Organization Settings</h1>
            <p className="text-gray-600 mt-1">Manage your communication channels and campaign settings</p>
          </div>

          {/* Success Message */}
          {actionData?.success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-8">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{actionData.message}</p>
                </div>
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Email Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#313131]">Email Configuration</h2>
                    <p className="text-sm text-gray-600 mt-1">Set up your custom email domain</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      organization.emailStatus === 'verified' ? 'bg-green-500' :
                      organization.emailStatus === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      organization.emailStatus === 'verified' ? 'text-green-700' :
                      organization.emailStatus === 'pending' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {organization.emailStatus.charAt(0).toUpperCase() + organization.emailStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <Form method="post" className="space-y-6">
                  <input type="hidden" name="_action" value="updateEmail" />
                  
                  <div>
                    <label htmlFor="emailDomain" className="block text-sm font-medium text-[#313131] mb-2">
                      Email Domain *
                    </label>
                    <input
                      type="text"
                      id="emailDomain"
                      name="emailDomain"
                      defaultValue={organization.emailDomain || ""}
                      className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                        actionData?.errors?.emailDomain ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="yourdomain.com"
                    />
                    {actionData?.errors?.emailDomain && (
                      <p className="text-red-600 text-sm mt-1">{actionData.errors.emailDomain}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      We'll verify this domain with Mailgun on your behalf
                    </p>
                  </div>

                  <div>
                    <label htmlFor="emailFromAddress" className="block text-sm font-medium text-[#313131] mb-2">
                      Default From Email *
                    </label>
                    <input
                      type="email"
                      id="emailFromAddress"
                      name="emailFromAddress"
                      defaultValue={organization.emailFromAddress || ""}
                      className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                        actionData?.errors?.emailFromAddress ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="campaigns@yourdomain.com"
                    />
                    {actionData?.errors?.emailFromAddress && (
                      <p className="text-red-600 text-sm mt-1">{actionData.errors.emailFromAddress}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      All email campaigns will be sent from this address
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 text-sm font-semibold text-white bg-[#5EC0DA] rounded-xl hover:bg-[#4a9fb5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isSubmitting ? "Saving..." : "Save Email Settings"}
                  </button>
                </Form>

                {organization.emailStatus === 'verified' && organization.emailFromAddress && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">Domain Verified</p>
                        <p className="text-sm text-green-700">Campaigns will be sent from: {organization.emailFromAddress}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SMS Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#313131]">SMS Configuration</h2>
                    <p className="text-sm text-gray-600 mt-1">Your dedicated Twilio phone number</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      organization.phoneStatus === 'active' ? 'bg-green-500' :
                      organization.phoneStatus === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      organization.phoneStatus === 'active' ? 'text-green-700' :
                      organization.phoneStatus === 'pending' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {organization.phoneStatus.charAt(0).toUpperCase() + organization.phoneStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {organization.twilioPhoneNumber && organization.phoneStatus === 'active' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">Phone Number Active</p>
                          <p className="text-lg font-mono text-green-700">{organization.twilioPhoneNumber}</p>
                          <p className="text-sm text-green-600">All SMS campaigns will be sent from this number</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Features:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Automatic STOP/START handling</li>
                        <li>Delivery receipts and analytics</li>
                        <li>North American coverage</li>
                        <li>Compliant with carrier regulations</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-[#313131] mb-2">No Phone Number</h3>
                      <p className="text-sm text-gray-500 mb-6">Request a dedicated phone number for SMS campaigns</p>
                      
                      <Form method="post">
                        <input type="hidden" name="_action" value="requestPhone" />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {isSubmitting ? "Requesting..." : "Request Phone Number"}
                        </button>
                      </Form>
                    </div>

                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>What you'll get:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Dedicated US phone number</li>
                        <li>Automatic compliance handling</li>
                        <li>Real-time delivery tracking</li>
                        <li>Professional sender identity</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Organization Info */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#313131] mb-4">Organization Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Organization Name</label>
                <p className="text-[#313131] font-medium">{organization.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Organization ID</label>
                <p className="text-gray-500 font-mono text-sm">{organization.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}