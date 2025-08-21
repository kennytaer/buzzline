import { useLoaderData, useActionData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getCampaignService } from "~/lib/services/campaign.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { formatDate } from "~/lib/utils";
import { CampaignSender } from "~/lib/campaign-sender.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  const { campaignId } = args.params;
  
  if (!userId || !orgId || !campaignId) {
    return redirect("/dashboard/campaigns");
  }

  try {
    const campaignService = getCampaignService(args.context);
    const contactListService = getContactListService(args.context);
    
    const campaign = await campaignService.getCampaign(orgId, campaignId);
    
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const [contactLists, analytics] = await Promise.all([
      contactListService.listContactLists(orgId),
      campaignService.getCampaignAnalytics(orgId, campaignId)
    ]);
    
    return json({ 
      campaign, 
      contactLists: contactLists || [],
      analytics: analytics || {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        emailStats: { sent: 0, delivered: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 },
        smsStats: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 }
      }
    });
  } catch (error) {
    console.log("Error loading campaign:", error);
    return redirect("/dashboard/campaigns");
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  const { campaignId } = args.params;
  
  if (!userId || !orgId || !campaignId) {
    return redirect("/dashboard/campaigns");
  }

  try {
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    if (action === "send") {
      try {
        const campaignSender = new CampaignSender(args.context);
        const result = await campaignSender.sendCampaign(orgId, campaignId);
        
        if (result.success) {
          return json({ 
            success: `Campaign sent successfully! ${result.emailsSent} emails and ${result.smsSent} SMS messages sent to ${result.totalContacts} contacts.`,
            details: result
          });
        } else {
          return json({ 
            error: `Campaign sending failed. ${result.failures} failures out of ${result.totalContacts} contacts.`,
            details: result
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Campaign sending error:', error);
        return json({ 
          error: `Failed to send campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    if (action === "delete") {
      // TODO: Implement campaign deletion
      return redirect("/dashboard/campaigns");
    }

    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Campaign action error:", error);
    return json({ error: "Failed to perform action" }, { status: 500 });
  }
}

export default function CampaignDetail() {
  const { campaign, contactLists, analytics } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getContactListNames = () => {
    return campaign.contactListIds
      .map((id: string) => {
        const list = contactLists.find((l: any) => l.id === id);
        return list ? list.name : `Unknown List (${id})`;
      })
      .join(", ");
  };

  const getTotalContacts = () => {
    return campaign.contactListIds
      .reduce((total: number, id: string) => {
        const list = contactLists.find((l: any) => l.id === id);
        return total + (list?.contactIds?.length || 0);
      }, 0);
  };

  const getEditUrl = () => {
    const searchParams = new URLSearchParams({
      editMode: 'true',
      campaignId: campaign.id,
      name: campaign.name || '',
      description: campaign.description || '',
      type: campaign.type || 'email',
      campaignMode: campaign.campaignType || 'standard',
      contactLists: (campaign.contactListIds || []).join(','),
      
      // Email template data
      ...(campaign.emailTemplate && {
        emailSubject: campaign.emailTemplate.subject || '',
        emailBody: campaign.emailTemplate.htmlBody || '',
        fromName: campaign.emailTemplate.fromName || '',
        fromEmail: campaign.emailTemplate.fromEmail || '',
        salesPersonName: campaign.emailTemplate.signature?.salesPersonName || '',
        salesPersonTitle: campaign.emailTemplate.signature?.salesPersonTitle || '',
        companyLogoUrl: campaign.emailTemplate.signature?.companyLogoUrl || '',
      }),
      
      // SMS template data
      ...(campaign.smsTemplate && {
        smsMessage: campaign.smsTemplate.message || '',
        fromNumber: campaign.smsTemplate.fromNumber || '',
      }),
      
      // Sales settings
      ...(campaign.salesSettings && {
        salesMode: campaign.salesSettings.useRoundRobin ? 'round-robin' : 'specific',
        selectedSalesMembers: (campaign.salesSettings.selectedMemberIds || []).join(','),
      }),
      
      // Settings
      trackOpens: campaign.settings?.trackOpens ? 'true' : 'false',
      trackClicks: campaign.settings?.trackClicks ? 'true' : 'false',
      unsubscribeLink: campaign.settings?.unsubscribeLink ? 'true' : 'false',
    });
    
    return `/dashboard/campaigns/new?${searchParams.toString()}`;
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900">
              {campaign.name}
            </h1>
            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                Type: <span className="ml-1 font-medium">{campaign.type}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                Created: {formatDate(campaign.createdAt)}
              </div>
              {campaign.sentAt && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  Sent: {formatDate(campaign.sentAt)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            {campaign.status === 'draft' && (
              <Form method="post" className="inline">
                <input type="hidden" name="_action" value="send" />
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Send Campaign
                </button>
              </Form>
            )}
          </div>
        </div>

        {actionData && 'success' in actionData && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">{actionData.success}</div>
          </div>
        )}

        {actionData && 'error' in actionData && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{actionData.error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Overview */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Campaign Overview</h2>
              <div className="space-y-4">
                {campaign.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{campaign.description}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getContactListNames()} ({getTotalContacts()} contacts)
                  </dd>
                </div>
              </div>
            </div>

            {/* Email Template */}
            {campaign.emailTemplate && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Email Template</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">From</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {campaign.emailTemplate.fromName} &lt;{campaign.emailTemplate.fromEmail}&gt;
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subject</dt>
                      <dd className="mt-1 text-sm text-gray-900">{campaign.emailTemplate.subject}</dd>
                    </div>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Content</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{campaign.emailTemplate.htmlBody}</pre>
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Template */}
            {campaign.smsTemplate && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">SMS Template</h2>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Message</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="bg-gray-50 rounded-md p-4">
                      <pre className="whitespace-pre-wrap text-sm">{campaign.smsTemplate.message}</pre>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {campaign.smsTemplate.message.length} characters
                    </div>
                  </dd>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Performance</h3>
              
              {campaign.status === 'draft' ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Campaign hasn't been sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overall Stats */}
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Sent</span>
                      <span className="font-medium">{analytics.totalSent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivered</span>
                      <span className="font-medium">{analytics.totalDelivered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Failed</span>
                      <span className="font-medium">{analytics.totalFailed}</span>
                    </div>
                  </div>

                  {/* Email Stats */}
                  {campaign.emailTemplate && analytics.emailStats && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Email</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Opened</span>
                          <span className="font-medium">{analytics.emailStats.opened} ({analytics.emailStats.openRate}%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Clicked</span>
                          <span className="font-medium">{analytics.emailStats.clicked} ({analytics.emailStats.clickRate}%)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMS Stats */}
                  {campaign.smsTemplate && analytics.smsStats && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">SMS</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Delivery Rate</span>
                          <span className="font-medium">{analytics.smsStats.deliveryRate}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <div className="space-y-2 text-sm">
                {campaign.settings.trackOpens && (
                  <div className="flex items-center text-green-600">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email opens tracked
                  </div>
                )}
                {campaign.settings.trackClicks && (
                  <div className="flex items-center text-green-600">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Link clicks tracked
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {campaign.status === 'draft' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Actions</h3>
                <div className="space-y-2">
                  <a
                    href={getEditUrl()}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit Campaign
                  </a>
                  <Form method="post" className="w-full">
                    <input type="hidden" name="_action" value="delete" />
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      onClick={(e) => {
                        if (!confirm("Are you sure you want to delete this campaign?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete Campaign
                    </button>
                  </Form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}