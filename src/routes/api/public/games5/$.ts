import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://www.kbhgames.com";
const PREFIX = "/api/public/games5";

export const Route = createFileRoute("/api/public/games5/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
