import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://nikehub.pages.dev";
const PREFIX = "/api/public/nikehub";

export const Route = createFileRoute("/api/public/nikehub/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
