import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
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
    const [orgId, contactId] = decodedData.split(':');
    
    if (!orgId || !contactId) {
      throw new Response("Invalid unsubscribe token", { status: 400 });
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
      unsubscribedAt: contact.optOutDate || new Date().toISOString()
    });

  } catch (error) {
    console.error("Error processing unsubscribe token:", error);
    throw new Response("Invalid unsubscribe link", { status: 400 });
  }
}

export default function UnsubscribeSuccessPage() {
  const data = useLoaderData<typeof loader>();

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
              Successfully Unsubscribed
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              You have been unsubscribed from all communications from <strong>{data.companyName}</strong>.
            </p>
          </div>

          <div className="mt-8">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Unsubscribe Confirmed
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      <strong>{data.contact.email}</strong> has been removed from both email and SMS communications from {data.companyName}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You will no longer receive marketing emails from {data.companyName}</li>
                <li>• You will no longer receive marketing SMS messages from {data.companyName}</li>
                <li>• You may still receive transactional messages if you have an active account</li>
                <li>• This unsubscribe only applies to {data.companyName}</li>
              </ul>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Need to resubscribe?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      If you change your mind, please contact {data.companyName} directly to resubscribe to their communications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Unsubscribed on {new Date(data.unsubscribedAt).toLocaleDateString()} at {new Date(data.unsubscribedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}