import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getContactService } from "~/lib/services/contact.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { getKVService } from "~/lib/kv.server";
import { formatDate, isValidEmail, isValidPhone } from "~/lib/utils";
import { CustomFieldSelector } from "~/components/CustomFieldSelector";
import { useCustomFields } from "~/hooks/useCustomFields";

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
    const contactService = getContactService(args.context);
    const contactListService = getContactListService(args.context);
    const kvService = getKVService(args.context); // For custom fields
    
    // Get the contact
    const contact = await contactService.getContact(orgId, contactId);
    if (!contact) {
      throw new Response("Contact not found", { status: 404 });
    }

    // Get all contact lists for this organization to show which lists this contact belongs to
    const [contactLists, customFields] = await Promise.all([
      contactListService.listContactLists(orgId),
      kvService.getCustomFields(orgId)
    ]);
    
    const contactListsForContact = contactLists.filter((list: any) => 
      contact.contactListIds && contact.contactListIds.includes(list.id)
    );

    return json({ 
      contact,
      contactLists: contactListsForContact,
      customFields,
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
    const contactService = getContactService(args.context);
    const kvService = getKVService(args.context); // For custom fields
    const contact = await contactService.getContact(orgId, contactId);
    
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
        
        // Get existing org custom fields
        const existingOrgFields = await kvService.getCustomFields(orgId);
        const newFields = [];
        
        for (const [key, value] of Object.entries(customFields)) {
          if (value) {
            metadata[key] = value;
            metadata[`${key}_display_name`] = key.replace(/_/g, ' ');
            
            // Track new fields that need to be saved to the org
            if (!existingOrgFields.includes(key)) {
              newFields.push(key);
            }
          }
        }
        
        // Save new custom fields to the organization
        if (newFields.length > 0) {
          await kvService.saveCustomFields(orgId, [...existingOrgFields, ...newFields]);
        }
      }

      const updates = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        metadata
      };

      await contactService.updateContact(orgId, contactId, updates);
      return json({ success: "Contact updated successfully" });
      
    } else if (actionType === "toggleOptOut") {
      const newOptOutStatus = !contact.optedOut;
      await contactService.updateContactOptOut(orgId, contactId, newOptOutStatus);
      return json({ success: `Contact ${newOptOutStatus ? 'opted out' : 'reactivated'} successfully` });
      
    } else if (actionType === "delete") {
      const success = await contactService.deleteContact(orgId, contactId);
      if (success) {
        // Redirect to contacts list after successful deletion
        return redirect("/dashboard/contacts");
      } else {
        return json({ error: "Contact not found" }, { status: 404 });
      }
      
    } else {
      return json({ error: "Invalid action" }, { status: 400 });
    }
    
  } catch (error) {
    console.error("Error updating contact:", error);
    return json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export default function ContactView() {
  const { contact, contactLists, customFields: availableCustomFields, orgId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Prepare initial values from existing contact metadata
  const initialActiveFields = contact.metadata 
    ? Object.keys(contact.metadata).filter(key => !key.endsWith('_display_name'))
    : [];
  
  const initialValues = contact.metadata 
    ? Object.keys(contact.metadata)
        .filter(key => !key.endsWith('_display_name'))
        .reduce((acc, key) => ({ ...acc, [key]: contact.metadata[key] || '' }), {})
    : {};

  // Initialize custom fields manager with existing contact data
  const customFieldsManager = useCustomFields({
    initialFields: availableCustomFields || [],
    initialActiveFields,
    initialValues,
    orgId,
    onFieldAdded: async (fieldName) => {
      // Optionally sync with server immediately
      try {
        await fetch('/api/custom-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId, fieldName })
        });
      } catch (error) {
        console.warn('Failed to sync custom field immediately:', error);
      }
    }
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
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Contact
          </button>
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
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Custom Fields</h4>
                    <CustomFieldSelector
                      existingFields={customFieldsManager.availableFields}
                      onFieldSelect={customFieldsManager.addField}
                      onNewFieldCreate={customFieldsManager.addField}
                      placeholder="Add custom field"
                      className="w-64"
                    />
                  </div>
                  
                  {/* Active Custom Fields */}
                  {customFieldsManager.activeFields.length > 0 ? (
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                      {customFieldsManager.activeFields.map((key) => (
                        <div key={key} className="relative">
                          <div className="flex items-center gap-2 mb-1">
                            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                              {getCustomFieldDisplayName(key)}
                            </label>
                            <button
                              type="button"
                              onClick={() => customFieldsManager.removeField(key)}
                              className="text-gray-400 hover:text-red-500 text-sm"
                              title="Remove field"
                            >
                              ×
                            </button>
                          </div>
                          <input
                            type="text"
                            name={key}
                            id={key}
                            value={customFieldsManager.fieldValues[key] || ''}
                            onChange={(e) => customFieldsManager.updateFieldValue(key, e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">
                        No custom fields added yet. Use the dropdown above to add custom fields.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Example: Vehicle Year, Job Title, Company Size, etc.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <input type="hidden" name="customFields" value={JSON.stringify(customFieldsManager.fieldValues)} />

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Contact</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{contact.firstName} {contact.lastName}</strong>? 
                  This action cannot be undone and will permanently remove the contact from all lists and campaigns.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <Form method="post" style={{ display: 'inline' }}>
                    <input type="hidden" name="actionType" value="delete" />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      Delete
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}