import { proxy } from "./_proxy.mjs";

export default async (request) => proxy(request, {
  target: "https://sk-bytes.blogspot.com",
  prefix: "/api/public/stolensite2",
});

export const config = { path: ["/api/public/stolensite2", "/api/public/stolensite2/*"] };
