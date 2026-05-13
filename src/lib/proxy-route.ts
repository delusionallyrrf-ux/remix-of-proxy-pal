type ProxyOptions = {
  target: string;
  prefix: string;
};

const PASS_THROUGH_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "cookie",
  "content-type",
  "range",
] as const;

const SKIP_RESPONSE_HEADERS = new Set([
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

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPublicOrigin(request: Request, url: URL): string {
  const xfProto = request.headers.get("x-forwarded-proto");
  const xfHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (xfHost) return `${xfProto || url.protocol.replace(":", "")}://${xfHost}`;
  return url.origin;
}

function rewriteRootRelativeReferences(body: string, prefix: string): string {
  const prefixedPath = (path: string) => `${prefix}/${path}`;

  body = body.replace(
    /\b(href|src|action|poster)\s*=\s*"\/(?!\/|api\/public\/)([^"]*)"/gi,
    (_match, attr, rest) => `${attr}="${prefixedPath(rest)}"`,
  );
  body = body.replace(
    /\b(href|src|action|poster)\s*=\s*'\/(?!\/|api\/public\/)([^']*)'/gi,
    (_match, attr, rest) => `${attr}='${prefixedPath(rest)}'`,
  );
  body = body.replace(
    /url\(\s*(["']?)\/(?!\/|api\/public\/)([^"')\s]+)\1\s*\)/gi,
    (_match, quote, rest) => `url(${quote}${prefixedPath(rest)}${quote})`,
  );
  body = body.replace(
    /(["'`])\/(?!\/|api\/public\/)([^"'`\\\s<>)]*)\1/g,
    (_match, quote, rest) => `${quote}${prefixedPath(rest)}${quote}`,
  );

  return body;
}

function makeCorsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

function isTextResponse(response: Response): boolean {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return (
    contentType.includes("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    contentType.includes("xml")
  );
}

async function proxyHandler({ request }: { request: Request }, options: ProxyOptions) {
  const url = new URL(request.url);
  const target = options.target.replace(/\/+$/, "");
  const prefix = options.prefix.replace(/\/+$/, "");
  const subPath = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length) || "/"
    : url.pathname;
  const targetUrl = new URL(subPath + url.search, target + "/").toString();

  const headers = new Headers();
  for (const h of PASS_THROUGH_REQUEST_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("user-agent", DEFAULT_USER_AGENT);
  headers.set("referer", target + "/");
  headers.set("origin", target);
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
    const proxyBase = publicOrigin + prefix;
    const targetHost = new URL(target).host;
    const escapedHost = escapeRegExp(targetHost);

    const newHeaders = new Headers();
    res.headers.forEach((v, k) => {
      if (!SKIP_RESPONSE_HEADERS.has(k.toLowerCase())) newHeaders.set(k, v);
    });
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");
    newHeaders.set("cache-control", "no-store, no-cache");

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        try {
          const abs = new URL(loc, targetUrl);
          newHeaders.set(
            "location",
            abs.host === targetHost ? proxyBase + abs.pathname + abs.search + abs.hash : abs.toString(),
          );
        } catch {
          newHeaders.set("location", loc);
        }
      }
      return new Response(null, { status: res.status, headers: newHeaders });
    }

    if (request.method === "HEAD") {
      return new Response(null, { status: res.status, headers: newHeaders });
    }

    if (!isTextResponse(res)) {
      return new Response(res.body, { status: res.status, headers: newHeaders });
    }

    let body = await res.text();
    body = body.replace(new RegExp(`https?://${escapedHost}`, "gi"), proxyBase);
    body = body.replace(new RegExp(`//${escapedHost}`, "gi"), `//${new URL(publicOrigin).host}${prefix}`);

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("text/html")) {
      const baseTag = `<base href="${proxyBase}/">`;
      body = /<head[^>]*>/i.test(body)
        ? body.replace(/<head[^>]*>/i, (match) => match + baseTag)
        : baseTag + body;
    }
    body = rewriteRootRelativeReferences(body, prefix);

    return new Response(body, { status: res.status, headers: newHeaders });
  } catch {
    return new Response("pr0xy dead, report this to .gg/22mEef6mTB if this stays...", {
      status: 500,
    });
  }
}

export function createProxyHandlers(options: ProxyOptions) {
  const handler = (ctx: { request: Request }) => proxyHandler(ctx, options);
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
    HEAD: handler,
    OPTIONS: makeCorsResponse,
  };
}