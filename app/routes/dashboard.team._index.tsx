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

  const salesTeamService = getSalesTeamService();
  const members = await salesTeamService.getAllMembers(orgId);
  const stats = await salesTeamService.getMemberStats(orgId);

  return json({ 
    members,
    stats,
    orgId 
  });
}

export default function TeamIndex() {
  const { members, stats } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(member =>
    member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.title && member.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <p className="text-2xl font-bold text-accent-900 mt-1">{stats.total}</p>
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
          <div className="relative">
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
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
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Icons.Team className="mx-auto text-accent-400 mb-4" size="xl" />
          <h3 className="text-lg font-medium text-accent-900 mb-2">
            {searchTerm ? "No members found" : "No team members yet"}
          </h3>
          <p className="text-accent-600 mb-6">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Add your first sales team member to get started with personalized campaigns"
            }
          </p>
          {!searchTerm && (
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
                {filteredMembers.map((member) => (
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
        </div>
      )}
    </div>
  );
}