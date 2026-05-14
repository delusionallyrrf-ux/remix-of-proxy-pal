import { createFileRoute } from "@tanstack/react-router";
import { createProxyHandlers } from "@/lib/proxy-route";

const TARGET = "https://sk-bytes.blogspot.com";
const PREFIX = "/api/public/stolensite2";

export const Route = createFileRoute("/api/public/stolensite2/$")({
  server: {
    handlers: createProxyHandlers({ target: TARGET, prefix: PREFIX }),
  },
});
