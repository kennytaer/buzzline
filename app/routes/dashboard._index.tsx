import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/cloudflare";
import { Icons } from "~/components/Icons";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId) {
    return redirect("/");
  }

  // Don't redirect if no orgId - let the parent dashboard handle it
  
  // TODO: Fetch dashboard stats from KV when available
  // For now, returning mock data for development
  try {
    // In future: const kvService = getKVService(args.context);
    // const campaigns = await kvService.listCampaigns(orgId);
    // const contacts = await kvService.listContacts(orgId);
    
    return {
      orgId,
      stats: {
        totalCampaigns: 0,
        totalContacts: 0,
        campaignsSentThisMonth: 0,
        deliveryRate: 0
      }
    };
  } catch (error) {
    console.log("Dashboard stats error (expected in dev):", error);
    return {
      orgId,
      stats: {
        totalCampaigns: 0,
        totalContacts: 0,
        campaignsSentThisMonth: 0,
        deliveryRate: 0
      }
    };
  }
}

export default function DashboardIndex() {
  const { orgId, stats } = useLoaderData<typeof loader>();
  
  // If no orgId, the parent dashboard component will handle showing org selection
  if (!orgId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-accent-900 mb-4">
          Welcome to BuzzLine Dashboard
        </h1>
        <p className="text-lg text-accent-600 mb-8">
          Manage your marketing campaigns, contacts, and analytics all in one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-accent-900 mb-1">{stats.totalCampaigns}</div>
              <div className="text-sm font-medium text-accent-600">Total Campaigns</div>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Icons.Campaign className="text-primary-600" size="lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-accent-900 mb-1">{stats.totalContacts}</div>
              <div className="text-sm font-medium text-accent-600">Total Contacts</div>
            </div>
            <div className="p-3 bg-secondary-100 rounded-lg">
              <Icons.Contacts className="text-secondary-600" size="lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-accent-900 mb-1">{stats.campaignsSentThisMonth}</div>
              <div className="text-sm font-medium text-accent-600">Sent This Month</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Icons.Send className="text-green-600" size="lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-accent-900 mb-1">{stats.deliveryRate}%</div>
              <div className="text-sm font-medium text-accent-600">Delivery Rate</div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Icons.Analytics className="text-orange-600" size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/campaigns/new"
          className="flex items-center gap-4 bg-primary-500 hover:bg-primary-600 text-white font-medium py-6 px-6 rounded-lg transition-colors group"
        >
          <div className="p-3 bg-primary-400 rounded-lg group-hover:bg-primary-500 transition-colors">
            <Icons.Plus className="text-white" size="lg" />
          </div>
          <div className="text-left">
            <div className="font-semibold">Create Campaign</div>
            <div className="text-primary-100 text-sm">Start a new marketing campaign</div>
          </div>
        </a>

        <a
          href="/dashboard/contacts/upload"
          className="flex items-center gap-4 bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-6 px-6 rounded-lg transition-colors group"
        >
          <div className="p-3 bg-secondary-400 rounded-lg group-hover:bg-secondary-500 transition-colors">
            <Icons.Upload className="text-white" size="lg" />
          </div>
          <div className="text-left">
            <div className="font-semibold">Upload Contacts</div>
            <div className="text-secondary-100 text-sm">Import your contact lists</div>
          </div>
        </a>

        <a
          href="/dashboard/analytics"
          className="flex items-center gap-4 bg-accent-500 hover:bg-accent-600 text-white font-medium py-6 px-6 rounded-lg transition-colors group"
        >
          <div className="p-3 bg-accent-400 rounded-lg group-hover:bg-accent-500 transition-colors">
            <Icons.Analytics className="text-white" size="lg" />
          </div>
          <div className="text-left">
            <div className="font-semibold">View Analytics</div>
            <div className="text-accent-100 text-sm">Track campaign performance</div>
          </div>
        </a>
      </div>

      {/* Additional Quick Action for Sales Team */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-accent-900 mb-2">Sales Team Management</h3>
            <p className="text-accent-600">Manage your sales team for personalized campaign sending</p>
          </div>
          <a
            href="/dashboard/team"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Icons.Team size="sm" />
            Manage Team
          </a>
        </div>
      </div>
    </div>
  );
}