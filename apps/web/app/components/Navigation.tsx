import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix";
import { Link } from "@remix-run/react";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <img 
                src="/Buzzline_Logo.png" 
                alt="BuzzLine" 
                className="h-12 w-auto"
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <SignedOut>
              <Link 
                to="/features" 
                className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
              >
                Features
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
              >
                Pricing
              </Link>
              <SignInButton>
                <button className="bg-[#ED58A0] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 uppercase tracking-wide">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-6">
                <Link 
                  to="/campaigns" 
                  className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  Campaigns
                </Link>
                <Link 
                  to="/contacts" 
                  className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  Contacts
                </Link>
                <Link 
                  to="/sales" 
                  className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  Sales Team
                </Link>
                <Link 
                  to="/analytics" 
                  className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  Analytics
                </Link>
                <Link 
                  to="/settings" 
                  className="text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  Settings
                </Link>
                <div className="flex items-center space-x-4">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonPopoverCard: "shadow-lg border border-gray-100",
                        userButtonPopoverActionButton: "hover:bg-gray-50"
                      }
                    }}
                  />
                  <OrganizationSwitcher />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}