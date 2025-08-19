import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/node";
import { getKVService } from "~/lib/kv.server";
import { formatDate } from "~/lib/utils";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  try {
    const kvService = getKVService(args.context);
    const campaigns = await kvService.listCampaigns(orgId);
    
    // Sort campaigns by creation date (newest first)
    const sortedCampaigns = campaigns.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { orgId, campaigns: sortedCampaigns };
  } catch (error) {
    console.log("Error loading campaigns:", error);
    return { orgId, campaigns: [] };
  }
}

export default function CampaignsIndex() {
  const { campaigns } = useLoaderData<typeof loader>();

  if (campaigns.length === 0) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
        <div className="mt-6">
          <a
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Campaign
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              Created
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {campaigns.map((campaign: any) => (
            <tr key={campaign.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                <a href={`/dashboard/campaigns/${campaign.id}`} className="hover:text-primary-600">
                  {campaign.name}
                </a>
                {campaign.description && (
                  <div className="text-xs text-gray-500 mt-1">{campaign.description}</div>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className="capitalize">{campaign.type.replace('-', ' + ')}</span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatDate(campaign.createdAt)}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <a href={`/dashboard/campaigns/${campaign.id}`} className="text-primary-600 hover:text-primary-900">
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}