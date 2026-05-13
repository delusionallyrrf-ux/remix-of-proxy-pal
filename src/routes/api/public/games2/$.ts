import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://www.crazygames.com";
const PREFIX = "/api/public/games2";

export const Route = createFileRoute("/api/public/games2/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
