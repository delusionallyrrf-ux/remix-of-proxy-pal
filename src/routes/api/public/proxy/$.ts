import { createFileRoute } from "@tanstack/react-router";

const TARGET = "https://quiz-let.blogspot.com";
const PREFIX = "/api/public/proxy";

function getPublicOrigin(request: Request, url: URL): string {
  const xfProto = request.headers.get("x-forwarded-proto");
  const xfHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (xfHost) return `${xfProto || url.protocol.replace(":", "")}://${xfHost}`;
  return url.origin;
}

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const subPath = url.pathname.startsWith(PREFIX)
    ? url.pathname.slice(PREFIX.length) || "/"
    : url.pathname;
  const targetUrl = new URL(subPath + url.search, TARGET + "/").toString();

  const headers = new Headers();
  // Only forward a safe subset; strip hop-by-hop / infra headers
  const passThrough = ["accept", "accept-language", "user-agent", "cookie", "content-type", "range"];
  for (const h of passThrough) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("referer", TARGET + "/");
  headers.set("origin", TARGET);
  headers.set("accept-encoding", "identity");

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: "manual",
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
    });

    const publicOrigin = getPublicOrigin(request, url);
    const proxyBase = publicOrigin + PREFIX;
    const targetHost = new URL(TARGET).host;
    const escapedHost = targetHost.replace(/\./g, "\\.");

    const newHeaders = new Headers();
    // Copy safe response headers, drop blocking ones
    const skip = new Set([
      "content-encoding",
      "content-length",
      "transfer-encoding",
      "x-frame-options",
      "content-security-policy",
      "content-security-policy-report-only",
      "strict-transport-security",
      "cross-origin-opener-policy",
      "cross-origin-embedder-policy",
      "cross-origin-resource-policy",
    ]);
    res.headers.forEach((v, k) => {
      if (!skip.has(k.toLowerCase())) newHeaders.set(k, v);
    });
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
    newHeaders.set("cache-control", "no-store, no-cache");

    // Handle redirects: rewrite Location to stay inside the proxy
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        try {
          const abs = new URL(loc, targetUrl);
          if (abs.host === targetHost) {
            newHeaders.set("location", proxyBase + abs.pathname + abs.search + abs.hash);
          } else {
            newHeaders.set("location", abs.toString());
          }
        } catch {
          newHeaders.set("location", loc);
        }
      }
      return new Response(null, { status: res.status, headers: newHeaders });
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const isText =
      contentType.includes("text/") ||
      contentType.includes("javascript") ||
      contentType.includes("json") ||
      contentType.includes("xml");

    if (!isText) {
      return new Response(res.body, { status: res.status, headers: newHeaders });
    }

    let body = await res.text();

    // Rewrite absolute target URLs -> proxy
    body = body.replace(new RegExp(`https?://${escapedHost}`, "gi"), proxyBase);
    // Protocol-relative
    body = body.replace(new RegExp(`//${escapedHost}`, "gi"), `//${new URL(publicOrigin).host}${PREFIX}`);

    // For HTML, inject a <base> so root-relative links route through the proxy
    if (contentType.includes("text/html")) {
      const baseTag = `<base href="${proxyBase}/">`;
      if (/<head[^>]*>/i.test(body)) {
        body = body.replace(/<head[^>]*>/i, (m) => m + baseTag);
      } else {
        body = baseTag + body;
      }
      // Rewrite root-relative href/src/action="/..." -> proxyBase + "/..."
      body = body.replace(
        /\b(href|src|action)\s*=\s*"\/(?!\/)([^"]*)"/gi,
        (_m, attr, rest) => `${attr}="${PREFIX}/${rest}"`,
      );
      body = body.replace(
        /\b(href|src|action)\s*=\s*'\/(?!\/)([^']*)'/gi,
        (_m, attr, rest) => `${attr}='${PREFIX}/${rest}'`,
      );
    }

    return new Response(body, { status: res.status, headers: newHeaders });
  } catch {
    return new Response(
      "pr0xy dead, report this to .gg/22mEef6mTB if this stays...",
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/proxy/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      HEAD: handler,
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }),
    },
  },
});
