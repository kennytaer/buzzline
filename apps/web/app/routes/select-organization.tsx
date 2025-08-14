import { CreateOrganization, OrganizationList } from "@clerk/remix";
import { useUser } from "@clerk/remix";
import { Navigation } from "~/components/Navigation";

export default function SelectOrganizationPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#313131] mb-2">
              Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
            </h1>
            <p className="text-lg text-gray-600">
              Select or create an organization to get started with BuzzLine
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Organization List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-semibold text-[#313131] mb-6">
                Your Organizations
              </h2>
              <OrganizationList
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationListContainer: "space-y-3",
                    organizationPreview: 
                      "flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#5EC0DA]/30 hover:bg-gray-50 transition-all duration-200 cursor-pointer",
                    organizationPreviewAvatarBox: "w-10 h-10",
                    organizationPreviewTextContainer: "flex-1",
                    organizationPreviewMainIdentifier: "font-medium text-[#313131]",
                    organizationPreviewSecondaryIdentifier: "text-gray-500 text-sm",
                    organizationPreviewButton: "w-full text-left",
                  }
                }}
                hidePersonal
              />
            </div>

            {/* Create Organization */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-semibold text-[#313131] mb-6">
                Create New Organization
              </h2>
              <CreateOrganization
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-[#ED58A0] hover:bg-[#d948a0] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200",
                    formFieldInput: "border-gray-200 focus:border-[#5EC0DA] focus:ring-[#5EC0DA]/20 rounded-lg",
                    card: "shadow-none border-0",
                    headerTitle: "text-[#313131] text-lg font-semibold",
                    headerSubtitle: "text-gray-600",
                    formFieldLabel: "text-[#313131] font-medium",
                  }
                }}
              />
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Each organization has its own contacts, campaigns, and analytics data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}