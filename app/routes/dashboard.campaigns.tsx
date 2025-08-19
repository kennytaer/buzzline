import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/node";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  return { orgId };
}

export default function Campaigns() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your SMS and email marketing campaigns
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a
            href="/dashboard/campaigns/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Create Campaign
          </a>
        </div>
      </div>
      
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}