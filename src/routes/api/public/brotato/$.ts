import { createFileRoute } from "@tanstack/react-router";

// Static Brotato assets live in /public/brotato/* and are served directly by
// the platform's static asset handler. The route handler can't reliably
// self-fetch its own origin from inside the Worker, so we just redirect.
function redirectFor(splat: string | undefined): Response {
  const sub = (splat ?? "").replace(/^\/+/, "") || "index.html";
  return new Response(null, {
    status: 302,
    headers: { Location: `/brotato/${sub}` },
  });
}

export const Route = createFileRoute("/api/public/brotato/$")({
  server: {
    handlers: {
      GET: ({ params }) => redirectFor((params as { _splat?: string })._splat),
      HEAD: ({ params }) => redirectFor((params as { _splat?: string })._splat),
    },
  },
});
