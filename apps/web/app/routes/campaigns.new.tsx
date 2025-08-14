import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";

export const meta: MetaFunction = () => {
  return [
    { title: "New Campaign - BuzzLine" },
    { name: "description", content: "Create a new marketing campaign" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });

  const repositories = createRepositories(context.env, orgId);
  
  // Get contact lists and organization data
  const contactLists = await repositories.contactLists.findAll();
  const organization = await repositories.organization.findById() || {
    id: orgId,
    name: "My Organization", 
    twilioPhoneNumber: null, 
    emailFromAddress: null, 
    phoneStatus: 'pending' as const,
    emailStatus: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return json({ contactLists, organization });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const contactListId = formData.get("contactListId") as string;
  const emailSubject = formData.get("emailSubject") as string;
  const emailContent = formData.get("emailContent") as string;
  const smsContent = formData.get("smsContent") as string;

  // Basic validation
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Campaign name is required";
  if (!contactListId) errors.contactListId = "Contact list is required";
  if (!emailSubject && !smsContent) {
    errors.general = "At least one message type (email or SMS) is required";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  const repositories = createRepositories(context.env, orgId);
  
  // Create campaign
  const campaign = await repositories.campaigns.create({
    name,
    organizationId: orgId,
    contactListId,
    status: 'draft',
    emailTemplate: emailSubject && emailContent ? {
      subject: emailSubject,
      content: emailContent,
    } : undefined,
    smsTemplate: smsContent ? {
      content: smsContent,
    } : undefined,
  });
  
  return redirect(`/campaigns`);
}

export default function NewCampaign() {
  const { contactLists, organization } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Link
                to="/campaigns"
                className="text-[#5EC0DA] hover:text-[#4a9fb5] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-[#313131]">Create New Campaign</h1>
            </div>
            <p className="text-gray-600">Design and launch your marketing campaign</p>
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

          <Form method="post" className="space-y-6">
            {/* Campaign Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#313131]">Campaign Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#313131] mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                        actionData?.errors?.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Spring 2024 Product Launch"
                    />
                    {actionData?.errors?.name && (
                      <p className="text-red-600 text-sm mt-1">{actionData.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactListId" className="block text-sm font-medium text-[#313131] mb-2">
                      Contact List *
                    </label>
                    <select
                      id="contactListId"
                      name="contactListId"
                      required
                      className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                        actionData?.errors?.contactListId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a contact list</option>
                      {contactLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name} ({list.contactCount} contacts)
                        </option>
                      ))}
                    </select>
                    {actionData?.errors?.contactListId && (
                      <p className="text-red-600 text-sm mt-1">{actionData.errors.contactListId}</p>
                    )}
                    {contactLists.length === 0 && (
                      <p className="text-yellow-600 text-sm mt-1">
                        No contact lists found. Create one first in the Contacts section.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Message */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#313131]">Email Message</h2>
                    <p className="text-sm text-gray-600 mt-1">Design your email campaign (optional)</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {organization?.emailStatus === 'verified' && organization?.emailFromAddress ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-700 font-medium">From: {organization.emailFromAddress}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <Link to="/settings" className="text-xs text-yellow-700 font-medium hover:text-yellow-800">
                          Setup required →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="emailSubject" className="block text-sm font-medium text-[#313131] mb-2">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      id="emailSubject"
                      name="emailSubject"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors"
                      placeholder="Enter compelling email subject"
                    />
                  </div>

                  <div>
                    <label htmlFor="emailContent" className="block text-sm font-medium text-[#313131] mb-2">
                      Email Content
                    </label>
                    <textarea
                      id="emailContent"
                      name="emailContent"
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors"
                      placeholder="Write your email message here. Use dynamic tags like {firstName} for personalization."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Use dynamic tags like <code className="bg-gray-100 px-1 rounded">{"{firstName}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{company}"}</code> for personalization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS Message */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#313131]">SMS Message</h2>
                    <p className="text-sm text-gray-600 mt-1">Create your SMS campaign (optional)</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {organization?.phoneStatus === 'active' && organization?.twilioPhoneNumber ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-700 font-medium">From: {organization.twilioPhoneNumber}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <Link to="/settings" className="text-xs text-yellow-700 font-medium hover:text-yellow-800">
                          Setup required →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div>
                  <label htmlFor="smsContent" className="block text-sm font-medium text-[#313131] mb-2">
                    SMS Content
                  </label>
                  <textarea
                    id="smsContent"
                    name="smsContent"
                    rows={3}
                    maxLength={160}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors"
                    placeholder="Hi {firstName}, check out our latest offer!"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Keep SMS messages under 160 characters. Use <code className="bg-gray-100 px-1 rounded">{"{firstName}"}</code> for personalization.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Link
                to="/campaigns"
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}