import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";

export const meta: MetaFunction = () => {
  return [
    { title: "Add Sales Member - BuzzLine" },
    { name: "description", content: "Add a new sales member to your team" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  
  return json({ orgId });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();

  const firstName = formData.get("firstName")?.toString().trim();
  const lastName = formData.get("lastName")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const title = formData.get("title")?.toString().trim();

  // Validation
  const errors: Record<string, string> = {};

  if (!firstName) {
    errors.firstName = "First name is required";
  }

  if (!lastName) {
    errors.lastName = "Last name is required";
  }

  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (phone && !/^[\+]?[\d\s\(\)\-]{10,}$/.test(phone)) {
    errors.phone = "Please enter a valid phone number";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 400 });
  }

  try {
    const repositories = createRepositories(context.env, orgId);
    
    // Create sales agent
    await repositories.salesAgents.create({
      organizationId: orgId,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      title: title || undefined,
      metadata: {},
      isActive: true,
    });
    
    return redirect("/sales");
  } catch (error) {
    console.error("Error creating sales member:", error);
    return json({ 
      errors: { general: "Failed to create sales member. Please try again." }, 
      success: false 
    }, { status: 500 });
  }
}

export default function NewSalesMember() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Link
                to="/sales"
                className="text-[#5EC0DA] hover:text-[#4a9fb5] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-[#313131]">Add New Sales Member</h1>
            </div>
            <p className="text-gray-600">Add a new sales team member for campaign personalization</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#313131]">Sales Member Information</h2>
            </div>
            
            <Form method="post" className="p-6 space-y-6">
              {/* General Error */}
              {actionData?.errors?.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#313131] mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                      actionData?.errors?.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {actionData?.errors?.firstName && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#313131] mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                      actionData?.errors?.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {actionData?.errors?.lastName && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#313131] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                    actionData?.errors?.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="john.doe@company.com"
                />
                {actionData?.errors?.email && (
                  <p className="mt-1 text-sm text-red-600">{actionData.errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#313131] mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${
                      actionData?.errors?.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {actionData?.errors?.phone && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.phone}</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[#313131] mb-2">
                    Job Title (Optional)
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors"
                    placeholder="Sales Representative"
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Additional campaign variables (like company, region, etc.) can be added later by uploading a CSV with custom metadata fields.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Link
                  to="/sales"
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#ED58A0] rounded-lg hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Sales Member'
                  )}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}