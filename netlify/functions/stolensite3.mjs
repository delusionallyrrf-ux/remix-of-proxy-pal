import { proxy } from "./_proxy.mjs";

export default async (request, context) => {
  return proxy(request, {
    target: "https://yukios.netlify.app",
    prefix: "/api/public/os",
  });
};

export const config = {
  path: ["/api/public/os", "/api/public/os/*"]
};
