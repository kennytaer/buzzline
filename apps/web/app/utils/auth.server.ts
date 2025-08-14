import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createRepositories } from "~/lib/repositories";
import type { User, Organization } from "@buzzline/types";

export async function requireAuth(args: LoaderFunctionArgs) {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId) {
    throw redirect("/sign-in");
  }

  return { userId, orgId };
}

export async function requireAuthWithOrg(args: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(args);
  
  if (!orgId) {
    throw redirect("/select-organization");
  }

  return { userId, orgId };
}

export async function syncUserToKV(
  context: { env: any }, 
  clerkUserId: string, 
  email: string, 
  firstName?: string, 
  lastName?: string, 
  orgId?: string
): Promise<User> {
  if (!orgId) {
    throw new Error("Organization ID is required for user sync");
  }

  const repositories = createRepositories(context.env, orgId);
  const userKey = `org:${orgId}:users:${clerkUserId}`;
  
  // Check if user exists
  const existingUser = await repositories.contacts.kv.get<User>(userKey);
  
  const now = new Date().toISOString();
  const user: User = {
    id: clerkUserId,
    clerkId: clerkUserId,
    email,
    firstName,
    lastName,
    organizationId: orgId,
    role: existingUser?.role || 'member',
    createdAt: existingUser?.createdAt || now,
    updatedAt: now,
  };

  // Store user in KV
  await repositories.contacts.kv.put(userKey, user);
  
  // Add to organization users index
  const usersIndexKey = `org:${orgId}:indexes:users`;
  await repositories.contacts.kv.addToIndex(usersIndexKey, clerkUserId);

  return user;
}

export async function ensureOrganizationInKV(
  context: { env: any },
  clerkOrgId: string, 
  orgName: string
): Promise<Organization> {
  const repositories = createRepositories(context.env, clerkOrgId);
  const orgKey = `org:${clerkOrgId}:meta`;
  
  // Check if organization exists
  const existingOrg = await repositories.contacts.kv.get<Organization>(orgKey);
  
  const now = new Date().toISOString();
  const organization: Organization = {
    id: clerkOrgId,
    name: orgName,
    createdAt: existingOrg?.createdAt || now,
    updatedAt: now,
    // Communication settings
    phoneStatus: existingOrg?.phoneStatus || 'pending',
    emailStatus: existingOrg?.emailStatus || 'pending',
    twilioPhoneNumber: existingOrg?.twilioPhoneNumber,
    phoneNumberSid: existingOrg?.phoneNumberSid,
    emailDomain: existingOrg?.emailDomain,
    emailFromAddress: existingOrg?.emailFromAddress,
    mailgunDomainKey: existingOrg?.mailgunDomainKey,
  };

  // Store organization in KV
  await repositories.contacts.kv.put(orgKey, organization);

  return organization;
}

// Helper function to get user from KV
export async function getUserFromKV(
  context: { env: any },
  orgId: string,
  clerkUserId: string
): Promise<User | null> {
  const repositories = createRepositories(context.env, orgId);
  const userKey = `org:${orgId}:users:${clerkUserId}`;
  return await repositories.contacts.kv.get<User>(userKey);
}

// Helper function to get organization from KV  
export async function getOrganizationFromKV(
  context: { env: any },
  orgId: string
): Promise<Organization | null> {
  const repositories = createRepositories(context.env, orgId);
  const orgKey = `org:${orgId}:meta`;
  return await repositories.contacts.kv.get<Organization>(orgKey);
}