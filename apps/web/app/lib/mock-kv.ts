// Mock KV implementation for local development when running without Wrangler
export class MockKVNamespace {
  private storage = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async put(key: string, value: string, options?: any): Promise<void> {
    this.storage.set(key, value);
    // Simulate TTL in development (optional)
    if (options?.expirationTtl) {
      setTimeout(() => {
        this.storage.delete(key);
      }, options.expirationTtl * 1000);
    }
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }> {
    const keys: Array<{ name: string }> = [];
    
    for (const [key] of this.storage.entries()) {
      if (!options?.prefix || key.startsWith(options.prefix)) {
        keys.push({ name: key });
      }
    }
    
    return { keys };
  }
}

// Create mock environment for local development
export function createMockKVEnvironment() {
  return {
    BUZZLINE_MAIN: new MockKVNamespace(),
    BUZZLINE_ANALYTICS: new MockKVNamespace(), 
    BUZZLINE_CACHE: new MockKVNamespace(),
  };
}

// Type guard to check if we're in development with mock KV
export function isMockEnvironment(env: any): boolean {
  return env.BUZZLINE_MAIN instanceof MockKVNamespace;
}