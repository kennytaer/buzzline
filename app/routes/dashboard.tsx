import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/node";
import { OrganizationSwitcher, UserButton } from "@clerk/remix";
import { Icons } from "~/components/Icons";

export async function loader(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId) {
    return redirect("/");
  }

  return {
    userId,
    orgId,
  };
}

export default function Dashboard() {
  const { userId, orgId } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Icons.Home },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Icons.Campaign },
    { href: "/dashboard/contacts", label: "Contacts", icon: Icons.Contacts },
    { href: "/dashboard/team", label: "Sales Team", icon: Icons.Team },
    { href: "/dashboard/analytics", label: "Analytics", icon: Icons.Analytics },
    { href: "/dashboard/settings", label: "Settings", icon: Icons.Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  if (!orgId) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-accent-200">
          <div className="flex items-center justify-center mb-6">
            <img src="/Buzzline_Logo.png" alt="BuzzLine" className="h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-4 text-accent-900">Welcome to BuzzLine</h1>
          <p className="text-accent-600 text-center mb-6">
            Select an organization to get started with your marketing campaigns.
          </p>
          
          <div className="flex justify-center">
            <OrganizationSwitcher 
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "w-full justify-center"
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50">
      <header className="bg-white border-b border-accent-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center justify-between w-full">
              <img src="/Buzzline_Logo.png" alt="BuzzLine" className="h-8" />
              
              <div className="flex items-center space-x-6">
                <nav className="hidden md:flex space-x-1">
                  {navigationItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary-100 text-primary-700"
                            : "text-accent-600 hover:text-accent-900 hover:bg-accent-100"
                        }`}
                      >
                        {item.label}
                      </a>
                    );
                  })}
                </nav>
                
                <div className="flex items-center space-x-4">
                  <OrganizationSwitcher 
                    appearance={{
                      elements: {
                        organizationSwitcherTrigger: "border-accent-300 text-accent-700 hover:bg-accent-50"
                      }
                    }}
                  />
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}