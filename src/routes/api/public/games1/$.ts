import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://www.coolmathgames.com";
const PREFIX = "/api/public/games1";

export const Route = createFileRoute("/api/public/games1/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
