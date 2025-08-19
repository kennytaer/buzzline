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

export default function Contacts() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your contact lists and individual contacts
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-3">
          <a
            href="/dashboard/contacts/upload"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-secondary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 sm:w-auto"
          >
            Upload CSV
          </a>
          <a
            href="/dashboard/contacts/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Contact
          </a>
        </div>
      </div>
      
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}