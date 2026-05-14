import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://degloved.net/gms/brotato/index.html";
const PREFIX = "/api/public/brotato";

export const Route = createFileRoute("/api/public/brotato/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
