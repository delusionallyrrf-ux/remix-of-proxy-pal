import { createFileRoute } from "@tanstack/react-router";

const TARGET = "https://quiz-let.blogspot.com/";

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  // strip the route prefix so the path maps to the target site root
  const prefix = "/api/public/proxy";
  const subPath = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length) || "/"
    : url.pathname;
  const targetUrl = new URL(subPath + url.search, TARGET).toString();

  const headers = new Headers(request.headers);
  headers.delete("cf-connecting-ip");
  headers.delete("host");
  headers.set("referer", TARGET);
  headers.set("origin", TARGET);

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: "follow",
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
    });

    const contentType = res.headers.get("content-type") || "";
    const proxyOrigin = url.origin + prefix;
    const targetHost = new URL(TARGET).host;
    const escapedHost = targetHost.replace(/\./g, "\\.");

    const newHeaders = new Headers(res.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
    newHeaders.delete("x-frame-options");
    newHeaders.delete("content-security-policy");
    newHeaders.delete("content-encoding");
    newHeaders.delete("content-length");
    newHeaders.set("cache-control", "no-store, no-cache");

    if (
      contentType.includes("text/") ||
      contentType.includes("javascript") ||
      contentType.includes("json") ||
      contentType.includes("xml")
    ) {
      let body = await res.text();
      body = body.replace(
        new RegExp(`https?://${escapedHost}`, "gi"),
        proxyOrigin,
      );
      body = body.replace(
        new RegExp(`//${escapedHost}`, "gi"),
        `//${url.host}${prefix}`,
      );
      return new Response(body, { status: res.status, headers: newHeaders });
    }

    return new Response(res.body, { status: res.status, headers: newHeaders });
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
