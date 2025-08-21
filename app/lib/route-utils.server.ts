import { redirect, json } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";

export interface AuthContext {
  userId: string;
  orgId: string;
  context: any;
}

// Standard auth validation for routes that require organization
export async function requireAuth(args: LoaderFunctionArgs | ActionFunctionArgs): Promise<AuthContext> {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId) {
    throw redirect("/");
  }
  
  if (!orgId) {
    throw redirect("/dashboard");
  }
  
  return {
    userId,
    orgId,
    context: args.context
  };
}

// Auth validation for routes that only require user (organization optional)
export async function requireUser(args: LoaderFunctionArgs | ActionFunctionArgs): Promise<{ userId: string; orgId?: string; context: any }> {
  const { userId, orgId } = await getAuth(args);
  
  if (!userId) {
    throw redirect("/");
  }
  
  return {
    userId,
    orgId,
    context: args.context
  };
}

// Standard error response wrapper
export function createErrorResponse(error: unknown, status: number = 500) {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Route error:', error);
  
  return json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  }, { status });
}

// Success response wrapper
export function createSuccessResponse(data?: any, message?: string) {
  return json({
    success: true,
    message,
    data
  });
}

// Pagination helper for URL search params
export function getPaginationParams(request: Request) {
  const url = new URL(request.url);
  return {
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "50"),
    search: url.searchParams.get("search") || ""
  };
}

// Safe loader wrapper that handles common auth and error patterns
export function createSafeLoader<T>(
  handler: (auth: AuthContext, request: Request) => Promise<T>
) {
  return async (args: LoaderFunctionArgs) => {
    try {
      const auth = await requireAuth(args);
      const result = await handler(auth, args.request);
      return result;
    } catch (error) {
      if (error instanceof Response) {
        throw error; // Re-throw redirects
      }
      console.error("Loader error:", error);
      return json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }, { status: 500 });
    }
  };
}

// Safe action wrapper that handles common auth and error patterns
export function createSafeAction<T>(
  handler: (auth: AuthContext, formData: FormData, request: Request) => Promise<T>
) {
  return async (args: ActionFunctionArgs) => {
    try {
      const auth = await requireAuth(args);
      const formData = await args.request.formData();
      const result = await handler(auth, formData, args.request);
      return result;
    } catch (error) {
      if (error instanceof Response) {
        throw error; // Re-throw redirects
      }
      return createErrorResponse(error);
    }
  };
}

// Validation helper for form data
export function validateFormData(formData: FormData, requiredFields: string[]): { [key: string]: string } {
  const data: { [key: string]: string } = {};
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = formData.get(field);
    if (!value || typeof value !== 'string' || value.trim() === '') {
      missingFields.push(field);
    } else {
      data[field] = value.trim();
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return data;
}

// Intent-based action helper
export function handleActionIntent(
  formData: FormData,
  handlers: { [intent: string]: () => Promise<any> }
) {
  const intent = formData.get("intent");
  
  if (!intent || typeof intent !== 'string') {
    throw new Error('Action intent is required');
  }
  
  const handler = handlers[intent];
  if (!handler) {
    throw new Error(`Unknown action intent: ${intent}`);
  }
  
  return handler();
}

// Helper for handling file uploads
export async function handleFileUpload(formData: FormData, fieldName: string): Promise<File | null> {
  const file = formData.get(fieldName);
  
  if (!file || !(file instanceof File)) {
    return null;
  }
  
  if (file.size === 0) {
    throw new Error(`${fieldName} file is empty`);
  }
  
  return file;
}

// Standard pagination response
export interface PaginationResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  search?: string;
}

export function createPaginationResponse<T>(
  items: T[],
  totalItems: number,
  currentPage: number,
  limit: number,
  search?: string
): PaginationResponse<T> {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    items,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    },
    search
  };
}

// Rate limiting helper (basic in-memory implementation)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isRateLimited(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return true;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return false;
  }
}

export const rateLimiter = new RateLimiter();

// Rate limiting wrapper for actions
export function withRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return function decorator<T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = (async function(this: any, ...args: any[]) {
      if (rateLimiter.isRateLimited(key, maxRequests, windowMs)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      return method.apply(this, args);
    }) as T;
  };
}