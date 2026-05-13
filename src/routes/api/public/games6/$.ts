import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://www.silvergames.com";
const PREFIX = "/api/public/games6";

export const Route = createFileRoute("/api/public/games6/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
