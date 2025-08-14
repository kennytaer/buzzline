import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { requireAuthWithOrg } from "~/utils/auth.server";
import { Navigation } from "~/components/Navigation";
import { createRepositories } from "~/lib/repositories";
import type { Contact, ContactList } from "@buzzline/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Contacts - BuzzLine" },
    { name: "description", content: "Manage your contact lists and recipients" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  
  const repositories = createRepositories(context.env, orgId);
  
  // Get all contacts (limited to 50 for performance)
  const contactsResult = await repositories.contacts.findByFilter({}, 50, 0);
  
  // Get all contact lists
  const contactLists = await repositories.contactLists.findAll();

  return json({ 
    contacts: contactsResult.items, 
    contactLists, 
    orgId 
  });
}

export default function ContactsIndex() {
  const { contacts, contactLists } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#313131]">Contacts</h1>
              <p className="text-gray-600 mt-1">Manage your contact lists and recipients</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/contacts/upload"
                className="bg-[#5EC0DA] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4a9fb5] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Upload Contacts
              </Link>
              <Link
                to="/contacts/new"
                className="bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Add Contact
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-3xl font-bold text-[#313131] mt-1">{contacts.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ED58A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contact Lists</p>
                  <p className="text-3xl font-bold text-[#313131] mt-1">{contactLists.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Contacts</p>
                  <p className="text-3xl font-bold text-[#313131] mt-1">
                    {contacts.filter(c => !c.flags.emailOptedOut && !c.flags.smsOptedOut).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5EC0DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Lists */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#313131]">Contact Lists</h2>
                  <p className="text-sm text-gray-600 mt-1">Organize your contacts into groups</p>
                </div>
                <div className="p-6">
                  {contactLists.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No contact lists yet</p>
                      <p className="text-gray-400 text-xs mt-1">Upload a CSV to create your first list</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactLists.map((list) => (
                        <div
                          key={list.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-[#5EC0DA] rounded-full"></div>
                            <div>
                              <p className="font-medium text-[#313131] text-sm">{list.name}</p>
                              <p className="text-xs text-gray-500">{list.contactCount} contacts</p>
                            </div>
                          </div>
                          <Link
                            to={`/contacts/lists/${list.id}`}
                            className="text-[#5EC0DA] hover:text-[#4a9fb5] text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#313131]">Recent Contacts</h2>
                  <p className="text-sm text-gray-600 mt-1">Latest contacts added to your lists</p>
                </div>
                <div className="p-6">
                  {contacts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-[#313131] mb-2">No contacts yet</h3>
                      <p className="text-gray-500 text-sm mb-6">Get started by uploading a CSV file or adding contacts manually</p>
                      <div className="flex justify-center space-x-3">
                        <Link
                          to="/contacts/upload"
                          className="bg-[#5EC0DA] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a9fb5] transition-colors"
                        >
                          Upload CSV
                        </Link>
                        <Link
                          to="/contacts/new"
                          className="bg-[#ED58A0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d948a0] transition-colors"
                        >
                          Add Contact
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Phone</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">List</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center">
                                    <span className="text-[#ED58A0] font-medium text-sm">
                                      {contact.firstName?.[0] || contact.email?.[0]?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#313131] text-sm">
                                      {contact.firstName && contact.lastName 
                                        ? `${contact.firstName} ${contact.lastName}`
                                        : contact.firstName || 'N/A'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{contact.email || 'N/A'}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{contact.phone || 'N/A'}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                Demo List
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  contact.status === 'active' ? 'bg-green-100 text-green-800' :
                                  contact.status === 'unsubscribed' ? 'bg-red-100 text-red-800' :
                                  contact.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                                  contact.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {contact.status}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <button className="text-[#5EC0DA] hover:text-[#4a9fb5] text-sm font-medium">
                                    Edit
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}