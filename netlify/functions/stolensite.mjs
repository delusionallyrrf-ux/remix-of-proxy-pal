import { proxy } from "./_proxy.mjs";

export default async (request, context) => {
  return proxy(request, {
    target: "https://quiz-let.blogspot.com",
    prefix: "/api/public/bspot",
  });
};

export const config = {
  path: ["/api/public/bspot", "/api/public/bspot/*"]
};
