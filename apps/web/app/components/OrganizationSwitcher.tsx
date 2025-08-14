import { OrganizationSwitcher as ClerkOrgSwitcher } from "@clerk/remix";

export function OrganizationSwitcher() {
  return (
    <ClerkOrgSwitcher
      appearance={{
        elements: {
          rootBox: "flex items-center",
          organizationSwitcherTrigger: 
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-[#5EC0DA]/30 hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-[#313131]",
          organizationSwitcherTriggerIcon: "text-gray-500",
          organizationPreview: "flex items-center gap-2",
          organizationPreviewAvatarBox: "w-6 h-6",
          organizationPreviewTextContainer: "flex flex-col",
          organizationPreviewMainIdentifier: "text-[#313131] font-medium text-sm",
          organizationPreviewSecondaryIdentifier: "text-gray-500 text-xs",
          organizationSwitcherPopoverCard: "bg-white border border-gray-200 shadow-lg rounded-lg",
          organizationSwitcherPopoverActions: "p-2",
          organizationSwitcherPopoverActionButton: 
            "flex items-center gap-2 w-full px-3 py-2 text-left rounded-md hover:bg-gray-50 text-sm text-[#313131] transition-colors",
          organizationSwitcherPopoverActionButtonText: "font-medium",
          organizationSwitcherPopoverActionButtonIcon: "text-[#5EC0DA]",
          organizationSwitcherPreviewButton: 
            "flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors w-full text-left",
        }
      }}
      createOrganizationMode="modal"
      organizationProfileMode="modal"
    />
  );
}