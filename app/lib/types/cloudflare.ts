// Cloudflare KV Namespace types
export interface KVNamespace {
  get(key: string, options?: { type: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: {
    expirationTtl?: number;
    expiration?: number;
    metadata?: any;
  }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    limit?: number;
    prefix?: string;
    cursor?: string;
  }): Promise<{
    keys: Array<{
      name: string;
      expiration?: number;
      metadata?: any;
    }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface CloudflareEnv {
  BUZZLINE_MAIN?: KVNamespace;
  BUZZLINE_ANALYTICS?: KVNamespace;
  BUZZLINE_CACHE?: KVNamespace;
}