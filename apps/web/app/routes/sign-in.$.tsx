import { SignIn } from "@clerk/remix";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5EC0DA]/10 via-white to-[#ED58A0]/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/Buzzline_Logo.png" 
            alt="BuzzLine" 
            className="h-12 w-auto mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-[#313131] mb-2">
            Welcome to BuzzLine
          </h2>
          <p className="text-gray-600">
            Sign in to your marketing dashboard
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: "bg-[#ED58A0] hover:bg-[#d948a0] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200",
                footerActionLink: "text-[#5EC0DA] hover:text-[#4a9fb5]",
                identityPreviewEditButton: "text-[#5EC0DA] hover:text-[#4a9fb5]",
                formFieldInput: "border-gray-200 focus:border-[#5EC0DA] focus:ring-[#5EC0DA]/20",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500",
                socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50",
                card: "shadow-none",
                headerTitle: "text-[#313131]",
                headerSubtitle: "text-gray-600"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}