import type { MetaFunction } from "@remix-run/cloudflare";
import { SignedIn, SignedOut, SignInButton, useOrganization } from "@clerk/remix";
import { Link } from "@remix-run/react";
import { Navigation } from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "BuzzLine - Unified Marketing Communication Platform" },
    { name: "description", content: "Send unified SMS and Email campaigns with powerful analytics. Built for businesses that need reliable, scalable marketing communication." },
  ];
};

export default function Index() {
  const { organization } = useOrganization();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <SignedOut>
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[#5EC0DA]/10 via-white to-[#ED58A0]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-[#313131] mb-6 leading-tight">
                Marketing Communication
                <br />
                <span className="bg-gradient-to-r from-[#5EC0DA] to-[#ED58A0] bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Send unified SMS and email campaigns from one platform. Built for businesses that need reliable, scalable marketing communication with powerful analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <SignInButton>
                  <button className="bg-[#ED58A0] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Start Free Trial
                  </button>
                </SignInButton>
                <button className="border-2 border-[#5EC0DA] text-[#5EC0DA] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#5EC0DA] hover:text-white transition-all duration-200">
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[#313131] mb-4">
                Everything you need to scale
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful features built for modern marketing teams
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#313131] mb-3">Unified Messaging</h3>
                <p className="text-gray-600">Send SMS and email campaigns from a single interface. No more switching between platforms.</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#ED58A0]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#313131] mb-3">Powerful Analytics</h3>
                <p className="text-gray-600">Track opens, clicks, deliveries, and conversions with detailed performance insights.</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#313131] mb-3">Smart Contact Management</h3>
                <p className="text-gray-600">Import contacts via CSV, segment audiences, and manage opt-outs automatically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-gradient-to-r from-[#5EC0DA] to-[#ED58A0]">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to transform your marketing?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of businesses using BuzzLine to reach their customers effectively.
            </p>
            <SignInButton>
              <button className="bg-white text-[#ED58A0] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg">
                Get Started Free
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {!organization ? (
          /* No Organization Selected */
          <div className="py-20 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                <div className="w-16 h-16 bg-[#ED58A0]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#313131] mb-4">
                  Select an Organization
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  To access campaigns, contacts, and analytics, please select or create an organization. Each organization keeps its data completely separate.
                </p>
                <Link 
                  to="/select-organization"
                  className="bg-[#ED58A0] text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-[#d948a0] transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select Organization
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard View with Organization */
          <div className="py-12 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12">
                <h1 className="text-3xl font-bold text-[#313131] mb-2">
                  Welcome back to {organization.name}!
                </h1>
                <p className="text-lg text-gray-600">
                  Manage your campaigns and track performance for your organization
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  to="/campaigns"
                  className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#5EC0DA]/30"
                >
                  <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#5EC0DA]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#313131] mb-2">Campaigns</h3>
                  <p className="text-gray-600">Create and manage your marketing campaigns</p>
                </Link>

                <Link
                  to="/contacts"
                  className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#ED58A0]/30"
                >
                  <div className="w-12 h-12 bg-[#ED58A0]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#ED58A0]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#313131] mb-2">Contacts</h3>
                  <p className="text-gray-600">Manage your contact lists and recipients</p>
                </Link>

                <Link
                  to="/analytics"
                  className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#5EC0DA]/30"
                >
                  <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#5EC0DA]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#313131] mb-2">Analytics</h3>
                  <p className="text-gray-600">Track campaign performance and metrics</p>
                </Link>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white rounded-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                      <p className="text-2xl font-bold text-[#313131]">0</p>
                    </div>
                    <div className="w-8 h-8 bg-[#5EC0DA]/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#5EC0DA]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                      <p className="text-2xl font-bold text-[#313131]">0</p>
                    </div>
                    <div className="w-8 h-8 bg-[#ED58A0]/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#ED58A0]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                      <p className="text-2xl font-bold text-[#313131]">0</p>
                    </div>
                    <div className="w-8 h-8 bg-[#5EC0DA]/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#5EC0DA]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Rate</p>
                      <p className="text-2xl font-bold text-[#313131]">0%</p>
                    </div>
                    <div className="w-8 h-8 bg-[#ED58A0]/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#ED58A0]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}