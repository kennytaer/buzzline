import { useLoaderData, useFetcher, useRevalidator } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { useState, useEffect } from "react";
import { getContactService } from "~/lib/services/contact.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { getCampaignService } from "~/lib/services/campaign.server";
import { CampaignSender } from "~/lib/campaign-sender.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    // Get URL search params
    const url = new URL(args.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    
    // Use new service architecture with parallel calls
    const contactService = getContactService(args.context);
    const contactListService = getContactListService(args.context);
    const campaignService = getCampaignService(args.context);
    
    const [contactsData, segments, campaigns] = await Promise.all([
      contactService.getContactsPaginated(orgId, page, limit, search),
      contactListService.listContactLists(orgId),
      campaignService.listCampaigns(orgId)
    ]);

    return json({ 
      orgId, 
      contacts: contactsData.contacts, 
      segments,
      campaigns: campaigns || [],
      pagination: {
        currentPage: contactsData.currentPage,
        totalPages: contactsData.totalPages,
        totalContacts: contactsData.totalContacts,
        limit: contactsData.limit,
        hasNextPage: contactsData.hasNextPage,
        hasPrevPage: contactsData.hasPrevPage
      },
      search
    });
  } catch (error) {
    console.error("Error loading contacts:", error);
    // Return empty arrays if there's an error
    return json({ 
      orgId, 
      contacts: [], 
      segments: [],
      campaigns: [],
      pagination: { currentPage: 1, totalPages: 0, totalContacts: 0, limit: 50, hasNextPage: false, hasPrevPage: false },
      search: ""
    });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const formData = await args.request.formData();
  const intent = formData.get("intent");
  
  if (intent === "sendCampaign") {
    const contactId = formData.get("contactId");
    const campaignId = formData.get("campaignId");
    
    if (!campaignId || !contactId) {
      return json({ success: false, message: "Campaign ID and Contact ID are required" }, { status: 400 });
    }

    try {
      const contactService = getContactService(args.context);
      const campaignService = getCampaignService(args.context);
      const campaignSender = new CampaignSender(args.context);
      
      // Verify campaign and contact exist
      const [campaign, contact] = await Promise.all([
        campaignService.getCampaign(orgId, campaignId.toString()),
        contactService.getContact(orgId, contactId.toString())
      ]);
      
      if (!campaign) {
        return json({ success: false, message: "Campaign not found" }, { status: 404 });
      }
      
      if (!contact) {
        return json({ success: false, message: "Contact not found" }, { status: 404 });
      }

      // Store original campaign data
      const originalData = {
        targetingMode: campaign.targetingMode,
        specificContactIds: campaign.specificContactIds,
        contactListIds: campaign.contactListIds
      };

      // Create temporary modified campaign for individual sending
      const individualCampaign = {
        ...campaign,
        targetingMode: "specific",
        specificContactIds: [contactId.toString()],
        contactListIds: []
      };

      // Update campaign temporarily
      await campaignService.updateCampaign(orgId, campaignId.toString(), individualCampaign);
      
      try {
        // Send the campaign with individual send flag
        const result = await campaignSender.sendCampaign(orgId, campaignId.toString(), true);
        
        // Restore original campaign
        await campaignService.updateCampaign(orgId, campaignId.toString(), originalData);

        if (result.success) {
          return json({ 
            success: true, 
            message: `Campaign sent successfully to ${contact.firstName || contact.email}`,
            result 
          });
        } else {
          return json({ 
            success: false, 
            message: "Failed to send campaign", 
            errors: result.errors 
          }, { status: 500 });
        }
      } catch (error) {
        // Restore original campaign on error
        await campaignService.updateCampaign(orgId, campaignId.toString(), originalData);
        throw error;
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      return json({ success: false, message: "Failed to send campaign" }, { status: 500 });
    }
  }

  return json({ success: false, message: "Invalid request" }, { status: 400 });
}

export default function ContactsIndex() {
  const { contacts, segments, campaigns, pagination, search } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);

  const handleSendCampaign = (contact: any) => {
    setSelectedContact(contact);
    setShowCampaignModal(true);
  };

  const handleSendSelectedCampaign = (campaignId: string) => {
    if (!selectedContact) return;
    
    setSendingCampaignId(campaignId);
    setShowCampaignModal(false);
    
    fetcher.submit(
      {
        intent: "sendCampaign",
        contactId: selectedContact.id,
        campaignId: campaignId,
      },
      { method: "POST" }
    );
  };

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      setSendingCampaignId(null);
      if ((fetcher.data as any).success) {
        revalidator.revalidate();
      }
    }
  }, [fetcher.state, fetcher.data]);

  const isLoading = fetcher.state === 'submitting';

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="max-w-lg">
        <form method="GET" className="flex gap-x-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search contacts..."
            className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
          />
          <button
            type="submit"
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Search
          </button>
          {search && (
            <a
              href="/dashboard/contacts"
              className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
            >
              Clear
            </a>
          )}
        </form>
      </div>

      {/* Success/Error Messages */}
      {fetcher.data && (fetcher.data as any).message && (
        <div className={`rounded-md p-4 ${(fetcher.data as any).success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="ml-3">
              <p className={`text-sm font-medium ${(fetcher.data as any).success ? 'text-green-800' : 'text-red-800'}`}>
                {(fetcher.data as any).message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {contacts.length === 0 ? (
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No contacts</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading a CSV file or adding a contact.</p>
                <div className="mt-6 space-x-3">
                  <a
                    href="/dashboard/contacts/upload"
                    className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    Upload CSV
                  </a>
                  <a
                    href="/dashboard/contacts/new"
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Add Contact
                  </a>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {contacts.map((contact: any) => (
                      <tr key={contact.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {contact.firstName?.[0] || contact.email?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </div>
                              {contact.hasMetadata && (
                                <div className="text-xs text-gray-500">
                                  Has custom data
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {contact.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {contact.phone}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            contact.optedOut 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {contact.optedOut ? 'Opted Out' : 'Active'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center space-x-6">
                            <button
                              onClick={() => handleSendCampaign(contact)}
                              disabled={isLoading}
                              className="text-primary-600 hover:text-primary-900 disabled:opacity-50"
                            >
                              Send Campaign
                            </button>
                            <a
                              href={`/dashboard/contacts/${contact.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Edit
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      {pagination.hasPrevPage && (
                        <a
                          href={`?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Previous
                        </a>
                      )}
                      {pagination.hasNextPage && (
                        <a
                          href={`?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Next
                        </a>
                      )}
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                          <span className="font-medium">{pagination.totalPages}</span>
                          {' '}({pagination.totalContacts} total contacts)
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          {pagination.hasPrevPage && (
                            <a
                              href={`?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                              Previous
                            </a>
                          )}
                          {pagination.hasNextPage && (
                            <a
                              href={`?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                              Next
                            </a>
                          )}
                        </nav>
                      </div>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Selection Modal */}
      {showCampaignModal && selectedContact && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowCampaignModal(false)}>
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Send Campaign to {selectedContact.firstName || selectedContact.email}
              </h3>
              
              {campaigns.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No campaigns available</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign: any) => (
                    <button
                      key={campaign.id}
                      onClick={() => handleSendSelectedCampaign(campaign.id)}
                      disabled={sendingCampaignId === campaign.id || isLoading}
                      className="w-full text-left p-3 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{campaign.type} campaign</div>
                      <div className="text-xs text-gray-400 mt-1">{campaign.status}</div>
                      {sendingCampaignId === campaign.id && (
                        <div className="text-sm text-blue-600 mt-2 flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                          Sending...
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}