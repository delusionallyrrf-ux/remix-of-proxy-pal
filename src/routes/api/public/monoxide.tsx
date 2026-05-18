import { createFileRoute } from "@tanstack/react-router";

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>monoxide</title>
<style>
  html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden;font-family:system-ui,sans-serif}
  iframe{border:0;width:100vw;height:100vh;display:block}
  #gate{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:rgba(88,28,135,0.55);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%)}
  #gate h1{margin:0;font-size:clamp(64px,14vw,160px);font-weight:900;color:#ef1d1d;letter-spacing:.05em;text-shadow:0 0 24px rgba(239,29,29,.55);font-family:system-ui,sans-serif}
  #gate form{display:flex;gap:10px}
  #gate input{padding:14px 18px;font-size:18px;border-radius:10px;border:2px solid rgba(255,255,255,.4);background:rgba(0,0,0,.45);color:#fff;outline:none;min-width:260px}
  #gate input:focus{border-color:#fff}
  #gate button{padding:14px 22px;font-size:18px;font-weight:700;border-radius:10px;border:0;background:#ef1d1d;color:#fff;cursor:pointer}
  #gate .err{color:#ffb4b4;font-size:14px;min-height:18px}
</style>
</head>
<body>
<iframe id="frame" src="about:blank" allow="autoplay; fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="no-referrer"></iframe>
<div id="gate" role="dialog" aria-modal="true">
  <h1>LOCKED</h1>
  <form id="f" autocomplete="off">
    <input id="code" type="password" placeholder="Enter code" aria-label="Code" autofocus />
    <button type="submit">Unlock</button>
  </form>
  <div class="err" id="err"></div>
</div>
<script>
(function(){
  var KEY="monoxide_unlocked";
  var CODE="monoxideactivate";
  var TARGET="https://monoxide.dev/";
  var unlocked=false;
  try{unlocked=sessionStorage.getItem(KEY)==="1"}catch(_){}
  if(unlocked){
    document.getElementById("gate").remove();
    document.getElementById("frame").src=TARGET;
    return;
  }
  document.getElementById("f").addEventListener("submit",function(e){
    e.preventDefault();
    var v=document.getElementById("code").value.trim();
    if(v===CODE){
      try{sessionStorage.setItem(KEY,"1")}catch(_){}
      location.reload();
    }else{
      document.getElementById("err").textContent="Incorrect code";
      document.getElementById("code").value="";
    }
  });
})();
</script>
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
