// Shared proxy logic for Netlify Functions.
// Mirrors src/lib/proxy-route.ts (Worker version) so behavior matches.
const PASS_THROUGH = ["accept", "accept-language", "cookie", "content-type", "range"];
const SKIP_RESPONSE = new Set([
  "content-encoding", "content-length", "transfer-encoding",
  "x-frame-options", "content-security-policy",
  "content-security-policy-report-only", "strict-transport-security",
  "cross-origin-opener-policy", "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const escapeRegExp = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function rewriteRoots(body, prefix) {
  const p = (rest) => `${prefix}/${rest}`;
  body = body.replace(/\b(href|src|action|poster)\s*=\s*"\/(?!\/|api\/public\/)([^"]*)"/gi, (_, a, r) => `${a}="${p(r)}"`);
  body = body.replace(/\b(href|src|action|poster)\s*=\s*'\/(?!\/|api\/public\/)([^']*)'/gi, (_, a, r) => `${a}='${p(r)}'`);
  body = body.replace(/url\(\s*(["']?)\/(?!\/|api\/public\/)([^"')\s]+)\1\s*\)/gi, (_, q, r) => `url(${q}${p(r)}${q})`);
  body = body.replace(/(["'`])\/(?!\/|api\/public\/)([^"'`\\\s<>)]*)\1/g, (_, q, r) => `${q}${p(r)}${q}`);
  return body;
}

function isText(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  return ct.includes("text/") || ct.includes("javascript") || ct.includes("json") || ct.includes("xml");
}

export async function proxy(request, { target, prefix }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const url = new URL(request.url);
  target = target.replace(/\/+$/, "");
  prefix = prefix.replace(/\/+$/, "");
  const sub = url.pathname.startsWith(prefix) ? (url.pathname.slice(prefix.length) || "/") : url.pathname;
  const targetUrl = new URL(sub + url.search, target + "/").toString();

  const headers = new Headers();
  for (const h of PASS_THROUGH) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("user-agent", UA);
  headers.set("referer", target + "/");
  headers.set("origin", target);
  headers.set("accept-encoding", "identity");

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: "manual",
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    });

    const publicOrigin = url.origin;
    const proxyBase = publicOrigin + prefix;
    const targetHost = new URL(target).host;
    const escapedHost = escapeRegExp(targetHost);

    const out = new Headers();
    res.headers.forEach((v, k) => { if (!SKIP_RESPONSE.has(k.toLowerCase())) out.set(k, v); });
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
    out.set("Access-Control-Allow-Headers", "*");
    out.set("cache-control", "no-store, no-cache");

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        try {
          const abs = new URL(loc, targetUrl);
          out.set("location", abs.host === targetHost ? proxyBase + abs.pathname + abs.search + abs.hash : abs.toString());
        } catch { out.set("location", loc); }
      }
      return new Response(null, { status: res.status, headers: out });
    }

    if (request.method === "HEAD") return new Response(null, { status: res.status, headers: out });
    if (!isText(res)) return new Response(res.body, { status: res.status, headers: out });

    let body = await res.text();
    body = body.replace(new RegExp(`https?://${escapedHost}`, "gi"), proxyBase);
    body = body.replace(new RegExp(`//${escapedHost}`, "gi"), `//${new URL(publicOrigin).host}${prefix}`);

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("text/html")) {
      const baseTag = `<base href="${proxyBase}/">`;
      body = /<head[^>]*>/i.test(body) ? body.replace(/<head[^>]*>/i, (m) => m + baseTag) : baseTag + body;
    }
    body = rewriteRoots(body, prefix);
    return new Response(body, { status: res.status, headers: out });
  } catch {
    return new Response("pr0xy dead, report this to .gg/22mEef6mTB if this stays...", { status: 500 });
  }
}
