import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";

export const meta: MetaFunction = () => {
  return [
    { title: "BuzzLine - Marketing Communication Platform" },
    { name: "description", content: "Unified SMS and email marketing campaigns" },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  
  // Redirect authenticated users to dashboard
  if (userId) {
    return redirect("/dashboard");
  }
  
  return {};
}

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <div className="flex flex-col items-center gap-6">
            <img src="/Buzzline_Logo.png" alt="BuzzLine" className="h-16" />
            <h1 className="text-4xl font-bold text-gray-800 text-center">
              Marketing Communication Platform
            </h1>
            <p className="text-xl text-gray-600 text-center max-w-2xl">
              Unify your SMS and email marketing campaigns with BuzzLine. Create, send, and track multi-channel campaigns from one platform.
            </p>
            
            <SignedOut>
              <div className="flex flex-col items-center gap-4">
                <SignInButton mode="modal">
                  <button className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200">
                    Get Started
                  </button>
                </SignInButton>
                <p className="text-sm text-gray-500">Sign in to access your campaigns</p>
              </div>
            </SignedOut>
          </div>
        </header>
        
        <SignedOut>
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Unified Messaging</h3>
                <p className="text-gray-600">Send SMS and email campaigns from one interface</p>
              </div>
              <div className="text-center">
                <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Contact Management</h3>
                <p className="text-gray-600">Import and organize your contacts with ease</p>
              </div>
              <div className="text-center">
                <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
                <p className="text-gray-600">Track delivery rates, opens, and engagement</p>
              </div>
            </div>
          </div>
        </SignedOut>
      </div>
    </div>
  );
}
