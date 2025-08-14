import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// Import the server build
import * as build from "../build/server/index.js";

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => ({
    env: context.env,
  }),
});

export const onRequest = handleRequest;