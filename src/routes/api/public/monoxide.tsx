import { createFileRoute } from "@tanstack/react-router";

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>monoxide</title>
<style>
  html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
  iframe{border:0;width:100vw;height:100vh;display:block}
</style>
</head>
<body>
<iframe src="https://veterans4education.org/" allow="autoplay; fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="no-referrer"></iframe>
</body>
</html>`;

export const Route = createFileRoute("/api/public/monoxide")({
  server: {
    handlers: {
      GET: async () =>
        new Response(HTML, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        }),
    },
  },
});
