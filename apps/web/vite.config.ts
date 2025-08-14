import { vitePlugin as remix, cloudflareDevProxyVitePlugin as remixCloudflareDevProxy } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy({
      getLoadContext: () => {
        // If running without Wrangler (regular npm run dev), provide mock KV
        if (!process.env.CF_PAGES) {
          return {
            env: {
              BUZZLINE_MAIN: {
                get: async (key: string) => {
                  console.log(`[MOCK KV] GET ${key}`);
                  return null; // Always return null for dev
                },
                put: async (key: string, value: string) => {
                  console.log(`[MOCK KV] PUT ${key}:`, value?.substring(0, 50) + '...');
                },
                delete: async (key: string) => {
                  console.log(`[MOCK KV] DELETE ${key}`);
                },
                list: async () => ({ keys: [] }),
              },
              BUZZLINE_ANALYTICS: {
                get: async () => null,
                put: async () => {},
                delete: async () => {},
                list: async () => ({ keys: [] }),
              },
              BUZZLINE_CACHE: {
                get: async () => null,
                put: async () => {},
                delete: async () => {},
                list: async () => ({ keys: [] }),
              },
            }
          };
        }
        return {};
      }
    }),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
});
