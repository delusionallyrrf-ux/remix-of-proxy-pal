import { createFileRoute } from "@tanstack/react-router";

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  wasm: "application/wasm",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  json: "application/json; charset=utf-8",
  pck: "application/octet-stream",
  bin: "application/octet-stream",
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2",
};

const COOP_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
} as const;

function mimeFor(path: string): string {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return "application/octet-stream";
  // Godot split pck parts: brotato.pck.part.00 -> ext "00"
  if (/^\d+$/.test(m[1])) return "application/octet-stream";
  return MIME[m[1]] || "application/octet-stream";
}

async function serve(request: Request, splat: string | undefined) {
  const sub = (splat ?? "").replace(/^\/+/, "") || "index.html";
  const url = new URL(request.url);
  const assetUrl = new URL(`/brotato/${sub}`, url.origin);

  const upstream = await fetch(assetUrl.toString(), {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers: { range: request.headers.get("range") ?? "" },
  });

  const headers = new Headers(upstream.headers);
  headers.set("Content-Type", mimeFor(sub));
  for (const [k, v] of Object.entries(COOP_HEADERS)) headers.set(k, v);
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute("/api/public/brotato/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => serve(request, (params as { _splat?: string })._splat),
      HEAD: ({ request, params }) => serve(request, (params as { _splat?: string })._splat),
    },
  },
});
