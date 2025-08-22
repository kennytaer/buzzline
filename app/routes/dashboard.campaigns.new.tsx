import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form, useNavigate, useSearchParams } from "@remix-run/react";
// Simple rich text editor using contentEditable
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getCampaignService } from "~/lib/services/campaign.server";
import { getContactListService } from "~/lib/services/contactlist.server";
import { getContactService } from "~/lib/services/contact.server";
import { getSalesTeamService } from "~/lib/sales-team.server";
import { generateId } from "~/lib/utils";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    const contactListService = getContactListService(args.context);
    const salesTeamService = getSalesTeamService(args.context);
    
    // Get contact lists 
    const rawContactLists = await contactListService.listContactLists(orgId);
    
    console.log("DEBUG: Campaign loader - Raw contact lists:", rawContactLists.length, rawContactLists);
    
    // Get contact service to count contacts per list
    const contactService = getContactService(args.context);
    
    // Add contact counts to each list by counting contacts that belong to each list
    const contactLists = await Promise.all(
      rawContactLists.map(async (list: any) => {
        try {
          // Use the same approach as other pages - get contacts from the list's contactIds field
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
      contactLists: contactLists || [],
      defaultSignature: {
        salesPersonName: '',
        salesPersonTitle: '',
        salesPersonPhone: '',
        companyLogoUrl: ''
      },
      salesTeam: activeMembers
    });
  } catch (error) {
    console.log("Error loading contact lists:", error);
    return json({ 
      orgId, 
      contactLists: [],
      defaultSignature: {
        salesPersonName: '',
        salesPersonTitle: '',
        salesPersonPhone: '',
        companyLogoUrl: ''
      },
      salesTeam: []
    });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    const formData = await request.formData();
    const campaignService = getCampaignService(args.context);
    
    const campaignData = {
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
          salesPersonPhone: formData.get("salesPersonPhone") as string,
          companyLogoUrl: formData.get("companyLogoUrl") as string,
        }
      } : undefined,
      
      // SMS template
      smsTemplate: formData.get("type") !== "email" ? {
        message: formData.get("smsMessage") as string,
      } : undefined,

      // Sales settings (for sales campaigns)
      salesSettings: formData.get("campaignMode") === "sales" ? {
        useRoundRobin: formData.get("useRoundRobin") === "on",
        selectedMemberIds: formData.getAll("selectedMembers") as string[],
      } : undefined,
      
      // Settings
      settings: {
        trackOpens: formData.get("trackOpens") === "on",
        trackClicks: formData.get("trackClicks") === "on",
        timezone: "America/Toronto", // Default for now
      },
    };

    // Validate required fields
    if (!campaignData.name || !campaignData.type || campaignData.contactListIds.length === 0) {
      return json({ error: "Campaign name, type, and at least one contact list are required" }, { status: 400 });
    }

    if (campaignData.type !== "sms" && (!campaignData.emailTemplate?.subject || !campaignData.emailTemplate?.htmlBody)) {
      return json({ error: "Email subject and body are required for email campaigns" }, { status: 400 });
    }

    // For company campaigns, validate from email is provided
    if (campaignData.campaignType === "company" && campaignData.type !== "sms" && !campaignData.emailTemplate?.fromEmail) {
      return json({ error: "From email is required for company email campaigns" }, { status: 400 });
    }

    if (campaignData.type !== "email" && !campaignData.smsTemplate?.message) {
      return json({ error: "SMS message is required for SMS campaigns" }, { status: 400 });
    }

    // Check if this is an edit operation
    const editMode = formData.get("editMode") === "true";
    const editCampaignId = formData.get("editCampaignId") as string;

    if (editMode && editCampaignId) {
      // Update existing campaign
      const existingCampaign = await campaignService.getCampaign(orgId, editCampaignId);
      if (!existingCampaign || existingCampaign.status !== 'draft') {
        return json({ error: "Campaign cannot be edited" }, { status: 400 });
      }
      
      await campaignService.updateCampaign(orgId, editCampaignId, {
        ...campaignData,
        updatedAt: new Date().toISOString()
      });
      
      return redirect(`/dashboard/campaigns/${editCampaignId}`);
    } else {
      // Create new campaign
      const campaignId = generateId();
      await campaignService.createCampaign(orgId, campaignId, campaignData);

      return redirect(`/dashboard/campaigns/${campaignId}`);
    }
    
  } catch (error) {
    console.error("Campaign creation error:", error);
    return json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export default function NewCampaign() {
  const { contactLists, defaultSignature, salesTeam } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  // Check if we're in edit mode by reading URL parameters
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('editMode') === 'true';
  const editCampaignId = searchParams.get('campaignId');
  
  const [campaignType, setCampaignType] = useState<"email" | "sms" | "both">(
    (searchParams.get('type') as "email" | "sms" | "both") || "email"
  );
  const [campaignMode, setCampaignMode] = useState<"sales" | "company">(
    (searchParams.get('campaignMode') as "sales" | "company") || "company"
  );
  const [selectedLists, setSelectedLists] = useState<string[]>(
    searchParams.get('contactLists')?.split(',').filter(Boolean) || []
  );
  const [emailContent, setEmailContent] = useState(searchParams.get('emailBody') || "");
  const [emailHtmlCode, setEmailHtmlCode] = useState(searchParams.get('emailBody') || "");
  const [emailEditorMode, setEmailEditorMode] = useState<"visual" | "html">("visual");
  const [smsMessage, setSmsMessage] = useState(searchParams.get('smsMessage') || "");
  const [smsSegments, setSmsSegments] = useState(1);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");

  // Calculate SMS segments based on message length and content (Twilio rules)
  const calculateSmsSegments = (message: string): number => {
    if (!message) return 0;
    
    // Check for Unicode characters (non-GSM 7-bit)
    const gsmChars = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;
    const isUnicode = !gsmChars.test(message);
    
    if (isUnicode) {
      // UCS-2 encoding: 70 chars for single segment, 67 chars per segment for multi-part
      if (message.length <= 70) return 1;
      return Math.ceil(message.length / 67);
    } else {
      // GSM-7 encoding: 160 chars for single segment, 153 chars per segment for multi-part
      if (message.length <= 160) return 1;
      return Math.ceil(message.length / 153);
    }
  };

  // Update SMS segments when message changes
  useEffect(() => {
    setSmsSegments(calculateSmsSegments(smsMessage));
  }, [smsMessage]);

  // Sync between visual and HTML modes
  useEffect(() => {
    if (emailEditorMode === "html" && !emailHtmlCode && emailContent) {
      setEmailHtmlCode(emailContent);
    } else if (emailEditorMode === "visual" && emailHtmlCode && !emailContent) {
      setEmailContent(emailHtmlCode);
    }
  }, [emailEditorMode, emailContent, emailHtmlCode]);

  // Rich text editor functions
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Update content after command execution
    const editorElement = document.querySelector('[contenteditable]') as HTMLElement;
    if (editorElement) {
      setEmailContent(editorElement.innerHTML);
    }
  };

  const toggleEditorMode = () => {
    const editorElement = document.querySelector('[contenteditable]') as HTMLElement;
    if (emailEditorMode === "visual" && editorElement) {
      // Switch to HTML mode - save current visual content
      const currentContent = editorElement.innerHTML;
      setEmailContent(currentContent);
      setEmailHtmlCode(currentContent);
    } else if (emailEditorMode === "html") {
      // Switch to visual mode - apply HTML code to visual editor
      setEmailContent(emailHtmlCode);
    }
    setEmailEditorMode(emailEditorMode === "visual" ? "html" : "visual");
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-accent-900 sm:truncate">
              {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
            </h1>
            <p className="mt-1 text-sm text-accent-600">
              {isEditMode ? 'Update your campaign settings and content' : 'Design and send unified SMS and email marketing campaigns'}
            </p>
          </div>
        </div>

        {actionData?.error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{actionData.error}</div>
          </div>
        )}

        <Form method="post" className="space-y-8">
          {/* Hidden fields for edit mode */}
          {isEditMode && (
            <>
              <input type="hidden" name="editMode" value="true" />
              <input type="hidden" name="editCampaignId" value={editCampaignId || ''} />
            </>
          )}
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-medium mb-6">Campaign Details</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="form-label mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={searchParams.get('name') || ''}
                  className="form-input"
                  placeholder="e.g., Welcome Series, Monthly Newsletter"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={searchParams.get('description') || ''}
                  className="form-textarea"
                  placeholder="Brief description of this campaign"
                />
              </div>

              <div>
                <label className="form-label mb-2">
                  Campaign Type *
                </label>
                <select
                  name="type"
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value as "email" | "sms" | "both")}
                  className="form-select"
                  required
                >
                  <option value="email">Email Only</option>
                  <option value="sms">SMS Only</option>
                  <option value="both">Email + SMS</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="form-label mb-2">
                  Campaign Mode *
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="campaignMode"
                      value="company"
                      checked={campaignMode === "company"}
                      onChange={(e) => setCampaignMode(e.target.value as "sales" | "company")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Company Campaign</div>
                      <div className="text-sm text-gray-500">Static sender info, sent on behalf of the company</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="campaignMode"
                      value="sales"
                      checked={campaignMode === "sales"}
                      onChange={(e) => setCampaignMode(e.target.value as "sales" | "company")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Sales Team Campaign</div>
                      <div className="text-sm text-gray-500">Round-robin through sales team members</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Team Configuration */}
          {campaignMode === "sales" && (
            <div className="card p-6">
              <h2 className="text-lg font-medium mb-6">Sales Team Configuration</h2>
              
              {salesTeam.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-3">No sales team members available.</p>
                  <a
                    href="/dashboard/team"
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Add team members first →
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="useRoundRobin"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Use round-robin rotation through all active team members
                      </span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      Each email will cycle through team members automatically, ensuring equal distribution.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Active Sales Team Members ({salesTeam.length})</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {salesTeam.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                          <input
                            type="checkbox"
                            name="selectedMembers"
                            value={member.id}
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.title && `${member.title} • `}
                              {member.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Lists */}
          <div className="card p-6">
            <h2 className="text-lg font-medium mb-6">Target Audience</h2>
            <label className="form-label mb-4">
              Select Contact Lists *
            </label>
            
            {contactLists.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-3">No contact lists available.</p>
                <a
                  href="/dashboard/contacts/upload"
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  Upload contacts first →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {contactLists.map((list: any) => (
                  <label key={list.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="contactLists"
                      value={list.id}
                      defaultChecked={selectedLists.includes(list.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLists(prev => [...prev, list.id]);
                        } else {
                          setSelectedLists(prev => prev.filter(id => id !== list.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{list.name}</div>
                      <div className="text-sm text-gray-500">
                        {list.contactCount || 0} contacts
                        {list.description && ` • ${list.description}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Email Template */}
          {(campaignType === "email" || campaignType === "both") && (
            <div className="card p-6">
              <h2 className="text-lg font-medium mb-6">Email Template</h2>
              <div className="space-y-6">
                {campaignMode === "company" && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="form-label mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        name="fromName"
                        defaultValue={searchParams.get('fromName') || ''}
                        className="form-input"
                        placeholder="Your Business Name"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label mb-2">
                        From Email *
                      </label>
                      <input
                        type="email"
                        name="fromEmail"
                        required={campaignMode === "company" && (campaignType === "email" || campaignType === "both")}
                        defaultValue={searchParams.get('fromEmail') || ''}
                        className="form-input"
                        placeholder="hello@yourcompany.com"
                      />
                    </div>
                  </div>
                )}

                {/* Hidden fields for sales campaigns - will be populated dynamically */}
                {campaignMode === "sales" && (
                  <>
                    <input type="hidden" name="fromName" value="SALES_DYNAMIC" />
                    <input type="hidden" name="fromEmail" value="SALES_DYNAMIC" />
                  </>
                )}

                <div>
                  <label className="form-label mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    name="emailSubject"
                    required={campaignType === "email" || campaignType === "both"}
                    defaultValue={searchParams.get('emailSubject') || ''}
                    className="form-input"
                    placeholder="Welcome to our newsletter!"
                  />
                </div>

                {campaignMode === "sales" ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>Sales Campaign:</strong> The "From" name, email, and signature will be automatically populated from your selected sales team members during sending. Email signatures are automatically appended to every email. Use variables like {`{salesTeamFirstName}`} in your email content.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-green-800">
                          <strong>Company Campaign:</strong> The "From" name and email will be static for all recipients. Email signatures are automatically appended to every email from your organization settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Member Selector - Only for Company campaigns */}
                {campaignMode === "company" && (
                  <div className="mb-6">
                    <label className="form-label mb-2">
                      Select Team Member for Signature (Optional)
                    </label>
                    <select
                      value={selectedTeamMember}
                      onChange={(e) => {
                        setSelectedTeamMember(e.target.value);
                        const member = salesTeam.find(m => m.id === e.target.value);
                        if (member) {
                          // Auto-populate hidden fields
                          const nameInput = document.getElementById('salesPersonName') as HTMLInputElement;
                          const titleInput = document.getElementById('salesPersonTitle') as HTMLInputElement;
                          const phoneInput = document.getElementById('salesPersonPhone') as HTMLInputElement;
                          
                          if (nameInput) nameInput.value = `${member.firstName} ${member.lastName}`;
                          if (titleInput) titleInput.value = member.title || '';
                          if (phoneInput) phoneInput.value = member.phone || '';
                        }
                      }}
                      className="form-select"
                    >
                      <option value="">Use organization default signature</option>
                      {salesTeam.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} {member.title ? `- ${member.title}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Hidden fields for form submission */}
                <input type="hidden" name="salesPersonName" id="salesPersonName" defaultValue={defaultSignature?.salesPersonName || ''} />
                <input type="hidden" name="salesPersonTitle" id="salesPersonTitle" defaultValue={defaultSignature?.salesPersonTitle || ''} />
                <input type="hidden" name="salesPersonPhone" id="salesPersonPhone" defaultValue={defaultSignature?.salesPersonPhone || ''} />
                <input type="hidden" name="companyLogoUrl" defaultValue={defaultSignature?.companyLogoUrl || ''} />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label">
                      Email Content *
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Editor Mode:</span>
                      <button
                        type="button"
                        onClick={toggleEditorMode}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          emailEditorMode === "visual"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Visual
                      </button>
                      <button
                        type="button"
                        onClick={toggleEditorMode}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          emailEditorMode === "html"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        HTML
                      </button>
                    </div>
                  </div>
                  <div className="mb-2 text-xs text-gray-500 bg-primary-50 p-2 rounded">
                    <div className="mb-1"><strong>Available variables:</strong></div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        • <code>{`{firstName}`}</code> - Contact's first name<br/>
                        • <code>{`{lastName}`}</code> - Contact's last name<br/>
                        • <code>{`{email}`}</code> - Contact's email address<br/>
                        • <code>{`{unsubscribeUrl}`}</code> - Unsubscribe link
                      </div>
                      <div>
                        {campaignMode === "sales" ? (
                          <>
                            • <code>{`{salesTeamFirstName}`}</code> - Sales rep's first name<br/>
                            • <code>{`{salesTeamLastName}`}</code> - Sales rep's last name<br/>
                            • <code>{`{salesTeamEmail}`}</code> - Sales rep's email<br/>
                            • <code>{`{salesTeamPhone}`}</code> - Sales rep's phone<br/>
                            • <code>{`{salesTeamTitle}`}</code> - Sales rep's title<br/>
                          </>
                        ) : (
                          <>
                            • <strong>Custom Fields:</strong> Use field names without spaces<br/>
                            • Example: <code>{`{vehicleYear}`}</code> for "Vehicle Year"<br/>
                            • <strong>Note:</strong> Email signature is automatically added
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {emailEditorMode === "visual" ? (
                    <div className="border border-gray-300 rounded-md">
                      <div className="border-b border-gray-200 bg-gray-50 p-2">
                        <div className="flex flex-wrap gap-2">
                          {/* Text Formatting */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 font-bold text-gray-900"
                              onClick={() => executeCommand('bold')}
                              title="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 italic text-gray-900"
                              onClick={() => executeCommand('italic')}
                              title="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 underline text-gray-900"
                              onClick={() => executeCommand('underline')}
                              title="Underline"
                            >
                              U
                            </button>
                          </div>

                          {/* Font Size */}
                          <div className="flex gap-1">
                            <select
                              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-900"
                              onChange={(e) => {
                                if (e.target.value) {
                                  executeCommand('fontSize', e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">Font Size</option>
                              <option value="1">Small</option>
                              <option value="3">Normal</option>
                              <option value="4">Medium</option>
                              <option value="5">Large</option>
                              <option value="6">X-Large</option>
                              <option value="7">XX-Large</option>
                            </select>
                          </div>

                          {/* Text Alignment */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-900"
                              onClick={() => executeCommand('justifyLeft')}
                              title="Align Left"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-900"
                              onClick={() => executeCommand('justifyCenter')}
                              title="Align Center"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm-1 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm-1 4a1 1 0 011-1h14a1 1 0 110 2H2a1 1 0 01-1-1zm1 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-900"
                              onClick={() => executeCommand('justifyRight')}
                              title="Align Right"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 000 2h12a1 1 0 100-2H3zM9 8a1 1 0 000 2h6a1 1 0 100-2H9zM3 12a1 1 0 000 2h12a1 1 0 100-2H3zm6 4a1 1 0 100 2h6a1 1 0 100-2H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-900"
                              onClick={() => executeCommand('justifyFull')}
                              title="Justify"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h14a1 1 0 100-2H3zM3 12a1 1 0 000 2h14a1 1 0 100-2H3zM3 16a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Lists */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-900"
                              onClick={() => executeCommand('insertUnorderedList')}
                              title="Bullet List"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 100 2h.01a1 1 0 100-2H3zM6 4a1 1 0 000 2h11a1 1 0 100-2H6zM3 9a1 1 0 100 2h.01a1 1 0 100-2H3zM6 9a1 1 0 000 2h11a1 1 0 100-2H6zM3 14a1 1 0 100 2h.01a1 1 0 100-2H3zM6 14a1 1 0 000 2h11a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 text-gray-900"
                              onClick={() => executeCommand('insertOrderedList')}
                              title="Numbered List"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 01.8-.98l2-.4a1 1 0 11.4 1.96l-.4.08V6a1 1 0 11-2 0V4zM3 10a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM4 15a1 1 0 100-2 1 1 0 000 2zM6 4a1 1 0 000 2h11a1 1 0 100-2H6zM6 9a1 1 0 000 2h11a1 1 0 100-2H6zM6 14a1 1 0 000 2h11a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Text Color */}
                          <div className="flex gap-1">
                            <input
                              type="color"
                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                              onChange={(e) => executeCommand('foreColor', e.target.value)}
                              title="Text Color"
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        contentEditable
                        className="p-4 min-h-[400px] outline-none bg-white text-gray-900"
                        style={{ minHeight: '400px' }}
                        suppressContentEditableWarning={true}
                        onInput={(e) => setEmailContent(e.currentTarget.innerHTML)}
                        ref={(el) => {
                          if (el && el.innerHTML !== emailContent) {
                            el.innerHTML = emailContent;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-md">
                      <div className="border-b border-gray-200 bg-gray-50 p-2">
                        <div className="text-sm text-gray-600">
                          HTML Editor - Write your email using HTML code
                        </div>
                      </div>
                      <textarea
                        className="w-full p-4 min-h-[400px] font-mono text-sm bg-gray-50 text-gray-900 border-0 outline-none resize-none"
                        style={{ minHeight: '400px' }}
                        value={emailHtmlCode}
                        onChange={(e) => setEmailHtmlCode(e.target.value)}
                        placeholder="Enter your HTML email template here..."
                      />
                    </div>
                  )}

                  <input
                    type="hidden"
                    name="emailBody"
                    value={emailEditorMode === "visual" ? emailContent : emailHtmlCode}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SMS Template */}
          {(campaignType === "sms" || campaignType === "both") && (
            <div className="card p-6">
              <h2 className="text-lg font-medium mb-6">SMS Template</h2>
              <div>
                <label className="form-label mb-2">
                  Message *
                </label>
                <div className="mb-2 text-xs text-gray-500 bg-primary-50 p-2 rounded">
                  <strong>Available variables:</strong> {`{firstName}`}, {`{lastName}`}
                  {campaignMode === "sales" && (
                    <>, {`{salesTeamFirstName}`}, {`{salesTeamLastName}`}, {`{salesTeamPhone}`}</>
                  )}
                </div>
                <textarea
                  name="smsMessage"
                  rows={4}
                  required={campaignType === "sms" || campaignType === "both"}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="form-textarea resize-none"
                  placeholder="Your SMS message here. Include variables like {{firstName}} for personalization."
                />
                
                {/* SMS Segment Counter */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className={`font-medium ${smsMessage.length > 160 ? 'text-orange-600' : 'text-gray-700'}`}>
                      {smsMessage.length} characters
                    </span>
                    <span className={`font-medium ${smsSegments > 1 ? 'text-orange-600' : 'text-green-600'}`}>
                      {smsSegments} segment{smsSegments !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {smsSegments > 1 && (
                      <span className="text-orange-600">⚠️ Multi-segment SMS costs more</span>
                    )}
                  </div>
                </div>
                
                {/* SMS Guidelines */}
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">SMS Guidelines:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <strong>GSM-7:</strong> 160 chars = 1 segment, 153 chars per segment for multi-part</li>
                    <li>• <strong>UCS-2:</strong> 70 chars = 1 segment, 67 chars per segment for multi-part</li>
                    <li>• <strong>Special characters</strong> (emojis, accents) force UCS-2 encoding</li>
                    <li>• Recipients with STOP requests will be automatically excluded</li>
                  </ul>
                </div>
                
                {/* Character limit warning */}
                {smsMessage.length > 306 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    ⚠️ Very long messages may have delivery issues. Consider shortening your message.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campaign Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-medium mb-6">Campaign Settings</h2>
            <div className="space-y-4">
              {(campaignType === "email" || campaignType === "both") && (
                <>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="trackOpens"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Track email opens</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="trackClicks"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Track link clicks</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={contactLists.length === 0 || selectedLists.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isEditMode ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}