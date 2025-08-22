import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { getContactService } from "~/lib/services/contact.server";
import { getKVService } from "~/lib/kv.server";

export async function loader(args: LoaderFunctionArgs) {
  const { token } = args.params;
  
  if (!token) {
    throw new Response("Invalid unsubscribe link", { status: 400 });
  }

  try {
    // Decode the token to get orgId, contactId, campaignId
    const decodedData = Buffer.from(token, 'base64url').toString('utf-8');
    const [orgId, contactId, campaignId, timestamp] = decodedData.split(':');
    
    if (!orgId || !contactId) {
      throw new Response("Invalid unsubscribe token", { status: 400 });
    }

    // Check if token is not too old (30 days max)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    if (tokenAge > maxAge) {
      throw new Response("Unsubscribe link has expired", { status: 400 });
    }

    const contactService = getContactService(args.context);
    const kvService = getKVService(args.context);
    
    // Get contact information
    const contact = await contactService.getContact(orgId, contactId);
    
    if (!contact) {
      throw new Response("Contact not found", { status: 404 });
    }

    // Get organization settings for display name
    const orgSettings = await kvService.getOrgSettings(orgId);
    const companyName = orgSettings?.companyInfo?.name || "this organization";

    return json({
      contact,
      companyName,
      orgId,
      contactId,
      campaignId,
      token,
      alreadyOptedOut: contact.optedOut
    });

  } catch (error) {
    console.error("Error processing unsubscribe token:", error);
    throw new Response("Invalid unsubscribe link", { status: 400 });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { token } = args.params;
  const formData = await args.request.formData();
  const action = formData.get("action");
  
  if (!token || action !== "unsubscribe") {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Decode the token again
    const decodedData = Buffer.from(token, 'base64url').toString('utf-8');
    const [orgId, contactId, campaignId] = decodedData.split(':');
    
    if (!orgId || !contactId) {
      return json({ error: "Invalid unsubscribe token" }, { status: 400 });
    }

    const contactService = getContactService(args.context);
    const kvService = getKVService(args.context);
    
    // Get contact to verify it exists
    const contact = await contactService.getContact(orgId, contactId);
    
    if (!contact) {
      return json({ error: "Contact not found" }, { status: 404 });
    }

    // Opt out from both SMS and Email (all-or-nothing approach)
    await contactService.updateContactOptOut(orgId, contactId, true);
    
    // Log the opt-out in analytics for both channels
    await kvService.setCache(`optout:email:${contactId}`, {
      contactId,
      orgId,
      channel: 'email',
      timestamp: new Date().toISOString(),
      method: 'email_unsubscribe_link',
      campaignId
    });
    
    await kvService.setCache(`optout:sms:${contactId}`, {
      contactId,
      orgId,
      channel: 'sms', 
      timestamp: new Date().toISOString(),
      method: 'email_unsubscribe_cascade',
      campaignId
    });

    console.log(`Contact ${contactId} unsubscribed from organization ${orgId} via email link`);
    
    return redirect(`/unsubscribe/${token}/success`);

  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    return json({ error: "Failed to process unsubscribe request" }, { status: 500 });
  }
}

export default function UnsubscribePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (data.alreadyOptedOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Already Unsubscribed
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                You are already unsubscribed from communications from <strong>{data.companyName}</strong>.
              </p>
              <p className="mt-4 text-center text-xs text-gray-500">
                Email: {data.contact.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Unsubscribe
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Unsubscribe from communications from <strong>{data.companyName}</strong>
            </p>
          </div>

          <div className="mt-8">
            {actionData?.error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {actionData.error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information:</h3>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {data.contact.firstName} {data.contact.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {data.contact.email}
              </p>
              {data.contact.phone && (
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {data.contact.phone}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Unsubscribing will remove you from <strong>both email and SMS</strong> communications from {data.companyName}.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Form method="post">
              <input type="hidden" name="action" value="unsubscribe" />
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Unsubscribe from All Communications
              </button>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                If you clicked this link by mistake, simply close this page.
                No changes will be made to your subscription status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}