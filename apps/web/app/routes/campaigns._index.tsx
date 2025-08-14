import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";

export const meta: MetaFunction = () => {
  return [
    { title: "Campaigns - BuzzLine" },
    { name: "description", content: "Manage your marketing campaigns" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });

  const repositories = createRepositories(context.env, orgId);
  
  // Get all campaigns for the organization
  const campaignsResult = await repositories.campaigns.findAll(50, 0);

  // Get contact lists for enriching campaign data
  const contactLists = await repositories.contactLists.findAll();
  const contactListMap = new Map(contactLists.map(list => [list.id, list]));

  // Enrich campaigns with contact list data
  const campaigns = campaignsResult.items.map(campaign => ({
    ...campaign,
    contactList: contactListMap.get(campaign.contactListId) || {
      name: "Unknown List",
      contactCount: 0,
    },
  }));

  return json({ campaigns });
}

export default function CampaignsIndex() {
  const { campaigns } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#313131]">Campaigns</h1>
              <p className="text-gray-600 mt-1">Create and manage your marketing campaigns</p>
            </div>
            <Link
              to="/campaigns/new"
              className="bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              Create Campaign
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-3xl font-bold text-[#313131] mt-1">{campaigns.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-3xl font-bold text-[#313131] mt-1">
                    {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent Campaigns</p>
                  <p className="text-3xl font-bold text-[#313131] mt-1">
                    {campaigns.filter(c => c.status === 'sent').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#313131] mb-2">No campaigns yet</h3>
              <p className="text-gray-500 text-sm mb-6">Get started by creating your first marketing campaign to reach your contacts</p>
              <Link
                to="/campaigns/new"
                className="bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Create Your First Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#313131]">Recent Campaigns</h2>
              <p className="text-sm text-gray-600 mt-1">Manage and track your marketing campaigns</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Campaign</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Contact List</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Updated</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-[#313131] text-sm">{campaign.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-[#313131]">{campaign.contactList.name}</p>
                            <p className="text-xs text-gray-500">{campaign.contactList.contactCount} contacts</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'sending' ? 'bg-[#5EC0DA]/10 text-[#5EC0DA]' :
                            campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                            campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(campaign.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/campaigns/${campaign.id}`}
                              className="text-[#5EC0DA] hover:text-[#4a9fb5] text-sm font-medium"
                            >
                              View
                            </Link>
                            <span className="text-gray-300">|</span>
                            <button className="text-[#ED58A0] hover:text-[#d948a0] text-sm font-medium">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}