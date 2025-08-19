import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// @ts-ignore - this file is generated at build time
import * as build from "../build/server";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext(context) {
    // Make Cloudflare bindings available to your loaders and actions
    return {
      cloudflare: {
        env: context.env,
        ctx: context,
        caches,
        cf: context.request.cf,
      },
    };
  },
});