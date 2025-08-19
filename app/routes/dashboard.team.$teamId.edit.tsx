import { useState } from "react";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/node";
import { getSalesTeamService } from "~/lib/sales-team.server";
import { formatDate } from "~/lib/utils";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }

  const { teamId } = args.params;
  if (!teamId) {
    throw new Response("Team member not found", { status: 404 });
  }

  try {
    const salesTeamService = getSalesTeamService(args.context);
    const member = await salesTeamService.getMember(orgId, teamId);
    
    if (!member) {
      throw new Response("Team member not found", { status: 404 });
    }

    return { orgId, member };
  } catch (error) {
    console.error("Error loading team member:", error);
    throw new Response("Failed to load team member", { status: 500 });
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  const { teamId } = args.params;
  
  if (!userId || !orgId || !teamId) {
    return redirect("/dashboard");
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  try {
    const salesTeamService = getSalesTeamService(args.context);

    if (actionType === "update") {
      const updates = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        title: formData.get("title") as string,
        department: formData.get("department") as string,
        bio: formData.get("bio") as string,
        isActive: formData.get("isActive") === "on",
      };

      // Validate required fields
      if (!updates.firstName || !updates.lastName || !updates.email) {
        return json({ error: "First name, last name, and email are required" }, { status: 400 });
      }

      const updatedMember = await salesTeamService.updateMember(orgId, teamId, updates);
      if (!updatedMember) {
        return json({ error: "Team member not found" }, { status: 404 });
      }

      return json({ success: "Team member updated successfully" });
      
    } else if (actionType === "delete") {
      const deleted = await salesTeamService.deleteMember(orgId, teamId);
      if (!deleted) {
        return json({ error: "Team member not found" }, { status: 404 });
      }
      
      return redirect("/dashboard/team");
      
    } else {
      return json({ error: "Invalid action" }, { status: 400 });
    }
    
  } catch (error) {
    console.error("Error updating team member:", error);
    return json({ error: "Failed to update team member" }, { status: 500 });
  }
}

export default function EditTeamMember() {
  const { member } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <a href="/dashboard/team" className="text-gray-400 hover:text-gray-500">
                  Sales Team
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Team Member</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update {member.firstName} {member.lastName}'s information.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {actionData && 'success' in actionData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-green-800">{actionData.success}</p>
          </div>
        </div>
      )}

      {actionData && 'error' in actionData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-800">{actionData.error}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Delete Team Member</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {member.firstName} {member.lastName}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <Form method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="actionType" value="delete" />
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="actionType" value="update" />
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  defaultValue={member.firstName}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  defaultValue={member.lastName}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="Smith"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  defaultValue={member.email}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  defaultValue={member.phone || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  defaultValue={member.title || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="Sales Manager"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  id="department"
                  defaultValue={member.department || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="Sales"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={3}
                  defaultValue={member.bio || ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  placeholder="Brief bio or description..."
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    defaultChecked={member.isActive}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-700">
                    Active team member
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Inactive members won't appear in campaign assignment options.
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(member.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(member.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-end space-x-3">
              <a
                href="/dashboard/team"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Save Changes
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}