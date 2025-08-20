import { useState } from "react";
import { useActionData, Form, Link, useNavigate } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { getSalesTeamService } from "~/lib/sales-team.server";
import { Icons } from "~/components/Icons";

export async function action(args: ActionFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId || !orgId) {
    return redirect("/sign-in");
  }

  const formData = await args.request.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const bio = formData.get("bio") as string;
  const isActive = formData.get("isActive") === "on";

  if (!firstName || !lastName || !email) {
    return json(
      { error: "First name, last name, and email are required" },
      { status: 400 }
    );
  }

  try {
    const salesTeamService = getSalesTeamService(args.context);
    await salesTeamService.createMember(orgId, {
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      title: title || undefined,
      department: department || undefined,
      bio: bio || undefined,
      isActive,
    });

    return redirect("/dashboard/team");
  } catch (error) {
    return json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}

export default function NewTeamMember() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    bio: "",
    isActive: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-accent-600 hover:text-accent-900 hover:bg-accent-100 rounded-lg transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-accent-900">Add Team Member</h1>
          <p className="text-accent-600 mt-1">
            Add a new sales team member for personalized campaigns
          </p>
        </div>
      </div>

      {/* Error Message */}
      {actionData?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Icons.Warning className="text-red-500" />
            <p className="text-red-700">{actionData.error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card p-6">
        <Form method="post" className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-accent-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-accent-900">Professional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Sales Representative"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  placeholder="e.g., Sales, Marketing"
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label mb-2">
                Bio / Description
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={3}
                placeholder="Brief description of the team member's role and expertise..."
                className="form-textarea"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-accent-900">Status</h3>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
                className="w-4 h-4 text-primary-600 border-accent-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-accent-700">
                Active (available for campaign assignment)
              </label>
            </div>
            
            <div className="p-3 bg-accent-50 rounded-lg">
              <p className="text-sm text-accent-600">
                <Icons.Info className="inline mr-2" size="sm" />
                Only active team members will be included in round-robin campaign assignments.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-accent-200">
            <Link
              to="/dashboard/team"
              className="px-4 py-2 text-accent-600 hover:text-accent-900 transition-colors"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Icons.Check size="sm" />
              Create Member
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}