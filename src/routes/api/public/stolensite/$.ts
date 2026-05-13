import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://quiz-let.blogspot.com";
const PREFIX = "/api/public/stolensite";

export const Route = createFileRoute("/api/public/stolensite/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
