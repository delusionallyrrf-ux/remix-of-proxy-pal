// Netlify Function: proxies https://quiz-let.blogspot.com under /api/public/stolensite
// Mirrors the logic in src/lib/proxy-route.ts but in Netlify's handler shape.
import { proxy } from "./_proxy.mjs";

export default async (request, context) => {
  return proxy(request, {
    target: "https://quiz-let.blogspot.com",
    prefix: "/api/public/stolensite",
  });
};

export const config = { path: ["/api/public/stolensite", "/api/public/stolensite/*"] };
