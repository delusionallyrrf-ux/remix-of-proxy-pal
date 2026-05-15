import { proxy } from "./_proxy.mjs";

export default async (request, context) => {
  return proxy(request, {
    target: "https://sk-bytes.blogspot.com",
    prefix: "/api/public/kbytes",
  });
};

export const config = {
  path: ["/api/public/kbytes", "/api/public/kbytes/*"]
};

