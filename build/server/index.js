var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, redirect, json } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useLoaderData, useActionData, Form, useNavigate, Link, useSearchParams, useLocation } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { ClerkApp, OrganizationSwitcher, UserButton, SignedOut, SignInButton } from "@clerk/remix";
import { rootAuthLoader, getAuth } from "@clerk/remix/ssr.server";
import "clsx";
import { useState, useEffect } from "react";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const loader$j = (args) => {
  return rootAuthLoader(args);
};
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
  }
];
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
  loader: loader$j
}, Symbol.toStringTag, { value: "Module" }));
class MockKVNamespace {
  constructor(storeName) {
    __publicField(this, "store");
    if (!global.__mockKVStores) {
      global.__mockKVStores = {};
    }
    if (!global.__mockKVStores[storeName]) {
      global.__mockKVStores[storeName] = /* @__PURE__ */ new Map();
    }
    this.store = global.__mockKVStores[storeName];
  }
  async get(key) {
    return this.store.get(key) || null;
  }
  async put(key, value, options) {
    this.store.set(key, value);
  }
  async delete(key) {
    this.store.delete(key);
  }
  async list(options) {
    const keys = Array.from(this.store.keys());
    const prefix = (options == null ? void 0 : options.prefix) || "";
    const filteredKeys = keys.filter((key) => key.startsWith(prefix));
    const limit = (options == null ? void 0 : options.limit) || 1e4;
    return {
      keys: filteredKeys.slice(0, limit).map((name) => ({ name }))
    };
  }
}
class KVService {
  constructor(env) {
    __publicField(this, "main");
    __publicField(this, "analytics");
    __publicField(this, "cache");
    this.env = env;
    this.main = env.BUZZLINE_MAIN || new MockKVNamespace("main");
    this.analytics = env.BUZZLINE_ANALYTICS || new MockKVNamespace("analytics");
    this.cache = env.BUZZLINE_CACHE || new MockKVNamespace("cache");
    console.log("KV Service initialized:", {
      main: env.BUZZLINE_MAIN ? "Cloudflare KV" : "Mock KV",
      analytics: env.BUZZLINE_ANALYTICS ? "Cloudflare KV" : "Mock KV",
      cache: env.BUZZLINE_CACHE ? "Cloudflare KV" : "Mock KV"
    });
  }
  // Key patterns for organization-scoped data
  getOrgKey(orgId, type, id) {
    return id ? `org:${orgId}:${type}:${id}` : `org:${orgId}:${type}`;
  }
  getUserKey(orgId, userId) {
    return `org:${orgId}:user:${userId}`;
  }
  // Organization management
  async createOrganization(orgId, data) {
    const key = this.getOrgKey(orgId, "info");
    await this.main.put(key, JSON.stringify(data));
  }
  async getOrganization(orgId) {
    const key = this.getOrgKey(orgId, "info");
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }
  // Contact management
  async createContact(orgId, contactId, contact) {
    const key = this.getOrgKey(orgId, "contact", contactId);
    await this.main.put(key, JSON.stringify({
      ...contact,
      id: contactId,
      orgId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      optedOut: false
    }));
  }
  async getContact(orgId, contactId) {
    const key = this.getOrgKey(orgId, "contact", contactId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }
  async updateContactOptOut(orgId, contactId, optedOut) {
    const contact = await this.getContact(orgId, contactId);
    if (contact) {
      contact.optedOut = optedOut;
      contact.optedOutAt = optedOut ? (/* @__PURE__ */ new Date()).toISOString() : null;
      const key = this.getOrgKey(orgId, "contact", contactId);
      await this.main.put(key, JSON.stringify(contact));
    }
  }
  async listContacts(orgId, limit = 1e4) {
    const prefix = this.getOrgKey(orgId, "contact", "");
    const list = await this.main.list({ prefix, limit });
    const contacts = await Promise.all(
      list.keys.map(async (key) => {
        const data = await this.main.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return contacts.filter(Boolean);
  }
  async findContactByEmailOrPhone(orgId, email, phone) {
    if (!email && !phone) return null;
    const allContacts = await this.listContacts(orgId);
    return allContacts.find((contact) => {
      if (email && contact.email && contact.email.toLowerCase() === email.toLowerCase()) {
        return true;
      }
      if (phone && contact.phone && contact.phone === phone) {
        return true;
      }
      return false;
    });
  }
  async updateContact(orgId, contactId, updates) {
    const contact = await this.getContact(orgId, contactId);
    if (contact) {
      const updated = { ...contact, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      const key = this.getOrgKey(orgId, "contact", contactId);
      await this.main.put(key, JSON.stringify(updated));
      return updated;
    }
    return null;
  }
  // Contact List management
  async createContactList(orgId, listId, listData) {
    const key = this.getOrgKey(orgId, "contactlist", listId);
    await this.main.put(key, JSON.stringify({
      ...listData,
      id: listId,
      orgId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  async getContactList(orgId, listId) {
    const key = this.getOrgKey(orgId, "contactlist", listId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }
  async listContactLists(orgId, limit = 100) {
    const prefix = this.getOrgKey(orgId, "contactlist", "");
    const list = await this.main.list({ prefix, limit });
    const lists = await Promise.all(
      list.keys.map(async (key) => {
        const data = await this.main.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return lists.filter(Boolean);
  }
  // Campaign management
  async createCampaign(orgId, campaignId, campaign) {
    const key = this.getOrgKey(orgId, "campaign", campaignId);
    await this.main.put(key, JSON.stringify({
      ...campaign,
      id: campaignId,
      orgId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "draft"
    }));
  }
  async getCampaign(orgId, campaignId) {
    const key = this.getOrgKey(orgId, "campaign", campaignId);
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }
  async updateCampaign(orgId, campaignId, updates) {
    const campaign = await this.getCampaign(orgId, campaignId);
    if (campaign) {
      const updated = { ...campaign, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      const key = this.getOrgKey(orgId, "campaign", campaignId);
      await this.main.put(key, JSON.stringify(updated));
      return updated;
    }
    return null;
  }
  async listCampaigns(orgId, limit = 100) {
    const prefix = this.getOrgKey(orgId, "campaign", "");
    const list = await this.main.list({ prefix, limit });
    const campaigns = await Promise.all(
      list.keys.map(async (key) => {
        const data = await this.main.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    return campaigns.filter(Boolean);
  }
  // Campaign Delivery tracking
  async trackDelivery(orgId, campaignId, contactId, deliveryData) {
    const deliveryId = `${campaignId}-${contactId}`;
    const key = `org:${orgId}:delivery:${deliveryId}`;
    await this.analytics.put(key, JSON.stringify({
      ...deliveryData,
      orgId,
      campaignId,
      contactId,
      deliveryId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  async getDeliveryStatus(orgId, campaignId, contactId) {
    const deliveryId = `${campaignId}-${contactId}`;
    const key = `org:${orgId}:delivery:${deliveryId}`;
    const data = await this.analytics.get(key);
    return data ? JSON.parse(data) : null;
  }
  // Analytics
  async getCampaignAnalytics(orgId, campaignId) {
    const key = `org:${orgId}:analytics:${campaignId}`;
    const data = await this.analytics.get(key);
    return data ? JSON.parse(data) : null;
  }
  async updateCampaignAnalytics(orgId, campaignId, analytics) {
    const key = `org:${orgId}:analytics:${campaignId}`;
    await this.analytics.put(key, JSON.stringify({
      ...analytics,
      orgId,
      campaignId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  // Cache utilities
  async setCache(key, data, ttl = 3600) {
    await this.cache.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }
  async getCache(key) {
    const data = await this.cache.get(key);
    return data ? JSON.parse(data) : null;
  }
  async deleteCache(key) {
    await this.cache.delete(key);
  }
  // Organization Settings and Signature management
  async getOrgSettings(orgId) {
    const key = this.getOrgKey(orgId, "settings");
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : {
      emailSignature: {
        salesPersonName: "",
        salesPersonTitle: "",
        salesPersonPhone: "",
        companyLogoUrl: ""
      },
      companyInfo: {
        name: "",
        website: "",
        address: ""
      }
    };
  }
  async updateOrgSettings(orgId, settings) {
    const key = this.getOrgKey(orgId, "settings");
    const currentSettings = await this.getOrgSettings(orgId);
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.main.put(key, JSON.stringify(updatedSettings));
    return updatedSettings;
  }
  // Sales Team management
  async getSalesTeam(orgId) {
    const key = this.getOrgKey(orgId, "sales_team");
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : [];
  }
  // Custom Field mappings for CSV imports
  async getCustomFields(orgId) {
    const key = this.getOrgKey(orgId, "custom_fields");
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : [];
  }
  async saveCustomFields(orgId, customFields) {
    const key = this.getOrgKey(orgId, "custom_fields");
    await this.main.put(key, JSON.stringify(customFields));
  }
  async addCustomField(orgId, fieldName) {
    const existingFields = await this.getCustomFields(orgId);
    if (!existingFields.includes(fieldName)) {
      const updatedFields = [...existingFields, fieldName];
      await this.saveCustomFields(orgId, updatedFields);
      return updatedFields;
    }
    return existingFields;
  }
  // Sales Team management methods
  async putSalesTeamData(key, data) {
    await this.main.put(key, JSON.stringify(data));
  }
  async getSalesTeamData(key) {
    const data = await this.main.get(key);
    return data ? JSON.parse(data) : null;
  }
  async deleteSalesTeamData(key) {
    await this.main.delete(key);
  }
}
function getKVService(context) {
  var _a;
  const env = ((_a = context == null ? void 0 : context.cloudflare) == null ? void 0 : _a.env) || {};
  return new KVService(env);
}
function generateId() {
  return crypto.randomUUID();
}
function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    data.push(row);
  }
  return data;
}
function formatDate(dateString) {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${month} ${day}, ${year} ${displayHours}:${displayMinutes} ${ampm}`;
}
function formatDateOnly(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day}/${year}`;
}
async function loader$i(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const { segmentId } = args.params;
  if (!segmentId) {
    throw new Response("Segment not found", { status: 404 });
  }
  try {
    const kvService = getKVService(args.context);
    const url = new URL(args.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const segment = await kvService.getContactList(orgId, segmentId);
    if (!segment) {
      throw new Response("Segment not found", { status: 404 });
    }
    const allContacts = await kvService.listContacts(orgId);
    let segmentContacts = allContacts ? allContacts.filter(
      (contact) => contact && contact.contactListIds && contact.contactListIds.includes(segmentId)
    ) : [];
    if (search) {
      const searchLower = search.toLowerCase();
      segmentContacts = segmentContacts.filter((contact) => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = (contact.email || "").toLowerCase();
        const phone = (contact.phone || "").toLowerCase();
        const metadataText = contact.metadata ? Object.values(contact.metadata).join(" ").toLowerCase() : "";
        return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || metadataText.includes(searchLower);
      });
    }
    const totalContacts = segmentContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const offset = (page - 1) * limit;
    const paginatedContacts = segmentContacts.slice(offset, offset + limit);
    return json({
      segment,
      contacts: paginatedContacts,
      allSegmentContacts: segmentContacts,
      // All contacts for stats calculation
      orgId,
      pagination: {
        currentPage: page,
        totalPages,
        totalContacts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      search
    });
  } catch (error) {
    console.error("Error loading segment:", error);
    throw new Response("Failed to load segment", { status: 500 });
  }
}
function SegmentView() {
  const { segment, contacts, allSegmentContacts, pagination, search } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("nav", { className: "flex", "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsxs("ol", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/dashboard/contacts", className: "text-gray-400 hover:text-gray-500", children: "Contacts" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("svg", { className: "flex-shrink-0 h-5 w-5 text-gray-300", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("span", { className: "ml-4 text-sm font-medium text-gray-500", children: segment.name })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-2xl font-bold text-gray-900", children: segment.name }),
        segment.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: segment.description })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex space-x-3", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/contacts/upload",
          className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
            "Add More Contacts"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Total Contacts" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: pagination.totalContacts })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Active" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: allSegmentContacts.filter((c) => !c.optedOut).length })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-purple-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "With Phone" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: allSegmentContacts.filter((c) => c.phone && c.phone.trim()).length })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "With Email" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: allSegmentContacts.filter((c) => c.email && c.email.trim()).length })
        ] }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white shadow overflow-hidden sm:rounded-md", children: [
      /* @__PURE__ */ jsx("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: [
            "Contacts in this segment (",
            pagination.totalContacts,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 max-w-2xl text-sm text-gray-500", children: [
            'All contacts that belong to "',
            segment.name,
            '"'
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 sm:mt-0", children: /* @__PURE__ */ jsxs("form", { method: "GET", className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "search",
                defaultValue: search,
                className: "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
                placeholder: "Search contacts..."
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700",
              children: "Search"
            }
          ),
          search && /* @__PURE__ */ jsx(
            "a",
            {
              href: `/dashboard/contacts/segments/${segment.id}`,
              className: "inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Clear"
            }
          )
        ] }) })
      ] }) }),
      contacts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: "mx-auto h-12 w-12 text-gray-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No contacts" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "This segment doesn't have any contacts yet." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/dashboard/contacts/upload",
            className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
              "Add Contacts"
            ]
          }
        ) })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Name" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Email" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Phone" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Custom Fields" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Status" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Added" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "relative px-6 py-3", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Actions" }) })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: contacts.map((contact) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsxs("td", { className: "whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900", children: [
            contact.firstName,
            " ",
            contact.lastName
          ] }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.email || "-" }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.phone || "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: contact.metadata && Object.keys(contact.metadata).length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).slice(0, 2).map((key) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
                contact.metadata[`${key}_display_name`] || key.replace(/_/g, " "),
                ":"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs", children: contact.metadata[key] })
            ] }, key)),
            Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).length > 2 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
              "+",
              Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).length - 2,
              " more"
            ] })
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "-" }) }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.optedOut ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800", children: "Opted Out" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800", children: "Active" }) }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: formatDateOnly(contact.createdAt) }),
          /* @__PURE__ */ jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6", children: /* @__PURE__ */ jsx(
            "a",
            {
              href: `/dashboard/contacts/${contact.id}`,
              className: "text-blue-600 hover:text-blue-900",
              children: "View"
            }
          ) })
        ] }, contact.id)) })
      ] }) }),
      pagination.totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex justify-between sm:hidden", children: [
          pagination.hasPrevPage ? /* @__PURE__ */ jsx(
            "a",
            {
              href: `?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
              className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Previous"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100", children: "Previous" }),
          pagination.hasNextPage ? /* @__PURE__ */ jsx(
            "a",
            {
              href: `?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
              className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Next"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100", children: "Next" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700", children: [
            "Showing",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: (pagination.currentPage - 1) * pagination.limit + 1 }),
            " ",
            "to",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: Math.min(pagination.currentPage * pagination.limit, pagination.totalContacts) }),
            " ",
            "of",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: pagination.totalContacts }),
            " ",
            "results",
            search && /* @__PURE__ */ jsxs("span", { children: [
              ' for "',
              search,
              '"'
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", "aria-label": "Pagination", children: [
            pagination.hasPrevPage ? /* @__PURE__ */ jsxs(
              "a",
              {
                href: `?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Previous" }),
                  /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", clipRule: "evenodd" }) })
                ]
              }
            ) : /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400", children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Previous" }),
              /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", clipRule: "evenodd" }) })
            ] }),
            Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              const isCurrentPage = pageNum === pagination.currentPage;
              return /* @__PURE__ */ jsx(
                "a",
                {
                  href: `?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                  className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${isCurrentPage ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`,
                  children: pageNum
                },
                pageNum
              );
            }),
            pagination.hasNextPage ? /* @__PURE__ */ jsxs(
              "a",
              {
                href: `?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Next" }),
                  /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })
                ]
              }
            ) : /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400", children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Next" }),
              /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Segment Information" }),
      /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Created" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: formatDate(segment.createdAt) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Segment ID" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 font-mono", children: segment.id })
        ] }),
        segment.description && /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Description" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: segment.description })
        ] })
      ] })
    ] }) })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SegmentView,
  loader: loader$i
}, Symbol.toStringTag, { value: "Module" }));
async function loader$h(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const { listId } = args.params;
  if (!listId) {
    throw new Response("Contact list not found", { status: 404 });
  }
  try {
    const kvService = getKVService(args.context);
    const contactList = await kvService.getContactList(orgId, listId);
    if (!contactList) {
      throw new Response("Contact list not found", { status: 404 });
    }
    const allContacts = await kvService.listContacts(orgId);
    const listContacts = allContacts ? allContacts.filter(
      (contact) => contact && contact.contactListIds && contact.contactListIds.includes(listId)
    ) : [];
    return json({
      contactList,
      contacts: listContacts,
      orgId
    });
  } catch (error) {
    console.error("Error loading contact list:", error);
    throw new Response("Failed to load contact list", { status: 500 });
  }
}
function ContactListView() {
  const { contactList, contacts } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("nav", { className: "flex", "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsxs("ol", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/dashboard/contacts", className: "text-gray-400 hover:text-gray-500", children: "Contacts" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("svg", { className: "flex-shrink-0 h-5 w-5 text-gray-300", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("span", { className: "ml-4 text-sm font-medium text-gray-500", children: contactList.name })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-2xl font-bold text-gray-900", children: contactList.name }),
        contactList.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: contactList.description })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex space-x-3", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/contacts/upload",
          className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
            "Add More Contacts"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Total Contacts" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: contacts.length })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Active" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: contacts.filter((c) => !c.optedOut).length })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-purple-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "With Phone" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: contacts.filter((c) => c.phone && c.phone.trim()).length })
        ] }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "ml-5 w-0 flex-1", children: /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "With Email" }),
          /* @__PURE__ */ jsx("dd", { className: "text-lg font-medium text-gray-900", children: contacts.filter((c) => c.email && c.email.trim()).length })
        ] }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white shadow overflow-hidden sm:rounded-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:px-6 border-b border-gray-200", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Contacts in this list" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 max-w-2xl text-sm text-gray-500", children: [
          'All contacts that belong to "',
          contactList.name,
          '"'
        ] })
      ] }),
      contacts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: "mx-auto h-12 w-12 text-gray-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No contacts" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "This contact list doesn't have any contacts yet." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/dashboard/contacts/upload",
            className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
              "Add Contacts"
            ]
          }
        ) })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Name" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Email" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Phone" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Custom Fields" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Status" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Added" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "relative px-6 py-3", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Actions" }) })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: contacts.map((contact) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsxs("td", { className: "whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900", children: [
            contact.firstName,
            " ",
            contact.lastName
          ] }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.email || "-" }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.phone || "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: contact.metadata && Object.keys(contact.metadata).length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).slice(0, 2).map((key) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
                contact.metadata[`${key}_display_name`] || key.replace(/_/g, " "),
                ":"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs", children: contact.metadata[key] })
            ] }, key)),
            Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).length > 2 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
              "+",
              Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).length - 2,
              " more"
            ] })
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "-" }) }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.optedOut ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800", children: "Opted Out" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800", children: "Active" }) }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: formatDateOnly(contact.createdAt) }),
          /* @__PURE__ */ jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6", children: /* @__PURE__ */ jsx(
            "a",
            {
              href: `/dashboard/contacts/${contact.id}`,
              className: "text-blue-600 hover:text-blue-900",
              children: "View"
            }
          ) })
        ] }, contact.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "List Information" }),
      /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Created" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: formatDate(contactList.createdAt) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "List ID" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 font-mono", children: contactList.id })
        ] }),
        contactList.description && /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Description" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: contactList.description })
        ] })
      ] })
    ] }) })
  ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ContactListView,
  loader: loader$h
}, Symbol.toStringTag, { value: "Module" }));
class MessagingService {
  constructor() {
    __publicField(this, "smsEndpoint");
    __publicField(this, "emailEndpoint");
    __publicField(this, "twilioAccountSid");
    __publicField(this, "twilioAuthToken");
    this.smsEndpoint = process.env.SMS_ENDPOINT || "";
    this.emailEndpoint = process.env.EMAILING_ENDPOINT || "";
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
  }
  async sendSMS(message) {
    if (!this.smsEndpoint) {
      return {
        success: false,
        error: "SMS service not configured",
        provider: "sms"
      };
    }
    try {
      const response = await fetch(this.smsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: message.from,
          // SMS phone number
          to: message.to,
          message: message.message,
          // Include metadata in message for tracking via webhook
          campaignId: message.campaignId,
          contactId: message.contactId,
          orgId: message.orgId
        })
      });
      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `SMS API error: ${response.status} ${errorData}`,
          provider: "sms"
        };
      }
      const result = await response.json();
      return {
        success: true,
        messageId: result.sid || result.messageId || result.id,
        provider: "sms"
      };
    } catch (error) {
      console.error("SMS sending error:", error);
      return {
        success: false,
        error: `SMS network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        provider: "sms"
      };
    }
  }
  async sendEmail(message) {
    var _a;
    if (!this.emailEndpoint) {
      return {
        success: false,
        error: "Email service not configured",
        provider: "email"
      };
    }
    try {
      const response = await fetch(this.emailEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: message.from,
          // Email address
          to: message.to,
          // Customer email address  
          subject: message.subject,
          htmlBody: message.htmlBody
        })
      });
      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `Email API error: ${response.status} ${errorData}`,
          provider: "email"
        };
      }
      const result = await response.json();
      return {
        success: true,
        messageId: result.id || result.messageId || ((_a = result.message) == null ? void 0 : _a.id),
        provider: "email"
      };
    } catch (error) {
      console.error("Email sending error:", error);
      return {
        success: false,
        error: `Email network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        provider: "email"
      };
    }
  }
  // Template variable replacement
  replaceVariables(template, contact, campaign, salesMember) {
    var _a, _b, _c, _d;
    let result = template;
    result = result.replace(/\{firstName\}/g, contact.firstName || "");
    result = result.replace(/\{lastName\}/g, contact.lastName || "");
    result = result.replace(/\{email\}/g, contact.email || "");
    result = result.replace(/\{phone\}/g, contact.phone || "");
    result = result.replace(/\{\{firstName\}\}/g, contact.firstName || "");
    result = result.replace(/\{\{lastName\}\}/g, contact.lastName || "");
    result = result.replace(/\{\{email\}\}/g, contact.email || "");
    result = result.replace(/\{\{phone\}\}/g, contact.phone || "");
    if (salesMember) {
      result = result.replace(/\{salesTeamFirstName\}/g, salesMember.firstName || "");
      result = result.replace(/\{salesTeamLastName\}/g, salesMember.lastName || "");
      result = result.replace(/\{salesTeamEmail\}/g, salesMember.email || "");
      result = result.replace(/\{salesTeamPhone\}/g, salesMember.phone || "");
      result = result.replace(/\{salesTeamTitle\}/g, salesMember.title || "");
      result = result.replace(/\{\{salesTeamFirstName\}\}/g, salesMember.firstName || "");
      result = result.replace(/\{\{salesTeamLastName\}\}/g, salesMember.lastName || "");
      result = result.replace(/\{\{salesTeamEmail\}\}/g, salesMember.email || "");
      result = result.replace(/\{\{salesTeamPhone\}\}/g, salesMember.phone || "");
      result = result.replace(/\{\{salesTeamTitle\}\}/g, salesMember.title || "");
    }
    if (contact.metadata) {
      Object.keys(contact.metadata).forEach((key) => {
        if (!key.endsWith("_display_name")) {
          const displayName = contact.metadata[`${key}_display_name`] || key;
          const value = contact.metadata[key] || "";
          const camelCaseKey = this.toCamelCase(displayName);
          const variations = [key, displayName, camelCaseKey];
          variations.forEach((variation) => {
            const regex1 = new RegExp(`\\{${variation}\\}`, "g");
            const regex2 = new RegExp(`\\{\\{${variation}\\}\\}`, "g");
            result = result.replace(regex1, value);
            result = result.replace(regex2, value);
          });
        }
      });
    }
    if (((_a = campaign == null ? void 0 : campaign.emailTemplate) == null ? void 0 : _a.signature) || salesMember) {
      const signatureData = salesMember ? {
        salesPersonName: `${salesMember.firstName} ${salesMember.lastName}`,
        salesPersonTitle: salesMember.title,
        salesPersonPhone: salesMember.phone,
        companyLogoUrl: (_c = (_b = campaign == null ? void 0 : campaign.emailTemplate) == null ? void 0 : _b.signature) == null ? void 0 : _c.companyLogoUrl
      } : (_d = campaign == null ? void 0 : campaign.emailTemplate) == null ? void 0 : _d.signature;
      if (signatureData) {
        const signature = this.generateSignature(signatureData);
        result = result.replace(/\{signature\}/g, signature);
        result = result.replace(/\{\{signature\}\}/g, signature);
        if (!result.includes("{signature}") && !result.includes("{{signature}}") && !result.toLowerCase().includes("chat soon") && // Avoid duplicate signatures
        !result.toLowerCase().includes("unsubscribe here")) {
          result += signature;
        }
      }
    }
    return result;
  }
  // Convert string to camelCase
  toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
  }
  // Generate HTML signature
  generateSignature(signatureData) {
    if (!signatureData.salesPersonName) {
      return "";
    }
    let signature = `<br/>
<p style="margin:0px;">Chat soon,</p>
<p style="margin:0px;"><strong>${signatureData.salesPersonName}</strong></p>`;
    if (signatureData.salesPersonTitle) {
      signature += `<p style="margin:0px;">${signatureData.salesPersonTitle}</p>`;
    }
    const logoUrl = signatureData.companyLogoUrl || "https://imagedelivery.net/fdADyrHW5AIzXwUyxun8dw/b95b1ebf-081b-454a-41f0-4ef26623c400/public";
    signature += `<img src="${logoUrl}" width="180px" style="display:block;margin:0px 0px 0px -8px;">`;
    signature += `<p style="display:block;margin:5px 0px;color:#343433;">No longer want to receive these types of emails? <a href="{unsubscribeUrl}" target="_blank" style="font-weight:600;">Unsubscribe here.</a></p>`;
    return signature;
  }
  // Generate unsubscribe URL
  generateUnsubscribeUrl(orgId, contactId, campaignId) {
    const token = Buffer.from(`${orgId}:${contactId}:${campaignId}:${Date.now()}`).toString("base64url");
    const domain = process.env.APP_DOMAIN || process.env.PUBLIC_URL || "https://buzzline.app";
    return `${domain}/unsubscribe/${token}`;
  }
}
class SalesTeamService {
  constructor(kv) {
    __publicField(this, "kv");
    this.kv = kv;
  }
  getKey(orgId, type, id) {
    return id ? `org:${orgId}:salesteam:${id}` : `org:${orgId}:salesteam:list`;
  }
  async createMember(orgId, memberData) {
    const id = `stm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const member = {
      id,
      ...memberData,
      createdAt: now,
      updatedAt: now
    };
    const key = `org:${orgId}:salesteam:${id}`;
    await this.kv.putSalesTeamData(key, member);
    const membersList = await this.getAllMembers(orgId);
    membersList.push(member);
    const listKey = `org:${orgId}:salesteam:list`;
    await this.kv.putSalesTeamData(listKey, membersList);
    return member;
  }
  async getMember(orgId, id) {
    const key = `org:${orgId}:salesteam:${id}`;
    return await this.kv.getSalesTeamData(key);
  }
  async getAllMembers(orgId) {
    const key = `org:${orgId}:salesteam:list`;
    const data = await this.kv.getSalesTeamData(key);
    return data || [];
  }
  async getActiveMembers(orgId) {
    const members = await this.getAllMembers(orgId);
    return members.filter((member) => member.isActive);
  }
  async updateMember(orgId, id, updates) {
    const member = await this.getMember(orgId, id);
    if (!member) return null;
    const updatedMember = {
      ...member,
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const key = `org:${orgId}:salesteam:${id}`;
    await this.kv.putSalesTeamData(key, updatedMember);
    const membersList = await this.getAllMembers(orgId);
    const index = membersList.findIndex((m) => m.id === id);
    if (index >= 0) {
      membersList[index] = updatedMember;
      const listKey = `org:${orgId}:salesteam:list`;
      await this.kv.putSalesTeamData(listKey, membersList);
    }
    return updatedMember;
  }
  async deleteMember(orgId, id) {
    const member = await this.getMember(orgId, id);
    if (!member) return false;
    const key = `org:${orgId}:salesteam:${id}`;
    await this.kv.deleteSalesTeamData(key);
    const membersList = await this.getAllMembers(orgId);
    const filteredList = membersList.filter((m) => m.id !== id);
    const listKey = `org:${orgId}:salesteam:list`;
    await this.kv.putSalesTeamData(listKey, filteredList);
    return true;
  }
  async getRandomActiveMember(orgId) {
    const activeMembers = await this.getActiveMembers(orgId);
    if (activeMembers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * activeMembers.length);
    return activeMembers[randomIndex];
  }
  async getRoundRobinMember(orgId) {
    const activeMembers = await this.getActiveMembers(orgId);
    if (activeMembers.length === 0) return null;
    const rrKey = `org:${orgId}:salesteam:round_robin_index`;
    const currentIndexData = await this.kv.getSalesTeamData(rrKey);
    let currentIndex = currentIndexData ? parseInt(currentIndexData) : 0;
    const member = activeMembers[currentIndex];
    const nextIndex = (currentIndex + 1) % activeMembers.length;
    await this.kv.putSalesTeamData(rrKey, nextIndex.toString());
    return member;
  }
  async importMembers(orgId, members) {
    const createdMembers = [];
    for (const memberData of members) {
      const member = await this.createMember(orgId, memberData);
      createdMembers.push(member);
    }
    return createdMembers;
  }
  async getMemberStats(orgId) {
    const members = await this.getAllMembers(orgId);
    const active = members.filter((m) => m.isActive).length;
    return {
      total: members.length,
      active,
      inactive: members.length - active
    };
  }
}
function getSalesTeamService(context = {}) {
  const kv = getKVService(context);
  return new SalesTeamService(kv);
}
class CampaignSender {
  constructor(context) {
    __publicField(this, "kvService");
    __publicField(this, "messagingService");
    __publicField(this, "salesTeamService");
    this.kvService = getKVService(context);
    this.messagingService = new MessagingService();
    this.salesTeamService = getSalesTeamService(context);
  }
  async sendCampaign(orgId, campaignId) {
    var _a, _b, _c, _d;
    const result = {
      success: false,
      totalContacts: 0,
      emailsSent: 0,
      smsSent: 0,
      failures: 0,
      errors: []
    };
    try {
      const campaign = await this.kvService.getCampaign(orgId, campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      const allContacts = await this.getAllCampaignContacts(orgId, campaign.contactListIds);
      result.totalContacts = allContacts.length;
      if (allContacts.length === 0) {
        throw new Error("No contacts found in selected lists");
      }
      console.log(`Starting campaign ${campaignId}: ${campaign.type} to ${allContacts.length} contacts`);
      await this.kvService.updateCampaign(orgId, campaignId, {
        status: "sending",
        sentAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      let salesTeamMembers = [];
      if (campaign.campaignType === "sales") {
        if ((_a = campaign.salesSettings) == null ? void 0 : _a.useRoundRobin) {
          salesTeamMembers = await this.salesTeamService.getActiveMembers(orgId);
        } else if ((_c = (_b = campaign.salesSettings) == null ? void 0 : _b.selectedMemberIds) == null ? void 0 : _c.length) {
          const allMembers = await this.salesTeamService.getAllMembers(orgId);
          salesTeamMembers = allMembers.filter(
            (member) => campaign.salesSettings.selectedMemberIds.includes(member.id) && member.isActive
          );
        }
        if (salesTeamMembers.length === 0) {
          throw new Error("No active sales team members available for sales campaign");
        }
      }
      for (let i = 0; i < allContacts.length; i++) {
        const contact = allContacts[i];
        if (contact.optedOut) {
          console.log(`Skipping opted-out contact: ${contact.id}`);
          continue;
        }
        let salesMember = null;
        if (campaign.campaignType === "sales" && salesTeamMembers.length > 0) {
          if ((_d = campaign.salesSettings) == null ? void 0 : _d.useRoundRobin) {
            salesMember = await this.salesTeamService.getRoundRobinMember(orgId);
          } else {
            salesMember = salesTeamMembers[i % salesTeamMembers.length];
          }
        }
        if ((campaign.type === "email" || campaign.type === "both") && campaign.emailTemplate) {
          try {
            await this.sendEmailToContact(orgId, campaignId, campaign, contact, salesMember);
            result.emailsSent++;
          } catch (error) {
            console.error(`Email failed for contact ${contact.id}:`, error);
            result.failures++;
            result.errors.push({
              contactId: contact.id,
              error: error instanceof Error ? error.message : "Unknown email error",
              type: "email"
            });
          }
        }
        if ((campaign.type === "sms" || campaign.type === "both") && campaign.smsTemplate) {
          try {
            await this.sendSmsToContact(orgId, campaignId, campaign, contact, salesMember);
            result.smsSent++;
          } catch (error) {
            console.error(`SMS failed for contact ${contact.id}:`, error);
            result.failures++;
            result.errors.push({
              contactId: contact.id,
              error: error instanceof Error ? error.message : "Unknown SMS error",
              type: "sms"
            });
          }
        }
        await this.sleep(100);
      }
      await this.kvService.updateCampaign(orgId, campaignId, {
        status: "completed",
        completedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await this.updateCampaignAnalytics(orgId, campaignId, result);
      result.success = true;
      console.log(`Campaign ${campaignId} completed:`, result);
    } catch (error) {
      console.error(`Campaign ${campaignId} failed:`, error);
      await this.kvService.updateCampaign(orgId, campaignId, {
        status: "failed",
        failedAt: (/* @__PURE__ */ new Date()).toISOString(),
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }
    return result;
  }
  async getAllCampaignContacts(orgId, contactListIds) {
    const allContacts = await this.kvService.listContacts(orgId);
    const campaignContacts = [];
    const seenContactIds = /* @__PURE__ */ new Set();
    for (const contact of allContacts) {
      if (!contact || !contact.contactListIds) continue;
      const belongsToSelectedLists = contact.contactListIds.some(
        (listId) => contactListIds.includes(listId)
      );
      if (belongsToSelectedLists && !seenContactIds.has(contact.id)) {
        campaignContacts.push(contact);
        seenContactIds.add(contact.id);
      }
    }
    return campaignContacts;
  }
  async sendEmailToContact(orgId, campaignId, campaign, contact, salesMember) {
    if (!campaign.emailTemplate || !contact.email) {
      throw new Error("Email template or contact email missing");
    }
    const subject = this.messagingService.replaceVariables(campaign.emailTemplate.subject, contact, campaign, salesMember);
    let htmlBody = this.messagingService.replaceVariables(campaign.emailTemplate.htmlBody, contact, campaign, salesMember);
    const unsubscribeUrl = this.messagingService.generateUnsubscribeUrl(orgId, contact.id, campaignId);
    htmlBody = htmlBody.replace(/\{unsubscribeUrl\}/g, unsubscribeUrl);
    htmlBody = htmlBody.replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
    if (!htmlBody.includes("unsubscribe") && !htmlBody.includes("opt-out")) {
      htmlBody += `<br><br><p style="font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a> from these emails.</p>`;
    }
    const fromEmail = salesMember ? salesMember.email : campaign.emailTemplate.fromEmail;
    salesMember ? `${salesMember.firstName} ${salesMember.lastName}` : campaign.emailTemplate.fromName;
    const result = await this.messagingService.sendEmail({
      to: contact.email,
      from: fromEmail,
      subject,
      htmlBody,
      campaignId,
      contactId: contact.id,
      orgId
    });
    if (!result.success) {
      throw new Error(result.error || "Email sending failed");
    }
    await this.kvService.trackDelivery(orgId, campaignId, contact.id, {
      type: "email",
      status: "sent",
      messageId: result.messageId,
      toAddress: contact.email,
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      salesMemberId: salesMember == null ? void 0 : salesMember.id
      // Track which sales member sent it
    });
  }
  async sendSmsToContact(orgId, campaignId, campaign, contact, salesMember) {
    if (!campaign.smsTemplate || !contact.phone) {
      throw new Error("SMS template or contact phone missing");
    }
    const message = this.messagingService.replaceVariables(campaign.smsTemplate.message, contact, campaign, salesMember);
    const formattedPhone = formatPhoneNumber(contact.phone);
    const fromNumber = salesMember && salesMember.phone ? formatPhoneNumber(salesMember.phone) : campaign.smsTemplate.fromNumber || process.env.DEFAULT_SMS_NUMBER || "+1234567890";
    const result = await this.messagingService.sendSMS({
      to: formattedPhone,
      from: fromNumber,
      message,
      campaignId,
      contactId: contact.id,
      orgId
    });
    if (!result.success) {
      throw new Error(result.error || "SMS sending failed");
    }
    await this.kvService.trackDelivery(orgId, campaignId, contact.id, {
      type: "sms",
      status: "sent",
      messageId: result.messageId,
      toAddress: formattedPhone,
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      salesMemberId: salesMember == null ? void 0 : salesMember.id
      // Track which sales member sent it
    });
  }
  async updateCampaignAnalytics(orgId, campaignId, result) {
    const analytics = {
      totalContacts: result.totalContacts,
      totalSent: result.emailsSent + result.smsSent,
      totalDelivered: result.emailsSent + result.smsSent,
      // Will be updated by webhooks
      totalFailed: result.failures,
      totalOptedOut: 0,
      // Will be updated by webhooks
      emailStats: result.emailsSent > 0 ? {
        sent: result.emailsSent,
        delivered: result.emailsSent,
        opened: 0,
        clicked: 0,
        bounced: 0,
        openRate: 0,
        clickRate: 0
      } : void 0,
      smsStats: result.smsSent > 0 ? {
        sent: result.smsSent,
        delivered: result.smsSent,
        failed: result.errors.filter((e) => e.type === "sms").length,
        deliveryRate: 100
        // Will be updated by webhooks
      } : void 0
    };
    await this.kvService.updateCampaignAnalytics(orgId, campaignId, analytics);
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
async function loader$g(args) {
  const { userId, orgId } = await getAuth(args);
  const { campaignId } = args.params;
  if (!userId || !orgId || !campaignId) {
    return redirect("/dashboard/campaigns");
  }
  try {
    const kvService = getKVService(args.context);
    const campaign = await kvService.getCampaign(orgId, campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    const contactLists = await kvService.listContactLists(orgId);
    const analytics = await kvService.getCampaignAnalytics(orgId, campaignId);
    return {
      campaign,
      contactLists: contactLists || [],
      analytics: analytics || {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        emailStats: { sent: 0, delivered: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 },
        smsStats: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 }
      }
    };
  } catch (error) {
    console.log("Error loading campaign:", error);
    return redirect("/dashboard/campaigns");
  }
}
async function action$9(args) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  const { campaignId } = args.params;
  if (!userId || !orgId || !campaignId) {
    return redirect("/dashboard/campaigns");
  }
  try {
    const formData = await request.formData();
    const action2 = formData.get("_action");
    const kvService = getKVService(args.context);
    if (action2 === "send") {
      try {
        const campaignSender = new CampaignSender(args.context);
        const result = await campaignSender.sendCampaign(orgId, campaignId);
        if (result.success) {
          return json({
            success: `Campaign sent successfully! ${result.emailsSent} emails and ${result.smsSent} SMS messages sent to ${result.totalContacts} contacts.`,
            details: result
          });
        } else {
          return json({
            error: `Campaign sending failed. ${result.failures} failures out of ${result.totalContacts} contacts.`,
            details: result
          }, { status: 400 });
        }
      } catch (error) {
        console.error("Campaign sending error:", error);
        return json({
          error: `Failed to send campaign: ${error instanceof Error ? error.message : "Unknown error"}`
        }, { status: 500 });
      }
    }
    if (action2 === "delete") {
      return redirect("/dashboard/campaigns");
    }
    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Campaign action error:", error);
    return json({ error: "Failed to perform action" }, { status: 500 });
  }
}
function CampaignDetail() {
  const { campaign, contactLists, analytics } = useLoaderData();
  const actionData = useActionData();
  const getContactListNames = () => {
    return campaign.contactListIds.map((id) => {
      const list = contactLists.find((l) => l.id === id);
      return list ? list.name : `Unknown List (${id})`;
    }).join(", ");
  };
  const getTotalContacts = () => {
    return campaign.contactListIds.reduce((total, id) => {
      var _a;
      const list = contactLists.find((l) => l.id === id);
      return total + (((_a = list == null ? void 0 : list.contactIds) == null ? void 0 : _a.length) || 0);
    }, 0);
  };
  return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "md:flex md:items-center md:justify-between mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold leading-7 text-gray-900", children: campaign.name }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center text-sm text-gray-500", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.status === "draft" ? "bg-gray-100 text-gray-800" : campaign.status === "sending" ? "bg-blue-100 text-blue-800" : campaign.status === "sent" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: campaign.status }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center text-sm text-gray-500", children: [
            "Type: ",
            /* @__PURE__ */ jsx("span", { className: "ml-1 font-medium", children: campaign.type })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center text-sm text-gray-500", children: [
            "Created: ",
            formatDate(campaign.createdAt)
          ] }),
          campaign.sentAt && /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center text-sm text-gray-500", children: [
            "Sent: ",
            formatDate(campaign.sentAt)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 flex md:mt-0 md:ml-4", children: campaign.status === "draft" && /* @__PURE__ */ jsxs(Form, { method: "post", className: "inline", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "send" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
            children: "Send Campaign"
          }
        )
      ] }) })
    ] }),
    actionData && "success" in actionData && /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-md bg-green-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-green-800", children: actionData.success }) }),
    actionData && "error" in actionData && /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-md bg-red-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-red-800", children: actionData.error }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-4", children: "Campaign Overview" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            campaign.description && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Description" }),
              /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: campaign.description })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Target Audience" }),
              /* @__PURE__ */ jsxs("dd", { className: "mt-1 text-sm text-gray-900", children: [
                getContactListNames(),
                " (",
                getTotalContacts(),
                " contacts)"
              ] })
            ] })
          ] })
        ] }),
        campaign.emailTemplate && /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-4", children: "Email Template" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "From" }),
                /* @__PURE__ */ jsxs("dd", { className: "mt-1 text-sm text-gray-900", children: [
                  campaign.emailTemplate.fromName,
                  " <",
                  campaign.emailTemplate.fromEmail,
                  ">"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Subject" }),
                /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: campaign.emailTemplate.subject })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Content" }),
              /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: /* @__PURE__ */ jsx("div", { className: "bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto", children: /* @__PURE__ */ jsx("pre", { className: "whitespace-pre-wrap text-sm", children: campaign.emailTemplate.htmlBody }) }) })
            ] })
          ] })
        ] }),
        campaign.smsTemplate && /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-4", children: "SMS Template" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Message" }),
            /* @__PURE__ */ jsxs("dd", { className: "mt-1 text-sm text-gray-900", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-gray-50 rounded-md p-4", children: /* @__PURE__ */ jsx("pre", { className: "whitespace-pre-wrap text-sm", children: campaign.smsTemplate.message }) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-gray-500", children: [
                campaign.smsTemplate.message.length,
                " characters"
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-4", children: "Performance" }),
          campaign.status === "draft" ? /* @__PURE__ */ jsx("div", { className: "text-center py-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Campaign hasn't been sent yet" }) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Total Sent" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: analytics.totalSent })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Delivered" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: analytics.totalDelivered })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Failed" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: analytics.totalFailed })
              ] })
            ] }),
            campaign.emailTemplate && analytics.emailStats && /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Email" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Opened" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    analytics.emailStats.opened,
                    " (",
                    analytics.emailStats.openRate,
                    "%)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Clicked" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    analytics.emailStats.clicked,
                    " (",
                    analytics.emailStats.clickRate,
                    "%)"
                  ] })
                ] })
              ] })
            ] }),
            campaign.smsTemplate && analytics.smsStats && /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "SMS" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-1", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Delivery Rate" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  analytics.smsStats.deliveryRate,
                  "%"
                ] })
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-4", children: "Settings" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            campaign.settings.trackOpens && /* @__PURE__ */ jsxs("div", { className: "flex items-center text-green-600", children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4 mr-2", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
              "Email opens tracked"
            ] }),
            campaign.settings.trackClicks && /* @__PURE__ */ jsxs("div", { className: "flex items-center text-green-600", children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4 mr-2", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }),
              "Link clicks tracked"
            ] })
          ] })
        ] }),
        campaign.status === "draft" && /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-4", children: "Actions" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: `/dashboard/campaigns/${campaign.id}/edit`,
                className: "w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
                children: "Edit Campaign"
              }
            ),
            /* @__PURE__ */ jsxs(Form, { method: "post", className: "w-full", children: [
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "delete" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200",
                  onClick: (e) => {
                    if (!confirm("Are you sure you want to delete this campaign?")) {
                      e.preventDefault();
                    }
                  },
                  children: "Delete Campaign"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9,
  default: CampaignDetail,
  loader: loader$g
}, Symbol.toStringTag, { value: "Module" }));
async function loader$f(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  try {
    const kvService = getKVService(args.context);
    const allContacts = await kvService.listContacts(orgId);
    const metadataFields = /* @__PURE__ */ new Set();
    allContacts.forEach((contact) => {
      if (contact.metadata) {
        Object.keys(contact.metadata).forEach((key) => {
          if (!key.endsWith("_display_name")) {
            metadataFields.add(key);
          }
        });
      }
    });
    const standardFields = [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "optedOut", label: "Opted Out Status" }
    ];
    const customFields = Array.from(metadataFields).map((key) => {
      var _a;
      const displayName = ((_a = allContacts.find(
        (c) => c.metadata && c.metadata[`${key}_display_name`]
      )) == null ? void 0 : _a.metadata[`${key}_display_name`]) || key.replace(/_/g, " ");
      return { key, label: displayName };
    });
    const availableFields = [...standardFields, ...customFields];
    return json({ orgId, availableFields, totalContacts: allContacts.length });
  } catch (error) {
    console.error("Error loading segment builder:", error);
    return json({ orgId, availableFields: [], totalContacts: 0 });
  }
}
async function action$8(args) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const formData = await request.formData();
  const segmentName = formData.get("segmentName");
  const segmentDescription = formData.get("segmentDescription");
  const filtersJson = formData.get("filters");
  if (!segmentName || !filtersJson) {
    return json({ error: "Segment name and filters are required" }, { status: 400 });
  }
  try {
    const filters = JSON.parse(filtersJson);
    const kvService = getKVService(args.context);
    const allContacts = await kvService.listContacts(orgId);
    const matchingContacts = allContacts.filter((contact) => {
      return evaluateFilters(contact, filters);
    });
    const segmentId = generateId();
    await kvService.createContactList(orgId, segmentId, {
      name: segmentName,
      description: segmentDescription,
      filters,
      type: "dynamic",
      // Mark as dynamic segment vs static upload
      contactCount: matchingContacts.length
    });
    for (const contact of matchingContacts) {
      const existingLists = contact.contactListIds || [];
      if (!existingLists.includes(segmentId)) {
        contact.contactListIds = [...existingLists, segmentId];
        await kvService.createContact(orgId, contact.id, contact);
      }
    }
    return json({
      success: true,
      segmentId,
      matchedContacts: matchingContacts.length
    });
  } catch (error) {
    console.error("Error creating segment:", error);
    return json({ error: "Failed to create segment" }, { status: 500 });
  }
}
function evaluateFilters(contact, filters) {
  if (filters.length === 0) return true;
  let result = evaluateRule(contact, filters[0]);
  for (let i = 1; i < filters.length; i++) {
    const rule = filters[i];
    const ruleResult = evaluateRule(contact, rule);
    if (rule.logic === "OR") {
      result = result || ruleResult;
    } else {
      result = result && ruleResult;
    }
  }
  return result;
}
function evaluateRule(contact, rule) {
  var _a;
  let contactValue;
  if (["firstName", "lastName", "email", "phone"].includes(rule.field)) {
    contactValue = contact[rule.field] || "";
  } else if (rule.field === "optedOut") {
    contactValue = contact.optedOut ? "true" : "false";
  } else {
    contactValue = ((_a = contact.metadata) == null ? void 0 : _a[rule.field]) || "";
  }
  const filterValue = rule.value;
  const contactStr = String(contactValue).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();
  switch (rule.operator) {
    case "equals":
      return contactStr === filterStr;
    case "not_equals":
      return contactStr !== filterStr;
    case "contains":
      return contactStr.includes(filterStr);
    case "not_contains":
      return !contactStr.includes(filterStr);
    case "starts_with":
      return contactStr.startsWith(filterStr);
    case "ends_with":
      return contactStr.endsWith(filterStr);
    case "greater_than":
      return parseFloat(contactValue) > parseFloat(filterValue);
    case "less_than":
      return parseFloat(contactValue) < parseFloat(filterValue);
    case "greater_equal":
      return parseFloat(contactValue) >= parseFloat(filterValue);
    case "less_equal":
      return parseFloat(contactValue) <= parseFloat(filterValue);
    case "is_empty":
      return !contactValue || contactValue === "";
    case "is_not_empty":
      return contactValue && contactValue !== "";
    default:
      return false;
  }
}
function NewSegment() {
  const { availableFields, totalContacts } = useLoaderData();
  const actionData = useActionData();
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [filters, setFilters] = useState([]);
  const [previewCount, setPreviewCount] = useState(null);
  const operators = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
    { value: "greater_equal", label: "Greater than or equal" },
    { value: "less_equal", label: "Less than or equal" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" }
  ];
  const addFilter = () => {
    var _a;
    const newFilter = {
      id: generateId(),
      field: ((_a = availableFields[0]) == null ? void 0 : _a.key) || "",
      operator: "equals",
      value: "",
      logic: filters.length > 0 ? "AND" : void 0
    };
    setFilters([...filters, newFilter]);
  };
  const updateFilter = (id, updates) => {
    setFilters(filters.map(
      (filter) => filter.id === id ? { ...filter, ...updates } : filter
    ));
  };
  const removeFilter = (id) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };
  if (actionData && "success" in actionData && actionData.success) {
    return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-green-400 mt-1", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-green-800", children: "Segment Created!" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-green-700", children: /* @__PURE__ */ jsxs("p", { children: [
          'Successfully created segment "',
          segmentName,
          '" with ',
          actionData && "matchedContacts" in actionData ? actionData.matchedContacts : 0,
          " matching contacts."
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
          "a",
          {
            href: `/dashboard/contacts/segments/${actionData && "segmentId" in actionData ? actionData.segmentId : ""}`,
            className: "text-green-800 hover:text-green-900 font-medium",
            children: "View segment →"
          }
        ) })
      ] })
    ] }) }) }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx("div", { className: "md:flex md:items-center md:justify-between mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Create New Segment" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-gray-500", children: [
        "Create a dynamic segment by filtering your ",
        totalContacts,
        " contacts based on their properties."
      ] })
    ] }) }),
    actionData && "error" in actionData && /* @__PURE__ */ jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsx("p", { className: "text-red-800", children: actionData.error }) }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "filters", value: JSON.stringify(filters) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-4", children: "Segment Details" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Segment Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "segmentName",
                value: segmentName,
                onChange: (e) => setSegmentName(e.target.value),
                className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
                placeholder: "e.g., High-Value Customers, Newsletter Subscribers",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "segmentDescription",
                value: segmentDescription,
                onChange: (e) => setSegmentDescription(e.target.value),
                rows: 3,
                className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
                placeholder: "Describe this segment..."
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: "Filters" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: addFilter,
              className: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "-ml-0.5 mr-2 h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
                "Add Filter"
              ]
            }
          )
        ] }),
        filters.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-6 bg-gray-50 rounded-lg", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "No filters added yet. Add a filter to start building your segment." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filters.map((filter, index) => /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [
          index > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Logic" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filter.logic || "AND",
                onChange: (e) => updateFilter(filter.id, { logic: e.target.value }),
                className: "block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "AND", children: "AND" }),
                  /* @__PURE__ */ jsx("option", { value: "OR", children: "OR" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Field" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: filter.field,
                  onChange: (e) => updateFilter(filter.id, { field: e.target.value }),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
                  children: availableFields.map((field) => /* @__PURE__ */ jsx("option", { value: field.key, children: field.label }, field.key))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Operator" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: filter.operator,
                  onChange: (e) => updateFilter(filter.id, { operator: e.target.value }),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
                  children: operators.map((op) => /* @__PURE__ */ jsx("option", { value: op.value, children: op.label }, op.value))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Value" }),
              filter.field === "optedOut" ? /* @__PURE__ */ jsxs(
                "select",
                {
                  value: filter.value,
                  onChange: (e) => updateFilter(filter.id, { value: e.target.value }),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "false", children: "Active" }),
                    /* @__PURE__ */ jsx("option", { value: "true", children: "Opted Out" })
                  ]
                }
              ) : ["is_empty", "is_not_empty"].includes(filter.operator) ? /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: "(no value needed)",
                  disabled: true,
                  className: "block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500"
                }
              ) : /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: filter.value,
                  onChange: (e) => updateFilter(filter.id, { value: e.target.value }),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
                  placeholder: "Enter value..."
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeFilter(filter.id),
                className: "inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50",
                children: "Remove"
              }
            ) })
          ] })
        ] }, filter.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/dashboard/contacts",
            className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: !segmentName || filters.length === 0,
            className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed",
            children: "Create Segment"
          }
        )
      ] })
    ] })
  ] }) });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  default: NewSegment,
  loader: loader$f
}, Symbol.toStringTag, { value: "Module" }));
async function loader$e(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const { contactId } = args.params;
  if (!contactId) {
    throw new Response("Contact not found", { status: 404 });
  }
  try {
    const kvService = getKVService(args.context);
    const contact = await kvService.getContact(orgId, contactId);
    if (!contact) {
      throw new Response("Contact not found", { status: 404 });
    }
    const contactLists = await kvService.listContactLists(orgId);
    const contactListsForContact = contactLists.filter(
      (list) => contact.contactListIds && contact.contactListIds.includes(list.id)
    );
    return json({
      contact,
      contactLists: contactListsForContact,
      orgId
    });
  } catch (error) {
    console.error("Error loading contact:", error);
    throw new Response("Failed to load contact", { status: 500 });
  }
}
async function action$7(args) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const { contactId } = args.params;
  if (!contactId) {
    throw new Response("Contact not found", { status: 404 });
  }
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  try {
    const kvService = getKVService(args.context);
    const contact = await kvService.getContact(orgId, contactId);
    if (!contact) {
      throw new Response("Contact not found", { status: 404 });
    }
    if (actionType === "update") {
      const firstName = formData.get("firstName");
      const lastName = formData.get("lastName");
      const email = formData.get("email");
      const phone = formData.get("phone");
      if (email && !isValidEmail(email)) {
        return json({ error: "Invalid email format" }, { status: 400 });
      }
      if (phone && !isValidPhone(phone)) {
        return json({ error: "Invalid phone format" }, { status: 400 });
      }
      const metadata = { ...contact.metadata };
      const customFieldsData = formData.get("customFields");
      if (customFieldsData) {
        const customFields = JSON.parse(customFieldsData);
        for (const [key, value] of Object.entries(customFields)) {
          if (value) {
            metadata[key] = value;
          }
        }
      }
      const updates = {
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phone: phone || "",
        metadata
      };
      await kvService.updateContact(orgId, contactId, updates);
      return json({ success: "Contact updated successfully" });
    } else if (actionType === "toggleOptOut") {
      const newOptOutStatus = !contact.optedOut;
      await kvService.updateContactOptOut(orgId, contactId, newOptOutStatus);
      return json({ success: `Contact ${newOptOutStatus ? "opted out" : "reactivated"} successfully` });
    } else {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating contact:", error);
    return json({ error: "Failed to update contact" }, { status: 500 });
  }
}
function ContactView() {
  const { contact, contactLists } = useLoaderData();
  const actionData = useActionData();
  useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState(() => {
    const fields = {};
    if (contact.metadata) {
      Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).forEach((key) => {
        fields[key] = contact.metadata[key] || "";
      });
    }
    return fields;
  });
  const getCustomFieldDisplayName = (key) => {
    var _a;
    return ((_a = contact.metadata) == null ? void 0 : _a[`${key}_display_name`]) || key.replace(/_/g, " ");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("nav", { className: "flex", "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsxs("ol", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/dashboard/contacts", className: "text-gray-400 hover:text-gray-500", children: "Contacts" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("svg", { className: "flex-shrink-0 h-5 w-5 text-gray-300", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsxs("span", { className: "ml-4 text-sm font-medium text-gray-500", children: [
              contact.firstName,
              " ",
              contact.lastName
            ] })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxs("h1", { className: "mt-2 text-2xl font-bold text-gray-900", children: [
          contact.firstName,
          " ",
          contact.lastName
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setIsEditing(!isEditing),
            className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) }),
              isEditing ? "Cancel Edit" : "Edit Contact"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(Form, { method: "post", style: { display: "inline" }, children: [
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "actionType", value: "toggleOptOut" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: `inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${contact.optedOut ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`,
              children: contact.optedOut ? "Reactivate" : "Opt Out"
            }
          )
        ] })
      ] })
    ] }),
    actionData && "success" in actionData && /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-green-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { className: "ml-3 text-sm text-green-800", children: actionData.success })
    ] }) }),
    actionData && "error" in actionData && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-red-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { className: "ml-3 text-sm text-red-800", children: actionData.error })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:px-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Contact Information" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-2xl text-sm text-gray-500", children: "Personal details and contact information." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center", children: contact.optedOut ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800", children: "Opted Out" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800", children: "Active" }) })
      ] }),
      isEditing ? /* @__PURE__ */ jsxs(Form, { method: "post", className: "border-t border-gray-200", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "actionType", value: "update" }),
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-gray-700", children: "First Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  name: "firstName",
                  id: "firstName",
                  defaultValue: contact.firstName,
                  className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-gray-700", children: "Last Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  name: "lastName",
                  id: "lastName",
                  defaultValue: contact.lastName,
                  className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email Address" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  name: "email",
                  id: "email",
                  defaultValue: contact.email,
                  className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700", children: "Phone Number" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "tel",
                  name: "phone",
                  id: "phone",
                  defaultValue: contact.phone,
                  className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                }
              )
            ] }),
            Object.keys(customFields).length > 0 && /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-700 mb-4", children: "Custom Fields" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2", children: Object.keys(customFields).map((key) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { htmlFor: key, className: "block text-sm font-medium text-gray-700", children: getCustomFieldDisplayName(key) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    name: key,
                    id: key,
                    value: customFields[key],
                    onChange: (e) => setCustomFields((prev) => ({
                      ...prev,
                      [key]: e.target.value
                    })),
                    className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                  }
                )
              ] }, key)) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "customFields", value: JSON.stringify(customFields) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsEditing(false),
                className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600",
                children: "Save Changes"
              }
            )
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200", children: /* @__PURE__ */ jsxs("dl", { children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Full name" }),
          /* @__PURE__ */ jsxs("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: [
            contact.firstName,
            " ",
            contact.lastName
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Email address" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: contact.email || "-" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Phone number" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: contact.phone || "-" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Status" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: contact.optedOut ? /* @__PURE__ */ jsxs("span", { className: "inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800", children: [
            "Opted Out",
            contact.optedOutAt && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-gray-600", children: [
              "on ",
              formatDate(contact.optedOutAt)
            ] })
          ] }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800", children: "Active" }) })
        ] }),
        contact.metadata && Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Custom Fields" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).map((key) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium text-gray-600", children: [
              getCustomFieldDisplayName(key),
              ":"
            ] }),
            /* @__PURE__ */ jsx("span", { children: contact.metadata[key] || "-" })
          ] }, key)) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Created" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: formatDate(contact.createdAt) })
        ] }),
        contact.updatedAt && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6", children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Last Updated" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2", children: formatDate(contact.updatedAt) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:px-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: "Contact Lists" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-2xl text-sm text-gray-500", children: "Lists and segments this contact belongs to." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200", children: contactLists.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-200", children: contactLists.map((list) => /* @__PURE__ */ jsx("li", { className: "px-4 py-4 sm:px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-900", children: list.name }),
          list.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: list.description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
            "Created ",
            formatDate(list.createdAt)
          ] }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: `/dashboard/contacts/segments/${list.id}`,
              className: "text-primary-600 hover:text-primary-900 text-sm font-medium",
              children: "View List"
            }
          )
        ] })
      ] }) }, list.id)) }) : /* @__PURE__ */ jsx("div", { className: "px-4 py-5 sm:px-6 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "This contact is not in any lists." }) }) })
    ] })
  ] });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  default: ContactView,
  loader: loader$e
}, Symbol.toStringTag, { value: "Module" }));
async function loader$d(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const { teamId } = args.params;
  if (!teamId) {
    throw new Response("Team member not found", { status: 404 });
  }
  try {
    const salesTeamService = getSalesTeamService(args.context);
    const member = await salesTeamService.getMember(orgId, teamId);
    if (!member) {
      throw new Response("Team member not found", { status: 404 });
    }
    return { orgId, member };
  } catch (error) {
    console.error("Error loading team member:", error);
    throw new Response("Failed to load team member", { status: 500 });
  }
}
async function action$6(args) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  const { teamId } = args.params;
  if (!userId || !orgId || !teamId) {
    return redirect("/dashboard");
  }
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  try {
    const salesTeamService = getSalesTeamService(args.context);
    if (actionType === "update") {
      const updates = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        title: formData.get("title"),
        department: formData.get("department"),
        bio: formData.get("bio"),
        isActive: formData.get("isActive") === "on"
      };
      if (!updates.firstName || !updates.lastName || !updates.email) {
        return json({ error: "First name, last name, and email are required" }, { status: 400 });
      }
      const updatedMember = await salesTeamService.updateMember(orgId, teamId, updates);
      if (!updatedMember) {
        return json({ error: "Team member not found" }, { status: 404 });
      }
      return json({ success: "Team member updated successfully" });
    } else if (actionType === "delete") {
      const deleted = await salesTeamService.deleteMember(orgId, teamId);
      if (!deleted) {
        return json({ error: "Team member not found" }, { status: 404 });
      }
      return redirect("/dashboard/team");
    } else {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating team member:", error);
    return json({ error: "Failed to update team member" }, { status: 500 });
  }
}
function EditTeamMember() {
  const { member } = useLoaderData();
  const actionData = useActionData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("nav", { className: "flex", "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsxs("ol", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/dashboard/team", className: "text-gray-400 hover:text-gray-500", children: "Sales Team" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("svg", { className: "flex-shrink-0 h-5 w-5 text-gray-300", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsxs("span", { className: "ml-4 text-sm font-medium text-gray-500", children: [
              member.firstName,
              " ",
              member.lastName
            ] })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-2xl font-bold text-gray-900", children: "Edit Team Member" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
          "Update ",
          member.firstName,
          " ",
          member.lastName,
          "'s information."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex space-x-3", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowDeleteConfirm(true),
          className: "inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5 text-red-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }),
            "Delete"
          ]
        }
      ) })
    ] }),
    actionData && "success" in actionData && /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-green-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { className: "ml-3 text-sm text-green-800", children: actionData.success })
    ] }) }),
    actionData && "error" in actionData && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-red-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { className: "ml-3 text-sm text-red-800", children: actionData.error })
    ] }) }),
    showDeleteConfirm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center mb-4", children: [
        /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-red-600 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Delete Team Member" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 mb-6", children: [
        "Are you sure you want to delete ",
        member.firstName,
        " ",
        member.lastName,
        "? This action cannot be undone."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowDeleteConfirm(false),
            className: "px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(Form, { method: "post", style: { display: "inline" }, children: [
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "actionType", value: "delete" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700",
              children: "Delete"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "bg-white shadow rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "px-4 py-5 sm:p-6", children: /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "actionType", value: "update" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-gray-700", children: "First Name *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "firstName",
              id: "firstName",
              defaultValue: member.firstName,
              required: true,
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "John"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-gray-700", children: "Last Name *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "lastName",
              id: "lastName",
              defaultValue: member.lastName,
              required: true,
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "Smith"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email Address *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              name: "email",
              id: "email",
              defaultValue: member.email,
              required: true,
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "john@company.com"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700", children: "Phone Number" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              name: "phone",
              id: "phone",
              defaultValue: member.phone || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "+1 (555) 123-4567"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700", children: "Job Title" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "title",
              id: "title",
              defaultValue: member.title || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "Sales Manager"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "department", className: "block text-sm font-medium text-gray-700", children: "Department" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "department",
              id: "department",
              defaultValue: member.department || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "Sales"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "bio", className: "block text-sm font-medium text-gray-700", children: "Bio" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "bio",
              id: "bio",
              rows: 3,
              defaultValue: member.bio || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "Brief bio or description..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                name: "isActive",
                id: "isActive",
                defaultChecked: member.isActive,
                className: "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              }
            ),
            /* @__PURE__ */ jsx("label", { htmlFor: "isActive", className: "ml-3 block text-sm font-medium text-gray-700", children: "Active team member" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Inactive members won't appear in campaign assignment options." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200 pt-6", children: /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Created" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: formatDate(member.createdAt) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Last Updated" }),
          /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm text-gray-900", children: formatDate(member.updatedAt) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/dashboard/team",
            className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700",
            children: "Save Changes"
          }
        )
      ] })
    ] }) }) })
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: EditTeamMember,
  loader: loader$d
}, Symbol.toStringTag, { value: "Module" }));
async function loader$c(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  try {
    const kvService = getKVService(args.context);
    const campaigns = await kvService.listCampaigns(orgId);
    const sortedCampaigns = campaigns.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { orgId, campaigns: sortedCampaigns };
  } catch (error) {
    console.log("Error loading campaigns:", error);
    return { orgId, campaigns: [] };
  }
}
function CampaignsIndex() {
  const { campaigns } = useLoaderData();
  if (campaigns.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(
        "svg",
        {
          className: "mx-auto h-12 w-12 text-gray-400",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          "aria-hidden": "true",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No campaigns" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Get started by creating a new campaign." }),
      /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/campaigns/new",
          className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx(
              "path",
              {
                fillRule: "evenodd",
                d: "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z",
                clipRule: "evenodd"
              }
            ) }),
            "New Campaign"
          ]
        }
      ) })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Name" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Type" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Status" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Created" }),
      /* @__PURE__ */ jsx("th", { className: "relative px-6 py-3", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Actions" }) })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: campaigns.map((campaign) => /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsxs("td", { className: "whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900", children: [
        /* @__PURE__ */ jsx("a", { href: `/dashboard/campaigns/${campaign.id}`, className: "hover:text-primary-600", children: campaign.name }),
        campaign.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mt-1", children: campaign.description })
      ] }),
      /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: /* @__PURE__ */ jsx("span", { className: "capitalize", children: campaign.type.replace("-", " + ") }) }),
      /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${campaign.status === "draft" ? "bg-gray-100 text-gray-800" : campaign.status === "sending" ? "bg-blue-100 text-blue-800" : campaign.status === "sent" ? "bg-green-100 text-green-800" : campaign.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: campaign.status }) }),
      /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: formatDate(campaign.createdAt) }),
      /* @__PURE__ */ jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6", children: /* @__PURE__ */ jsx("a", { href: `/dashboard/campaigns/${campaign.id}`, className: "text-primary-600 hover:text-primary-900", children: "View" }) })
    ] }, campaign.id)) })
  ] }) });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: CampaignsIndex,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
async function loader$b(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const kvService = getKVService(args.context);
  const existingCustomFields = await kvService.getCustomFields(orgId);
  return { orgId, existingCustomFields };
}
async function action$5(args) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const formData = await request.formData();
  const csvContent = formData.get("csvContent");
  const listName = formData.get("listName");
  const step = formData.get("step");
  const reactivateDuplicates = formData.get("reactivateDuplicates") === "true";
  if (!csvContent || !listName) {
    return json({ error: "CSV content and list name are required" }, { status: 400 });
  }
  try {
    const kvService = getKVService(args.context);
    const rows = parseCSV(csvContent);
    if (rows.length === 0) {
      return json({ error: "CSV file appears to be empty or invalid" }, { status: 400 });
    }
    if (step === "preview") {
      const headers = Object.keys(rows[0]);
      const preview = rows.slice(0, 5);
      return json({
        step: "mapping",
        headers,
        preview,
        totalRows: rows.length,
        listName
      });
    }
    if (step === "import") {
      const fieldMapping = {};
      const mappingData = formData.get("mapping");
      if (mappingData) {
        Object.assign(fieldMapping, JSON.parse(mappingData));
      }
      const listId = generateId();
      await kvService.createContactList(orgId, listId, {
        name: listName,
        description: `Imported CSV with ${rows.length} contacts`
      });
      const customFieldsToSave = Object.values(fieldMapping).filter(
        (field) => field && !["firstName", "lastName", "email", "phone"].includes(field)
      );
      if (customFieldsToSave.length > 0) {
        const existingCustomFields = await kvService.getCustomFields(orgId);
        const newFields = customFieldsToSave.filter((field) => !existingCustomFields.includes(field));
        if (newFields.length > 0) {
          await kvService.saveCustomFields(orgId, [...existingCustomFields, ...newFields]);
        }
      }
      const contactIds = [];
      const errors = [];
      const duplicatesUpdated = [];
      const skippedDuplicates = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const contact = {
            firstName: row[fieldMapping.firstName] || "",
            lastName: row[fieldMapping.lastName] || "",
            email: row[fieldMapping.email] || "",
            phone: row[fieldMapping.phone] || "",
            metadata: {},
            contactListIds: [listId]
          };
          if (contact.email && !isValidEmail(contact.email)) {
            errors.push({ row: i + 1, error: "Invalid email format" });
            continue;
          }
          if (contact.phone && !isValidPhone(contact.phone)) {
            errors.push({ row: i + 1, error: "Invalid phone format" });
            continue;
          }
          for (const [csvCol, contactField] of Object.entries(fieldMapping)) {
            if (!["firstName", "lastName", "email", "phone"].includes(contactField) && contactField) {
              const cleanFieldName = contactField.toLowerCase().replace(/[^a-z0-9]/g, "_");
              contact.metadata[cleanFieldName] = row[csvCol] || "";
              contact.metadata[`${cleanFieldName}_display_name`] = contactField;
            }
          }
          const existingContact = await kvService.findContactByEmailOrPhone(orgId, contact.email, contact.phone);
          if (existingContact) {
            const isExactDuplicate = contact.email && existingContact.email === contact.email && (contact.phone && existingContact.phone === contact.phone);
            if (isExactDuplicate) {
              const updatedListIds = existingContact.contactListIds || [];
              if (!updatedListIds.includes(listId)) {
                updatedListIds.push(listId);
                const updates = { contactListIds: updatedListIds };
                if (reactivateDuplicates && existingContact.optedOut) {
                  updates.optedOut = false;
                  updates.optedOutAt = null;
                }
                await kvService.updateContact(orgId, existingContact.id, updates);
                if (reactivateDuplicates && existingContact.optedOut) {
                  duplicatesUpdated.push(existingContact.id);
                } else {
                  skippedDuplicates.push(existingContact.id);
                }
              } else {
                skippedDuplicates.push(existingContact.id);
              }
            } else {
              const updatedListIds = existingContact.contactListIds || [];
              if (!updatedListIds.includes(listId)) {
                updatedListIds.push(listId);
              }
              const mergedMetadata = { ...existingContact.metadata, ...contact.metadata };
              const updates = {
                firstName: contact.firstName || existingContact.firstName,
                lastName: contact.lastName || existingContact.lastName,
                email: contact.email || existingContact.email,
                phone: contact.phone || existingContact.phone,
                metadata: mergedMetadata,
                contactListIds: updatedListIds
              };
              if (reactivateDuplicates && existingContact.optedOut) {
                updates.optedOut = false;
                updates.optedOutAt = null;
              }
              await kvService.updateContact(orgId, existingContact.id, updates);
              if (reactivateDuplicates && existingContact.optedOut) {
                duplicatesUpdated.push(existingContact.id);
              } else {
                contactIds.push(existingContact.id);
              }
            }
          } else {
            const contactId = generateId();
            await kvService.createContact(orgId, contactId, contact);
            contactIds.push(contactId);
          }
        } catch (error) {
          console.error("Error processing contact row:", error);
          errors.push({ row: i + 1, error: "Failed to process contact" });
        }
      }
      return json({
        step: "complete",
        listId,
        totalRows: rows.length,
        successfulRows: contactIds.length,
        duplicatesUpdated: duplicatesUpdated.length,
        skippedDuplicates: skippedDuplicates.length,
        failedRows: errors.length,
        errors: errors.slice(0, 10)
        // Limit errors shown
      });
    }
    return json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("CSV import error:", error);
    return json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}
function ContactUpload() {
  const { orgId, existingCustomFields } = useLoaderData();
  const actionData = useActionData();
  const [csvContent, setCsvContent] = useState("");
  const [listName, setListName] = useState("");
  const [fieldMapping, setFieldMapping] = useState({});
  const [customKeys, setCustomKeys] = useState(existingCustomFields || []);
  const [newCustomKeys, setNewCustomKeys] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});
  const handleFileUpload = (event) => {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a2;
        setCsvContent((_a2 = e.target) == null ? void 0 : _a2.result);
      };
      reader.readAsText(file);
    }
  };
  if (actionData && "step" in actionData && actionData.step === "complete") {
    return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-green-400 mt-1", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-green-800", children: "Import Successful!" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 text-sm text-green-700", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "Successfully processed ",
            actionData && "totalRows" in actionData ? actionData.totalRows : 0,
            " contacts:"
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "mt-2 space-y-1", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "• ",
              actionData && "successfulRows" in actionData ? actionData.successfulRows : 0,
              " new contacts imported"
            ] }),
            actionData && "duplicatesUpdated" in actionData && actionData.duplicatesUpdated > 0 && /* @__PURE__ */ jsxs("li", { children: [
              "• ",
              actionData && "duplicatesUpdated" in actionData ? actionData.duplicatesUpdated : 0,
              " duplicate contacts reactivated"
            ] }),
            actionData && "skippedDuplicates" in actionData && actionData.skippedDuplicates > 0 && /* @__PURE__ */ jsxs("li", { children: [
              "• ",
              actionData && "skippedDuplicates" in actionData ? actionData.skippedDuplicates : 0,
              " duplicate contacts skipped (already in list)"
            ] }),
            actionData && "failedRows" in actionData && actionData.failedRows > 0 && /* @__PURE__ */ jsxs("li", { className: "text-yellow-700", children: [
              "• ⚠️ ",
              actionData && "failedRows" in actionData ? actionData.failedRows : 0,
              " contacts failed to import"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
          "a",
          {
            href: `/dashboard/contacts/segments/${actionData && "listId" in actionData ? actionData.listId : ""}`,
            className: "text-green-800 hover:text-green-900 font-medium",
            children: "View segment →"
          }
        ) })
      ] })
    ] }) }) }) });
  }
  if (actionData && "step" in actionData && actionData.step === "mapping") {
    return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900 mb-6", children: "Map CSV Columns" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: "Map your CSV columns to contact fields. Preview shows the first 5 rows." }),
      /* @__PURE__ */ jsxs(Form, { method: "post", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "step", value: "import" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "csvContent", value: csvContent }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "listName", value: listName }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-4", children: "Map CSV Columns" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-6", children: "For each CSV column, choose what field it should map to. You can use standard fields or create custom ones." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-4", children: actionData && "headers" in actionData && actionData.headers.map((csvColumn, index) => {
              var _a;
              return /* @__PURE__ */ jsx("div", { className: "border border-gray-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "CSV Column" }),
                  /* @__PURE__ */ jsx("div", { className: "px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-900", children: csvColumn }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-gray-500", children: [
                    "Sample: ",
                    actionData && "preview" in actionData && ((_a = actionData.preview[0]) == null ? void 0 : _a[csvColumn]) || "No data"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Maps to Field" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2",
                      value: fieldMapping[csvColumn] || "",
                      onChange: (e) => {
                        if (e.target.value === "ADD_CUSTOM") {
                          setShowCustomInput((prev) => ({
                            ...prev,
                            [csvColumn]: true
                          }));
                          return;
                        }
                        setFieldMapping((prev) => ({
                          ...prev,
                          [csvColumn]: e.target.value
                        }));
                        setShowCustomInput((prev) => ({
                          ...prev,
                          [csvColumn]: false
                        }));
                      },
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "-- Select Field --" }),
                        /* @__PURE__ */ jsxs("optgroup", { label: "Standard Fields", children: [
                          /* @__PURE__ */ jsx("option", { value: "firstName", children: "First Name" }),
                          /* @__PURE__ */ jsx("option", { value: "lastName", children: "Last Name" }),
                          /* @__PURE__ */ jsx("option", { value: "email", children: "Email Address" }),
                          /* @__PURE__ */ jsx("option", { value: "phone", children: "Phone Number" })
                        ] }),
                        customKeys.length > 0 && /* @__PURE__ */ jsx("optgroup", { label: "Custom Fields", children: customKeys.map((key) => /* @__PURE__ */ jsx("option", { value: key, children: key }, key)) }),
                        /* @__PURE__ */ jsx("optgroup", { label: "Actions", children: /* @__PURE__ */ jsx("option", { value: "ADD_CUSTOM", children: "+ Add Custom Field" }) })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  showCustomInput[csvColumn] && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "New Custom Field" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "e.g., Vehicle Year, Job Title",
                          className: "flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2",
                          value: newCustomKeys[csvColumn] || "",
                          onChange: (e) => setNewCustomKeys((prev) => ({
                            ...prev,
                            [csvColumn]: e.target.value
                          })),
                          onKeyDown: (e) => {
                            var _a2;
                            if (e.key === "Enter" && ((_a2 = newCustomKeys[csvColumn]) == null ? void 0 : _a2.trim())) {
                              const cleanKey = newCustomKeys[csvColumn].trim();
                              if (!customKeys.includes(cleanKey)) {
                                setCustomKeys((prev) => [...prev, cleanKey]);
                              }
                              setFieldMapping((prev) => ({
                                ...prev,
                                [csvColumn]: cleanKey
                              }));
                              setShowCustomInput((prev) => ({
                                ...prev,
                                [csvColumn]: false
                              }));
                              setNewCustomKeys((prev) => {
                                const newKeys = { ...prev };
                                delete newKeys[csvColumn];
                                return newKeys;
                              });
                            }
                          }
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          className: "px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500",
                          onClick: () => {
                            var _a2;
                            if ((_a2 = newCustomKeys[csvColumn]) == null ? void 0 : _a2.trim()) {
                              const cleanKey = newCustomKeys[csvColumn].trim();
                              if (!customKeys.includes(cleanKey)) {
                                setCustomKeys((prev) => [...prev, cleanKey]);
                              }
                              setFieldMapping((prev) => ({
                                ...prev,
                                [csvColumn]: cleanKey
                              }));
                              setShowCustomInput((prev) => ({
                                ...prev,
                                [csvColumn]: false
                              }));
                              setNewCustomKeys((prev) => {
                                const newKeys = { ...prev };
                                delete newKeys[csvColumn];
                                return newKeys;
                              });
                            }
                          },
                          children: "Add"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: "mt-1 text-xs text-gray-600 hover:text-gray-800",
                        onClick: () => {
                          setShowCustomInput((prev) => ({
                            ...prev,
                            [csvColumn]: false
                          }));
                          setNewCustomKeys((prev) => {
                            const newKeys = { ...prev };
                            delete newKeys[csvColumn];
                            return newKeys;
                          });
                        },
                        children: "Cancel"
                      }
                    )
                  ] }),
                  fieldMapping[csvColumn] && !showCustomInput[csvColumn] && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Mapped Field" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-l-md text-sm font-medium text-green-800", children: [
                        "✓ ",
                        fieldMapping[csvColumn]
                      ] }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          className: "px-3 py-2 border border-l-0 border-green-200 bg-red-50 text-red-700 rounded-r-md hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
                          onClick: () => {
                            setFieldMapping((prev) => {
                              const newMapping = { ...prev };
                              delete newMapping[csvColumn];
                              return newMapping;
                            });
                          },
                          title: "Clear mapping",
                          children: "−"
                        }
                      )
                    ] })
                  ] })
                ] })
              ] }) }, csvColumn);
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-4", children: "Preview" }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsx("tr", { children: actionData && "headers" in actionData && actionData.headers.map((header) => /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: header }, header)) }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: actionData && "preview" in actionData && actionData.preview.map((row, index) => /* @__PURE__ */ jsx("tr", { children: actionData && "headers" in actionData && actionData.headers.map((header) => /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-900", children: row[header] }, header)) }, index)) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "hidden",
              name: "mapping",
              value: JSON.stringify(fieldMapping)
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-900 mb-3", children: "Duplicate Handling" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxs("label", { className: "flex items-start", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  name: "reactivateDuplicates",
                  value: "true",
                  className: "mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Reactivate opted-out duplicates" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "If a contact with the same email or phone already exists but has opted out, reactivate them when importing. Otherwise, duplicates will be updated but remain opted out." })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-3", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/dashboard/contacts/upload",
                className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50",
                children: "Back"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600",
                children: "Import Contacts"
              }
            )
          ] })
        ] })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900 mb-6", children: "Upload Contacts" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: "Upload a CSV file to import your contacts. Make sure your CSV includes headers for proper field mapping." }),
    actionData && "error" in actionData && /* @__PURE__ */ jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsx("p", { className: "text-red-800", children: actionData.error }) }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "step", value: "preview" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Contact List Name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "listName",
            value: listName,
            onChange: (e) => setListName(e.target.value),
            className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2",
            placeholder: "e.g., Newsletter Subscribers",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "CSV File" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            accept: ".csv",
            onChange: handleFileUpload,
            className: "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100",
            required: true
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Upload a CSV file with contact information. Common columns include: Name, Email, Phone, Company, etc." })
      ] }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "csvContent", value: csvContent }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: !csvContent || !listName,
          className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed",
          children: "Preview Import"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 p-4 bg-primary-50 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-primary-900 mb-2", children: "Need a template?" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-primary-700 mb-3", children: "Download a sample CSV template with common fields to get started quickly." }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
          onClick: () => {
            const csvContent2 = `First Name,Last Name,Email,Phone,Company,Notes
John,Doe,john@example.com,+15551234567,Acme Corp,Sample contact
Jane,Smith,jane@example.com,+15559876543,Tech Inc,Another sample`;
            const blob = new Blob([csvContent2], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "contacts-template.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          },
          children: [
            /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }),
            "Download Template CSV"
          ]
        }
      )
    ] })
  ] }) });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: ContactUpload,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
async function loader$a(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  try {
    const kvService = getKVService(args.context);
    const url = new URL(args.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const allContacts = await kvService.listContacts(orgId);
    const segments = await kvService.listContactLists(orgId);
    let filteredContacts = allContacts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = allContacts.filter((contact) => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = (contact.email || "").toLowerCase();
        const phone = (contact.phone || "").toLowerCase();
        const metadataText = contact.metadata ? Object.values(contact.metadata).join(" ").toLowerCase() : "";
        return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || metadataText.includes(searchLower);
      });
    }
    const totalContacts = filteredContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const offset = (page - 1) * limit;
    const paginatedContacts = filteredContacts.slice(offset, offset + limit);
    return json({
      orgId,
      contacts: paginatedContacts,
      segments,
      pagination: {
        currentPage: page,
        totalPages,
        totalContacts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      search
    });
  } catch (error) {
    console.error("Error loading contacts:", error);
    return json({
      orgId,
      contacts: [],
      segments: [],
      pagination: { currentPage: 1, totalPages: 0, totalContacts: 0, limit: 50, hasNextPage: false, hasPrevPage: false },
      search: ""
    });
  }
}
function ContactsIndex() {
  const { contacts, segments, pagination, search } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Segments" }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/dashboard/contacts/segments/new",
            className: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "-ml-0.5 mr-2 h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
              "Create Segment"
            ]
          }
        )
      ] }),
      segments.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-gray-50 rounded-lg", children: [
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: "mx-auto h-12 w-12 text-gray-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No segments" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Create segments by filtering your contacts or upload a CSV file." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-center space-x-3", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/dashboard/contacts/segments/new",
              className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
                "Create Segment"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/dashboard/contacts/upload",
              className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Upload CSV"
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: segments.map((segment) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-full bg-secondary-500 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "h-6 w-6 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { d: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" }) }) }) }),
            /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxs("a", { href: `/dashboard/contacts/segments/${segment.id}`, className: "focus:outline-none", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900", children: segment.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: segment.description || "No description" })
            ] }) })
          ] })
        },
        segment.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-medium text-gray-900 mb-2 sm:mb-0", children: [
          "All Contacts (",
          pagination.totalContacts,
          ")"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-4", children: /* @__PURE__ */ jsxs("form", { method: "GET", className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "search",
                defaultValue: search,
                className: "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500",
                placeholder: "Search contacts..."
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600",
              children: "Search"
            }
          ),
          search && /* @__PURE__ */ jsx(
            "a",
            {
              href: "/dashboard/contacts",
              className: "inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Clear"
            }
          )
        ] }) })
      ] }),
      contacts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-gray-50 rounded-lg", children: [
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: "mx-auto h-12 w-12 text-gray-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No contacts" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Get started by adding a new contact or uploading a CSV file." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-center space-x-3", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/dashboard/contacts/upload",
              className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600",
              children: "Upload CSV"
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/dashboard/contacts/new",
              className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
                "Add Contact"
              ]
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Name" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Email" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Phone" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Custom Fields" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "relative px-6 py-3", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Actions" }) })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: contacts.slice(0, 10).map((contact) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900", children: [
            contact.firstName,
            " ",
            contact.lastName
          ] }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.email }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.phone }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: contact.metadata && Object.keys(contact.metadata).filter((key) => !key.endsWith("_display_name")).map((key) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
              contact.metadata[`${key}_display_name`] || key.replace(/_/g, " "),
              ":"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs", children: contact.metadata[key] })
          ] }, key)) }) }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: contact.optedOut ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800", children: "Opted Out" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800", children: "Active" }) }),
          /* @__PURE__ */ jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6", children: /* @__PURE__ */ jsx("a", { href: `/dashboard/contacts/${contact.id}`, className: "text-primary-600 hover:text-primary-900", children: "View" }) })
        ] }, contact.id)) })
      ] }) }),
      pagination.totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex justify-between sm:hidden", children: [
          pagination.hasPrevPage ? /* @__PURE__ */ jsx(
            "a",
            {
              href: `?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
              className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Previous"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100", children: "Previous" }),
          pagination.hasNextPage ? /* @__PURE__ */ jsx(
            "a",
            {
              href: `?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
              className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
              children: "Next"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100", children: "Next" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700", children: [
            "Showing",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: (pagination.currentPage - 1) * pagination.limit + 1 }),
            " ",
            "to",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: Math.min(pagination.currentPage * pagination.limit, pagination.totalContacts) }),
            " ",
            "of",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: pagination.totalContacts }),
            " ",
            "results",
            search && /* @__PURE__ */ jsxs("span", { children: [
              ' for "',
              search,
              '"'
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", "aria-label": "Pagination", children: [
            pagination.hasPrevPage ? /* @__PURE__ */ jsxs(
              "a",
              {
                href: `?page=${pagination.currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Previous" }),
                  /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", clipRule: "evenodd" }) })
                ]
              }
            ) : /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400", children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Previous" }),
              /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", clipRule: "evenodd" }) })
            ] }),
            Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              const isCurrentPage = pageNum === pagination.currentPage;
              return /* @__PURE__ */ jsx(
                "a",
                {
                  href: `?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                  className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${isCurrentPage ? "z-10 bg-primary-50 border-primary-500 text-primary-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`,
                  children: pageNum
                },
                pageNum
              );
            }),
            pagination.hasNextPage ? /* @__PURE__ */ jsxs(
              "a",
              {
                href: `?page=${pagination.currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
                className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Next" }),
                  /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })
                ]
              }
            ) : /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400", children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Next" }),
              /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })
            ] })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ContactsIndex,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
async function loader$9(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  try {
    const kvService = getKVService(args.context);
    const contactLists = await kvService.listContactLists(orgId);
    const allContacts = await kvService.listContacts(orgId);
    const listsWithCounts = contactLists.map((list) => ({
      ...list,
      contactCount: allContacts ? allContacts.filter(
        (contact) => contact && contact.contactListIds && contact.contactListIds.includes(list.id)
      ).length : 0
    }));
    const orgSettings = await kvService.getOrgSettings(orgId);
    const salesTeamService = getSalesTeamService(args.context);
    const salesTeam = await salesTeamService.getAllMembers(orgId);
    const activeMembers = salesTeam.filter((member) => member.isActive);
    return {
      orgId,
      contactLists: listsWithCounts || [],
      defaultSignature: orgSettings.emailSignature || {},
      salesTeam: activeMembers
    };
  } catch (error) {
    console.log("Error loading contact lists:", error);
    return {
      orgId,
      contactLists: [],
      defaultSignature: {},
      salesTeam: []
    };
  }
}
async function action$4(args) {
  var _a, _b, _c, _d;
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  try {
    const formData = await request.formData();
    const kvService = getKVService(args.context);
    const campaignData = {
      name: formData.get("name"),
      description: formData.get("description"),
      type: formData.get("type"),
      campaignType: formData.get("campaignMode"),
      contactListIds: formData.getAll("contactLists"),
      // Email template
      emailTemplate: formData.get("type") !== "sms" ? {
        subject: formData.get("emailSubject"),
        htmlBody: formData.get("emailBody"),
        fromEmail: formData.get("fromEmail"),
        fromName: formData.get("fromName"),
        signature: {
          salesPersonName: formData.get("salesPersonName"),
          salesPersonTitle: formData.get("salesPersonTitle"),
          salesPersonPhone: formData.get("salesPersonPhone"),
          companyLogoUrl: formData.get("companyLogoUrl")
        }
      } : void 0,
      // SMS template
      smsTemplate: formData.get("type") !== "email" ? {
        message: formData.get("smsMessage")
      } : void 0,
      // Sales settings (for sales campaigns)
      salesSettings: formData.get("campaignMode") === "sales" ? {
        useRoundRobin: formData.get("useRoundRobin") === "on",
        selectedMemberIds: formData.getAll("selectedMembers")
      } : void 0,
      // Settings
      settings: {
        trackOpens: formData.get("trackOpens") === "on",
        trackClicks: formData.get("trackClicks") === "on",
        timezone: "America/Toronto"
        // Default for now
      }
    };
    if (!campaignData.name || !campaignData.type || campaignData.contactListIds.length === 0) {
      return json({ error: "Campaign name, type, and at least one contact list are required" }, { status: 400 });
    }
    if (campaignData.type !== "sms" && (!((_a = campaignData.emailTemplate) == null ? void 0 : _a.subject) || !((_b = campaignData.emailTemplate) == null ? void 0 : _b.htmlBody))) {
      return json({ error: "Email subject and body are required for email campaigns" }, { status: 400 });
    }
    if (campaignData.campaignType === "company" && campaignData.type !== "sms" && !((_c = campaignData.emailTemplate) == null ? void 0 : _c.fromEmail)) {
      return json({ error: "From email is required for company email campaigns" }, { status: 400 });
    }
    if (campaignData.type !== "email" && !((_d = campaignData.smsTemplate) == null ? void 0 : _d.message)) {
      return json({ error: "SMS message is required for SMS campaigns" }, { status: 400 });
    }
    const campaignId = generateId();
    await kvService.createCampaign(orgId, campaignId, campaignData);
    return redirect(`/dashboard/campaigns/${campaignId}`);
  } catch (error) {
    console.error("Campaign creation error:", error);
    return json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
function NewCampaign() {
  const { contactLists, defaultSignature, salesTeam } = useLoaderData();
  const actionData = useActionData();
  const [campaignType, setCampaignType] = useState("email");
  const [campaignMode, setCampaignMode] = useState("company");
  const [selectedLists, setSelectedLists] = useState([]);
  const [emailContent, setEmailContent] = useState("");
  const [emailHtmlCode, setEmailHtmlCode] = useState("");
  const [emailEditorMode, setEmailEditorMode] = useState("visual");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSegments, setSmsSegments] = useState(1);
  const [selectedTeamMember, setSelectedTeamMember] = useState("");
  const calculateSmsSegments = (message) => {
    if (!message) return 0;
    const gsmChars = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;
    const isUnicode = !gsmChars.test(message);
    if (isUnicode) {
      if (message.length <= 70) return 1;
      return Math.ceil(message.length / 67);
    } else {
      if (message.length <= 160) return 1;
      return Math.ceil(message.length / 153);
    }
  };
  useEffect(() => {
    setSmsSegments(calculateSmsSegments(smsMessage));
  }, [smsMessage]);
  useEffect(() => {
    if (emailEditorMode === "html" && !emailHtmlCode && emailContent) {
      setEmailHtmlCode(emailContent);
    } else if (emailEditorMode === "visual" && emailHtmlCode && !emailContent) {
      setEmailContent(emailHtmlCode);
    }
  }, [emailEditorMode, emailContent, emailHtmlCode]);
  const executeCommand = (command, value) => {
    document.execCommand(command, false, value);
    const editorElement = document.querySelector("[contenteditable]");
    if (editorElement) {
      setEmailContent(editorElement.innerHTML);
    }
  };
  const toggleEditorMode = () => {
    const editorElement = document.querySelector("[contenteditable]");
    if (emailEditorMode === "visual" && editorElement) {
      const currentContent = editorElement.innerHTML;
      setEmailContent(currentContent);
      setEmailHtmlCode(currentContent);
    } else if (emailEditorMode === "html") {
      setEmailContent(emailHtmlCode);
    }
    setEmailEditorMode(emailEditorMode === "visual" ? "html" : "visual");
  };
  return /* @__PURE__ */ jsx("div", { className: "px-4 py-6 sm:px-0", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx("div", { className: "md:flex md:items-center md:justify-between mb-8", children: /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold leading-7 text-accent-900 sm:truncate", children: "Create New Campaign" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-accent-600", children: "Design and send unified SMS and email marketing campaigns" })
    ] }) }),
    (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-md bg-red-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-red-800", children: actionData.error }) }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-6", children: "Campaign Details" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Campaign Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "name",
                required: true,
                className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2",
                placeholder: "e.g., Welcome Series, Monthly Newsletter"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "description",
                rows: 3,
                className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                placeholder: "Brief description of this campaign"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Campaign Type *" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                name: "type",
                value: campaignType,
                onChange: (e) => setCampaignType(e.target.value),
                className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                required: true,
                children: [
                  /* @__PURE__ */ jsx("option", { value: "email", children: "Email Only" }),
                  /* @__PURE__ */ jsx("option", { value: "sms", children: "SMS Only" }),
                  /* @__PURE__ */ jsx("option", { value: "both", children: "Email + SMS" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Campaign Mode *" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    name: "campaignMode",
                    value: "company",
                    checked: campaignMode === "company",
                    onChange: (e) => setCampaignMode(e.target.value),
                    className: "h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-900", children: "Company Campaign" }),
                  /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: "Static sender info, sent on behalf of the company" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    name: "campaignMode",
                    value: "sales",
                    checked: campaignMode === "sales",
                    onChange: (e) => setCampaignMode(e.target.value),
                    className: "h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-900", children: "Sales Team Campaign" }),
                  /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: "Round-robin through sales team members" })
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }),
      campaignMode === "sales" && /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-6", children: "Sales Team Configuration" }),
        salesTeam.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-gray-50 rounded-lg", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-3", children: "No sales team members available." }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/dashboard/team",
              className: "text-primary-600 hover:text-primary-800 text-sm font-medium",
              children: "Add team members first →"
            }
          )
        ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  name: "useRoundRobin",
                  defaultChecked: true,
                  className: "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Use round-robin rotation through all active team members" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1 ml-7", children: "Each email will cycle through team members automatically, ensuring equal distribution." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-medium text-gray-700 mb-3", children: [
              "Active Sales Team Members (",
              salesTeam.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: salesTeam.map((member) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 bg-gray-50 rounded-md", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  name: "selectedMembers",
                  value: member.id,
                  defaultChecked: true,
                  className: "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium text-gray-900", children: [
                  member.firstName,
                  " ",
                  member.lastName
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-500", children: [
                  member.title && `${member.title} • `,
                  member.email
                ] })
              ] })
            ] }, member.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-6", children: "Target Audience" }),
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Select Contact Lists *" }),
        contactLists.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-gray-50 rounded-lg", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-3", children: "No contact lists available." }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/dashboard/contacts/upload",
              className: "text-primary-600 hover:text-primary-800 text-sm font-medium",
              children: "Upload contacts first →"
            }
          )
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: contactLists.map((list) => /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              name: "contactLists",
              value: list.id,
              checked: selectedLists.includes(list.id),
              onChange: (e) => {
                if (e.target.checked) {
                  setSelectedLists((prev) => [...prev, list.id]);
                } else {
                  setSelectedLists((prev) => prev.filter((id) => id !== list.id));
                }
              },
              className: "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-900", children: list.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-500", children: [
              list.contactCount || 0,
              " contacts",
              list.description && ` • ${list.description}`
            ] })
          ] })
        ] }, list.id)) })
      ] }),
      (campaignType === "email" || campaignType === "both") && /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-6", children: "Email Template" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          campaignMode === "company" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "From Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  name: "fromName",
                  className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                  placeholder: "Your Business Name"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "From Email *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  name: "fromEmail",
                  required: campaignMode === "company" && (campaignType === "email" || campaignType === "both"),
                  className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                  placeholder: "hello@yourcompany.com"
                }
              )
            ] })
          ] }),
          campaignMode === "sales" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "fromName", value: "SALES_DYNAMIC" }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "fromEmail", value: "SALES_DYNAMIC" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Subject Line *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "emailSubject",
                required: campaignType === "email" || campaignType === "both",
                className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                placeholder: "Welcome to our newsletter!"
              }
            )
          ] }),
          campaignMode === "sales" ? /* @__PURE__ */ jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
            /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-blue-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-800", children: [
              /* @__PURE__ */ jsx("strong", { children: "Sales Campaign:" }),
              ' The "From" name, email, and signature will be automatically populated from your selected sales team members during sending. Email signatures are automatically appended to every email. Use variables like ',
              `{salesTeamFirstName}`,
              " in your email content."
            ] }) })
          ] }) }) : /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 mb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
            /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-green-400 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }),
            /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-800", children: [
              /* @__PURE__ */ jsx("strong", { children: "Company Campaign:" }),
              ' The "From" name and email will be static for all recipients. Email signatures are automatically appended to every email from your organization settings.'
            ] }) })
          ] }) }),
          campaignMode === "company" && /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Select Team Member for Signature (Optional)" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: selectedTeamMember,
                onChange: (e) => {
                  setSelectedTeamMember(e.target.value);
                  const member = salesTeam.find((m) => m.id === e.target.value);
                  if (member) {
                    const nameInput = document.getElementById("salesPersonName");
                    const titleInput = document.getElementById("salesPersonTitle");
                    const phoneInput = document.getElementById("salesPersonPhone");
                    if (nameInput) nameInput.value = `${member.firstName} ${member.lastName}`;
                    if (titleInput) titleInput.value = member.title || "";
                    if (phoneInput) phoneInput.value = member.phone || "";
                  }
                },
                className: "block w-full rounded-md border-accent-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Use organization default signature" }),
                  salesTeam.map((member) => /* @__PURE__ */ jsxs("option", { value: member.id, children: [
                    member.firstName,
                    " ",
                    member.lastName,
                    " ",
                    member.title ? `- ${member.title}` : ""
                  ] }, member.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "salesPersonName", id: "salesPersonName", defaultValue: (defaultSignature == null ? void 0 : defaultSignature.salesPersonName) || "" }),
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "salesPersonTitle", id: "salesPersonTitle", defaultValue: (defaultSignature == null ? void 0 : defaultSignature.salesPersonTitle) || "" }),
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "salesPersonPhone", id: "salesPersonPhone", defaultValue: (defaultSignature == null ? void 0 : defaultSignature.salesPersonPhone) || "" }),
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "companyLogoUrl", defaultValue: (defaultSignature == null ? void 0 : defaultSignature.companyLogoUrl) || "" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email Content *" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Editor Mode:" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: toggleEditorMode,
                    className: `px-3 py-1 rounded text-sm font-medium ${emailEditorMode === "visual" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
                    children: "Visual"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: toggleEditorMode,
                    className: `px-3 py-1 rounded text-sm font-medium ${emailEditorMode === "html" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
                    children: "HTML"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-2 text-xs text-gray-500 bg-primary-50 p-2 rounded", children: [
              /* @__PURE__ */ jsx("div", { className: "mb-1", children: /* @__PURE__ */ jsx("strong", { children: "Available variables:" }) }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mt-1", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{firstName}` }),
                  " - Contact's first name",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{lastName}` }),
                  " - Contact's last name",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{email}` }),
                  " - Contact's email address",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{unsubscribeUrl}` }),
                  " - Unsubscribe link"
                ] }),
                /* @__PURE__ */ jsx("div", { children: campaignMode === "sales" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{salesTeamFirstName}` }),
                  " - Sales rep's first name",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{salesTeamLastName}` }),
                  " - Sales rep's last name",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{salesTeamEmail}` }),
                  " - Sales rep's email",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{salesTeamPhone}` }),
                  " - Sales rep's phone",
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("code", { children: `{salesTeamTitle}` }),
                  " - Sales rep's title",
                  /* @__PURE__ */ jsx("br", {})
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  "• ",
                  /* @__PURE__ */ jsx("strong", { children: "Custom Fields:" }),
                  " Use field names without spaces",
                  /* @__PURE__ */ jsx("br", {}),
                  "• Example: ",
                  /* @__PURE__ */ jsx("code", { children: `{vehicleYear}` }),
                  ' for "Vehicle Year"',
                  /* @__PURE__ */ jsx("br", {}),
                  "• ",
                  /* @__PURE__ */ jsx("strong", { children: "Note:" }),
                  " Email signature is automatically added"
                ] }) })
              ] })
            ] }),
            emailEditorMode === "visual" ? /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 rounded-md", children: [
              /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 bg-gray-50 p-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 font-bold",
                      onClick: () => executeCommand("bold"),
                      title: "Bold",
                      children: "B"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 italic",
                      onClick: () => executeCommand("italic"),
                      title: "Italic",
                      children: "I"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 underline",
                      onClick: () => executeCommand("underline"),
                      title: "Underline",
                      children: "U"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "px-2 py-1 border border-gray-300 rounded text-xs",
                    onChange: (e) => {
                      if (e.target.value) {
                        executeCommand("fontSize", e.target.value);
                        e.target.value = "";
                      }
                    },
                    defaultValue: "",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Font Size" }),
                      /* @__PURE__ */ jsx("option", { value: "1", children: "Small" }),
                      /* @__PURE__ */ jsx("option", { value: "3", children: "Normal" }),
                      /* @__PURE__ */ jsx("option", { value: "4", children: "Medium" }),
                      /* @__PURE__ */ jsx("option", { value: "5", children: "Large" }),
                      /* @__PURE__ */ jsx("option", { value: "6", children: "X-Large" }),
                      /* @__PURE__ */ jsx("option", { value: "7", children: "XX-Large" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100",
                      onClick: () => executeCommand("justifyLeft"),
                      title: "Align Left",
                      children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z", clipRule: "evenodd" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100",
                      onClick: () => executeCommand("justifyCenter"),
                      title: "Align Center",
                      children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M4 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm-1 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm-1 4a1 1 0 011-1h14a1 1 0 110 2H2a1 1 0 01-1-1zm1 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1z", clipRule: "evenodd" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100",
                      onClick: () => executeCommand("justifyRight"),
                      title: "Align Right",
                      children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M3 4a1 1 0 000 2h12a1 1 0 100-2H3zM9 8a1 1 0 000 2h6a1 1 0 100-2H9zM3 12a1 1 0 000 2h12a1 1 0 100-2H3zm6 4a1 1 0 100 2h6a1 1 0 100-2H9z", clipRule: "evenodd" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100",
                      onClick: () => executeCommand("justifyFull"),
                      title: "Justify",
                      children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M3 4a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h14a1 1 0 100-2H3zM3 12a1 1 0 000 2h14a1 1 0 100-2H3zM3 16a1 1 0 000 2h14a1 1 0 100-2H3z", clipRule: "evenodd" }) })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100",
                      onClick: () => executeCommand("insertUnorderedList"),
                      title: "Bullet List",
                      children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M3 4a1 1 0 100 2h.01a1 1 0 100-2H3zM6 4a1 1 0 000 2h11a1 1 0 100-2H6zM3 9a1 1 0 100 2h.01a1 1 0 100-2H3zM6 9a1 1 0 000 2h11a1 1 0 100-2H6zM3 14a1 1 0 100 2h.01a1 1 0 100-2H3zM6 14a1 1 0 000 2h11a1 1 0 100-2H6z", clipRule: "evenodd" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100",
                      onClick: () => executeCommand("insertOrderedList"),
                      title: "Numbered List",
                      children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M3 4a1 1 0 01.8-.98l2-.4a1 1 0 11.4 1.96l-.4.08V6a1 1 0 11-2 0V4zM3 10a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zM4 15a1 1 0 100-2 1 1 0 000 2zM6 4a1 1 0 000 2h11a1 1 0 100-2H6zM6 9a1 1 0 000 2h11a1 1 0 100-2H6zM6 14a1 1 0 000 2h11a1 1 0 100-2H6z", clipRule: "evenodd" }) })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "color",
                    className: "w-8 h-8 border border-gray-300 rounded cursor-pointer",
                    onChange: (e) => executeCommand("foreColor", e.target.value),
                    title: "Text Color"
                  }
                ) })
              ] }) }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  contentEditable: true,
                  className: "p-4 min-h-[400px] outline-none",
                  style: { minHeight: "400px" },
                  dangerouslySetInnerHTML: { __html: emailContent },
                  onInput: (e) => setEmailContent(e.currentTarget.innerHTML),
                  onBlur: (e) => setEmailContent(e.currentTarget.innerHTML),
                  onKeyUp: (e) => setEmailContent(e.currentTarget.innerHTML)
                }
              )
            ] }) : /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 rounded-md", children: [
              /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 bg-gray-50 p-2", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: "HTML Editor - Write your email using HTML code" }) }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  className: "w-full p-4 min-h-[400px] font-mono text-sm bg-gray-50 border-0 outline-none resize-none",
                  style: { minHeight: "400px" },
                  value: emailHtmlCode,
                  onChange: (e) => setEmailHtmlCode(e.target.value),
                  placeholder: "Enter your HTML email template here..."
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "hidden",
                name: "emailBody",
                value: emailEditorMode === "visual" ? emailContent : emailHtmlCode
              }
            )
          ] })
        ] })
      ] }),
      (campaignType === "sms" || campaignType === "both") && /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-6", children: "SMS Template" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Message *" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-2 text-xs text-gray-500 bg-primary-50 p-2 rounded", children: [
            /* @__PURE__ */ jsx("strong", { children: "Available variables:" }),
            " ",
            `{firstName}`,
            ", ",
            `{lastName}`,
            campaignMode === "sales" && /* @__PURE__ */ jsxs(Fragment, { children: [
              ", ",
              `{salesTeamFirstName}`,
              ", ",
              `{salesTeamLastName}`,
              ", ",
              `{salesTeamPhone}`
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "smsMessage",
              rows: 4,
              required: campaignType === "sms" || campaignType === "both",
              value: smsMessage,
              onChange: (e) => setSmsMessage(e.target.value),
              className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none px-3 py-2",
              placeholder: "Your SMS message here. Include variables like {{firstName}} for personalization."
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
              /* @__PURE__ */ jsxs("span", { className: `font-medium ${smsMessage.length > 160 ? "text-orange-600" : "text-gray-700"}`, children: [
                smsMessage.length,
                " characters"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: `font-medium ${smsSegments > 1 ? "text-orange-600" : "text-green-600"}`, children: [
                smsSegments,
                " segment",
                smsSegments !== 1 ? "s" : ""
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: smsSegments > 1 && /* @__PURE__ */ jsx("span", { className: "text-orange-600", children: "⚠️ Multi-segment SMS costs more" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-gray-50 rounded-md", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-medium text-gray-700 mb-2", children: "SMS Guidelines:" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-xs text-gray-600 space-y-1", children: [
              /* @__PURE__ */ jsxs("li", { children: [
                "• ",
                /* @__PURE__ */ jsx("strong", { children: "GSM-7:" }),
                " 160 chars = 1 segment, 153 chars per segment for multi-part"
              ] }),
              /* @__PURE__ */ jsxs("li", { children: [
                "• ",
                /* @__PURE__ */ jsx("strong", { children: "UCS-2:" }),
                " 70 chars = 1 segment, 67 chars per segment for multi-part"
              ] }),
              /* @__PURE__ */ jsxs("li", { children: [
                "• ",
                /* @__PURE__ */ jsx("strong", { children: "Special characters" }),
                " (emojis, accents) force UCS-2 encoding"
              ] }),
              /* @__PURE__ */ jsx("li", { children: "• Recipients with STOP requests will be automatically excluded" })
            ] })
          ] }),
          smsMessage.length > 306 && /* @__PURE__ */ jsx("div", { className: "mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800", children: "⚠️ Very long messages may have delivery issues. Consider shortening your message." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium mb-6", children: "Campaign Settings" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: (campaignType === "email" || campaignType === "both") && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                name: "trackOpens",
                defaultChecked: true,
                className: "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Track email opens" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                name: "trackClicks",
                defaultChecked: true,
                className: "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Track link clicks" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => window.history.back(),
            className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: contactLists.length === 0 || selectedLists.length === 0,
            className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed",
            children: "Create Campaign"
          }
        )
      ] })
    ] })
  ] }) });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: NewCampaign,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8"
};
const Icons = {
  // Navigation & UI
  Home: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("polyline", { points: "9,22 9,12 15,12 15,22", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Campaign: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M9 12l2 2 4-4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Contacts: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Team: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4", stroke: "currentColor", strokeWidth: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Analytics: ({ className = "", size = "md" }) => /* @__PURE__ */ jsx("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("polyline", { points: "22,12 18,12 15,21 9,3 6,12 2,12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
  // Actions
  Plus: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
  ] }),
  Edit: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Trash: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("polyline", { points: "3,6 5,6 21,6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Send: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("polygon", { points: "22,2 15,22 11,13 2,9 22,2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Upload: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("polyline", { points: "7,10 12,5 17,10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "5", x2: "12", y2: "15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
  ] }),
  Download: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("polyline", { points: "7,10 12,15 17,10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
  ] }),
  // Status indicators
  Check: ({ className = "", size = "md" }) => /* @__PURE__ */ jsx("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("polyline", { points: "20,6 9,17 4,12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
  X: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Warning: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  Info: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }),
  // Navigation
  ChevronLeft: ({ className = "", size = "md" }) => /* @__PURE__ */ jsx("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("polyline", { points: "15,18 9,12 15,6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
  Settings: ({ className = "", size = "md" }) => /* @__PURE__ */ jsxs("svg", { className: `${sizeMap[size]} ${className}`, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3", stroke: "currentColor", strokeWidth: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z", stroke: "currentColor", strokeWidth: "2" })
  ] })
};
async function action$3(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/sign-in");
  }
  const formData = await args.request.formData();
  const csvData = formData.get("csvData");
  if (!csvData) {
    return json(
      { error: "Please provide CSV data" },
      { status: 400 }
    );
  }
  try {
    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const members = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < 3) continue;
      const member = {
        firstName: values[headers.indexOf("firstname") || headers.indexOf("first_name") || 0] || "",
        lastName: values[headers.indexOf("lastname") || headers.indexOf("last_name") || 1] || "",
        email: values[headers.indexOf("email") || 2] || "",
        phone: values[headers.indexOf("phone") || headers.indexOf("phone_number")] || void 0,
        title: values[headers.indexOf("title") || headers.indexOf("job_title")] || void 0,
        department: values[headers.indexOf("department")] || void 0,
        bio: values[headers.indexOf("bio") || headers.indexOf("description")] || void 0,
        isActive: true
      };
      if (member.firstName && member.lastName && member.email) {
        members.push(member);
      }
    }
    if (members.length === 0) {
      return json(
        { error: "No valid team members found in CSV data" },
        { status: 400 }
      );
    }
    const salesTeamService = getSalesTeamService();
    await salesTeamService.importMembers(orgId, members);
    return redirect(`/dashboard/team?imported=${members.length}`);
  } catch (error) {
    return json(
      { error: "Failed to import team members" },
      { status: 500 }
    );
  }
}
function UploadTeam() {
  const actionData = useActionData();
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const handleFile = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      var _a;
      const text = (_a = e.target) == null ? void 0 : _a.result;
      setCsvData(text);
    };
    reader.readAsText(file);
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  const sampleCSV = `firstname,lastname,email,phone,title,department
John,Smith,john.smith@company.com,+1-555-0101,Sales Representative,Sales
Jane,Doe,jane.doe@company.com,+1-555-0102,Account Manager,Sales
Mike,Johnson,mike.j@company.com,+1-555-0103,Sales Director,Sales`;
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate(-1),
          className: "p-2 text-accent-600 hover:text-accent-900 hover:bg-accent-100 rounded-lg transition-colors",
          children: /* @__PURE__ */ jsx(Icons.ChevronLeft, {})
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-accent-900", children: "Upload Sales Team" }),
        /* @__PURE__ */ jsx("p", { className: "text-accent-600 mt-1", children: "Import multiple team members from a CSV file" })
      ] })
    ] }),
    (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Icons.Warning, { className: "text-red-500" }),
      /* @__PURE__ */ jsx("p", { className: "text-red-700", children: actionData.error })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-accent-900 mb-4", children: "Upload CSV File" }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary-400 bg-primary-50" : "border-accent-300 hover:border-accent-400"}`,
            onDragEnter: handleDrag,
            onDragLeave: handleDrag,
            onDragOver: handleDrag,
            onDrop: handleDrop,
            children: [
              /* @__PURE__ */ jsx(Icons.Upload, { className: "mx-auto text-accent-400 mb-4", size: "xl" }),
              /* @__PURE__ */ jsx("p", { className: "text-accent-600 mb-4", children: "Drag and drop your CSV file here, or click to select" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: ".csv",
                  onChange: handleFileInput,
                  className: "hidden",
                  id: "csvFile"
                }
              ),
              /* @__PURE__ */ jsxs(
                "label",
                {
                  htmlFor: "csvFile",
                  className: "inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(Icons.Upload, { size: "sm" }),
                    "Choose File"
                  ]
                }
              )
            ]
          }
        ),
        csvData && /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-accent-700 mb-2", children: "Preview" }),
          /* @__PURE__ */ jsx("div", { className: "bg-accent-50 rounded-lg p-3 max-h-48 overflow-auto", children: /* @__PURE__ */ jsxs("pre", { className: "text-xs text-accent-600 whitespace-pre-wrap", children: [
            csvData.substring(0, 500),
            csvData.length > 500 && "..."
          ] }) })
        ] }),
        csvData && /* @__PURE__ */ jsxs(Form, { method: "post", className: "mt-6", children: [
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "csvData", value: csvData }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setCsvData(""),
                className: "px-4 py-2 text-accent-600 hover:text-accent-900 transition-colors",
                children: "Clear"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                className: "inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Icons.Check, { size: "sm" }),
                  "Import Team Members"
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-accent-900 mb-4", children: "CSV Format" }),
          /* @__PURE__ */ jsx("p", { className: "text-accent-600 mb-4", children: "Your CSV file should include these columns (header row required):" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-accent-600", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Icons.Check, { size: "sm", className: "text-green-500" }),
              /* @__PURE__ */ jsx("strong", { children: "firstname" }),
              " (required)"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Icons.Check, { size: "sm", className: "text-green-500" }),
              /* @__PURE__ */ jsx("strong", { children: "lastname" }),
              " (required)"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Icons.Check, { size: "sm", className: "text-green-500" }),
              /* @__PURE__ */ jsx("strong", { children: "email" }),
              " (required)"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-accent-300" }),
              /* @__PURE__ */ jsx("strong", { children: "phone" }),
              " (optional)"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-accent-300" }),
              /* @__PURE__ */ jsx("strong", { children: "title" }),
              " (optional)"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-accent-300" }),
              /* @__PURE__ */ jsx("strong", { children: "department" }),
              " (optional)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-accent-900 mb-4", children: "Sample CSV" }),
          /* @__PURE__ */ jsx("div", { className: "bg-accent-50 rounded-lg p-3 mb-4", children: /* @__PURE__ */ jsx("pre", { className: "text-xs text-accent-600 overflow-x-auto", children: sampleCSV }) }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                navigator.clipboard.writeText(sampleCSV);
                alert("Sample CSV copied to clipboard!");
              },
              className: "inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-sm",
              children: [
                /* @__PURE__ */ jsx(Icons.Download, { size: "sm" }),
                "Copy Sample"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-primary-50 rounded-lg border border-primary-200 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(Icons.Info, { className: "text-primary-600 mt-0.5", size: "sm" }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-primary-700 font-medium mb-1", children: "Important Notes:" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-primary-600 space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: '• All imported team members will be set as "Active" by default' }),
              /* @__PURE__ */ jsx("li", { children: "• Duplicate email addresses will be skipped" }),
              /* @__PURE__ */ jsx("li", { children: "• Maximum 100 team members per upload" })
            ] })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: UploadTeam
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/sign-in");
  }
  const salesTeamService = getSalesTeamService();
  const members = await salesTeamService.getAllMembers(orgId);
  const stats = await salesTeamService.getMemberStats(orgId);
  return json({
    members,
    stats,
    orgId
  });
}
function TeamIndex() {
  const { members, stats } = useLoaderData();
  useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const filteredMembers = members.filter(
    (member) => member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || member.email.toLowerCase().includes(searchTerm.toLowerCase()) || member.title && member.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-accent-900", children: "Sales Team" }),
        /* @__PURE__ */ jsx("p", { className: "text-accent-600 mt-1", children: "Manage your sales team members for personalized campaigns" })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/dashboard/team/new",
          className: "inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Icons.Plus, { size: "sm" }),
            "Add Member"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-accent-600 text-sm font-medium", children: "Total Members" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-accent-900 mt-1", children: stats.total })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-primary-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.Team, { className: "text-primary-600", size: "lg" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-accent-600 text-sm font-medium", children: "Active Members" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-green-600 mt-1", children: stats.active })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-green-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.Check, { className: "text-green-600", size: "lg" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-accent-600 text-sm font-medium", children: "Inactive Members" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-accent-400 mt-1", children: stats.inactive })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-accent-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.X, { className: "text-accent-400", size: "lg" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 max-w-md", children: /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Search team members...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "w-full pl-4 pr-4 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        }
      ) }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/dashboard/team/upload",
          className: "inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Icons.Upload, { size: "sm" }),
            "Upload CSV"
          ]
        }
      ) })
    ] }),
    filteredMembers.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx(Icons.Team, { className: "mx-auto text-accent-400 mb-4", size: "xl" }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-accent-900 mb-2", children: searchTerm ? "No members found" : "No team members yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-accent-600 mb-6", children: searchTerm ? "Try adjusting your search terms" : "Add your first sales team member to get started with personalized campaigns" }),
      !searchTerm && /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/dashboard/team/new",
          className: "inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Icons.Plus, { size: "sm" }),
            "Add First Member"
          ]
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-accent-200", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-accent-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider", children: "Member" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider", children: "Contact" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider", children: "Role" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-accent-500 uppercase tracking-wider", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-accent-200", children: filteredMembers.map((member) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-accent-50", children: [
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 h-10 w-10", children: /* @__PURE__ */ jsxs("div", { className: "h-10 w-10 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center text-white font-medium", children: [
            member.firstName[0],
            member.lastName[0]
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "ml-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium text-accent-900", children: [
              member.firstName,
              " ",
              member.lastName
            ] }),
            member.department && /* @__PURE__ */ jsx("div", { className: "text-sm text-accent-500", children: member.department })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm text-accent-900", children: member.email }),
          member.phone && /* @__PURE__ */ jsx("div", { className: "text-sm text-accent-500", children: member.phone })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-accent-900", children: member.title || "Sales Representative" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${member.isActive ? "bg-green-100 text-green-800" : "bg-accent-100 text-accent-800"}`, children: member.isActive ? "Active" : "Inactive" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: `/dashboard/team/${member.id}/edit`,
              className: "text-primary-600 hover:text-primary-900 p-1",
              children: /* @__PURE__ */ jsx(Icons.Edit, { size: "sm" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (confirm("Are you sure you want to delete this team member?")) ;
              },
              className: "text-red-600 hover:text-red-900 p-1",
              children: /* @__PURE__ */ jsx(Icons.Trash, { size: "sm" })
            }
          )
        ] }) })
      ] }, member.id)) })
    ] }) }) })
  ] });
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: TeamIndex,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
async function loader$7(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const analytics = {
    totalCampaigns: 0,
    totalContacts: 0,
    totalSent: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    recentCampaigns: []
  };
  return { orgId, analytics };
}
function Analytics() {
  const { analytics } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 sm:px-0", children: [
    /* @__PURE__ */ jsx("div", { className: "sm:flex sm:items-center", children: /* @__PURE__ */ jsxs("div", { className: "sm:flex-auto", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Analytics" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-700", children: "Track the performance of your marketing campaigns" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6", children: [
        /* @__PURE__ */ jsx("dt", { className: "truncate text-sm font-medium text-gray-500", children: "Total Campaigns" }),
        /* @__PURE__ */ jsx("dd", { className: "mt-1 text-3xl font-semibold tracking-tight text-gray-900", children: analytics.totalCampaigns })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6", children: [
        /* @__PURE__ */ jsx("dt", { className: "truncate text-sm font-medium text-gray-500", children: "Total Contacts" }),
        /* @__PURE__ */ jsx("dd", { className: "mt-1 text-3xl font-semibold tracking-tight text-gray-900", children: analytics.totalContacts })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6", children: [
        /* @__PURE__ */ jsx("dt", { className: "truncate text-sm font-medium text-gray-500", children: "Messages Sent" }),
        /* @__PURE__ */ jsx("dd", { className: "mt-1 text-3xl font-semibold tracking-tight text-gray-900", children: analytics.totalSent })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6", children: [
        /* @__PURE__ */ jsx("dt", { className: "truncate text-sm font-medium text-gray-500", children: "Delivery Rate" }),
        /* @__PURE__ */ jsxs("dd", { className: "mt-1 text-3xl font-semibold tracking-tight text-gray-900", children: [
          analytics.deliveryRate,
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Email Performance" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Open Rate" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900", children: [
              analytics.openRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "bg-primary-500 h-2 rounded-full",
              style: { width: `${analytics.openRate}%` }
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Click Rate" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900", children: [
              analytics.clickRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "bg-chart-3 h-2 rounded-full",
              style: { width: `${analytics.clickRate}%` }
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "SMS Performance" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Delivery Rate" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900", children: [
              analytics.deliveryRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "bg-secondary-500 h-2 rounded-full",
              style: { width: `${analytics.deliveryRate}%` }
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Opt-out Rate" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-900", children: "0%" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx("div", { className: "bg-red-600 h-2 rounded-full", style: { width: "0%" } }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Recent Campaign Performance" }),
      analytics.recentCampaigns.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-6 bg-gray-50 rounded-lg", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "No campaign data available yet." }) }) : /* @__PURE__ */ jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Campaign" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Sent" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Delivered" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Opened" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Clicked" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: analytics.recentCampaigns.map((campaign) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900", children: campaign.name }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: campaign.type }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: campaign.sent }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: campaign.delivered }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: campaign.opened || "-" }),
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-6 py-4 text-sm text-gray-500", children: campaign.clicked || "-" })
        ] }, campaign.id)) })
      ] }) })
    ] })
  ] });
}
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Analytics,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  return { orgId };
}
function Campaigns() {
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 sm:px-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "sm:flex sm:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "sm:flex-auto", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Campaigns" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-700", children: "Manage your SMS and email marketing campaigns" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 sm:mt-0 sm:ml-16 sm:flex-none", children: /* @__PURE__ */ jsx(
        "a",
        {
          href: "/dashboard/campaigns/new",
          className: "inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto",
          children: "Create Campaign"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(Outlet, {}) })
  ] });
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Campaigns,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
async function loader$5(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  return { orgId };
}
function Contacts() {
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 sm:px-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "sm:flex sm:items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "sm:flex-auto", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Contacts" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-700", children: "Manage your contact lists and individual contacts" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/dashboard/contacts/upload",
            className: "inline-flex items-center justify-center rounded-md border border-transparent bg-secondary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 sm:w-auto",
            children: "Upload CSV"
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/dashboard/contacts/new",
            className: "inline-flex items-center justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "-ml-0.5 mr-2 h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }),
              "Add Contact"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(Outlet, {}) })
  ] });
}
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Contacts,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("files", file);
  console.log("Uploading file:", {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });
  const response = await fetch("https://file-uploader.benchmetrics.workers.dev/upload", {
    method: "POST",
    body: formData,
    headers: {
      "x-api-key": "benchmetrics-3dc3c222-64ab-4d44-abd5-84f648e1d8af"
    }
  });
  console.log("Upload response status:", response.status);
  console.log("Upload response headers:", Object.fromEntries(response.headers.entries()));
  if (!response.ok) {
    const errorText = await response.text();
    console.log("Upload error response:", errorText);
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }
  const responseText = await response.text();
  console.log("Raw response text:", responseText);
  const data = JSON.parse(responseText);
  console.log("Upload API response:", data);
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Unexpected response format - empty array or not an array");
    throw new Error("Upload failed: Empty response from server");
  }
  const uploadResult = data[0];
  console.log("Upload result:", uploadResult);
  if (!uploadResult) {
    throw new Error("Upload failed: No upload result in response");
  }
  return {
    url: uploadResult.imageUrl || uploadResult.fileUrl,
    id: uploadResult.imageId || uploadResult.fileId
  };
}
async function loader$4(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  try {
    const kvService = getKVService(args.context);
    const orgSettings = await kvService.getOrgSettings(orgId);
    return {
      orgId,
      settings: orgSettings
    };
  } catch (error) {
    console.error("Error loading org settings:", error);
    return {
      orgId,
      settings: {
        emailSignature: {
          salesPersonName: "",
          salesPersonTitle: "",
          salesPersonPhone: "",
          companyLogoUrl: "",
          unsubscribeUrl: ""
        },
        companyInfo: {
          name: "",
          website: "",
          address: ""
        }
      },
      salesTeam: []
    };
  }
}
async function action$2(args) {
  const { request } = args;
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/dashboard");
  }
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  try {
    const kvService = getKVService(args.context);
    if (actionType === "updateSignature") {
      const emailSignature = {
        salesPersonName: formData.get("salesPersonName"),
        salesPersonTitle: formData.get("salesPersonTitle"),
        salesPersonPhone: formData.get("salesPersonPhone"),
        companyLogoUrl: formData.get("companyLogoUrl"),
        unsubscribeUrl: formData.get("unsubscribeUrl")
      };
      await kvService.updateOrgSettings(orgId, { emailSignature });
      return json({ success: "Email signature updated successfully" });
    }
    if (actionType === "updateCompany") {
      const companyInfo = {
        name: formData.get("companyName"),
        website: formData.get("companyWebsite"),
        address: formData.get("companyAddress")
      };
      await kvService.updateOrgSettings(orgId, { companyInfo });
      return json({ success: "Company information updated successfully" });
    }
    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating org settings:", error);
    return json({ error: "Failed to update settings" }, { status: 500 });
  }
}
function OrganizationSettings() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    urlTab || "signature"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(((_a = settings.emailSignature) == null ? void 0 : _a.companyLogoUrl) || "");
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const handleFileUpload = async (event) => {
    var _a2;
    const file = (_a2 = event.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB.");
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      setLogoUrl(result.url);
      const input = document.getElementById("companyLogoUrl");
      if (input) {
        input.value = result.url;
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Organization Settings" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Manage your organization's email signature, company information, and sales team." })
    ] }) }),
    actionData && "success" in actionData && /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-green-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { className: "ml-3 text-sm text-green-800", children: actionData.success })
    ] }) }),
    actionData && "error" in actionData && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-red-400", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }),
      /* @__PURE__ */ jsx("p", { className: "ml-3 text-sm text-red-800", children: actionData.error })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200", children: /* @__PURE__ */ jsxs("nav", { className: "-mb-px flex space-x-8", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleTabChange("signature"),
          className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "signature" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
          children: "Email Signature"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleTabChange("company"),
          className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "company" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
          children: "Company Info"
        }
      )
    ] }) }),
    activeTab === "signature" && /* @__PURE__ */ jsx("div", { className: "bg-white shadow rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Default Email Signature" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-6", children: "This signature will be used as the default for all email campaigns. You can override it per campaign if needed." }),
      /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "actionType", value: "updateSignature" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "salesPersonName", className: "block text-sm font-medium text-gray-700", children: "Sales Person Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "salesPersonName",
                id: "salesPersonName",
                defaultValue: ((_b = settings.emailSignature) == null ? void 0 : _b.salesPersonName) || "",
                className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
                placeholder: "John Smith"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "salesPersonTitle", className: "block text-sm font-medium text-gray-700", children: "Sales Person Title" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "salesPersonTitle",
                id: "salesPersonTitle",
                defaultValue: ((_c = settings.emailSignature) == null ? void 0 : _c.salesPersonTitle) || "",
                className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
                placeholder: "Sales Manager"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "salesPersonPhone", className: "block text-sm font-medium text-gray-700", children: "Sales Person Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                name: "salesPersonPhone",
                id: "salesPersonPhone",
                defaultValue: ((_d = settings.emailSignature) == null ? void 0 : _d.salesPersonPhone) || "",
                className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
                placeholder: "+1 (555) 123-4567"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "unsubscribeUrl", className: "block text-sm font-medium text-gray-700", children: "Unsubscribe URL" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "url",
                name: "unsubscribeUrl",
                id: "unsubscribeUrl",
                defaultValue: ((_e = settings.emailSignature) == null ? void 0 : _e.unsubscribeUrl) || "",
                className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
                placeholder: "https://yourcompany.com/unsubscribe"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Company Logo" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center space-x-4", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "url",
                  name: "companyLogoUrl",
                  id: "companyLogoUrl",
                  value: logoUrl,
                  onChange: (e) => setLogoUrl(e.target.value),
                  className: "block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
                  placeholder: "https://yourcompany.com/logo.png"
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    className: "hidden",
                    id: "logo-upload",
                    onChange: handleFileUpload,
                    disabled: isUploading
                  }
                ),
                /* @__PURE__ */ jsx(
                  "label",
                  {
                    htmlFor: "logo-upload",
                    className: `cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`,
                    children: isUploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400", fill: "none", viewBox: "0 0 24 24", children: [
                        /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                        /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
                      ] }),
                      "Uploading..."
                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("svg", { className: "-ml-1 mr-2 h-5 w-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }),
                      "Upload"
                    ] })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Upload an image file (max 5MB) or enter a URL directly. Recommended size: 180px wide." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            children: "Save Email Signature"
          }
        ) })
      ] }),
      ((_f = settings.emailSignature) == null ? void 0 : _f.salesPersonName) && /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Preview:" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm", dangerouslySetInnerHTML: {
          __html: `
                    <br/>
                    <p style="margin:0px;">Chat soon,</p>
                    <p style="margin:0px;"><strong>${settings.emailSignature.salesPersonName}</strong></p>
                    ${settings.emailSignature.salesPersonTitle ? `<p style="margin:0px;">${settings.emailSignature.salesPersonTitle}</p>` : ""}
                    <img src="${logoUrl || "https://imagedelivery.net/fdADyrHW5AIzXwUyxun8dw/b95b1ebf-081b-454a-41f0-4ef26623c400/public"}" width="180px" style="display:block;margin:0px 0px 0px -8px;">
                    <p style="display:block;margin:5px 0px;color:#343433;">No longer want to receive these types of emails? <a href="${settings.emailSignature.unsubscribeUrl || "#"}" target="_blank" style="font-weight:600;">Unsubscribe here.</a></p>
                  `
        } })
      ] })
    ] }) }),
    activeTab === "company" && /* @__PURE__ */ jsx("div", { className: "bg-white shadow rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-5 sm:p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Company Information" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-6", children: "Basic information about your company for campaigns and correspondence." }),
      /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "actionType", value: "updateCompany" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "companyName", className: "block text-sm font-medium text-gray-700", children: "Company Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "companyName",
              id: "companyName",
              defaultValue: ((_g = settings.companyInfo) == null ? void 0 : _g.name) || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "Your Company Name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "companyWebsite", className: "block text-sm font-medium text-gray-700", children: "Website" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "url",
              name: "companyWebsite",
              id: "companyWebsite",
              defaultValue: ((_h = settings.companyInfo) == null ? void 0 : _h.website) || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "https://yourcompany.com"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "companyAddress", className: "block text-sm font-medium text-gray-700", children: "Address" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "companyAddress",
              id: "companyAddress",
              rows: 3,
              defaultValue: ((_i = settings.companyInfo) == null ? void 0 : _i.address) || "",
              className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2",
              placeholder: "123 Main St, City, State 12345"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            children: "Save Company Info"
          }
        ) })
      ] })
    ] }) })
  ] });
}
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: OrganizationSettings,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function action$1(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId || !orgId) {
    return redirect("/sign-in");
  }
  const formData = await args.request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const title = formData.get("title");
  const department = formData.get("department");
  const bio = formData.get("bio");
  const isActive = formData.get("isActive") === "on";
  if (!firstName || !lastName || !email) {
    return json(
      { error: "First name, last name, and email are required" },
      { status: 400 }
    );
  }
  try {
    const salesTeamService = getSalesTeamService();
    await salesTeamService.createMember(orgId, {
      firstName,
      lastName,
      email,
      phone: phone || void 0,
      title: title || void 0,
      department: department || void 0,
      bio: bio || void 0,
      isActive
    });
    return redirect("/dashboard/team");
  } catch (error) {
    return json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
function NewTeamMember() {
  const actionData = useActionData();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    bio: "",
    isActive: true
  });
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate(-1),
          className: "p-2 text-accent-600 hover:text-accent-900 hover:bg-accent-100 rounded-lg transition-colors",
          children: /* @__PURE__ */ jsx(Icons.ChevronLeft, {})
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-accent-900", children: "Add Team Member" }),
        /* @__PURE__ */ jsx("p", { className: "text-accent-600 mt-1", children: "Add a new sales team member for personalized campaigns" })
      ] })
    ] }),
    (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Icons.Warning, { className: "text-red-500" }),
      /* @__PURE__ */ jsx("p", { className: "text-red-700", children: actionData.error })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-accent-900", children: "Basic Information" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "First Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "firstName",
                value: formData.firstName,
                onChange: (e) => handleInputChange("firstName", e.target.value),
                className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "Last Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "lastName",
                value: formData.lastName,
                onChange: (e) => handleInputChange("lastName", e.target.value),
                className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "Email Address *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              name: "email",
              value: formData.email,
              onChange: (e) => handleInputChange("email", e.target.value),
              className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "Phone Number" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              name: "phone",
              value: formData.phone,
              onChange: (e) => handleInputChange("phone", e.target.value),
              className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-accent-900", children: "Professional Information" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "Job Title" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "title",
                value: formData.title,
                onChange: (e) => handleInputChange("title", e.target.value),
                placeholder: "e.g., Sales Representative",
                className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "Department" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "department",
                value: formData.department,
                onChange: (e) => handleInputChange("department", e.target.value),
                placeholder: "e.g., Sales, Marketing",
                className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-accent-700 mb-2", children: "Bio / Description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "bio",
              value: formData.bio,
              onChange: (e) => handleInputChange("bio", e.target.value),
              rows: 3,
              placeholder: "Brief description of the team member's role and expertise...",
              className: "w-full px-3 py-2 border border-accent-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-accent-900", children: "Status" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              name: "isActive",
              id: "isActive",
              checked: formData.isActive,
              onChange: (e) => handleInputChange("isActive", e.target.checked),
              className: "w-4 h-4 text-primary-600 border-accent-300 rounded focus:ring-2 focus:ring-primary-500"
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "isActive", className: "text-sm font-medium text-accent-700", children: "Active (available for campaign assignment)" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-accent-50 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-accent-600", children: [
          /* @__PURE__ */ jsx(Icons.Info, { className: "inline mr-2", size: "sm" }),
          "Only active team members will be included in round-robin campaign assignments."
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-6 border-t border-accent-200", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/dashboard/team",
            className: "px-4 py-2 text-accent-600 hover:text-accent-900 transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            className: "inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Icons.Check, { size: "sm" }),
              "Create Member"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: NewTeamMember
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId) {
    return redirect("/");
  }
  try {
    return {
      orgId,
      stats: {
        totalCampaigns: 0,
        totalContacts: 0,
        campaignsSentThisMonth: 0,
        deliveryRate: 0
      }
    };
  } catch (error) {
    console.log("Dashboard stats error (expected in dev):", error);
    return {
      orgId,
      stats: {
        totalCampaigns: 0,
        totalContacts: 0,
        campaignsSentThisMonth: 0,
        deliveryRate: 0
      }
    };
  }
}
function DashboardIndex() {
  const { orgId, stats } = useLoaderData();
  if (!orgId) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-accent-900 mb-4", children: "Welcome to BuzzLine Dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-accent-600 mb-8", children: "Manage your marketing campaigns, contacts, and analytics all in one place." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-accent-900 mb-1", children: stats.totalCampaigns }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-accent-600", children: "Total Campaigns" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-primary-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.Campaign, { className: "text-primary-600", size: "lg" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-accent-900 mb-1", children: stats.totalContacts }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-accent-600", children: "Total Contacts" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-secondary-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.Contacts, { className: "text-secondary-600", size: "lg" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-accent-900 mb-1", children: stats.campaignsSentThisMonth }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-accent-600", children: "Sent This Month" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-green-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.Send, { className: "text-green-600", size: "lg" }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-accent-200 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-accent-900 mb-1", children: [
            stats.deliveryRate,
            "%"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-accent-600", children: "Delivery Rate" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-orange-100 rounded-lg", children: /* @__PURE__ */ jsx(Icons.Analytics, { className: "text-orange-600", size: "lg" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/campaigns/new",
          className: "flex items-center gap-4 bg-primary-500 hover:bg-primary-600 text-white font-medium py-6 px-6 rounded-lg transition-colors group",
          children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-primary-400 rounded-lg group-hover:bg-primary-500 transition-colors", children: /* @__PURE__ */ jsx(Icons.Plus, { className: "text-white", size: "lg" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Create Campaign" }),
              /* @__PURE__ */ jsx("div", { className: "text-primary-100 text-sm", children: "Start a new marketing campaign" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/contacts/upload",
          className: "flex items-center gap-4 bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-6 px-6 rounded-lg transition-colors group",
          children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-secondary-400 rounded-lg group-hover:bg-secondary-500 transition-colors", children: /* @__PURE__ */ jsx(Icons.Upload, { className: "text-white", size: "lg" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Upload Contacts" }),
              /* @__PURE__ */ jsx("div", { className: "text-secondary-100 text-sm", children: "Import your contact lists" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/analytics",
          className: "flex items-center gap-4 bg-accent-500 hover:bg-accent-600 text-white font-medium py-6 px-6 rounded-lg transition-colors group",
          children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-accent-400 rounded-lg group-hover:bg-accent-500 transition-colors", children: /* @__PURE__ */ jsx(Icons.Analytics, { className: "text-white", size: "lg" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "View Analytics" }),
              /* @__PURE__ */ jsx("div", { className: "text-accent-100 text-sm", children: "Track campaign performance" })
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-accent-900 mb-2", children: "Sales Team Management" }),
        /* @__PURE__ */ jsx("p", { className: "text-accent-600", children: "Manage your sales team for personalized campaign sending" })
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/dashboard/team",
          className: "inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Icons.Team, { size: "sm" }),
            "Manage Team"
          ]
        }
      )
    ] }) })
  ] });
}
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DashboardIndex,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function action(args) {
  const { request } = args;
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const messageSid = params.get("MessageSid") || params.get("SmsSid");
    const messageStatus = params.get("MessageStatus") || params.get("SmsStatus");
    const from = params.get("From");
    const to = params.get("To");
    const body_text = params.get("Body");
    const errorCode = params.get("ErrorCode");
    const errorMessage = params.get("ErrorMessage");
    console.log("Twilio Webhook:", {
      messageSid,
      messageStatus,
      from,
      to,
      body: body_text,
      errorCode,
      errorMessage
    });
    const kvService = getKVService(args.context);
    if (body_text && from && to) {
      const responseText = body_text.toLowerCase().trim();
      const optOutKeywords = ["stop", "unsubscribe", "quit", "cancel", "end", "opt-out", "optout"];
      const isOptOut = optOutKeywords.some((keyword) => responseText.includes(keyword));
      if (isOptOut) {
        console.log(`Opt-out detected from ${from}: ${body_text}`);
        await handleOptOut(kvService, from, "sms");
        await logWebhookEvent(kvService, {
          type: "sms_opt_out",
          phone: from,
          message: body_text,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          messageSid
        });
      } else {
        await logWebhookEvent(kvService, {
          type: "sms_response",
          phone: from,
          message: body_text,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          messageSid
        });
      }
    }
    if (messageStatus && messageSid) {
      await handleDeliveryStatus(kvService, messageSid, messageStatus, errorCode || void 0, errorMessage || void 0);
    }
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return new Response("Error processed", { status: 200 });
  }
}
async function handleOptOut(kvService, phone, channel) {
  try {
    const allOrgs = await getAllOrganizations(kvService);
    for (const orgId of allOrgs) {
      const contacts = await kvService.listContacts(orgId);
      for (const contact of contacts) {
        if (contact.phone === phone || contact.email === phone) {
          console.log(`Found contact ${contact.id} in org ${orgId}, marking as opted out`);
          await kvService.updateContactOptOut(orgId, contact.id, true);
          await kvService.setCache(`optout:${channel}:${contact.id}`, {
            contactId: contact.id,
            orgId,
            channel,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            method: "twilio_webhook"
          });
          return;
        }
      }
    }
    console.log(`No contact found for ${channel} opt-out: ${phone}`);
  } catch (error) {
    console.error("Error handling opt-out:", error);
  }
}
async function handleDeliveryStatus(kvService, messageSid, status, errorCode, errorMessage) {
  try {
    await logWebhookEvent(kvService, {
      type: "sms_delivery_status",
      messageSid,
      status,
      errorCode,
      errorMessage,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(`SMS ${messageSid} status: ${status}${errorCode ? ` (Error: ${errorCode})` : ""}`);
  } catch (error) {
    console.error("Error handling delivery status:", error);
  }
}
async function logWebhookEvent(kvService, event) {
  try {
    const eventId = crypto.randomUUID();
    const key = `webhook_event:${Date.now()}:${eventId}`;
    await kvService.setCache(key, event, 86400);
  } catch (error) {
    console.error("Error logging webhook event:", error);
  }
}
async function getAllOrganizations(kvService) {
  try {
    return [];
  } catch (error) {
    console.error("Error getting organizations:", error);
    return [];
  }
}
function loader$2() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1(args) {
  const { userId, orgId } = await getAuth(args);
  if (!userId) {
    return redirect("/");
  }
  return {
    userId,
    orgId
  };
}
function Dashboard() {
  const { userId, orgId } = useLoaderData();
  const location = useLocation();
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Icons.Home },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Icons.Campaign },
    { href: "/dashboard/contacts", label: "Contacts", icon: Icons.Contacts },
    { href: "/dashboard/team", label: "Sales Team", icon: Icons.Team },
    { href: "/dashboard/analytics", label: "Analytics", icon: Icons.Analytics },
    { href: "/dashboard/settings", label: "Settings", icon: Icons.Settings }
  ];
  const isActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };
  if (!orgId) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-accent-50 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-accent-200", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx("img", { src: "/Buzzline_Logo.png", alt: "BuzzLine", className: "h-8" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-center mb-4 text-accent-900", children: "Welcome to BuzzLine" }),
      /* @__PURE__ */ jsx("p", { className: "text-accent-600 text-center mb-6", children: "Select an organization to get started with your marketing campaigns." }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
        OrganizationSwitcher,
        {
          appearance: {
            elements: {
              organizationSwitcherTrigger: "w-full justify-center"
            }
          }
        }
      ) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-accent-50", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-white border-b border-accent-200 shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
      /* @__PURE__ */ jsx("img", { src: "/Buzzline_Logo.png", alt: "BuzzLine", className: "h-8" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-6", children: [
        /* @__PURE__ */ jsx("nav", { className: "hidden md:flex space-x-1", children: navigationItems.map((item) => {
          const active = isActive(item.href);
          return /* @__PURE__ */ jsx(
            "a",
            {
              href: item.href,
              className: `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-primary-100 text-primary-700" : "text-accent-600 hover:text-accent-900 hover:bg-accent-100"}`,
              children: item.label
            },
            item.href
          );
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx(
            OrganizationSwitcher,
            {
              appearance: {
                elements: {
                  organizationSwitcherTrigger: "border-accent-300 text-accent-700 hover:bg-accent-50"
                }
              }
            }
          ),
          /* @__PURE__ */ jsx(
            UserButton,
            {
              appearance: {
                elements: {
                  userButtonAvatarBox: "w-8 h-8"
                }
              }
            }
          )
        ] })
      ] })
    ] }) }) }) }),
    /* @__PURE__ */ jsx("main", { className: "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx(Outlet, {}) })
  ] });
}
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Dashboard,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const meta = () => {
  return [
    { title: "BuzzLine - Marketing Communication Platform" },
    { name: "description", content: "Unified SMS and email marketing campaigns" }
  ];
};
async function loader(args) {
  const { userId } = await getAuth(args);
  if (userId) {
    return redirect("/dashboard");
  }
  return {};
}
function Index() {
  return /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-16", children: [
    /* @__PURE__ */ jsx("header", { className: "flex flex-col items-center gap-9", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-6", children: [
      /* @__PURE__ */ jsx("img", { src: "/Buzzline_Logo.png", alt: "BuzzLine", className: "h-16" }),
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-800 dark:text-gray-100 text-center", children: "Marketing Communication Platform" }),
      /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 dark:text-gray-400 text-center max-w-2xl", children: "Unify your SMS and email marketing campaigns with BuzzLine. Create, send, and track multi-channel campaigns from one platform." }),
      /* @__PURE__ */ jsx(SignedOut, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsx(SignInButton, { mode: "modal", children: /* @__PURE__ */ jsx("button", { className: "bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200", children: "Get Started" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Sign in to access your campaigns" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(SignedOut, { children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-6 text-center", children: "Key Features" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-primary-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: "Unified Messaging" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Send SMS and email campaigns from one interface" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-secondary-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: "Contact Management" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Import and organize your contacts with ease" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-accent-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: "Real-time Analytics" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Track delivery rates, opens, and engagement" })
        ] })
      ] })
    ] }) })
  ] }) });
}
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  loader,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Bu5Sy_cb.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js", "/assets/browser-Dlxvbl0z.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CqdJktz4.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js", "/assets/browser-Dlxvbl0z.js", "/assets/index-oAF_wgAM.js"], "css": ["/assets/root-MKZjulgi.css"] }, "routes/dashboard.contacts.segments.$segmentId": { "id": "routes/dashboard.contacts.segments.$segmentId", "parentId": "routes/dashboard.contacts", "path": "segments/:segmentId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts.segments._segmentId-CHrCxwZ9.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.contacts.lists.$listId": { "id": "routes/dashboard.contacts.lists.$listId", "parentId": "routes/dashboard.contacts", "path": "lists/:listId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts.lists._listId-AWTs34zX.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.campaigns.$campaignId": { "id": "routes/dashboard.campaigns.$campaignId", "parentId": "routes/dashboard.campaigns", "path": ":campaignId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.campaigns._campaignId-hXPfmjDV.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.contacts.segments.new": { "id": "routes/dashboard.contacts.segments.new", "parentId": "routes/dashboard.contacts", "path": "segments/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts.segments.new-PrcxO17h.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.contacts.$contactId": { "id": "routes/dashboard.contacts.$contactId", "parentId": "routes/dashboard.contacts", "path": ":contactId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts._contactId-uyrlOjLv.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.team.$teamId.edit": { "id": "routes/dashboard.team.$teamId.edit", "parentId": "routes/dashboard", "path": "team/:teamId/edit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.team._teamId.edit-8qNXQtTL.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.campaigns._index": { "id": "routes/dashboard.campaigns._index", "parentId": "routes/dashboard.campaigns", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.campaigns._index-BB8wwz5x.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/utils-z-rVVjtK.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.contacts.upload": { "id": "routes/dashboard.contacts.upload", "parentId": "routes/dashboard.contacts", "path": "upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts.upload-Bhdjcynq.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.contacts._index": { "id": "routes/dashboard.contacts._index", "parentId": "routes/dashboard.contacts", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts._index-BWxeRwWQ.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.campaigns.new": { "id": "routes/dashboard.campaigns.new", "parentId": "routes/dashboard.campaigns", "path": "new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.campaigns.new-1i6Q51fU.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.team.upload": { "id": "routes/dashboard.team.upload", "parentId": "routes/dashboard", "path": "team/upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.team.upload-BdhCJMkf.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/Icons-DYSEiJZQ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.team._index": { "id": "routes/dashboard.team._index", "parentId": "routes/dashboard", "path": "team", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.team._index-CfS6QTxi.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/Icons-DYSEiJZQ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.analytics": { "id": "routes/dashboard.analytics", "parentId": "routes/dashboard", "path": "analytics", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.analytics-D-PxVXco.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.campaigns": { "id": "routes/dashboard.campaigns", "parentId": "routes/dashboard", "path": "campaigns", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.campaigns-D8Qh9PLV.js", "imports": ["/assets/index-C-5hEMXZ.js"], "css": [] }, "routes/dashboard.contacts": { "id": "routes/dashboard.contacts", "parentId": "routes/dashboard", "path": "contacts", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.contacts-Dc7g7IhT.js", "imports": ["/assets/index-C-5hEMXZ.js"], "css": [] }, "routes/dashboard.settings": { "id": "routes/dashboard.settings", "parentId": "routes/dashboard", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.settings--wk9tn2Q.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard.team.new": { "id": "routes/dashboard.team.new", "parentId": "routes/dashboard", "path": "team/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.team.new-DxDpg9-u.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/Icons-DYSEiJZQ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/dashboard._index": { "id": "routes/dashboard._index", "parentId": "routes/dashboard", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard._index-CUFf82wV.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/Icons-DYSEiJZQ.js", "/assets/components-CcwgdvBG.js"], "css": [] }, "routes/webhook.twilio": { "id": "routes/webhook.twilio", "parentId": "root", "path": "webhook/twilio", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhook.twilio-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard-DRyyvT-Z.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/index-oAF_wgAM.js", "/assets/Icons-DYSEiJZQ.js", "/assets/components-CcwgdvBG.js", "/assets/browser-Dlxvbl0z.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-Dt_e4l_N.js", "imports": ["/assets/index-C-5hEMXZ.js", "/assets/index-oAF_wgAM.js", "/assets/components-CcwgdvBG.js", "/assets/browser-Dlxvbl0z.js"], "css": [] } }, "url": "/assets/manifest-14d1c4b3.js", "version": "14d1c4b3" };
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
  "routes/dashboard.contacts.segments.$segmentId": {
    id: "routes/dashboard.contacts.segments.$segmentId",
    parentId: "routes/dashboard.contacts",
    path: "segments/:segmentId",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/dashboard.contacts.lists.$listId": {
    id: "routes/dashboard.contacts.lists.$listId",
    parentId: "routes/dashboard.contacts",
    path: "lists/:listId",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/dashboard.campaigns.$campaignId": {
    id: "routes/dashboard.campaigns.$campaignId",
    parentId: "routes/dashboard.campaigns",
    path: ":campaignId",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/dashboard.contacts.segments.new": {
    id: "routes/dashboard.contacts.segments.new",
    parentId: "routes/dashboard.contacts",
    path: "segments/new",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/dashboard.contacts.$contactId": {
    id: "routes/dashboard.contacts.$contactId",
    parentId: "routes/dashboard.contacts",
    path: ":contactId",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/dashboard.team.$teamId.edit": {
    id: "routes/dashboard.team.$teamId.edit",
    parentId: "routes/dashboard",
    path: "team/:teamId/edit",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/dashboard.campaigns._index": {
    id: "routes/dashboard.campaigns._index",
    parentId: "routes/dashboard.campaigns",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/dashboard.contacts.upload": {
    id: "routes/dashboard.contacts.upload",
    parentId: "routes/dashboard.contacts",
    path: "upload",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/dashboard.contacts._index": {
    id: "routes/dashboard.contacts._index",
    parentId: "routes/dashboard.contacts",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route9
  },
  "routes/dashboard.campaigns.new": {
    id: "routes/dashboard.campaigns.new",
    parentId: "routes/dashboard.campaigns",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/dashboard.team.upload": {
    id: "routes/dashboard.team.upload",
    parentId: "routes/dashboard",
    path: "team/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/dashboard.team._index": {
    id: "routes/dashboard.team._index",
    parentId: "routes/dashboard",
    path: "team",
    index: true,
    caseSensitive: void 0,
    module: route12
  },
  "routes/dashboard.analytics": {
    id: "routes/dashboard.analytics",
    parentId: "routes/dashboard",
    path: "analytics",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/dashboard.campaigns": {
    id: "routes/dashboard.campaigns",
    parentId: "routes/dashboard",
    path: "campaigns",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/dashboard.contacts": {
    id: "routes/dashboard.contacts",
    parentId: "routes/dashboard",
    path: "contacts",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/dashboard.settings": {
    id: "routes/dashboard.settings",
    parentId: "routes/dashboard",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/dashboard.team.new": {
    id: "routes/dashboard.team.new",
    parentId: "routes/dashboard",
    path: "team/new",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/dashboard._index": {
    id: "routes/dashboard._index",
    parentId: "routes/dashboard",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route18
  },
  "routes/webhook.twilio": {
    id: "routes/webhook.twilio",
    parentId: "root",
    path: "webhook/twilio",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route21
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
