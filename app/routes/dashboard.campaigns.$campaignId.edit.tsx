import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getCampaignService } from "~/lib/services/campaign.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { getContactService } from "~/lib/services/contact.server";
import { getSalesTeamService } from "~/lib/sales-team.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  const { campaignId } = args.params;
  
  if (!userId || !orgId || !campaignId) {
    return redirect("/dashboard/campaigns");
  }

  try {
    const campaignService = getCampaignService(args.context);
    const contactListService = getContactListService(args.context);
    const salesTeamService = getSalesTeamService(args.context);
    
    // Get the existing campaign
    const campaign = await campaignService.getCampaign(orgId, campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Only allow editing of draft campaigns
    if (campaign.status !== 'draft') {
      return redirect(`/dashboard/campaigns/${campaignId}`);
    }
    
    // Get contact lists 
    const rawContactLists = await contactListService.listContactLists(orgId);
    
    // Get contact service to count contacts per list
    const contactService = getContactService(args.context);
    
    // Add contact counts to each list
    const contactLists = await Promise.all(
      rawContactLists.map(async (list: any) => {
        try {
          const contactIds = list.contactIds || [];
          const contactCount = contactIds.length;
          
          return {
            ...list,
            contactCount
          };
        } catch (error) {
          console.log("Error getting contact count for list", list.id, error);
          return {
            ...list,
            contactCount: 0
          };
        }
      })
    );
    
    // Get active sales team members for signature selection
    const activeMembers = await salesTeamService.getActiveMembers(orgId);
    
    return json({ 
      orgId, 
      campaign,
      contactLists: contactLists || [],
      defaultSignature: {},
      salesTeam: activeMembers
    });
  } catch (error) {
    console.log("Error loading campaign edit data:", error);
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
    const campaignService = getCampaignService(args.context);
    
    // Get the existing campaign to verify it can be edited
    const existingCampaign = await campaignService.getCampaign(orgId, campaignId);
    if (!existingCampaign || existingCampaign.status !== 'draft') {
      return json({ error: "Campaign cannot be edited" }, { status: 400 });
    }
    
    const updatedCampaignData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      campaignType: formData.get("campaignMode") as string,
      contactListIds: formData.getAll("contactLists") as string[],
      
      // Email template
      emailTemplate: formData.get("type") !== "sms" ? {
        subject: formData.get("emailSubject") as string,
        htmlBody: formData.get("emailBody") as string,
        fromEmail: formData.get("fromEmail") as string,
        fromName: formData.get("fromName") as string,
        signature: {
          salesPersonName: formData.get("salesPersonName") as string,
          salesPersonTitle: formData.get("salesPersonTitle") as string,
          companyLogoUrl: formData.get("companyLogoUrl") as string,
        }
      } : undefined,
      
      // SMS template
      smsTemplate: formData.get("type") !== "email" ? {
        message: formData.get("smsMessage") as string,
        fromNumber: formData.get("fromNumber") as string,
      } : undefined,
      
      // Sales settings
      salesSettings: formData.get("campaignMode") === "sales" ? {
        useRoundRobin: formData.get("salesMode") === "round-robin",
        selectedMemberIds: formData.get("salesMode") === "specific" 
          ? formData.getAll("selectedSalesMembers") as string[]
          : undefined
      } : undefined,
      
      // Settings
      settings: {
        trackOpens: formData.get("trackOpens") === "on",
        trackClicks: formData.get("trackClicks") === "on",
        unsubscribeLink: formData.get("unsubscribeLink") === "on",
      },
      
      // Keep original metadata
      updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!updatedCampaignData.name || !updatedCampaignData.type) {
      return json({ error: "Campaign name and type are required" }, { status: 400 });
    }

    if (!updatedCampaignData.contactListIds || updatedCampaignData.contactListIds.length === 0) {
      return json({ error: "At least one contact list must be selected" }, { status: 400 });
    }

    // Update the campaign (preserve original ID and metadata)
    await campaignService.updateCampaign(orgId, campaignId, updatedCampaignData);
    
    return redirect(`/dashboard/campaigns/${campaignId}`);
    
  } catch (error) {
    console.error("Error updating campaign:", error);
    return json({ 
      error: error instanceof Error ? error.message : "Failed to update campaign" 
    }, { status: 500 });
  }
}

export default function EditCampaign() {
  const { orgId, campaign, contactLists, salesTeam } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  // Form state
  const [campaignType, setCampaignType] = useState(campaign.type || "both");
  const [campaignMode, setCampaignMode] = useState(campaign.campaignType || "standard");
  const [salesMode, setSalesMode] = useState("round-robin");
  const [emailContent, setEmailContent] = useState(campaign.emailTemplate?.htmlBody || "");
  const [smsMessage, setSmsMessage] = useState(campaign.smsTemplate?.message || "");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Initialize sales mode based on existing campaign
  useEffect(() => {
    if (campaign.salesSettings?.useRoundRobin) {
      setSalesMode("round-robin");
    } else if (campaign.salesSettings?.selectedMemberIds?.length) {
      setSalesMode("specific");
    }
  }, [campaign]);

  const handleEmailContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEmailContent(e.currentTarget.innerHTML);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-7 text-gray-900">
                Edit Campaign: {campaign.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Update your campaign settings and content.
              </p>
            </div>
            <button
              onClick={() => navigate(`/dashboard/campaigns/${campaign.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {actionData && 'error' in actionData && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{actionData.error}</div>
          </div>
        )}

        <Form method="post" className="space-y-8">
          {/* Campaign Basics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Campaign Details</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  defaultValue={campaign.name}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  defaultValue={campaign.description}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Campaign Type */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Campaign Type</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Message Type
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "email", label: "Email Only", icon: "📧" },
                    { value: "sms", label: "SMS Only", icon: "📱" },
                    { value: "both", label: "Email + SMS", icon: "🚀" }
                  ].map((type) => (
                    <label key={type.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={campaignType === type.value}
                        onChange={(e) => setCampaignType(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        campaignType === type.value
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-medium">{type.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Lists */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Target Audience</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Contact Lists
              </label>
              
              {contactLists.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No contact lists available.</p>
                  <a
                    href="/dashboard/contacts"
                    className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                  >
                    Create a contact list →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {contactLists.map((list: any) => (
                    <label key={list.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="contactLists"
                        value={list.id}
                        defaultChecked={campaign.contactListIds?.includes(list.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{list.name}</span>
                          <span className="text-sm text-gray-500">{list.contactCount} contacts</span>
                        </div>
                        {list.description && (
                          <p className="text-xs text-gray-500">{list.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Mode */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Campaign Mode</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    value: "standard", 
                    label: "Standard Campaign", 
                    description: "Send from organization defaults",
                    icon: "📢"
                  },
                  { 
                    value: "sales", 
                    label: "Sales Team Campaign", 
                    description: "Send from individual sales team members",
                    icon: "👥"
                  }
                ].map((mode) => (
                  <label key={mode.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="campaignMode"
                      value={mode.value}
                      checked={campaignMode === mode.value}
                      onChange={(e) => setCampaignMode(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg transition-colors ${
                      campaignMode === mode.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{mode.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{mode.label}</div>
                          <div className="text-sm text-gray-500">{mode.description}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Sales Team Options */}
              {campaignMode === "sales" && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Sales Team Distribution</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="salesMode"
                        value="round-robin"
                        checked={salesMode === "round-robin"}
                        onChange={(e) => setSalesMode(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Round Robin</div>
                        <div className="text-xs text-gray-500">Distribute contacts evenly among all active sales team members</div>
                      </div>
                    </label>
                    
                    <label className="flex items-start">
                      <input
                        type="radio"
                        name="salesMode"
                        value="specific"
                        checked={salesMode === "specific"}
                        onChange={(e) => setSalesMode(e.target.value)}
                        className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">Specific Members</div>
                        <div className="text-xs text-gray-500 mb-2">Choose specific sales team members</div>
                        
                        {salesMode === "specific" && (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {salesTeam.map((member: any) => (
                              <label key={member.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  name="selectedSalesMembers"
                                  value={member.id}
                                  defaultChecked={campaign.salesSettings?.selectedMemberIds?.includes(member.id)}
                                  className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-xs text-gray-700">
                                  {member.firstName} {member.lastName} ({member.email})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Template */}
          {(campaignType === "email" || campaignType === "both") && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Email Template</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
                      From Name
                    </label>
                    <input
                      type="text"
                      name="fromName"
                      id="fromName"
                      defaultValue={campaign.emailTemplate?.fromName}
                      placeholder="Your Organization"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700">
                      From Email
                    </label>
                    <input
                      type="email"
                      name="fromEmail"
                      id="fromEmail"
                      defaultValue={campaign.emailTemplate?.fromEmail}
                      placeholder="noreply@yourcompany.com"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    name="emailSubject"
                    id="emailSubject"
                    required={campaignType !== "sms"}
                    defaultValue={campaign.emailTemplate?.subject}
                    placeholder="Welcome to our community!"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700">
                      Email Content
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="text-xs text-primary-600 hover:text-primary-500"
                      >
                        {isPreviewMode ? "Edit" : "Preview"}
                      </button>
                    </div>
                  </div>
                  
                  <input type="hidden" name="emailBody" value={emailContent} />
                  
                  {isPreviewMode ? (
                    <div className="border border-gray-300 rounded-md p-4 min-h-[200px] bg-gray-50">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: emailContent }}
                      />
                    </div>
                  ) : (
                    <div
                      contentEditable
                      onInput={handleEmailContentChange}
                      suppressContentEditableWarning={true}
                      className="border border-gray-300 rounded-md p-4 min-h-[200px] focus:ring-primary-500 focus:border-primary-500"
                      style={{ outline: 'none' }}
                      dangerouslySetInnerHTML={{ __html: emailContent }}
                    />
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Available variables: {"{firstName}"}, {"{lastName}"}, {"{email}"}, {"{phone}"}
                    {campaignMode === "sales" && (
                      <span>, {"{salesTeamFirstName}"}, {"{salesTeamLastName}"}, {"{salesTeamEmail}"}, {"{salesTeamTitle}"}</span>
                    )}
                  </div>
                </div>

                {/* Signature Settings */}
                {campaignMode === "sales" && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Email Signature (Sales Campaigns)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="salesPersonName" className="block text-sm font-medium text-gray-700">
                          Sales Person Name Template
                        </label>
                        <input
                          type="text"
                          name="salesPersonName"
                          id="salesPersonName"
                          defaultValue={campaign.emailTemplate?.signature?.salesPersonName}
                          placeholder="{salesTeamFirstName} {salesTeamLastName}"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="salesPersonTitle" className="block text-sm font-medium text-gray-700">
                          Title Template
                        </label>
                        <input
                          type="text"
                          name="salesPersonTitle"
                          id="salesPersonTitle"
                          defaultValue={campaign.emailTemplate?.signature?.salesPersonTitle}
                          placeholder="{salesTeamTitle}"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="companyLogoUrl" className="block text-sm font-medium text-gray-700">
                        Company Logo URL
                      </label>
                      <input
                        type="url"
                        name="companyLogoUrl"
                        id="companyLogoUrl"
                        defaultValue={campaign.emailTemplate?.signature?.companyLogoUrl}
                        placeholder="https://example.com/logo.png"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SMS Template */}
          {(campaignType === "sms" || campaignType === "both") && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">SMS Template</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="fromNumber" className="block text-sm font-medium text-gray-700">
                    From Phone Number
                  </label>
                  <input
                    type="tel"
                    name="fromNumber"
                    id="fromNumber"
                    defaultValue={campaign.smsTemplate?.fromNumber}
                    placeholder="+1234567890"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to use organization default
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="smsMessage" className="block text-sm font-medium text-gray-700">
                      SMS Message
                    </label>
                    <span className="text-xs text-gray-500">
                      {smsMessage.length}/160 characters
                    </span>
                  </div>
                  <textarea
                    name="smsMessage"
                    id="smsMessage"
                    rows={4}
                    required={campaignType !== "email"}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Hi {firstName}, welcome to our community!"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Available variables: {"{firstName}"}, {"{lastName}"}, {"{email}"}, {"{phone}"}
                    {campaignMode === "sales" && (
                      <span>, {"{salesTeamFirstName}"}, {"{salesTeamLastName}"}, {"{salesTeamPhone}"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Campaign Settings</h2>
            
            <div className="space-y-4">
              {(campaignType === "email" || campaignType === "both") && (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="trackOpens"
                      defaultChecked={campaign.settings?.trackOpens}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Track Email Opens</div>
                      <div className="text-xs text-gray-500">Monitor when recipients open your emails</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="trackClicks"
                      defaultChecked={campaign.settings?.trackClicks}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Track Link Clicks</div>
                      <div className="text-xs text-gray-500">Monitor when recipients click links in your emails</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="unsubscribeLink"
                      defaultChecked={campaign.settings?.unsubscribeLink}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Include Unsubscribe Link</div>
                      <div className="text-xs text-gray-500">Automatically add unsubscribe links to emails</div>
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/campaigns/${campaign.id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Update Campaign
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}