import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";
import type { SalesAgent } from "@buzzline/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Sales Team - BuzzLine" },
    { name: "description", content: "Manage your sales team for campaign personalization" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });

  const repositories = createRepositories(context.env, orgId);
  const salesTeam = await repositories.salesAgents.findAll();

  return json({ 
    salesTeam
  });
}

export default function SalesIndex() {
  const { salesTeam } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  
  const uploaded = searchParams.get('uploaded');
  const teamName = searchParams.get('team');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          {uploaded && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-8">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    Successfully uploaded {uploaded} sales team members{teamName && ` for "${teamName}"`}!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#313131]">Sales Team</h1>
              <p className="text-gray-600 mt-1">Manage your sales team for campaign personalization and round-robin features</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/sales/upload"
                className="bg-[#5EC0DA] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4a9fb5] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Upload Sales Team
              </Link>
              <Link
                to="/sales/new"
                className="bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Add Sales Member
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">{salesTeam.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">
                    {salesTeam.filter(member => member.isActive).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Variables</p>
                  <p className="text-2xl font-bold text-[#313131] mt-1">
                    {salesTeam.length > 0 ? Object.keys(salesTeam[0].metadata).length + 6 : 6}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {salesTeam.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[#313131] mb-2">No Sales Team Members</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Upload your sales team data to enable personalized campaigns with sales rep information.
                </p>
                <Link
                  to="/sales/upload"
                  className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload Sales Team</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Sales Team Table */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#313131]">Team Members</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your sales team members and their campaign variables</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Sales Rep</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Title</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Variables</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesTeam.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-[#ED58A0]">
                                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-[#313131] text-sm">
                                  {member.firstName} {member.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <p className="text-gray-900">{member.email}</p>
                              {member.phone && (
                                <p className="text-gray-500">{member.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {member.title || '-'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(member.metadata).slice(0, 3).map((key) => (
                                <span key={key} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#5EC0DA]/10 text-[#5EC0DA]">
                                  {key}
                                </span>
                              ))}
                              {Object.keys(member.metadata).length > 3 && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                  +{Object.keys(member.metadata).length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              member.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Available Variables Info */}
          {salesTeam.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#313131]">Available Campaign Variables</h2>
                <p className="text-sm text-gray-600 mt-1">Use these variables in your campaign templates</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">Standard Fields</p>
                    <div className="space-y-1">
                      <code className="block text-xs bg-white px-2 py-1 rounded border">{"{salespersonFirstName}"}</code>
                      <code className="block text-xs bg-white px-2 py-1 rounded border">{"{salespersonLastName}"}</code>
                      <code className="block text-xs bg-white px-2 py-1 rounded border">{"{salespersonEmail}"}</code>
                      <code className="block text-xs bg-white px-2 py-1 rounded border">{"{salespersonPhone}"}</code>
                      <code className="block text-xs bg-white px-2 py-1 rounded border">{"{salespersonTitle}"}</code>
                    </div>
                  </div>
                  {Object.keys(salesTeam[0].metadata).length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg md:col-span-3 lg:col-span-5">
                      <p className="text-xs font-medium text-gray-600 mb-1">Custom Variables</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                        {Object.keys(salesTeam[0].metadata).map((key) => (
                          <code key={key} className="text-xs bg-white px-2 py-1 rounded border">
                            {"{"}{key}{"}"}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}