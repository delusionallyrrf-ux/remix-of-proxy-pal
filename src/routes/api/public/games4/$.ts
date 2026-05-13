import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://www.miniclip.com";
const PREFIX = "/api/public/games4";

export const Route = createFileRoute("/api/public/games4/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
