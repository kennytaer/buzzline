import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getKVService } from "~/lib/kv.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    const kvService = getKVService(args.context);
    const customFields = await kvService.getCustomFields(orgId);
    
    return json({ orgId, customFields });
  } catch (error) {
    console.error("Error loading contact form:", error);
    return json({ orgId, customFields: [] });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await args.request.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  // Validate required fields
  if (!firstName || !lastName) {
    return json({ error: "First name and last name are required" }, { status: 400 });
  }

  if (!email && !phone) {
    return json({ error: "Either email or phone number is required" }, { status: 400 });
  }

  try {
    const kvService = getKVService(args.context);

    // Check if contact already exists
    const existingContact = await kvService.findContactByEmailOrPhone(orgId, email, phone);
    if (existingContact) {
      return json({ error: "A contact with this email or phone number already exists" }, { status: 400 });
    }

    // Collect metadata/custom fields
    const metadata: Record<string, string> = {};
    const customFields = await kvService.getCustomFields(orgId);
    
    for (const fieldName of customFields) {
      const value = formData.get(`metadata_${fieldName}`) as string;
      if (value && value.trim()) {
        metadata[fieldName] = value.trim();
        // Also store display name for the field
        metadata[`${fieldName}_display_name`] = fieldName.replace(/_/g, ' ');
      }
    }

    // Handle additional custom fields that might be added dynamically
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('metadata_') && !key.includes('_display_name')) {
        const fieldName = key.replace('metadata_', '');
        if (!customFields.includes(fieldName) && value && (value as string).trim()) {
          metadata[fieldName] = (value as string).trim();
          metadata[`${fieldName}_display_name`] = fieldName.replace(/_/g, ' ');
          // Add to custom fields list
          await kvService.addCustomField(orgId, fieldName);
        }
      }
    }

    // Create contact
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await kvService.createContact(orgId, contactId, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null
    });

    return redirect("/dashboard/contacts");
  } catch (error) {
    console.error("Error creating contact:", error);
    return json({ error: "Failed to create contact. Please try again." }, { status: 500 });
  }
}

export default function NewContact() {
  const { customFields } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Contact</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new contact manually
          </p>
        </div>
        <a
          href="/dashboard/contacts"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Contacts
        </a>
      </div>

      {actionData?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{actionData.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <Form method="post" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter email address"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Email or phone number is required
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter phone number"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Include country code (e.g., +1234567890)
                </p>
              </div>
            </div>

            {customFields.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {customFields.map((fieldName: string) => (
                    <div key={fieldName}>
                      <label htmlFor={`metadata_${fieldName}`} className="block text-sm font-medium text-gray-700">
                        {fieldName.replace(/_/g, ' ')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name={`metadata_${fieldName}`}
                          id={`metadata_${fieldName}`}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder={`Enter ${fieldName.replace(/_/g, ' ')}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-5">
              <div className="flex justify-end space-x-3">
                <a
                  href="/dashboard/contacts"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Contact"
                  )}
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}