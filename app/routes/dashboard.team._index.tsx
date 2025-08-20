import { useState } from "react";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getSalesTeamService } from "~/lib/sales-team.server";
import { Icons } from "~/components/Icons";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/sign-in");
  }

  // Get URL search params for pagination and search
  const url = new URL(args.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const search = url.searchParams.get("search") || "";

  const salesTeamService = getSalesTeamService();
  
  // Use new paginated method for fast loading
  const membersData = await salesTeamService.getMembersPaginated(orgId, page, limit, search || undefined);
  const stats = await salesTeamService.getMemberStats(orgId);

  return json({ 
    members: membersData.members,
    pagination: {
      currentPage: membersData.currentPage,
      totalPages: membersData.totalPages,
      totalMembers: membersData.totalMembers,
      limit: membersData.limit,
      hasNextPage: membersData.hasNextPage,
      hasPrevPage: membersData.hasPrevPage
    },
    stats,
    search,
    orgId 
  });
}

export default function TeamIndex() {
  const { members, pagination, stats, search } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Search is now handled server-side for better performance
  const handleSearch = (searchValue: string) => {
    const url = new URL(window.location.href);
    if (searchValue) {
      url.searchParams.set('search', searchValue);
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.delete('page'); // Reset to page 1 on new search
    navigate(url.pathname + url.search);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-900">Sales Team</h1>
          <p className="text-accent-600 mt-1">
            Manage your sales team members for personalized campaigns
          </p>
        </div>
        <Link
          to="/dashboard/team/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Icons.Plus size="sm" />
          Add Member
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-600 text-sm font-medium">Total Members</p>
              <p className="text-2xl font-bold text-accent-900 mt-1">{pagination.totalMembers}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Icons.Team className="text-primary-600" size="lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-600 text-sm font-medium">Active Members</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Icons.Check className="text-green-600" size="lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-accent-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-600 text-sm font-medium">Inactive Members</p>
              <p className="text-2xl font-bold text-accent-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="p-3 bg-accent-100 rounded-lg">
              <Icons.X className="text-accent-400" size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSearch(formData.get('search') as string || '');
            }}
            className="relative"
          >
            <input
              type="text"
              name="search"
              placeholder="Search team members..."
              defaultValue={search}
              className="w-full pl-4 pr-4 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button type="submit" className="sr-only">Search</button>
          </form>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/team/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
          >
            <Icons.Upload size="sm" />
            Upload CSV
          </Link>
        </div>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-12">
          <Icons.Team className="mx-auto text-accent-400 mb-4" size="xl" />
          <h3 className="text-lg font-medium text-accent-900 mb-2">
            {search ? "No members found" : "No team members yet"}
          </h3>
          <p className="text-accent-600 mb-6">
            {search 
              ? "Try adjusting your search terms" 
              : "Add your first sales team member to get started with personalized campaigns"
            }
          </p>
          {!search && (
            <Link
              to="/dashboard/team/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Icons.Plus size="sm" />
              Add First Member
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-accent-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-accent-200">
              <thead className="bg-accent-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-accent-200">
                {members.map((member: any) => (
                  <tr key={member.id} className="hover:bg-accent-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center text-white font-medium">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-accent-900">
                            {member.firstName} {member.lastName}
                          </div>
                          {member.department && (
                            <div className="text-sm text-accent-500">
                              {member.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">{member.email}</div>
                      {member.phone && (
                        <div className="text-sm text-accent-500">{member.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-accent-900">
                        {member.title || "Sales Representative"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-accent-100 text-accent-800"
                      }`}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/dashboard/team/${member.id}/edit`}
                          className="text-primary-600 hover:text-primary-900 p-1"
                        >
                          <Icons.Edit size="sm" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this team member?")) {
                              // Handle delete - would need to implement this action
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Icons.Trash size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-accent-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                {pagination.hasPrevPage ? (
                  <Link
                    to={`?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                    className="relative inline-flex items-center px-4 py-2 border border-accent-300 text-sm font-medium rounded-md text-accent-700 bg-white hover:bg-accent-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="relative inline-flex items-center px-4 py-2 border border-accent-300 text-sm font-medium rounded-md text-accent-400 bg-accent-100">
                    Previous
                  </span>
                )}
                {pagination.hasNextPage ? (
                  <Link
                    to={`?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-accent-300 text-sm font-medium rounded-md text-accent-700 bg-white hover:bg-accent-50"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="ml-3 relative inline-flex items-center px-4 py-2 border border-accent-300 text-sm font-medium rounded-md text-accent-400 bg-accent-100">
                    Next
                  </span>
                )}
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-accent-700">
                    Showing{' '}
                    <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalMembers)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.totalMembers}</span>
                    {' '}results
                    {search && <span> for "{search}"</span>}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous page link */}
                    {pagination.hasPrevPage ? (
                      <Link
                        to={`?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-accent-300 bg-white text-sm font-medium text-accent-500 hover:bg-accent-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-accent-300 bg-accent-100 text-sm font-medium text-accent-400">
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      const isCurrentPage = pageNum === pagination.currentPage;
                      
                      return (
                        <Link
                          key={pageNum}
                          to={`?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-accent-300 text-accent-500 hover:bg-accent-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                    
                    {/* Next page link */}
                    {pagination.hasNextPage ? (
                      <Link
                        to={`?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-accent-300 bg-white text-sm font-medium text-accent-500 hover:bg-accent-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-accent-300 bg-accent-100 text-sm font-medium text-accent-400">
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}