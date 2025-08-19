import { useState } from "react";
import { useLoaderData, useActionData, Form, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/node";
import { getKVService } from "~/lib/kv.server";
import { formatDate, isValidEmail, isValidPhone } from "~/lib/utils";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const { contactId } = args.params;
  if (!contactId) {
    throw new Response("Contact not found", { status: 404 });
  }

  try {
    const kvService = getKVService(args.context);
    
    // Get the contact
    const contact = await kvService.getContact(orgId, contactId);
    if (!contact) {
      throw new Response("Contact not found", { status: 404 });
    }

    // Get all contact lists for this organization to show which lists this contact belongs to
    const contactLists = await kvService.listContactLists(orgId);
    const contactListsForContact = contactLists.filter((list: any) => 
      contact.contactListIds && contact.contactListIds.includes(list.id)
    );

    return json({ 
      contact,
      contactLists: contactListsForContact,
      orgId 
    });
  } catch (error) {
    console.error("Error loading contact:", error);
    throw new Response("Failed to load contact", { status: 500 });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const { contactId } = args.params;
  if (!contactId) {
    throw new Response("Contact not found", { status: 404 });
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  try {
    const kvService = getKVService(args.context);
    const contact = await kvService.getContact(orgId, contactId);
    
    if (!contact) {
      throw new Response("Contact not found", { status: 404 });
    }

    if (actionType === "update") {
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;

      // Validate email and phone if provided
      if (email && !isValidEmail(email)) {
        return json({ error: "Invalid email format" }, { status: 400 });
      }
      
      if (phone && !isValidPhone(phone)) {
        return json({ error: "Invalid phone format" }, { status: 400 });
      }

      // Handle custom fields
      const metadata = { ...contact.metadata };
      const customFieldsData = formData.get("customFields") as string;
      if (customFieldsData) {
        const customFields = JSON.parse(customFieldsData);
        for (const [key, value] of Object.entries(customFields)) {
          if (value) {
            metadata[key] = value;
          }
        }
      }

      const updates = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        metadata
      };

      await kvService.updateContact(orgId, contactId, updates);
      return json({ success: "Contact updated successfully" });
      
    } else if (actionType === "toggleOptOut") {
      const newOptOutStatus = !contact.optedOut;
      await kvService.updateContactOptOut(orgId, contactId, newOptOutStatus);
      return json({ success: `Contact ${newOptOutStatus ? 'opted out' : 'reactivated'} successfully` });
      
    } else {
      return json({ error: "Invalid action" }, { status: 400 });
    }
    
  } catch (error) {
    console.error("Error updating contact:", error);
    return json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export default function ContactView() {
  const { contact, contactLists } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState(() => {
    const fields: Record<string, string> = {};
    if (contact.metadata) {
      Object.keys(contact.metadata)
        .filter(key => !key.endsWith('_display_name'))
        .forEach(key => {
          fields[key] = contact.metadata[key] || '';
        });
    }
    return fields;
  });

  const getCustomFieldDisplayName = (key: string) => {
    return contact.metadata?.[`${key}_display_name`] || key.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <a href="/dashboard/contacts" className="text-gray-400 hover:text-gray-500">
                  Contacts
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {contact.firstName} {contact.lastName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {contact.firstName} {contact.lastName}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isEditing ? 'Cancel Edit' : 'Edit Contact'}
          </button>
          <Form method="post" style={{ display: 'inline' }}>
            <input type="hidden" name="actionType" value="toggleOptOut" />
            <button
              type="submit"
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                contact.optedOut 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {contact.optedOut ? 'Reactivate' : 'Opt Out'}
            </button>
          </Form>
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

      {/* Contact Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Contact Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Personal details and contact information.
            </p>
          </div>
          <div className="flex items-center">
            {contact.optedOut ? (
              <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                Opted Out
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                Active
              </span>
            )}
          </div>
        </div>

        {isEditing ? (
          <Form method="post" className="border-t border-gray-200">
            <input type="hidden" name="actionType" value="update" />
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    defaultValue={contact.firstName}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    defaultValue={contact.lastName}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    defaultValue={contact.email}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    defaultValue={contact.phone}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  />
                </div>

                {/* Custom Fields */}
                {Object.keys(customFields).length > 0 && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Custom Fields</h4>
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                      {Object.keys(customFields).map((key) => (
                        <div key={key}>
                          <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                            {getCustomFieldDisplayName(key)}
                          </label>
                          <input
                            type="text"
                            name={key}
                            id={key}
                            value={customFields[key]}
                            onChange={(e) => setCustomFields(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Form>
        ) : (
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {contact.firstName} {contact.lastName}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {contact.email || '-'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {contact.phone || '-'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {contact.optedOut ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                      Opted Out
                      {contact.optedOutAt && (
                        <span className="ml-1 text-gray-600">
                          on {formatDate(contact.optedOutAt)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      Active
                    </span>
                  )}
                </dd>
              </div>
              
              {/* Custom Fields Display */}
              {contact.metadata && Object.keys(contact.metadata).filter(key => !key.endsWith('_display_name')).length > 0 && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Custom Fields</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="space-y-2">
                      {Object.keys(contact.metadata)
                        .filter(key => !key.endsWith('_display_name'))
                        .map((key) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            {getCustomFieldDisplayName(key)}:
                          </span>
                          <span>{contact.metadata[key] || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </dd>
                </div>
              )}

              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(contact.createdAt)}
                </dd>
              </div>
              
              {contact.updatedAt && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(contact.updatedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Contact Lists */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Contact Lists</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Lists and segments this contact belongs to.
          </p>
        </div>
        <div className="border-t border-gray-200">
          {contactLists.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {contactLists.map((list) => (
                <li key={list.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{list.name}</h4>
                      {list.description && (
                        <p className="text-sm text-gray-500">{list.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Created {formatDate(list.createdAt)}
                      </span>
                      <a
                        href={`/dashboard/contacts/segments/${list.id}`}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        View List
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-sm text-gray-500">This contact is not in any lists.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}