var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs } from "react/jsx-runtime";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, Link, useLoaderData, useActionData, useNavigation, Form, useSearchParams } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ClerkApp, OrganizationSwitcher as OrganizationSwitcher$1, SignedOut, SignInButton, SignedIn, UserButton, useUser, OrganizationList, CreateOrganization, SignIn, useOrganization } from "@clerk/remix";
import { rootAuthLoader, getAuth } from "@clerk/remix/ssr.server";
import { redirect, json } from "@remix-run/cloudflare";
import { useState } from "react";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import { v4 } from "uuid";
import Papa from "papaparse";
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  const body = await renderToReadableStream(
    /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url }),
    {
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      }
    }
  );
  if (isbot(request.headers.get("user-agent"))) {
    await body.allReady;
  }
  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  },
  { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
  { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
  { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  { rel: "manifest", href: "/site.webmanifest" }
];
const loader$b = (args) => {
  return rootAuthLoader(args);
};
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const root = ClerkApp(App);
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: root,
  links,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
function OrganizationSwitcher() {
  return /* @__PURE__ */ jsx(
    OrganizationSwitcher$1,
    {
      appearance: {
        elements: {
          rootBox: "flex items-center",
          organizationSwitcherTrigger: "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-[#5EC0DA]/30 hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-[#313131]",
          organizationSwitcherTriggerIcon: "text-gray-500",
          organizationPreview: "flex items-center gap-2",
          organizationPreviewAvatarBox: "w-6 h-6",
          organizationPreviewTextContainer: "flex flex-col",
          organizationPreviewMainIdentifier: "text-[#313131] font-medium text-sm",
          organizationPreviewSecondaryIdentifier: "text-gray-500 text-xs",
          organizationSwitcherPopoverCard: "bg-white border border-gray-200 shadow-lg rounded-lg",
          organizationSwitcherPopoverActions: "p-2",
          organizationSwitcherPopoverActionButton: "flex items-center gap-2 w-full px-3 py-2 text-left rounded-md hover:bg-gray-50 text-sm text-[#313131] transition-colors",
          organizationSwitcherPopoverActionButtonText: "font-medium",
          organizationSwitcherPopoverActionButtonIcon: "text-[#5EC0DA]",
          organizationSwitcherPreviewButton: "flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors w-full text-left"
        }
      },
      createOrganizationMode: "modal",
      organizationProfileMode: "modal"
    }
  );
}
function Navigation() {
  return /* @__PURE__ */ jsx("nav", { className: "bg-white shadow-sm border-b border-gray-100", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between h-20", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "flex-shrink-0 flex items-center space-x-2", children: /* @__PURE__ */ jsx(
      "img",
      {
        src: "/Buzzline_Logo.png",
        alt: "BuzzLine",
        className: "h-12 w-auto"
      }
    ) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-8", children: [
      /* @__PURE__ */ jsxs(SignedOut, { children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/features",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Features"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/pricing",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Pricing"
          }
        ),
        /* @__PURE__ */ jsx(SignInButton, { children: /* @__PURE__ */ jsx("button", { className: "bg-[#ED58A0] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 uppercase tracking-wide", children: "Sign In" }) })
      ] }),
      /* @__PURE__ */ jsx(SignedIn, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-6", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/campaigns",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Campaigns"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/contacts",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Contacts"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/sales",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Sales Team"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/analytics",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Analytics"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/settings",
            className: "text-gray-600 hover:text-[#313131] transition-all duration-200 text-sm font-semibold uppercase tracking-wide hover:bg-gray-50 px-4 py-2 rounded-lg",
            children: "Settings"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx(
            UserButton,
            {
              afterSignOutUrl: "/",
              appearance: {
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-lg border border-gray-100",
                  userButtonPopoverActionButton: "hover:bg-gray-50"
                }
              }
            }
          ),
          /* @__PURE__ */ jsx(OrganizationSwitcher, {})
        ] })
      ] }) })
    ] })
  ] }) }) });
}
function SelectOrganizationPage() {
  var _a;
  const { user } = useUser();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-[#313131] mb-2", children: [
          "Welcome, ",
          (user == null ? void 0 : user.firstName) || ((_a = user == null ? void 0 : user.emailAddresses[0]) == null ? void 0 : _a.emailAddress),
          "!"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-600", children: "Select or create an organization to get started with BuzzLine" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-[#313131] mb-6", children: "Your Organizations" }),
          /* @__PURE__ */ jsx(
            OrganizationList,
            {
              appearance: {
                elements: {
                  rootBox: "w-full",
                  organizationListContainer: "space-y-3",
                  organizationPreview: "flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#5EC0DA]/30 hover:bg-gray-50 transition-all duration-200 cursor-pointer",
                  organizationPreviewAvatarBox: "w-10 h-10",
                  organizationPreviewTextContainer: "flex-1",
                  organizationPreviewMainIdentifier: "font-medium text-[#313131]",
                  organizationPreviewSecondaryIdentifier: "text-gray-500 text-sm",
                  organizationPreviewButton: "w-full text-left"
                }
              },
              hidePersonal: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-[#313131] mb-6", children: "Create New Organization" }),
          /* @__PURE__ */ jsx(
            CreateOrganization,
            {
              appearance: {
                elements: {
                  formButtonPrimary: "bg-[#ED58A0] hover:bg-[#d948a0] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200",
                  formFieldInput: "border-gray-200 focus:border-[#5EC0DA] focus:ring-[#5EC0DA]/20 rounded-lg",
                  card: "shadow-none border-0",
                  headerTitle: "text-[#313131] text-lg font-semibold",
                  headerSubtitle: "text-gray-600",
                  formFieldLabel: "text-[#313131] font-medium"
                }
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Each organization has its own contacts, campaigns, and analytics data." }) })
    ] }) })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SelectOrganizationPage
}, Symbol.toStringTag, { value: "Module" }));
class KVClient {
  constructor(env, organizationId) {
    this.env = env;
    this.organizationId = organizationId;
  }
  // Generic KV operations with automatic organization scoping
  async get(key) {
    try {
      const value = await this.env.BUZZLINE_MAIN.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("KV get error:", error);
      return null;
    }
  }
  async put(key, value, options) {
    try {
      await this.env.BUZZLINE_MAIN.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.error("KV put error:", error);
      throw error;
    }
  }
  async delete(key) {
    try {
      await this.env.BUZZLINE_MAIN.delete(key);
    } catch (error) {
      console.error("KV delete error:", error);
      throw error;
    }
  }
  async list(prefix) {
    try {
      const result = await this.env.BUZZLINE_MAIN.list({ prefix });
      return result.keys.map((k) => k.name);
    } catch (error) {
      console.error("KV list error:", error);
      return [];
    }
  }
  // Analytics namespace operations
  async getAnalytics(key) {
    try {
      const value = await this.env.BUZZLINE_ANALYTICS.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("KV analytics get error:", error);
      return null;
    }
  }
  async putAnalytics(key, value, options) {
    try {
      await this.env.BUZZLINE_ANALYTICS.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.error("KV analytics put error:", error);
      throw error;
    }
  }
  // Cache namespace operations (with shorter TTL)
  async getCache(key) {
    try {
      const value = await this.env.BUZZLINE_CACHE.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("KV cache get error:", error);
      return null;
    }
  }
  async putCache(key, value, ttl = 3600) {
    try {
      await this.env.BUZZLINE_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } catch (error) {
      console.error("KV cache put error:", error);
      throw error;
    }
  }
  // Batch operations
  async batchPut(entries) {
    const promises = entries.map(({ key, value }) => this.put(key, value));
    await Promise.all(promises);
  }
  async batchDelete(keys) {
    const promises = keys.map((key) => this.delete(key));
    await Promise.all(promises);
  }
  // Index management for search and filtering
  async addToIndex(indexKey, itemId) {
    const currentIndex = await this.get(indexKey) || [];
    if (!currentIndex.includes(itemId)) {
      currentIndex.push(itemId);
      await this.put(indexKey, currentIndex);
    }
  }
  async removeFromIndex(indexKey, itemId) {
    const currentIndex = await this.get(indexKey) || [];
    const updatedIndex = currentIndex.filter((id) => id !== itemId);
    await this.put(indexKey, updatedIndex);
  }
  async getFromIndex(indexKey) {
    return await this.get(indexKey) || [];
  }
  // Multi-index operations for complex queries
  async updateItemIndexes(itemId, oldIndexes, newIndexes) {
    const promises = [];
    for (const indexKey of oldIndexes) {
      promises.push(this.removeFromIndex(indexKey, itemId));
    }
    for (const indexKey of newIndexes) {
      promises.push(this.addToIndex(indexKey, itemId));
    }
    await Promise.all(promises);
  }
  // Organization-scoped helper methods
  getOrganizationKey(key) {
    return key.replace(":orgId:", `:${this.organizationId}:`);
  }
  // Atomic operations simulation
  async atomicUpdate(key, updateFn) {
    const current = await this.get(key);
    const updated = updateFn(current);
    await this.put(key, updated);
    return updated;
  }
}
function createKVClient(env, organizationId) {
  return new KVClient(env, organizationId);
}
const KVKeys = {
  // Organizations
  organization: (orgId) => `org:${orgId}:meta`,
  // Users
  user: (orgId, userId) => `org:${orgId}:users:${userId}`,
  usersByOrg: (orgId) => `org:${orgId}:indexes:users`,
  // Contacts
  contact: (orgId, contactId) => `org:${orgId}:contacts:${contactId}`,
  contactsByList: (orgId, listId) => `org:${orgId}:indexes:contacts:list:${listId}`,
  contactsByStatus: (orgId, status) => `org:${orgId}:indexes:contacts:status:${status}`,
  contactsByTag: (orgId, tag) => `org:${orgId}:indexes:contacts:tag:${tag}`,
  contactsBySubGroup: (orgId, subGroupId) => `org:${orgId}:indexes:contacts:subgroup:${subGroupId}`,
  contactMetadataIndex: (orgId, field, value) => `org:${orgId}:indexes:contacts:metadata:${field}:${value}`,
  // Contact Lists
  contactList: (orgId, listId) => `org:${orgId}:lists:${listId}`,
  contactListsByOrg: (orgId) => `org:${orgId}:indexes:lists`,
  // SubGroups
  subGroup: (orgId, subGroupId) => `org:${orgId}:subgroups:${subGroupId}`,
  subGroupsByList: (orgId, listId) => `org:${orgId}:indexes:subgroups:list:${listId}`,
  // Campaigns
  campaign: (orgId, campaignId) => `org:${orgId}:campaigns:${campaignId}`,
  campaignsByOrg: (orgId) => `org:${orgId}:indexes:campaigns`,
  campaignsByStatus: (orgId, status) => `org:${orgId}:indexes:campaigns:status:${status}`,
  // Campaign Deliveries
  campaignDelivery: (orgId, campaignId, contactId, type) => `org:${orgId}:deliveries:${campaignId}:${contactId}:${type}`,
  deliveriesByCampaign: (orgId, campaignId) => `org:${orgId}:indexes:deliveries:campaign:${campaignId}`,
  // Sales Agents
  salesAgent: (orgId, agentId) => `org:${orgId}:agents:${agentId}`,
  agentsByOrg: (orgId) => `org:${orgId}:indexes:agents`,
  agentsByStatus: (orgId, status) => `org:${orgId}:indexes:agents:status:${status}`,
  agentsByTerritory: (orgId, territory) => `org:${orgId}:indexes:agents:territory:${territory}`,
  // Analytics (stored in BUZZLINE_ANALYTICS namespace)
  campaignAnalytics: (campaignId) => `analytics:campaign:${campaignId}`,
  dailyAnalytics: (orgId, date) => `analytics:org:${orgId}:daily:${date}`,
  monthlyAnalytics: (orgId, month) => `analytics:org:${orgId}:monthly:${month}`
};
class ContactRepository {
  constructor(kv, organizationId) {
    this.kv = kv;
    this.organizationId = organizationId;
  }
  async create(contactData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const contact = {
      id,
      ...contactData,
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(KVKeys.contact(this.organizationId, id), contact);
    await this.updateContactIndexes(contact, null);
    await this.updateContactListCount(contact.contactListId, 1);
    return contact;
  }
  async findById(id) {
    return await this.kv.get(KVKeys.contact(this.organizationId, id));
  }
  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id,
      // Ensure ID doesn't change
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(KVKeys.contact(this.organizationId, id), updated);
    if (this.indexRelevantFieldsChanged(existing, updated)) {
      await this.updateContactIndexes(updated, existing);
    }
    return updated;
  }
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.kv.delete(KVKeys.contact(this.organizationId, id));
    await this.removeFromAllIndexes(existing);
    await this.updateContactListCount(existing.contactListId, -1);
    return true;
  }
  async findByList(listId, limit = 100, offset = 0) {
    const contactIds = await this.kv.getFromIndex(
      KVKeys.contactsByList(this.organizationId, listId)
    );
    const total = contactIds.length;
    const paginatedIds = contactIds.slice(offset, offset + limit);
    const contacts = await this.getContactsByIds(paginatedIds);
    return {
      items: contacts,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }
  async findByFilter(filter, limit = 100, offset = 0) {
    let contactIds = [];
    if (filter.listId) {
      contactIds = await this.kv.getFromIndex(
        KVKeys.contactsByList(this.organizationId, filter.listId)
      );
    } else {
      const allContactKeys = await this.kv.list(`org:${this.organizationId}:contacts:`);
      contactIds = allContactKeys.map((key) => key.split(":").pop()).filter(Boolean);
    }
    if (filter.status) {
      const statusContactIds = await this.kv.getFromIndex(
        KVKeys.contactsByStatus(this.organizationId, filter.status)
      );
      contactIds = contactIds.filter((id) => statusContactIds.includes(id));
    }
    if (filter.tags && filter.tags.length > 0) {
      for (const tag of filter.tags) {
        const tagContactIds = await this.kv.getFromIndex(
          KVKeys.contactsByTag(this.organizationId, tag)
        );
        contactIds = contactIds.filter((id) => tagContactIds.includes(id));
      }
    }
    if (filter.subGroups && filter.subGroups.length > 0) {
      const subGroupContactIds = /* @__PURE__ */ new Set();
      for (const subGroupId of filter.subGroups) {
        const subGroupIds = await this.kv.getFromIndex(
          KVKeys.contactsBySubGroup(this.organizationId, subGroupId)
        );
        subGroupIds.forEach((id) => subGroupContactIds.add(id));
      }
      contactIds = contactIds.filter((id) => subGroupContactIds.has(id));
    }
    if (filter.metadata) {
      for (const [field, value] of Object.entries(filter.metadata)) {
        const metadataContactIds = await this.kv.getFromIndex(
          KVKeys.contactMetadataIndex(this.organizationId, field, String(value))
        );
        contactIds = contactIds.filter((id) => metadataContactIds.includes(id));
      }
    }
    let contacts = await this.getContactsByIds(contactIds);
    if (filter.hasEmail !== void 0) {
      contacts = contacts.filter(
        (contact) => filter.hasEmail ? !!contact.email : !contact.email
      );
    }
    if (filter.hasPhone !== void 0) {
      contacts = contacts.filter(
        (contact) => filter.hasPhone ? !!contact.phone : !contact.phone
      );
    }
    const total = contacts.length;
    const paginatedContacts = contacts.slice(offset, offset + limit);
    return {
      items: paginatedContacts,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }
  async addToSubGroup(contactId, subGroupId) {
    const contact = await this.findById(contactId);
    if (!contact) return false;
    if (!contact.subGroups.includes(subGroupId)) {
      contact.subGroups.push(subGroupId);
      await this.update(contactId, { subGroups: contact.subGroups });
    }
    return true;
  }
  async removeFromSubGroup(contactId, subGroupId) {
    const contact = await this.findById(contactId);
    if (!contact) return false;
    contact.subGroups = contact.subGroups.filter((id) => id !== subGroupId);
    await this.update(contactId, { subGroups: contact.subGroups });
    return true;
  }
  async bulkUpdateStatus(contactIds, status) {
    let updatedCount = 0;
    for (const contactId of contactIds) {
      const success = await this.update(contactId, { status });
      if (success) updatedCount++;
    }
    return updatedCount;
  }
  async bulkAddTags(contactIds, tags) {
    let updatedCount = 0;
    for (const contactId of contactIds) {
      const contact = await this.findById(contactId);
      if (contact) {
        const newTags = [.../* @__PURE__ */ new Set([...contact.tags, ...tags])];
        await this.update(contactId, { tags: newTags });
        updatedCount++;
      }
    }
    return updatedCount;
  }
  // Private helper methods
  async getContactsByIds(ids) {
    if (ids.length === 0) return [];
    const promises = ids.map((id) => this.findById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  async updateContactIndexes(contact, previousContact) {
    const promises = [];
    promises.push(this.kv.addToIndex(
      KVKeys.contactsByList(this.organizationId, contact.contactListId),
      contact.id
    ));
    promises.push(this.kv.addToIndex(
      KVKeys.contactsByStatus(this.organizationId, contact.status),
      contact.id
    ));
    for (const tag of contact.tags) {
      promises.push(this.kv.addToIndex(
        KVKeys.contactsByTag(this.organizationId, tag),
        contact.id
      ));
    }
    for (const subGroupId of contact.subGroups) {
      promises.push(this.kv.addToIndex(
        KVKeys.contactsBySubGroup(this.organizationId, subGroupId),
        contact.id
      ));
    }
    for (const [field, value] of Object.entries(contact.metadata)) {
      promises.push(this.kv.addToIndex(
        KVKeys.contactMetadataIndex(this.organizationId, field, String(value)),
        contact.id
      ));
    }
    if (previousContact) {
      if (previousContact.status !== contact.status) {
        promises.push(this.kv.removeFromIndex(
          KVKeys.contactsByStatus(this.organizationId, previousContact.status),
          contact.id
        ));
      }
      const removedTags = previousContact.tags.filter((tag) => !contact.tags.includes(tag));
      for (const tag of removedTags) {
        promises.push(this.kv.removeFromIndex(
          KVKeys.contactsByTag(this.organizationId, tag),
          contact.id
        ));
      }
      const removedSubGroups = previousContact.subGroups.filter((sg) => !contact.subGroups.includes(sg));
      for (const subGroupId of removedSubGroups) {
        promises.push(this.kv.removeFromIndex(
          KVKeys.contactsBySubGroup(this.organizationId, subGroupId),
          contact.id
        ));
      }
      for (const [field, value] of Object.entries(previousContact.metadata)) {
        if (contact.metadata[field] !== value) {
          promises.push(this.kv.removeFromIndex(
            KVKeys.contactMetadataIndex(this.organizationId, field, String(value)),
            contact.id
          ));
        }
      }
    }
    await Promise.all(promises);
  }
  async removeFromAllIndexes(contact) {
    const promises = [];
    promises.push(this.kv.removeFromIndex(
      KVKeys.contactsByList(this.organizationId, contact.contactListId),
      contact.id
    ));
    promises.push(this.kv.removeFromIndex(
      KVKeys.contactsByStatus(this.organizationId, contact.status),
      contact.id
    ));
    for (const tag of contact.tags) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.contactsByTag(this.organizationId, tag),
        contact.id
      ));
    }
    for (const subGroupId of contact.subGroups) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.contactsBySubGroup(this.organizationId, subGroupId),
        contact.id
      ));
    }
    for (const [field, value] of Object.entries(contact.metadata)) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.contactMetadataIndex(this.organizationId, field, String(value)),
        contact.id
      ));
    }
    await Promise.all(promises);
  }
  indexRelevantFieldsChanged(old, updated) {
    return old.status !== updated.status || JSON.stringify(old.tags) !== JSON.stringify(updated.tags) || JSON.stringify(old.subGroups) !== JSON.stringify(updated.subGroups) || JSON.stringify(old.metadata) !== JSON.stringify(updated.metadata) || old.contactListId !== updated.contactListId;
  }
  async updateContactListCount(listId, delta) {
    const listKey = KVKeys.contactList(this.organizationId, listId);
    await this.kv.atomicUpdate(listKey, (current) => {
      if (current) {
        current.contactCount = Math.max(0, current.contactCount + delta);
        current.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      return current;
    });
  }
}
class ContactListRepository {
  constructor(kv, organizationId) {
    this.kv = kv;
    this.organizationId = organizationId;
  }
  async create(listData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const contactList = {
      id,
      ...listData,
      organizationId: this.organizationId,
      contactCount: 0,
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(KVKeys.contactList(this.organizationId, id), contactList);
    await this.kv.addToIndex(
      KVKeys.contactListsByOrg(this.organizationId),
      id
    );
    return contactList;
  }
  async findById(id) {
    return await this.kv.get(KVKeys.contactList(this.organizationId, id));
  }
  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id,
      // Ensure ID doesn't change
      organizationId: this.organizationId,
      // Ensure org doesn't change
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(KVKeys.contactList(this.organizationId, id), updated);
    return updated;
  }
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.kv.delete(KVKeys.contactList(this.organizationId, id));
    await this.kv.removeFromIndex(
      KVKeys.contactListsByOrg(this.organizationId),
      id
    );
    return true;
  }
  async findAll() {
    const listIds = await this.kv.getFromIndex(KVKeys.contactListsByOrg(this.organizationId));
    if (listIds.length === 0) return [];
    const promises = listIds.map((id) => this.findById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  async findOrCreate(name) {
    const existingLists = await this.findAll();
    const existing = existingLists.find((list) => list.name === name);
    if (existing) {
      return existing;
    }
    return await this.create({ name });
  }
  async incrementContactCount(id, delta = 1) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const newCount = Math.max(0, existing.contactCount + delta);
    return await this.update(id, { contactCount: newCount });
  }
  async decrementContactCount(id, delta = 1) {
    return await this.incrementContactCount(id, -delta);
  }
}
class CampaignRepository {
  constructor(kv, organizationId) {
    this.kv = kv;
    this.organizationId = organizationId;
  }
  async create(campaignData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const campaign = {
      id,
      ...campaignData,
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(KVKeys.campaign(this.organizationId, id), campaign);
    await this.updateCampaignIndexes(campaign, null);
    return campaign;
  }
  async findById(id) {
    return await this.kv.get(KVKeys.campaign(this.organizationId, id));
  }
  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(KVKeys.campaign(this.organizationId, id), updated);
    if (existing.status !== updated.status) {
      await this.updateCampaignIndexes(updated, existing);
    }
    return updated;
  }
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.kv.delete(KVKeys.campaign(this.organizationId, id));
    await this.removeFromAllIndexes(existing);
    await this.deleteAllDeliveries(id);
    await this.kv.delete(KVKeys.campaignAnalytics(id));
    return true;
  }
  async findAll(limit = 100, offset = 0) {
    const campaignIds = await this.kv.getFromIndex(
      KVKeys.campaignsByOrg(this.organizationId)
    );
    const total = campaignIds.length;
    const paginatedIds = campaignIds.slice(offset, offset + limit);
    const campaigns = await this.getCampaignsByIds(paginatedIds);
    return {
      items: campaigns,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }
  async findByStatus(status, limit = 100, offset = 0) {
    const campaignIds = await this.kv.getFromIndex(
      KVKeys.campaignsByStatus(this.organizationId, status)
    );
    const total = campaignIds.length;
    const paginatedIds = campaignIds.slice(offset, offset + limit);
    const campaigns = await this.getCampaignsByIds(paginatedIds);
    return {
      items: campaigns,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }
  // Campaign Delivery Methods
  async createDelivery(delivery) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const campaignDelivery = {
      id,
      ...delivery,
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(
      KVKeys.campaignDelivery(this.organizationId, delivery.campaignId, delivery.contactId, delivery.type),
      campaignDelivery
    );
    await this.kv.addToIndex(
      KVKeys.deliveriesByCampaign(this.organizationId, delivery.campaignId),
      `${delivery.contactId}:${delivery.type}`
    );
    return campaignDelivery;
  }
  async updateDelivery(campaignId, contactId, type, updates) {
    const key = KVKeys.campaignDelivery(this.organizationId, campaignId, contactId, type);
    const existing = await this.kv.get(key);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(key, updated);
    return updated;
  }
  async getDelivery(campaignId, contactId, type) {
    return await this.kv.get(
      KVKeys.campaignDelivery(this.organizationId, campaignId, contactId, type)
    );
  }
  async getCampaignDeliveries(campaignId) {
    const deliveryKeys = await this.kv.getFromIndex(
      KVKeys.deliveriesByCampaign(this.organizationId, campaignId)
    );
    const deliveries = [];
    for (const key of deliveryKeys) {
      const [contactId, type] = key.split(":");
      const delivery = await this.getDelivery(campaignId, contactId, type);
      if (delivery) deliveries.push(delivery);
    }
    return deliveries;
  }
  // Campaign Analytics Methods
  async updateAnalytics(campaignId) {
    const deliveries = await this.getCampaignDeliveries(campaignId);
    const analytics = {
      campaignId,
      totalContacts: new Set(deliveries.map((d) => d.contactId)).size,
      emailsSent: deliveries.filter((d) => d.type === "email" && d.status === "sent").length,
      smsSent: deliveries.filter((d) => d.type === "sms" && d.status === "sent").length,
      emailsDelivered: deliveries.filter((d) => d.type === "email" && d.status === "delivered").length,
      smsDelivered: deliveries.filter((d) => d.type === "sms" && d.status === "delivered").length,
      emailsOpened: deliveries.filter((d) => d.type === "email" && d.status === "opened").length,
      emailsClicked: deliveries.filter((d) => d.type === "email" && d.status === "clicked").length,
      emailsBounced: deliveries.filter((d) => d.type === "email" && d.status === "bounced").length,
      smsFailed: deliveries.filter((d) => d.type === "sms" && d.status === "failed").length,
      openRate: 0,
      clickRate: 0,
      deliveryRate: 0
    };
    const emailsDelivered = analytics.emailsDelivered;
    const totalSent = analytics.emailsSent + analytics.smsSent;
    const totalDelivered = analytics.emailsDelivered + analytics.smsDelivered;
    analytics.openRate = emailsDelivered > 0 ? analytics.emailsOpened / emailsDelivered * 100 : 0;
    analytics.clickRate = analytics.emailsOpened > 0 ? analytics.emailsClicked / analytics.emailsOpened * 100 : 0;
    analytics.deliveryRate = totalSent > 0 ? totalDelivered / totalSent * 100 : 0;
    await this.kv.putAnalytics(KVKeys.campaignAnalytics(campaignId), analytics);
    return analytics;
  }
  async getAnalytics(campaignId) {
    return await this.kv.getAnalytics(KVKeys.campaignAnalytics(campaignId));
  }
  // Bulk operations
  async bulkUpdateStatus(campaignIds, status) {
    let updatedCount = 0;
    for (const campaignId of campaignIds) {
      const success = await this.update(campaignId, { status });
      if (success) updatedCount++;
    }
    return updatedCount;
  }
  // Private helper methods
  async getCampaignsByIds(ids) {
    if (ids.length === 0) return [];
    const promises = ids.map((id) => this.findById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  async updateCampaignIndexes(campaign, previousCampaign) {
    const promises = [];
    promises.push(this.kv.addToIndex(
      KVKeys.campaignsByOrg(this.organizationId),
      campaign.id
    ));
    promises.push(this.kv.addToIndex(
      KVKeys.campaignsByStatus(this.organizationId, campaign.status),
      campaign.id
    ));
    if (previousCampaign && previousCampaign.status !== campaign.status) {
      promises.push(this.kv.removeFromIndex(
        KVKeys.campaignsByStatus(this.organizationId, previousCampaign.status),
        campaign.id
      ));
    }
    await Promise.all(promises);
  }
  async removeFromAllIndexes(campaign) {
    const promises = [];
    promises.push(this.kv.removeFromIndex(
      KVKeys.campaignsByOrg(this.organizationId),
      campaign.id
    ));
    promises.push(this.kv.removeFromIndex(
      KVKeys.campaignsByStatus(this.organizationId, campaign.status),
      campaign.id
    ));
    await Promise.all(promises);
  }
  async deleteAllDeliveries(campaignId) {
    const deliveryKeys = await this.kv.getFromIndex(
      KVKeys.deliveriesByCampaign(this.organizationId, campaignId)
    );
    const deletePromises = deliveryKeys.map((key) => {
      const [contactId, type] = key.split(":");
      return this.kv.delete(
        KVKeys.campaignDelivery(this.organizationId, campaignId, contactId, type)
      );
    });
    await Promise.all(deletePromises);
    await this.kv.delete(KVKeys.deliveriesByCampaign(this.organizationId, campaignId));
  }
}
class UserRepository {
  constructor(kv, organizationId) {
    this.kv = kv;
    this.organizationId = organizationId;
  }
  async create(userData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const user = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(KVKeys.user(this.organizationId, id), user);
    await this.kv.addToIndex(
      KVKeys.usersByOrg(this.organizationId),
      id
    );
    return user;
  }
  async findById(id) {
    return await this.kv.get(KVKeys.user(this.organizationId, id));
  }
  async findByClerkId(clerkId) {
    const userIds = await this.kv.getFromIndex(KVKeys.usersByOrg(this.organizationId));
    for (const userId of userIds) {
      const user = await this.findById(userId);
      if (user && user.clerkId === clerkId) {
        return user;
      }
    }
    return null;
  }
  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id,
      // Ensure ID doesn't change
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(KVKeys.user(this.organizationId, id), updated);
    return updated;
  }
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.kv.delete(KVKeys.user(this.organizationId, id));
    await this.kv.removeFromIndex(
      KVKeys.usersByOrg(this.organizationId),
      id
    );
    return true;
  }
  async findAll() {
    const userIds = await this.kv.getFromIndex(KVKeys.usersByOrg(this.organizationId));
    const promises = userIds.map((id) => this.findById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  async upsertByClerkId(clerkId, userData) {
    const existing = await this.findByClerkId(clerkId);
    if (existing) {
      return await this.update(existing.id, userData);
    } else {
      return await this.create({ ...userData, clerkId });
    }
  }
}
class OrganizationRepository {
  constructor(kv, organizationId) {
    this.kv = kv;
    this.organizationId = organizationId;
  }
  async create(orgData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const organization = {
      ...orgData,
      phoneStatus: orgData.phoneStatus || "pending",
      emailStatus: orgData.emailStatus || "pending",
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(KVKeys.organization(this.organizationId), organization);
    return organization;
  }
  async findById() {
    return await this.kv.get(KVKeys.organization(this.organizationId));
  }
  async update(updates) {
    const existing = await this.findById();
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      // Ensure ID doesn't change
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(KVKeys.organization(this.organizationId), updated);
    return updated;
  }
  async delete() {
    const existing = await this.findById();
    if (!existing) return false;
    await this.kv.delete(KVKeys.organization(this.organizationId));
    return true;
  }
  async upsert(orgData) {
    const existing = await this.findById();
    if (existing) {
      return await this.update(orgData);
    } else {
      return await this.create(orgData);
    }
  }
  // Communication settings helpers
  async updateTwilioSettings(settings) {
    return await this.update(settings);
  }
  async updateMailgunSettings(settings) {
    return await this.update(settings);
  }
}
class SalesAgentRepository {
  constructor(kv, organizationId) {
    this.kv = kv;
    this.organizationId = organizationId;
  }
  async create(agentData) {
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const agent = {
      id,
      ...agentData,
      isActive: agentData.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
    await this.kv.put(KVKeys.salesAgent(this.organizationId, id), agent);
    await this.updateAgentIndexes(agent, null);
    return agent;
  }
  async findById(id) {
    return await this.kv.get(KVKeys.salesAgent(this.organizationId, id));
  }
  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id,
      // Ensure ID doesn't change
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.kv.put(KVKeys.salesAgent(this.organizationId, id), updated);
    if (existing.isActive !== updated.isActive) {
      await this.updateAgentIndexes(updated, existing);
    }
    return updated;
  }
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.kv.delete(KVKeys.salesAgent(this.organizationId, id));
    await this.removeFromAllIndexes(existing);
    return true;
  }
  async findAll() {
    const agentIds = await this.kv.getFromIndex(
      KVKeys.agentsByOrg(this.organizationId)
    );
    if (agentIds.length === 0) return [];
    const promises = agentIds.map((id) => this.findById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  async findActive() {
    const agentIds = await this.kv.getFromIndex(
      KVKeys.agentsByStatus(this.organizationId, "active")
    );
    if (agentIds.length === 0) return [];
    const promises = agentIds.map((id) => this.findById(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }
  async bulkCreate(agents) {
    const results = [];
    for (const agentData of agents) {
      try {
        const agent = await this.create(agentData);
        results.push(agent);
      } catch (error) {
        console.error(`Failed to create agent ${agentData.firstName} ${agentData.lastName}:`, error);
      }
    }
    return results;
  }
  async toggleActive(id) {
    const agent = await this.findById(id);
    if (!agent) return null;
    return await this.update(id, { isActive: !agent.isActive });
  }
  // Private helper methods
  async updateAgentIndexes(agent, previousAgent) {
    const promises = [];
    promises.push(this.kv.addToIndex(
      KVKeys.agentsByOrg(this.organizationId),
      agent.id
    ));
    const statusKey = agent.isActive ? "active" : "inactive";
    promises.push(this.kv.addToIndex(
      KVKeys.agentsByStatus(this.organizationId, statusKey),
      agent.id
    ));
    if (previousAgent && previousAgent.isActive !== agent.isActive) {
      const oldStatusKey = previousAgent.isActive ? "active" : "inactive";
      promises.push(this.kv.removeFromIndex(
        KVKeys.agentsByStatus(this.organizationId, oldStatusKey),
        agent.id
      ));
    }
    await Promise.all(promises);
  }
  async removeFromAllIndexes(agent) {
    const promises = [];
    promises.push(this.kv.removeFromIndex(
      KVKeys.agentsByOrg(this.organizationId),
      agent.id
    ));
    const statusKey = agent.isActive ? "active" : "inactive";
    promises.push(this.kv.removeFromIndex(
      KVKeys.agentsByStatus(this.organizationId, statusKey),
      agent.id
    ));
    await Promise.all(promises);
  }
}
class RepositoryFactory {
  constructor(env, organizationId) {
    __publicField(this, "contactRepo");
    __publicField(this, "contactListRepo");
    __publicField(this, "campaignRepo");
    __publicField(this, "userRepo");
    __publicField(this, "organizationRepo");
    __publicField(this, "salesAgentRepo");
    this.env = env;
    this.organizationId = organizationId;
  }
  get contacts() {
    if (!this.contactRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.contactRepo = new ContactRepository(kvClient, this.organizationId);
    }
    return this.contactRepo;
  }
  get contactLists() {
    if (!this.contactListRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.contactListRepo = new ContactListRepository(kvClient, this.organizationId);
    }
    return this.contactListRepo;
  }
  get campaigns() {
    if (!this.campaignRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.campaignRepo = new CampaignRepository(kvClient, this.organizationId);
    }
    return this.campaignRepo;
  }
  get users() {
    if (!this.userRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.userRepo = new UserRepository(kvClient, this.organizationId);
    }
    return this.userRepo;
  }
  get organization() {
    if (!this.organizationRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.organizationRepo = new OrganizationRepository(kvClient, this.organizationId);
    }
    return this.organizationRepo;
  }
  get salesAgents() {
    if (!this.salesAgentRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.salesAgentRepo = new SalesAgentRepository(kvClient, this.organizationId);
    }
    return this.salesAgentRepo;
  }
}
function createRepositories(env, organizationId) {
  return new RepositoryFactory(env, organizationId);
}
async function requireAuth(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId) {
    throw redirect("/sign-in");
  }
  return { userId, orgId };
}
async function requireAuthWithOrg(args) {
  const { userId, orgId } = await requireAuth(args);
  if (!orgId) {
    throw redirect("/select-organization");
  }
  return { userId, orgId };
}
async function loader$a(args) {
  await requireAuthWithOrg(args);
  const csvTemplate = `firstName,lastName,email,phone,company,industry,city,state
John,Doe,john.doe@example.com,+1-555-123-4567,Acme Corp,Technology,San Francisco,CA
Jane,Smith,jane.smith@example.com,+1-555-987-6543,Beta Inc,Marketing,New York,NY
Mike,Johnson,mike.johnson@example.com,+1-555-456-7890,Gamma LLC,Healthcare,Chicago,IL`;
  return new Response(csvTemplate, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="buzzline-contact-template.csv"',
      "Cache-Control": "no-cache"
    }
  });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
const meta$a = () => {
  return [
    { title: "Analytics - BuzzLine" },
    { name: "description", content: "Track your campaign performance and engagement metrics" }
  ];
};
async function loader$9(args) {
  await requireAuthWithOrg(args);
  const analyticsData = {
    overview: {
      totalContacts: 12547,
      totalCampaigns: 38,
      totalSent: 45623,
      avgOpenRate: 24.3,
      avgClickRate: 4.7,
      avgBounceRate: 2.1
    },
    timeSeriesData: {
      "7": {
        sent: [820, 1240, 980, 1450, 1120, 890, 1670],
        opens: [198, 301, 245, 352, 271, 216, 405],
        clicks: [47, 71, 58, 83, 64, 51, 96],
        bounces: [16, 25, 19, 29, 22, 18, 33],
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      },
      "30": {
        sent: Array.from({ length: 30 }, (_, i) => 800 + Math.floor(Math.random() * 600) + Math.sin(i * 0.2) * 200),
        opens: Array.from({ length: 30 }, (_, i) => 180 + Math.floor(Math.random() * 150) + Math.sin(i * 0.2) * 50),
        clicks: Array.from({ length: 30 }, (_, i) => 35 + Math.floor(Math.random() * 40) + Math.sin(i * 0.2) * 15),
        bounces: Array.from({ length: 30 }, (_, i) => 8 + Math.floor(Math.random() * 15) + Math.sin(i * 0.2) * 5),
        labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`)
      },
      "60": {
        sent: Array.from({ length: 60 }, (_, i) => 750 + Math.floor(Math.random() * 700) + Math.sin(i * 0.15) * 250),
        opens: Array.from({ length: 60 }, (_, i) => 170 + Math.floor(Math.random() * 180) + Math.sin(i * 0.15) * 60),
        clicks: Array.from({ length: 60 }, (_, i) => 30 + Math.floor(Math.random() * 50) + Math.sin(i * 0.15) * 20),
        bounces: Array.from({ length: 60 }, (_, i) => 5 + Math.floor(Math.random() * 20) + Math.sin(i * 0.15) * 8),
        labels: Array.from({ length: 60 }, (_, i) => `${i + 1}`)
      },
      "90": {
        sent: Array.from({ length: 90 }, (_, i) => 700 + Math.floor(Math.random() * 800) + Math.sin(i * 0.1) * 300),
        opens: Array.from({ length: 90 }, (_, i) => 150 + Math.floor(Math.random() * 200) + Math.sin(i * 0.1) * 70),
        clicks: Array.from({ length: 90 }, (_, i) => 25 + Math.floor(Math.random() * 60) + Math.sin(i * 0.1) * 25),
        bounces: Array.from({ length: 90 }, (_, i) => 3 + Math.floor(Math.random() * 25) + Math.sin(i * 0.1) * 10),
        labels: Array.from({ length: 90 }, (_, i) => `${i + 1}`)
      }
    },
    campaignStats: [
      { name: "Spring Product Launch", sent: 2847, opens: 692, clicks: 164, bounces: 57, openRate: 24.3, clickRate: 5.8, status: "completed" },
      { name: "Weekly Newsletter #42", sent: 1923, opens: 461, clicks: 89, bounces: 38, openRate: 24, clickRate: 4.6, status: "completed" },
      { name: "Customer Survey 2024", sent: 3456, opens: 864, clicks: 197, bounces: 69, openRate: 25, clickRate: 5.7, status: "completed" },
      { name: "Black Friday Preview", sent: 4821, opens: 1205, clicks: 289, bounces: 96, openRate: 25, clickRate: 6, status: "completed" },
      { name: "Holiday Special Offer", sent: 3892, opens: 934, clicks: 178, bounces: 78, openRate: 24, clickRate: 4.6, status: "sending" }
    ],
    channelBreakdown: {
      email: { sent: 32840, success: 31456, bounces: 689, unsubscribes: 234 },
      sms: { sent: 12783, success: 12621, bounces: 89, unsubscribes: 73 }
    }
  };
  return json({ analyticsData });
}
function AnalyticsIndex() {
  const { analyticsData } = useLoaderData();
  const [timeFrame, setTimeFrame] = useState("7");
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Analytics" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Track your campaign performance and engagement metrics" })
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
          "select",
          {
            value: timeFrame,
            onChange: (e) => setTimeFrame(e.target.value),
            className: "px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
            children: [
              /* @__PURE__ */ jsx("option", { value: "7", children: "Last 7 days" }),
              /* @__PURE__ */ jsx("option", { value: "30", children: "Last 30 days" }),
              /* @__PURE__ */ jsx("option", { value: "60", children: "Last 60 days" }),
              /* @__PURE__ */ jsx("option", { value: "90", children: "Last 90 days" })
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Contacts" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: analyticsData.overview.totalContacts.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Campaigns" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: analyticsData.overview.totalCampaigns })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Messages Sent" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: analyticsData.overview.totalSent.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Avg. Open Rate" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: [
              analyticsData.overview.avgOpenRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxs("svg", { className: "w-6 h-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Avg. Click Rate" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: [
              analyticsData.overview.avgClickRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Avg. Bounce Rate" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: [
              analyticsData.overview.avgBounceRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Performance Over Time" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Messages sent, opens, and clicks" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx(PerformanceChart, { data: analyticsData.timeSeriesData[timeFrame] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Channel Performance" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Email vs SMS delivery" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-[#313131]", children: "Email" }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600", children: [
                  analyticsData.channelBreakdown.email.sent.toLocaleString(),
                  " sent"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "bg-[#5EC0DA] h-2 rounded-full",
                  style: { width: `${analyticsData.channelBreakdown.email.success / analyticsData.channelBreakdown.email.sent * 100}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-gray-500 mt-1", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Success: ",
                  analyticsData.channelBreakdown.email.success.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Bounces: ",
                  analyticsData.channelBreakdown.email.bounces
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Unsubs: ",
                  analyticsData.channelBreakdown.email.unsubscribes
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-[#313131]", children: "SMS" }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600", children: [
                  analyticsData.channelBreakdown.sms.sent.toLocaleString(),
                  " sent"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "bg-[#ED58A0] h-2 rounded-full",
                  style: { width: `${analyticsData.channelBreakdown.sms.success / analyticsData.channelBreakdown.sms.sent * 100}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-gray-500 mt-1", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Success: ",
                  analyticsData.channelBreakdown.sms.success.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Bounces: ",
                  analyticsData.channelBreakdown.sms.bounces
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Unsubs: ",
                  analyticsData.channelBreakdown.sms.unsubscribes
                ] })
              ] })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Recent Campaign Performance" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Detailed metrics for your latest campaigns" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Campaign" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Sent" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Opens" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Clicks" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Open Rate" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Click Rate" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: analyticsData.campaignStats.map((campaign, i) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) }),
              /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] text-sm", children: campaign.name }) })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: campaign.sent.toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: campaign.opens.toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: campaign.clicks.toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", children: [
              campaign.openRate,
              "%"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", children: [
              campaign.clickRate,
              "%"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${campaign.status === "completed" ? "bg-green-100 text-green-800" : campaign.status === "sending" ? "bg-[#5EC0DA]/10 text-[#5EC0DA]" : "bg-gray-100 text-gray-800"}`, children: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) }) })
          ] }, i)) })
        ] }) }) })
      ] })
    ] }) })
  ] });
}
function PerformanceChart({ data }) {
  const chartData = {
    labels: data.labels.length <= 7 ? data.labels : data.labels.map((label, i) => {
      if (data.labels.length <= 30) {
        return i % 5 === 0 ? `Day ${label}` : "";
      }
      return i % Math.ceil(data.labels.length / 8) === 0 ? `Day ${label}` : "";
    }),
    datasets: [
      {
        label: "Messages Sent",
        data: data.sent,
        borderColor: "#5EC0DA",
        backgroundColor: "rgba(94, 192, 218, 0.1)",
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "#5EC0DA",
        pointBorderColor: "#5EC0DA",
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: "Opens",
        data: data.opens,
        borderColor: "#ED58A0",
        backgroundColor: "rgba(237, 88, 160, 0.1)",
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "#ED58A0",
        pointBorderColor: "#ED58A0",
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: "Clicks",
        data: data.clicks,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#10B981",
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: "Bounces",
        data: data.bounces,
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "#EF4444",
        pointBorderColor: "#EF4444",
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          },
          color: "#6B7280"
        }
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#F9FAFB",
        bodyColor: "#F9FAFB",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: "rgba(229, 231, 235, 0.5)"
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11
          },
          maxTicksLimit: 8
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(229, 231, 235, 0.5)"
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11
          },
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: "index"
    }
  };
  return /* @__PURE__ */ jsx("div", { style: { height: "350px" }, children: /* @__PURE__ */ jsx(Line, { data: chartData, options }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: AnalyticsIndex,
  loader: loader$9,
  meta: meta$a
}, Symbol.toStringTag, { value: "Module" }));
const meta$9 = () => {
  return [
    { title: "Campaigns - BuzzLine" },
    { name: "description", content: "Manage your marketing campaigns" }
  ];
};
async function loader$8({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const repositories = createRepositories(context.env, orgId);
  const campaignsResult = await repositories.campaigns.findAll(50, 0);
  const contactLists = await repositories.contactLists.findAll();
  const contactListMap = new Map(contactLists.map((list) => [list.id, list]));
  const campaigns = campaignsResult.items.map((campaign) => ({
    ...campaign,
    contactList: contactListMap.get(campaign.contactListId) || {
      name: "Unknown List",
      contactCount: 0
    }
  }));
  return json({ campaigns });
}
function CampaignsIndex() {
  const { campaigns } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Campaigns" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Create and manage your marketing campaigns" })
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/campaigns/new",
            className: "bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
            children: "Create Campaign"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Campaigns" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-[#313131] mt-1", children: campaigns.length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Campaigns" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-[#313131] mt-1", children: campaigns.filter((c) => c.status === "sending" || c.status === "scheduled").length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Sent Campaigns" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-[#313131] mt-1", children: campaigns.filter((c) => c.status === "sent").length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })
        ] }) })
      ] }),
      campaigns.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-[#313131] mb-2", children: "No campaigns yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mb-6", children: "Get started by creating your first marketing campaign to reach your contacts" }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/campaigns/new",
            className: "bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
            children: "Create Your First Campaign"
          }
        )
      ] }) }) : /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Recent Campaigns" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Manage and track your marketing campaigns" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Campaign" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Contact List" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Updated" }),
            /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: campaigns.map((campaign) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) }),
              /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] text-sm", children: campaign.name }) })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-[#313131]", children: campaign.contactList.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                campaign.contactList.contactCount,
                " contacts"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${campaign.status === "sent" ? "bg-green-100 text-green-800" : campaign.status === "sending" ? "bg-[#5EC0DA]/10 text-[#5EC0DA]" : campaign.status === "scheduled" ? "bg-yellow-100 text-yellow-800" : campaign.status === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`, children: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) }) }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: new Date(campaign.updatedAt).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: `/campaigns/${campaign.id}`,
                  className: "text-[#5EC0DA] hover:text-[#4a9fb5] text-sm font-medium",
                  children: "View"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "|" }),
              /* @__PURE__ */ jsx("button", { className: "text-[#ED58A0] hover:text-[#d948a0] text-sm font-medium", children: "Edit" })
            ] }) })
          ] }, campaign.id)) })
        ] }) }) })
      ] })
    ] }) })
  ] });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: CampaignsIndex,
  loader: loader$8,
  meta: meta$9
}, Symbol.toStringTag, { value: "Module" }));
const meta$8 = () => {
  return [
    { title: "Upload Contacts - BuzzLine" },
    { name: "description", content: "Upload and import contact lists from CSV with dynamic campaign tags" }
  ];
};
async function loader$7({ request, context }) {
  await requireAuthWithOrg({ request, context });
  return json({});
}
async function action$5({ request, context }) {
  try {
    const { userId, orgId } = await requireAuthWithOrg({ request, context });
    const formData = await request.formData();
    const listName = formData.get("listName");
    const csvData = formData.get("csvData");
    console.log("Upload action called:", { listName: !!listName, csvData: !!csvData, orgId });
    const errors = {};
    if (!listName) errors.listName = "Contact list name is required";
    if (!csvData) errors.csvData = "CSV data is required";
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return json({ errors }, { status: 400 });
    }
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
      // Don't transform headers to preserve original casing for campaign tags
    });
    if (parsedData.errors.length > 0) {
      return json(
        { errors: { csvData: "Invalid CSV format: " + parsedData.errors[0].message } },
        { status: 400 }
      );
    }
    const contacts = parsedData.data;
    if (contacts.length === 0) {
      return json(
        { errors: { csvData: "No valid contact data found in CSV" } },
        { status: 400 }
      );
    }
    const repositories = createRepositories(context.env, orgId);
    const contactList = await repositories.contactLists.create({ name: listName });
    let validContactCount = 0;
    const skippedContacts = [];
    for (const [index, row] of contacts.entries()) {
      const firstName = findFieldValue(row, ["firstName", "first_name", "first name", "fname"]);
      const lastName = findFieldValue(row, ["lastName", "last_name", "last name", "lname"]);
      const email = findFieldValue(row, ["email", "email address", "emailAddress"]);
      const phone = findFieldValue(row, ["phone", "mobile", "phone number", "phoneNumber", "cell"]);
      if (!firstName || !lastName) {
        skippedContacts.push(`Row ${index + 2}: Missing required firstName or lastName`);
        continue;
      }
      if (!email && !phone) {
        skippedContacts.push(`Row ${index + 2}: Missing both email and phone`);
        continue;
      }
      const metadata = {};
      for (const [key, value] of Object.entries(row)) {
        if (value && value.toString().trim()) {
          metadata[key] = value.toString().trim();
        }
      }
      try {
        await repositories.contacts.create({
          contactListId: contactList.id,
          firstName,
          lastName,
          email: email || void 0,
          phone: phone || void 0,
          status: "active",
          subGroups: [],
          metadata,
          flags: {
            emailOptedOut: false,
            smsOptedOut: false,
            isVip: false
          },
          tags: []
        });
        validContactCount++;
      } catch (error) {
        console.error(`Failed to create contact ${firstName} ${lastName}:`, error);
        skippedContacts.push(`Row ${index + 2}: Failed to create contact`);
      }
    }
    if (validContactCount === 0) {
      await repositories.contactLists.delete(contactList.id);
      const errorMsg = skippedContacts.length > 0 ? `No valid contacts found. Issues: ${skippedContacts.slice(0, 3).join("; ")}${skippedContacts.length > 3 ? "..." : ""}` : "No valid contacts found. Each contact must have firstName, lastName, and either email or phone.";
      return json(
        { errors: { csvData: errorMsg } },
        { status: 400 }
      );
    }
    return redirect(`/contacts?imported=${validContactCount}&skipped=${skippedContacts.length}`);
  } catch (error) {
    console.error("Error processing CSV:", error);
    return json(
      { errors: { general: "An error occurred while processing the CSV file" } },
      { status: 500 }
    );
  }
}
function findFieldValue(row, possibleKeys) {
  for (const key of possibleKeys) {
    if (row[key]) return row[key].toString().trim();
    const foundKey = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());
    if (foundKey && row[foundKey]) {
      return row[foundKey].toString().trim();
    }
  }
  return null;
}
function UploadContacts() {
  var _a, _b, _c, _d;
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvData, setCsvData] = useState("");
  const handleFileUpload = (event) => {
    var _a2;
    const file = (_a2 = event.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      var _a3;
      const text = (_a3 = e.target) == null ? void 0 : _a3.result;
      setCsvData(text);
      const parsed = Papa.parse(text, {
        header: false,
        skipEmptyLines: true
      });
      setCsvPreview(parsed.data.slice(0, 5));
    };
    reader.readAsText(file);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-white shadow-sm border-b border-gray-100", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center h-20", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "flex-shrink-0 flex items-center space-x-2", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: "/Buzzline_Logo.png",
          alt: "BuzzLine",
          className: "h-12 w-auto"
        }
      ) }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/contacts",
          className: "text-[#5EC0DA] hover:text-[#4a9fb5] font-medium transition-colors",
          children: "← Back to Contacts"
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-[#313131] mb-4", children: "Upload Contact List" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-600 max-w-2xl mx-auto", children: "Import your contacts from a CSV file with support for dynamic campaign personalization tags" })
      ] }),
      ((_a = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _a.general) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-red-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.errors.general }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-[#313131] mb-6", children: "Upload CSV File" }),
          /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "csvData", value: csvData }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "listName", className: "block text-sm font-medium text-[#313131] mb-2", children: "Contact List Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "listName",
                  name: "listName",
                  required: true,
                  className: `w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.listName) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "e.g., Spring 2024 Newsletter Subscribers"
                }
              ),
              ((_c = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _c.listName) && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: actionData.errors.listName })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "csvFile", className: "block text-sm font-medium text-[#313131] mb-2", children: "CSV File *" }),
              /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  id: "csvFile",
                  accept: ".csv",
                  onChange: handleFileUpload,
                  className: "w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#5EC0DA]/10 file:text-[#5EC0DA] hover:file:bg-[#5EC0DA]/20 transition-colors"
                }
              ) }),
              ((_d = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _d.csvData) && /* @__PURE__ */ jsx("div", { className: "mt-2 p-3 bg-red-50 border border-red-200 rounded-lg", children: /* @__PURE__ */ jsx("p", { className: "text-red-800 text-sm", children: actionData.errors.csvData }) }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-2", children: "Upload a CSV file with your contact information" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3 pt-6", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/contacts",
                  className: "px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: isSubmitting || !csvData,
                  className: "px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] border border-transparent rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
                  children: isSubmitting ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 animate-spin", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                    /* @__PURE__ */ jsx("span", { children: "Processing..." })
                  ] }) : "Import Contacts"
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-[#5EC0DA]/10 to-[#ED58A0]/10 rounded-2xl p-6 border border-gray-100", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-[#313131] mb-3 flex items-center", children: [
              /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-[#5EC0DA] mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }),
              "Download CSV Template"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Get started with our pre-formatted CSV template that includes example data and all the recommended columns." }),
            /* @__PURE__ */ jsxs(
              "a",
              {
                href: "/contacts/template",
                download: true,
                className: "inline-flex items-center space-x-2 bg-[#5EC0DA] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a9fb5] transition-colors shadow-sm",
                children: [
                  /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Download Template" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-[#313131] mb-4 flex items-center", children: [
              /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-[#ED58A0] mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }),
              "CSV Requirements"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] mb-2", children: "Required Columns:" }),
                /* @__PURE__ */ jsxs("ul", { className: "space-y-1 ml-4", children: [
                  /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-[#ED58A0] rounded-full" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-2 py-0.5 rounded", children: "firstName" }),
                      " - Contact's first name"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-[#ED58A0] rounded-full" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-2 py-0.5 rounded", children: "lastName" }),
                      " - Contact's last name"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-[#ED58A0] rounded-full" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-2 py-0.5 rounded", children: "email" }),
                      " OR ",
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-2 py-0.5 rounded", children: "phone" }),
                      " (at least one)"
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] mb-2", children: "Contact Personalization:" }),
                /* @__PURE__ */ jsxs("ul", { className: "space-y-1 ml-4 text-gray-600", children: [
                  /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-[#5EC0DA] rounded-full" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "All columns become dynamic tags: ",
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "{firstName}" }),
                      ", ",
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "{company}" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-[#5EC0DA] rounded-full" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Add columns titles like ",
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "company" }),
                      ", ",
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "industry" }),
                      ", ",
                      /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "city" }),
                      " for rich personalization"
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] }),
          csvPreview.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-[#313131] mb-4 flex items-center", children: [
              /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 text-[#5EC0DA] mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
                /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
              ] }),
              "CSV Preview"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsx("table", { className: "min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: csvPreview.map((row, i) => /* @__PURE__ */ jsx("tr", { className: i === 0 ? "bg-[#5EC0DA]/5 font-medium" : "hover:bg-gray-50", children: row.map((cell, j) => /* @__PURE__ */ jsx("td", { className: "px-3 py-2 border-r border-gray-200 last:border-r-0 text-xs", children: cell }, j)) }, i)) }) }) }),
            csvPreview.length === 5 && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-3 text-center", children: "Showing first 5 rows..." })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: UploadContacts,
  loader: loader$7,
  meta: meta$8
}, Symbol.toStringTag, { value: "Module" }));
const meta$7 = () => {
  return [
    { title: "Contacts - BuzzLine" },
    { name: "description", content: "Manage your contact lists and recipients" }
  ];
};
async function loader$6({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const repositories = createRepositories(context.env, orgId);
  const contactsResult = await repositories.contacts.findByFilter({}, 50, 0);
  const contactLists = await repositories.contactLists.findAll();
  return json({
    contacts: contactsResult.items,
    contactLists,
    orgId
  });
}
function ContactsIndex() {
  const { contacts, contactLists } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Contacts" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage your contact lists and recipients" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/contacts/upload",
              className: "bg-[#5EC0DA] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4a9fb5] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
              children: "Upload Contacts"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/contacts/new",
              className: "bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
              children: "Add Contact"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Contacts" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-[#313131] mt-1", children: contacts.length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Contact Lists" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-[#313131] mt-1", children: contactLists.length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 10h16M4 14h16M4 18h16" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Contacts" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-[#313131] mt-1", children: contacts.filter((c) => !c.flags.emailOptedOut && !c.flags.smsOptedOut).length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Contact Lists" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Organize your contacts into groups" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: contactLists.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "No contact lists yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-xs mt-1", children: "Upload a CSV to create your first list" })
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: contactLists.map((list) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#5EC0DA] rounded-full" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] text-sm", children: list.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                      list.contactCount,
                      " contacts"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: `/contacts/lists/${list.id}`,
                    className: "text-[#5EC0DA] hover:text-[#4a9fb5] text-sm font-medium",
                    children: "View"
                  }
                )
              ]
            },
            list.id
          )) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Recent Contacts" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Latest contacts added to your lists" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: contacts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" }) }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-[#313131] mb-2", children: "No contacts yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mb-6", children: "Get started by uploading a CSV file or adding contacts manually" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-center space-x-3", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/contacts/upload",
                  className: "bg-[#5EC0DA] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a9fb5] transition-colors",
                  children: "Upload CSV"
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/contacts/new",
                  className: "bg-[#ED58A0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d948a0] transition-colors",
                  children: "Add Contact"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100", children: [
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Name" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Email" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Phone" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "List" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: contacts.map((contact) => {
              var _a, _b, _c;
              return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [
                /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-[#ED58A0] font-medium text-sm", children: ((_a = contact.firstName) == null ? void 0 : _a[0]) || ((_c = (_b = contact.email) == null ? void 0 : _b[0]) == null ? void 0 : _c.toUpperCase()) || "?" }) }),
                  /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] text-sm", children: contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName || "N/A" }) })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: contact.email || "N/A" }),
                /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: contact.phone || "N/A" }),
                /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: "Demo List" }),
                /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${contact.status === "active" ? "bg-green-100 text-green-800" : contact.status === "unsubscribed" ? "bg-red-100 text-red-800" : contact.status === "archived" ? "bg-gray-100 text-gray-800" : contact.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`, children: contact.status }) }),
                /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsx("button", { className: "text-[#5EC0DA] hover:text-[#4a9fb5] text-sm font-medium", children: "Edit" }),
                  /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "|" }),
                  /* @__PURE__ */ jsx("button", { className: "text-red-600 hover:text-red-700 text-sm font-medium", children: "Delete" })
                ] }) })
              ] }, contact.id);
            }) })
          ] }) }) })
        ] }) })
      ] })
    ] }) })
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ContactsIndex,
  loader: loader$6,
  meta: meta$7
}, Symbol.toStringTag, { value: "Module" }));
const meta$6 = () => {
  return [
    { title: "Settings - BuzzLine" },
    { name: "description", content: "Manage your organization communication settings" }
  ];
};
async function loader$5({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const repositories = createRepositories(context.env, orgId);
  let organization = await repositories.organization.findById();
  if (!organization) {
    organization = await repositories.organization.create({
      id: orgId,
      name: "My Organization"
    });
  }
  return json({ organization });
}
async function action$4({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();
  const action2 = formData.get("_action");
  if (action2 === "updateEmail") {
    const emailDomain = formData.get("emailDomain");
    const emailFromAddress = formData.get("emailFromAddress");
    const errors = {};
    if (!emailDomain) {
      errors.emailDomain = "Email domain is required";
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(emailDomain)) {
      errors.emailDomain = "Please enter a valid domain (e.g., yourdomain.com)";
    }
    if (!emailFromAddress) {
      errors.emailFromAddress = "From email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFromAddress)) {
      errors.emailFromAddress = "Please enter a valid email address";
    } else if (!emailFromAddress.endsWith(`@${emailDomain}`)) {
      errors.emailFromAddress = `Email address must be from domain @${emailDomain}`;
    }
    if (Object.keys(errors).length > 0) {
      return json({ errors, success: false }, { status: 400 });
    }
    try {
      const repositories = createRepositories(context.env, orgId);
      await repositories.organization.updateMailgunSettings({
        emailDomain,
        emailFromAddress,
        emailStatus: "pending"
        // Reset to pending for re-verification
      });
      return json({
        success: true,
        message: "Email settings saved. Domain verification pending."
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      return json({
        errors: { general: "Failed to update email settings" },
        success: false
      }, { status: 500 });
    }
  }
  if (action2 === "requestPhone") {
    try {
      const repositories = createRepositories(context.env, orgId);
      const mockPhoneNumber = `+1${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 9e3) + 1e3}`;
      const mockSid = `PN${Math.random().toString(36).substr(2, 32)}`;
      await repositories.organization.updateTwilioSettings({
        twilioPhoneNumber: mockPhoneNumber,
        phoneNumberSid: mockSid,
        phoneStatus: "active"
      });
      return json({
        success: true,
        message: `Phone number ${mockPhoneNumber} has been assigned to your organization.`
      });
    } catch (error) {
      console.error("Error requesting phone number:", error);
      return json({
        errors: { general: "Failed to assign phone number" },
        success: false
      }, { status: 500 });
    }
  }
  return json({ errors: { general: "Invalid action" }, success: false }, { status: 400 });
}
function Settings() {
  var _a, _b, _c, _d, _e;
  const { organization } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Organization Settings" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage your communication channels and campaign settings" })
      ] }),
      (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsx("div", { className: "bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-green-800", children: actionData.message }) })
      ] }) }),
      ((_a = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _a.general) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-red-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.errors.general }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Email Configuration" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Set up your custom email domain" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${organization.emailStatus === "verified" ? "bg-green-500" : organization.emailStatus === "pending" ? "bg-yellow-500" : "bg-red-500"}` }),
              /* @__PURE__ */ jsx("span", { className: `text-xs font-medium ${organization.emailStatus === "verified" ? "text-green-700" : organization.emailStatus === "pending" ? "text-yellow-700" : "text-red-700"}`, children: organization.emailStatus.charAt(0).toUpperCase() + organization.emailStatus.slice(1) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "updateEmail" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "emailDomain", className: "block text-sm font-medium text-[#313131] mb-2", children: "Email Domain *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    id: "emailDomain",
                    name: "emailDomain",
                    defaultValue: organization.emailDomain || "",
                    className: `w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.emailDomain) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                    placeholder: "yourdomain.com"
                  }
                ),
                ((_c = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _c.emailDomain) && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: actionData.errors.emailDomain }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-2", children: "We'll verify this domain with Mailgun on your behalf" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "emailFromAddress", className: "block text-sm font-medium text-[#313131] mb-2", children: "Default From Email *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    id: "emailFromAddress",
                    name: "emailFromAddress",
                    defaultValue: organization.emailFromAddress || "",
                    className: `w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_d = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _d.emailFromAddress) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                    placeholder: "campaigns@yourdomain.com"
                  }
                ),
                ((_e = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _e.emailFromAddress) && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: actionData.errors.emailFromAddress }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-2", children: "All email campaigns will be sent from this address" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: isSubmitting,
                  className: "w-full px-6 py-3 text-sm font-semibold text-white bg-[#5EC0DA] rounded-xl hover:bg-[#4a9fb5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md",
                  children: isSubmitting ? "Saving..." : "Save Email Settings"
                }
              )
            ] }),
            organization.emailStatus === "verified" && organization.emailFromAddress && /* @__PURE__ */ jsx("div", { className: "mt-6 p-4 bg-green-50 rounded-lg border border-green-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-green-800", children: "Domain Verified" }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-700", children: [
                  "Campaigns will be sent from: ",
                  organization.emailFromAddress
                ] })
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "SMS Configuration" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Your dedicated Twilio phone number" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${organization.phoneStatus === "active" ? "bg-green-500" : organization.phoneStatus === "pending" ? "bg-yellow-500" : "bg-red-500"}` }),
              /* @__PURE__ */ jsx("span", { className: `text-xs font-medium ${organization.phoneStatus === "active" ? "text-green-700" : organization.phoneStatus === "pending" ? "text-yellow-700" : "text-red-700"}`, children: organization.phoneStatus.charAt(0).toUpperCase() + organization.phoneStatus.slice(1) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: organization.twilioPhoneNumber && organization.phoneStatus === "active" ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 bg-green-50 rounded-lg border border-green-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-green-800", children: "Phone Number Active" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-mono text-green-700", children: organization.twilioPhoneNumber }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-green-600", children: "All SMS campaigns will be sent from this number" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600 space-y-2", children: [
              /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "Features:" }) }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside ml-4 space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "Automatic STOP/START handling" }),
                /* @__PURE__ */ jsx("li", { children: "Delivery receipts and analytics" }),
                /* @__PURE__ */ jsx("li", { children: "North American coverage" }),
                /* @__PURE__ */ jsx("li", { children: "Compliant with carrier regulations" })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-[#313131] mb-2", children: "No Phone Number" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Request a dedicated phone number for SMS campaigns" }),
              /* @__PURE__ */ jsxs(Form, { method: "post", children: [
                /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "requestPhone" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    disabled: isSubmitting,
                    className: "px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md",
                    children: isSubmitting ? "Requesting..." : "Request Phone Number"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600 space-y-2", children: [
              /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "What you'll get:" }) }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside ml-4 space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "Dedicated US phone number" }),
                /* @__PURE__ */ jsx("li", { children: "Automatic compliance handling" }),
                /* @__PURE__ */ jsx("li", { children: "Real-time delivery tracking" }),
                /* @__PURE__ */ jsx("li", { children: "Professional sender identity" })
              ] })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-[#313131] mb-4", children: "Organization Information" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-600 mb-1", children: "Organization Name" }),
            /* @__PURE__ */ jsx("p", { className: "text-[#313131] font-medium", children: organization.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-600 mb-1", children: "Organization ID" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 font-mono text-sm", children: organization.id })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: Settings,
  loader: loader$5,
  meta: meta$6
}, Symbol.toStringTag, { value: "Module" }));
const meta$5 = () => {
  return [
    { title: "New Campaign - BuzzLine" },
    { name: "description", content: "Create a new marketing campaign" }
  ];
};
async function loader$4({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const repositories = createRepositories(context.env, orgId);
  const contactLists = await repositories.contactLists.findAll();
  const organization = await repositories.organization.findById() || {
    id: orgId,
    name: "My Organization",
    twilioPhoneNumber: null,
    emailFromAddress: null,
    phoneStatus: "pending",
    emailStatus: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return json({ contactLists, organization });
}
async function action$3({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();
  const name = formData.get("name");
  const contactListId = formData.get("contactListId");
  const emailSubject = formData.get("emailSubject");
  const emailContent = formData.get("emailContent");
  const smsContent = formData.get("smsContent");
  const errors = {};
  if (!name) errors.name = "Campaign name is required";
  if (!contactListId) errors.contactListId = "Contact list is required";
  if (!emailSubject && !smsContent) {
    errors.general = "At least one message type (email or SMS) is required";
  }
  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }
  const repositories = createRepositories(context.env, orgId);
  await repositories.campaigns.create({
    name,
    organizationId: orgId,
    contactListId,
    status: "draft",
    emailTemplate: emailSubject && emailContent ? {
      subject: emailSubject,
      content: emailContent
    } : void 0,
    smsTemplate: smsContent ? {
      content: smsContent
    } : void 0
  });
  return redirect(`/campaigns`);
}
function NewCampaign() {
  var _a, _b, _c, _d, _e;
  const { contactLists, organization } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/campaigns",
              className: "text-[#5EC0DA] hover:text-[#4a9fb5] transition-colors",
              children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Create New Campaign" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Design and launch your marketing campaign" })
      ] }),
      ((_a = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _a.general) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-red-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.errors.general }) })
      ] }) }),
      /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Campaign Details" }) }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-[#313131] mb-2", children: "Campaign Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "name",
                  name: "name",
                  required: true,
                  className: `w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.name) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "e.g., Spring 2024 Product Launch"
                }
              ),
              ((_c = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _c.name) && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: actionData.errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "contactListId", className: "block text-sm font-medium text-[#313131] mb-2", children: "Contact List *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "contactListId",
                  name: "contactListId",
                  required: true,
                  className: `w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_d = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _d.contactListId) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select a contact list" }),
                    contactLists.map((list) => /* @__PURE__ */ jsxs("option", { value: list.id, children: [
                      list.name,
                      " (",
                      list.contactCount,
                      " contacts)"
                    ] }, list.id))
                  ]
                }
              ),
              ((_e = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _e.contactListId) && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: actionData.errors.contactListId }),
              contactLists.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-yellow-600 text-sm mt-1", children: "No contact lists found. Create one first in the Contacts section." })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Email Message" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Design your email campaign (optional)" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-2", children: (organization == null ? void 0 : organization.emailStatus) === "verified" && (organization == null ? void 0 : organization.emailFromAddress) ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-green-700 font-medium", children: [
                "From: ",
                organization.emailFromAddress
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-yellow-500 rounded-full" }),
              /* @__PURE__ */ jsx(Link, { to: "/settings", className: "text-xs text-yellow-700 font-medium hover:text-yellow-800", children: "Setup required →" })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "emailSubject", className: "block text-sm font-medium text-[#313131] mb-2", children: "Subject Line" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "emailSubject",
                  name: "emailSubject",
                  className: "w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
                  placeholder: "Enter compelling email subject"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "emailContent", className: "block text-sm font-medium text-[#313131] mb-2", children: "Email Content" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "emailContent",
                  name: "emailContent",
                  rows: 6,
                  className: "w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
                  placeholder: "Write your email message here. Use dynamic tags like {firstName} for personalization."
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 mt-2", children: [
                "Use dynamic tags like ",
                /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "{firstName}" }),
                ", ",
                /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "{company}" }),
                " for personalization."
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "SMS Message" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Create your SMS campaign (optional)" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-2", children: (organization == null ? void 0 : organization.phoneStatus) === "active" && (organization == null ? void 0 : organization.twilioPhoneNumber) ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-green-700 font-medium", children: [
                "From: ",
                organization.twilioPhoneNumber
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-yellow-500 rounded-full" }),
              /* @__PURE__ */ jsx(Link, { to: "/settings", className: "text-xs text-yellow-700 font-medium hover:text-yellow-800", children: "Setup required →" })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "smsContent", className: "block text-sm font-medium text-[#313131] mb-2", children: "SMS Content" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "smsContent",
                name: "smsContent",
                rows: 3,
                maxLength: 160,
                className: "w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
                placeholder: "Hi {firstName}, check out our latest offer!"
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 mt-2", children: [
              "Keep SMS messages under 160 characters. Use ",
              /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-1 rounded", children: "{firstName}" }),
              " for personalization."
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3 pt-6", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/campaigns",
              className: "px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: isSubmitting,
              className: "px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
              children: isSubmitting ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 animate-spin", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                /* @__PURE__ */ jsx("span", { children: "Creating..." })
              ] }) : "Create Campaign"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: NewCampaign,
  loader: loader$4,
  meta: meta$5
}, Symbol.toStringTag, { value: "Module" }));
const meta$4 = () => {
  return [
    { title: "Add Contact - BuzzLine" },
    { name: "description", content: "Add a new contact to your lists" }
  ];
};
async function loader$3({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const repositories = createRepositories(context.env, orgId);
  const contactLists = await repositories.contactLists.findAll();
  return json({ contactLists, orgId });
}
async function action$2({ request, context }) {
  var _a, _b, _c, _d, _e;
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();
  const firstName = (_a = formData.get("firstName")) == null ? void 0 : _a.toString().trim();
  const lastName = (_b = formData.get("lastName")) == null ? void 0 : _b.toString().trim();
  const email = (_c = formData.get("email")) == null ? void 0 : _c.toString().trim();
  const phone = (_d = formData.get("phone")) == null ? void 0 : _d.toString().trim();
  const contactListId = (_e = formData.get("contactListId")) == null ? void 0 : _e.toString();
  const errors = {};
  if (!firstName) {
    errors.firstName = "First name is required";
  }
  if (!lastName) {
    errors.lastName = "Last name is required";
  }
  if (!email && !phone) {
    errors.email = "Either email or phone is required";
    errors.phone = "Either email or phone is required";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }
  if (phone && !/^[\+]?[\d\s\(\)\-]{10,}$/.test(phone)) {
    errors.phone = "Please enter a valid phone number";
  }
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 400 });
  }
  try {
    const repositories = createRepositories(context.env, orgId);
    let finalContactListId = contactListId;
    if (!finalContactListId) {
      const defaultList = await repositories.contactLists.findOrCreate("General");
      finalContactListId = defaultList.id;
    }
    await repositories.contacts.create({
      contactListId: finalContactListId,
      firstName,
      lastName,
      email: email || void 0,
      phone: phone || void 0,
      status: "active",
      subGroups: [],
      metadata: {},
      flags: {
        emailOptedOut: false,
        smsOptedOut: false,
        isVip: false
      },
      tags: []
    });
    return redirect("/contacts");
  } catch (error) {
    console.error("Error creating contact:", error);
    return json({
      errors: { general: "Failed to create contact. Please try again." },
      success: false
    }, { status: 500 });
  }
}
function NewContact() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { contactLists } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/contacts",
              className: "text-[#5EC0DA] hover:text-[#4a9fb5] transition-colors",
              children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Add New Contact" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Create a new contact and add them to your lists" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Contact Information" }) }),
        /* @__PURE__ */ jsxs(Form, { method: "post", className: "p-6 space-y-6", children: [
          ((_a = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _a.general) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
            /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-red-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.errors.general }) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-[#313131] mb-2", children: "First Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "firstName",
                  name: "firstName",
                  className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.firstName) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "John"
                }
              ),
              ((_c = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _c.firstName) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.firstName })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-[#313131] mb-2", children: "Last Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "lastName",
                  name: "lastName",
                  className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_d = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _d.lastName) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "Doe"
                }
              ),
              ((_e = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _e.lastName) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.lastName })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-[#313131] mb-2", children: "Email Address *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                id: "email",
                name: "email",
                className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_f = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _f.email) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                placeholder: "john.doe@example.com"
              }
            ),
            ((_g = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _g.email) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-[#313131] mb-2", children: "Phone Number" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                id: "phone",
                name: "phone",
                className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_h = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _h.phone) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                placeholder: "+1 (555) 123-4567"
              }
            ),
            ((_i = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _i.phone) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.phone })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "contactListId", className: "block text-sm font-medium text-[#313131] mb-2", children: "Contact List (Optional)" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "contactListId",
                name: "contactListId",
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "No list (can be assigned later)" }),
                  contactLists.map((list) => /* @__PURE__ */ jsx("option", { value: list.id, children: list.name }, list.id))
                ]
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Assign this contact to a specific list, or leave blank to assign later." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3 pt-6 border-t border-gray-100", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/contacts",
                className: "px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: isSubmitting,
                className: "px-6 py-2 text-sm font-semibold text-white bg-[#ED58A0] rounded-lg hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md",
                children: isSubmitting ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 animate-spin", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Creating..." })
                ] }) : "Create Contact"
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: NewContact,
  loader: loader$3,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
const meta$3 = () => {
  return [
    { title: "Upload Sales Team - BuzzLine" },
    { name: "description", content: "Upload your sales team data via CSV" }
  ];
};
async function loader$2({ request, context }) {
  await requireAuthWithOrg({ request, context });
  return json({});
}
async function action$1({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "download-template") {
    const csvData = [
      ["firstName", "lastName", "email", "phone", "title", "companyName", "region", "territory"],
      ["John", "Smith", "john.smith@company.com", "+1-555-0123", "Senior Sales Rep", "BuzzLine Inc", "North America", "West Coast"],
      ["Sarah", "Johnson", "sarah.j@company.com", "+1-555-0124", "Account Manager", "BuzzLine Inc", "North America", "East Coast"],
      ["Mike", "Davis", "mike.davis@company.com", "+1-555-0125", "Sales Director", "BuzzLine Inc", "North America", "National"]
    ];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    return new Response(blob, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=sales_team_template.csv"
      }
    });
  }
  if (intent === "upload") {
    const file = formData.get("csvFile");
    const teamName = formData.get("teamName");
    if (!file || file.size === 0) {
      return json({
        error: "Please select a CSV file to upload.",
        teamName
      }, { status: 400 });
    }
    if (!(teamName == null ? void 0 : teamName.trim())) {
      return json({
        error: "Team name is required.",
        teamName
      }, { status: 400 });
    }
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
      });
      if (parsed.errors.length > 0) {
        return json({
          error: "CSV parsing failed: " + parsed.errors[0].message,
          teamName
        }, { status: 400 });
      }
      const rows = parsed.data;
      if (rows.length === 0) {
        return json({
          error: "CSV file is empty or contains no valid data.",
          teamName
        }, { status: 400 });
      }
      const requiredFields = ["firstname", "lastname", "email"];
      const missingFields = [];
      requiredFields.forEach((field) => {
        var _a;
        const hasField = (_a = parsed.meta.fields) == null ? void 0 : _a.some((f) => f.toLowerCase().includes(field));
        if (!hasField) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0) {
        return json({
          error: `CSV is missing required columns: ${missingFields.join(", ")}. Please ensure your CSV has firstName, lastName, and email columns.`,
          teamName
        }, { status: 400 });
      }
      const salesMembers = rows.map((row) => {
        var _a, _b, _c, _d, _e;
        const firstNameField = Object.keys(row).find(
          (key) => key.toLowerCase().includes("firstname") || key.toLowerCase() === "first_name" || key.toLowerCase() === "first name"
        );
        const lastNameField = Object.keys(row).find(
          (key) => key.toLowerCase().includes("lastname") || key.toLowerCase() === "last_name" || key.toLowerCase() === "last name"
        );
        const emailField = Object.keys(row).find(
          (key) => key.toLowerCase().includes("email")
        );
        const firstName = firstNameField ? (_a = row[firstNameField]) == null ? void 0 : _a.trim() : "";
        const lastName = lastNameField ? (_b = row[lastNameField]) == null ? void 0 : _b.trim() : "";
        const email = emailField ? (_c = row[emailField]) == null ? void 0 : _c.trim() : "";
        if (!firstName || !lastName || !email) {
          throw new Error(`Missing required data for sales team member: ${firstName} ${lastName}`);
        }
        const phoneField = Object.keys(row).find(
          (key) => key.toLowerCase().includes("phone")
        );
        const titleField = Object.keys(row).find(
          (key) => key.toLowerCase().includes("title") || key.toLowerCase().includes("position") || key.toLowerCase().includes("role")
        );
        const phone = phoneField ? (_d = row[phoneField]) == null ? void 0 : _d.trim() : null;
        const title = titleField ? (_e = row[titleField]) == null ? void 0 : _e.trim() : null;
        const metadata = {};
        Object.keys(row).forEach((key) => {
          var _a2;
          const lowerKey = key.toLowerCase();
          if (!lowerKey.includes("firstname") && !lowerKey.includes("lastname") && !lowerKey.includes("email") && !lowerKey.includes("phone") && !lowerKey.includes("title") && !lowerKey.includes("position") && !lowerKey.includes("role")) {
            if ((_a2 = row[key]) == null ? void 0 : _a2.trim()) {
              metadata[key] = row[key].trim();
            }
          }
        });
        return {
          organizationId: orgId,
          firstName,
          lastName,
          email,
          phone,
          title,
          metadata,
          isActive: true
        };
      });
      const repositories = createRepositories(context.env, orgId);
      const createdMembers = await repositories.salesAgents.bulkCreate(salesMembers);
      return redirect(`/sales?uploaded=${createdMembers.length}&team=${encodeURIComponent(teamName)}`);
    } catch (error) {
      console.error("Error processing sales team CSV:", error);
      return json({
        error: `Failed to process CSV file: ${error instanceof Error ? error.message : "Unknown error"}`,
        teamName
      }, { status: 500 });
    }
  }
  return json({ error: "Invalid request" }, { status: 400 });
}
function SalesUpload() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find((file) => file.type === "text/csv" || file.name.endsWith(".csv"));
    if (csvFile) {
      setSelectedFile(csvFile);
    }
  };
  const handleFileSelect = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Upload Sales Team" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Add your sales team members for campaign personalization" })
        ] }),
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/Buzzline_Logo.png",
            alt: "BuzzLine",
            className: "h-12 w-auto"
          }
        )
      ] }),
      (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", { className: "mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-red-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.error }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Upload CSV File" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Upload a CSV file containing your sales team data" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs(Form, { method: "post", encType: "multipart/form-data", className: "space-y-6", children: [
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "intent", value: "upload" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "teamName", className: "block text-sm font-medium text-[#313131] mb-2", children: "Team Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "teamName",
                  name: "teamName",
                  required: true,
                  defaultValue: (actionData == null ? void 0 : actionData.teamName) || "",
                  className: "w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
                  placeholder: "e.g., Sales Team Q1 2024"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[#313131] mb-2", children: "CSV File *" }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: `border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-[#5EC0DA] bg-[#5EC0DA]/5" : "border-gray-300 hover:border-[#5EC0DA] hover:bg-[#5EC0DA]/5"}`,
                  onDrop: handleDrop,
                  onDragOver: (e) => {
                    e.preventDefault();
                    setDragOver(true);
                  },
                  onDragLeave: () => setDragOver(false),
                  children: selectedFile ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-[#5EC0DA] mx-auto", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-[#313131]", children: selectedFile.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                      (selectedFile.size / 1024).toFixed(1),
                      " KB"
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setSelectedFile(null),
                        className: "text-xs text-[#ED58A0] hover:text-[#d948a0] font-medium",
                        children: "Remove file"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-gray-400 mx-auto", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-[#313131]", children: [
                        "Drop your CSV file here, or",
                        " ",
                        /* @__PURE__ */ jsxs("label", { className: "text-[#ED58A0] hover:text-[#d948a0] cursor-pointer", children: [
                          "browse",
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "file",
                              name: "csvFile",
                              accept: ".csv",
                              className: "sr-only",
                              onChange: handleFileSelect,
                              required: true
                            }
                          )
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "CSV files only" })
                    ] })
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: isSubmitting,
                className: "w-full px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
                children: isSubmitting ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center space-x-2", children: [
                  /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 animate-spin", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Uploading..." })
                ] }) : "Upload Sales Team"
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "CSV Template" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Download a template to get started" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs(Form, { method: "post", children: [
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "intent", value: "download-template" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "w-full px-6 py-3 text-sm font-semibold text-[#5EC0DA] bg-[#5EC0DA]/10 border border-[#5EC0DA]/20 rounded-xl hover:bg-[#5EC0DA]/20 transition-all duration-200",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center space-x-2", children: [
                    /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }),
                    /* @__PURE__ */ jsx("span", { children: "Download Template" })
                  ] })
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Requirements" }) }),
            /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#ED58A0] rounded-full mt-2 flex-shrink-0" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131]", children: "Required Fields" }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "firstName, lastName, email" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#5EC0DA] rounded-full mt-2 flex-shrink-0" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131]", children: "Optional Fields" }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "phone, title, companyName, region, territory" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131]", children: "Dynamic Tags" }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Any additional columns become campaign variables" })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Campaign Usage" }) }),
            /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] mb-2", children: "Example personalization:" }),
                /* @__PURE__ */ jsx("div", { className: "bg-gray-50 p-3 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-gray-700", children: [
                  '"Hi ',
                  "{customerFirstName}",
                  ", it's ",
                  "{salespersonFirstName}",
                  " from ",
                  "{companyName}",
                  "! I wanted to reach out about your ",
                  "{territory}",
                  ' account..."'
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-[#313131] mb-2", children: "Available variables:" }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
                  /* @__PURE__ */ jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: "{salespersonFirstName}" }),
                  /* @__PURE__ */ jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: "{salespersonLastName}" }),
                  /* @__PURE__ */ jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: "{salespersonEmail}" }),
                  /* @__PURE__ */ jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: "{salespersonTitle}" }),
                  /* @__PURE__ */ jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: "{companyName}" }),
                  /* @__PURE__ */ jsx("span", { className: "bg-gray-100 px-2 py-1 rounded", children: "{region}" })
                ] })
              ] })
            ] }) })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: SalesUpload,
  loader: loader$2,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const meta$2 = () => {
  return [
    { title: "Sales Team - BuzzLine" },
    { name: "description", content: "Manage your sales team for campaign personalization" }
  ];
};
async function loader$1({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const repositories = createRepositories(context.env, orgId);
  const salesTeam = await repositories.salesAgents.findAll();
  return json({
    salesTeam
  });
}
function SalesIndex() {
  const { salesTeam } = useLoaderData();
  const [searchParams] = useSearchParams();
  const uploaded = searchParams.get("uploaded");
  const teamName = searchParams.get("team");
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      uploaded && /* @__PURE__ */ jsx("div", { className: "bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-800", children: [
          "Successfully uploaded ",
          uploaded,
          " sales team members",
          teamName && ` for "${teamName}"`,
          "!"
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Sales Team" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage your sales team for campaign personalization and round-robin features" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/sales/upload",
              className: "bg-[#5EC0DA] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4a9fb5] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
              children: "Upload Sales Team"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/sales/new",
              className: "bg-[#ED58A0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
              children: "Add Sales Member"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Members" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: salesTeam.length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#ED58A0]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Members" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: salesTeam.filter((member) => member.isActive).length })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl p-6 shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Available Variables" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131] mt-1", children: salesTeam.length > 0 ? Object.keys(salesTeam[0].metadata).length + 6 : 6 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" }) }) })
        ] }) })
      ] }),
      salesTeam.length === 0 ? (
        /* Empty State */
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-[#313131] mb-2", children: "No Sales Team Members" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6 max-w-sm mx-auto", children: "Upload your sales team data to enable personalized campaigns with sales rep information." }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/sales/upload",
              className: "inline-flex items-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-[#ED58A0] rounded-xl hover:bg-[#d948a0] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }),
                /* @__PURE__ */ jsx("span", { children: "Upload Sales Team" })
              ]
            }
          )
        ] }) })
      ) : (
        /* Sales Team Table */
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Team Members" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Manage your sales team members and their campaign variables" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100", children: [
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Sales Rep" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Contact" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Title" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Variables" }),
              /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600 text-sm uppercase tracking-wide", children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: salesTeam.map((member) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#ED58A0]/10 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-[#ED58A0]", children: [
                  member.firstName.charAt(0),
                  member.lastName.charAt(0)
                ] }) }),
                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("p", { className: "font-medium text-[#313131] text-sm", children: [
                  member.firstName,
                  " ",
                  member.lastName
                ] }) })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("p", { className: "text-gray-900", children: member.email }),
                member.phone && /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: member.phone })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: member.title || "-" }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1", children: [
                Object.keys(member.metadata).slice(0, 3).map((key) => /* @__PURE__ */ jsx("span", { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#5EC0DA]/10 text-[#5EC0DA]", children: key }, key)),
                Object.keys(member.metadata).length > 3 && /* @__PURE__ */ jsxs("span", { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600", children: [
                  "+",
                  Object.keys(member.metadata).length - 3
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-4 px-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: member.isActive ? "Active" : "Inactive" }) })
            ] }, member.id)) })
          ] }) }) })
        ] })
      ),
      salesTeam.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-8 bg-white rounded-xl shadow-sm border border-gray-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Available Campaign Variables" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Use these variables in your campaign templates" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-gray-600 mb-1", children: "Standard Fields" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("code", { className: "block text-xs bg-white px-2 py-1 rounded border", children: "{salespersonFirstName}" }),
              /* @__PURE__ */ jsx("code", { className: "block text-xs bg-white px-2 py-1 rounded border", children: "{salespersonLastName}" }),
              /* @__PURE__ */ jsx("code", { className: "block text-xs bg-white px-2 py-1 rounded border", children: "{salespersonEmail}" }),
              /* @__PURE__ */ jsx("code", { className: "block text-xs bg-white px-2 py-1 rounded border", children: "{salespersonPhone}" }),
              /* @__PURE__ */ jsx("code", { className: "block text-xs bg-white px-2 py-1 rounded border", children: "{salespersonTitle}" })
            ] })
          ] }),
          Object.keys(salesTeam[0].metadata).length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-3 rounded-lg md:col-span-3 lg:col-span-5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-gray-600 mb-1", children: "Custom Variables" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1", children: Object.keys(salesTeam[0].metadata).map((key) => /* @__PURE__ */ jsxs("code", { className: "text-xs bg-white px-2 py-1 rounded border", children: [
              "{",
              key,
              "}"
            ] }, key)) })
          ] })
        ] }) })
      ] })
    ] }) })
  ] });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SalesIndex,
  loader: loader$1,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const meta$1 = () => {
  return [
    { title: "Add Sales Member - BuzzLine" },
    { name: "description", content: "Add a new sales member to your team" }
  ];
};
async function loader({ request, context }) {
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  return json({ orgId });
}
async function action({ request, context }) {
  var _a, _b, _c, _d, _e;
  const { userId, orgId } = await requireAuthWithOrg({ request, context });
  const formData = await request.formData();
  const firstName = (_a = formData.get("firstName")) == null ? void 0 : _a.toString().trim();
  const lastName = (_b = formData.get("lastName")) == null ? void 0 : _b.toString().trim();
  const email = (_c = formData.get("email")) == null ? void 0 : _c.toString().trim();
  const phone = (_d = formData.get("phone")) == null ? void 0 : _d.toString().trim();
  const title = (_e = formData.get("title")) == null ? void 0 : _e.toString().trim();
  const errors = {};
  if (!firstName) {
    errors.firstName = "First name is required";
  }
  if (!lastName) {
    errors.lastName = "Last name is required";
  }
  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }
  if (phone && !/^[\+]?[\d\s\(\)\-]{10,}$/.test(phone)) {
    errors.phone = "Please enter a valid phone number";
  }
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 400 });
  }
  try {
    const repositories = createRepositories(context.env, orgId);
    await repositories.salesAgents.create({
      organizationId: orgId,
      firstName,
      lastName,
      email,
      phone: phone || void 0,
      title: title || void 0,
      metadata: {},
      isActive: true
    });
    return redirect("/sales");
  } catch (error) {
    console.error("Error creating sales member:", error);
    return json({
      errors: { general: "Failed to create sales member. Please try again." },
      success: false
    }, { status: 500 });
  }
}
function NewSalesMember() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsx("div", { className: "py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/sales",
              className: "text-[#5EC0DA] hover:text-[#4a9fb5] transition-colors",
              children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-[#313131]", children: "Add New Sales Member" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Add a new sales team member for campaign personalization" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-100", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[#313131]", children: "Sales Member Information" }) }),
        /* @__PURE__ */ jsxs(Form, { method: "post", className: "p-6 space-y-6", children: [
          ((_a = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _a.general) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
            /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-red-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: actionData.errors.general }) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-[#313131] mb-2", children: "First Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "firstName",
                  name: "firstName",
                  className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_b = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _b.firstName) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "John"
                }
              ),
              ((_c = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _c.firstName) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.firstName })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-[#313131] mb-2", children: "Last Name *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "lastName",
                  name: "lastName",
                  className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_d = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _d.lastName) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "Doe"
                }
              ),
              ((_e = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _e.lastName) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.lastName })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-[#313131] mb-2", children: "Email Address *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                id: "email",
                name: "email",
                className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_f = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _f.email) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                placeholder: "john.doe@company.com"
              }
            ),
            ((_g = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _g.email) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-[#313131] mb-2", children: "Phone Number (Optional)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "tel",
                  id: "phone",
                  name: "phone",
                  className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors ${((_h = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _h.phone) ? "border-red-300 bg-red-50" : "border-gray-300"}`,
                  placeholder: "+1 (555) 123-4567"
                }
              ),
              ((_i = actionData == null ? void 0 : actionData.errors) == null ? void 0 : _i.phone) && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: actionData.errors.phone })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-[#313131] mb-2", children: "Job Title (Optional)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "title",
                  name: "title",
                  className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5EC0DA]/20 focus:border-[#5EC0DA] transition-colors",
                  placeholder: "Sales Representative"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
            /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-blue-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-800", children: [
              /* @__PURE__ */ jsx("strong", { children: "Note:" }),
              " Additional campaign variables (like company, region, etc.) can be added later by uploading a CSV with custom metadata fields."
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3 pt-6 border-t border-gray-100", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/sales",
                className: "px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: isSubmitting,
                className: "px-6 py-2 text-sm font-semibold text-white bg-[#ED58A0] rounded-lg hover:bg-[#d948a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md",
                children: isSubmitting ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 animate-spin", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Creating..." })
                ] }) : "Create Sales Member"
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: NewSalesMember,
  loader,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function SignInPage() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-[#5EC0DA]/10 via-white to-[#ED58A0]/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: "/Buzzline_Logo.png",
          alt: "BuzzLine",
          className: "h-12 w-auto mx-auto mb-6"
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-[#313131] mb-2", children: "Welcome to BuzzLine" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Sign in to your marketing dashboard" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-lg p-8", children: /* @__PURE__ */ jsx(
      SignIn,
      {
        appearance: {
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
        }
      }
    ) })
  ] }) });
}
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SignInPage
}, Symbol.toStringTag, { value: "Module" }));
const meta = () => {
  return [
    { title: "BuzzLine - Unified Marketing Communication Platform" },
    { name: "description", content: "Send unified SMS and Email campaigns with powerful analytics. Built for businesses that need reliable, scalable marketing communication." }
  ];
};
function Index() {
  const { organization } = useOrganization();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-white", children: [
    /* @__PURE__ */ jsx(Navigation, {}),
    /* @__PURE__ */ jsxs(SignedOut, { children: [
      /* @__PURE__ */ jsx("div", { className: "relative bg-gradient-to-br from-[#5EC0DA]/10 via-white to-[#ED58A0]/10", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-6xl font-bold text-[#313131] mb-6 leading-tight", children: [
          "Marketing Communication",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-[#5EC0DA] to-[#ED58A0] bg-clip-text text-transparent", children: "Made Simple" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed", children: "Send unified SMS and email campaigns from one platform. Built for businesses that need reliable, scalable marketing communication with powerful analytics." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center items-center", children: [
          /* @__PURE__ */ jsx(SignInButton, { children: /* @__PURE__ */ jsx("button", { className: "bg-[#ED58A0] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#d948a0] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5", children: "Start Free Trial" }) }),
          /* @__PURE__ */ jsx("button", { className: "border-2 border-[#5EC0DA] text-[#5EC0DA] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#5EC0DA] hover:text-white transition-all duration-200", children: "Watch Demo" })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "py-20 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-[#313131] mb-4", children: "Everything you need to scale" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-600 max-w-2xl mx-auto", children: "Powerful features built for modern marketing teams" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-[#313131] mb-3", children: "Unified Messaging" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Send SMS and email campaigns from a single interface. No more switching between platforms." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#ED58A0]/10 rounded-xl flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-[#313131] mb-3", children: "Powerful Analytics" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Track opens, clicks, deliveries, and conversions with detailed performance insights." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" }) }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-[#313131] mb-3", children: "Smart Contact Management" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Import contacts via CSV, segment audiences, and manage opt-outs automatically." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "py-20 bg-gradient-to-r from-[#5EC0DA] to-[#ED58A0]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-white mb-6", children: "Ready to transform your marketing?" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-white/90 mb-8", children: "Join thousands of businesses using BuzzLine to reach their customers effectively." }),
        /* @__PURE__ */ jsx(SignInButton, { children: /* @__PURE__ */ jsx("button", { className: "bg-white text-[#ED58A0] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg", children: "Get Started Free" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SignedIn, { children: !organization ? (
      /* No Organization Selected */
      /* @__PURE__ */ jsx("div", { className: "py-20 bg-gray-50 min-h-screen", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-12", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-[#ED58A0]/10 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" }) }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-[#313131] mb-4", children: "Select an Organization" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-8 max-w-2xl mx-auto", children: "To access campaigns, contacts, and analytics, please select or create an organization. Each organization keeps its data completely separate." }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/select-organization",
            className: "bg-[#ED58A0] text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-[#d948a0] transition-colors shadow-sm inline-flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
              "Select Organization"
            ]
          }
        )
      ] }) }) })
    ) : (
      /* Dashboard View with Organization */
      /* @__PURE__ */ jsx("div", { className: "py-12 bg-gray-50 min-h-screen", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-[#313131] mb-2", children: [
            "Welcome back to ",
            organization.name,
            "!"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-600", children: "Manage your campaigns and track performance for your organization" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/campaigns",
              className: "group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#5EC0DA]/30",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#5EC0DA]/20 transition-colors", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-[#313131] mb-2", children: "Campaigns" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Create and manage your marketing campaigns" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/contacts",
              className: "group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#ED58A0]/30",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#ED58A0]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#ED58A0]/20 transition-colors", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#ED58A0]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" }) }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-[#313131] mb-2", children: "Contacts" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Manage your contact lists and recipients" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/analytics",
              className: "group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#5EC0DA]/30",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-[#5EC0DA]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#5EC0DA]/20 transition-colors", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-[#5EC0DA]", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-[#313131] mb-2", children: "Analytics" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Track campaign performance and metrics" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mt-8", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Campaigns" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131]", children: "0" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#5EC0DA]/10 rounded flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-[#5EC0DA]", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Contacts" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131]", children: "0" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#ED58A0]/10 rounded flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-[#ED58A0]", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { d: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" }) }) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Messages Sent" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131]", children: "0" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#5EC0DA]/10 rounded flex items-center justify-center", children: /* @__PURE__ */ jsxs("svg", { className: "w-4 h-4 text-[#5EC0DA]", fill: "currentColor", viewBox: "0 0 20 20", children: [
              /* @__PURE__ */ jsx("path", { d: "M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" }),
              /* @__PURE__ */ jsx("path", { d: "M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: "Open Rate" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-[#313131]", children: "0%" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#ED58A0]/10 rounded flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-[#ED58A0]", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { d: "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" }) }) })
          ] }) })
        ] })
      ] }) })
    ) })
  ] });
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Dpa9GqDw.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CAbE1_45.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/browser-kcjcQWsZ.js", "/assets/index-C7kF29aY.js"], "css": ["/assets/root-DdslgoNR.css"] }, "routes/select-organization": { "id": "routes/select-organization", "parentId": "root", "path": "select-organization", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/select-organization-DBux_AUM.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/index-C7kF29aY.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/contacts.template": { "id": "routes/contacts.template", "parentId": "root", "path": "contacts/template", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/contacts.template-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/analytics._index": { "id": "routes/analytics._index", "parentId": "root", "path": "analytics", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/analytics._index-CYpFtD7j.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/campaigns._index": { "id": "routes/campaigns._index", "parentId": "root", "path": "campaigns", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/campaigns._index-ByRLoR7y.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/contacts.upload": { "id": "routes/contacts.upload", "parentId": "root", "path": "contacts/upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/contacts.upload-D84Z8Yo-.js", "imports": ["/assets/components-C_fFa3wo.js"], "css": [] }, "routes/contacts._index": { "id": "routes/contacts._index", "parentId": "root", "path": "contacts", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/contacts._index-DrUMKd2H.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/settings._index": { "id": "routes/settings._index", "parentId": "root", "path": "settings", "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/settings._index-CT18fH8S.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/campaigns.new": { "id": "routes/campaigns.new", "parentId": "root", "path": "campaigns/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/campaigns.new-9VH0FyZz.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/contacts.new": { "id": "routes/contacts.new", "parentId": "root", "path": "contacts/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/contacts.new-Do-ZKh3t.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/sales.upload": { "id": "routes/sales.upload", "parentId": "root", "path": "sales/upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/sales.upload-CDj1cSQL.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/sales._index": { "id": "routes/sales._index", "parentId": "root", "path": "sales", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/sales._index-BI7Pa_I6.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/sales.new": { "id": "routes/sales.new", "parentId": "root", "path": "sales/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/sales.new-XEoNgXb3.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/sign-in.$": { "id": "routes/sign-in.$", "parentId": "root", "path": "sign-in/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/sign-in._-IDO3oR5S.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/index-C7kF29aY.js", "/assets/browser-kcjcQWsZ.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-9mRG6U2z.js", "imports": ["/assets/components-C_fFa3wo.js", "/assets/index-C7kF29aY.js", "/assets/Navigation-XZ_7T8yw.js", "/assets/browser-kcjcQWsZ.js"], "css": [] } }, "url": "/assets/manifest-f4cdc30f.js", "version": "f4cdc30f" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/select-organization": {
    id: "routes/select-organization",
    parentId: "root",
    path: "select-organization",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/contacts.template": {
    id: "routes/contacts.template",
    parentId: "root",
    path: "contacts/template",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/analytics._index": {
    id: "routes/analytics._index",
    parentId: "root",
    path: "analytics",
    index: true,
    caseSensitive: void 0,
    module: route3
  },
  "routes/campaigns._index": {
    id: "routes/campaigns._index",
    parentId: "root",
    path: "campaigns",
    index: true,
    caseSensitive: void 0,
    module: route4
  },
  "routes/contacts.upload": {
    id: "routes/contacts.upload",
    parentId: "root",
    path: "contacts/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/contacts._index": {
    id: "routes/contacts._index",
    parentId: "root",
    path: "contacts",
    index: true,
    caseSensitive: void 0,
    module: route6
  },
  "routes/settings._index": {
    id: "routes/settings._index",
    parentId: "root",
    path: "settings",
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/campaigns.new": {
    id: "routes/campaigns.new",
    parentId: "root",
    path: "campaigns/new",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/contacts.new": {
    id: "routes/contacts.new",
    parentId: "root",
    path: "contacts/new",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/sales.upload": {
    id: "routes/sales.upload",
    parentId: "root",
    path: "sales/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/sales._index": {
    id: "routes/sales._index",
    parentId: "root",
    path: "sales",
    index: true,
    caseSensitive: void 0,
    module: route11
  },
  "routes/sales.new": {
    id: "routes/sales.new",
    parentId: "root",
    path: "sales/new",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/sign-in.$": {
    id: "routes/sign-in.$",
    parentId: "root",
    path: "sign-in/*",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route14
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
