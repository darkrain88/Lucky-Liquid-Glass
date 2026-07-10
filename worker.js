// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/update") {
      if (url.searchParams.get("key") !== env.API_KEY) {
        return new Response("Forbidden", {status:403});
      }
      const target = url.searchParams.get("target");
      if (!target) return new Response("Missing target",{status:400});
      const now = new Date().toISOString();
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      await env.STUN.put("target", target);
      await env.STUN.put("lastUpdate", now);
      await env.STUN.put("lastClient", ip);
      return Response.json({success:true,target,lastUpdate:now});
    }

    if (url.pathname === "/api/status") {
      return Response.json({
        target: await env.STUN.get("target"),
        lastUpdate: await env.STUN.get("lastUpdate"),
        lastClient: await env.STUN.get("lastClient")
      });
    }

    if (url.pathname === "/status") {
      const target = await env.STUN.get("target") || "Not configured";
      const lastUpdate = await env.STUN.get("lastUpdate") || "-";
      const lastClient = await env.STUN.get("lastClient") || "-";
      const html = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lucky STUN</title>
<style>
:root{color-scheme:light dark}
*{box-sizing:border-box}body{
margin:0;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;
display:flex;justify-content:center;align-items:center;min-height:100vh;
background:linear-gradient(135deg,#6ea8fe,#a78bfa,#7dd3fc);
background-size:300% 300%;animation:bg 18s ease infinite}
@keyframes bg{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
.card{
width:min(92vw,760px);
padding:34px;border-radius:28px;
background:rgba(255,255,255,.18);
backdrop-filter:blur(24px) saturate(180%);
-webkit-backdrop-filter:blur(24px) saturate(180%);
border:1px solid rgba(255,255,255,.25);
box-shadow:0 20px 60px rgba(0,0,0,.18)}
h1{margin:0 0 24px;text-align:center}
.row{margin:18px 0}
.label{opacity:.7;font-size:.9rem;margin-bottom:6px}
.value{word-break:break-all;font-size:1.02rem}
.status{display:flex;align-items:center;gap:10px;color:#16a34a;font-weight:700}
.dot{width:12px;height:12px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.5}}
.btns{display:flex;gap:12px;margin-top:28px;flex-wrap:wrap}
button,a{flex:1;text-decoration:none;text-align:center;border:none;padding:14px 18px;
border-radius:16px;font-weight:700;cursor:pointer}
.primary{background:#0a84ff;color:#fff}
.secondary{background:rgba(255,255,255,.25);color:inherit}
footer{text-align:center;opacity:.7;margin-top:28px;font-size:.82rem}
</style></head>
<body>
<div class="card">
<h1>🚀 Lucky STUN</h1>
<div class="status"><div class="dot"></div>Online</div>
<div class="row"><div class="label">Current Target</div><div class="value" id="target">${target}</div></div>
<div class="row"><div class="label">Last Update</div><div class="value">${lastUpdate}</div></div>
<div class="row"><div class="label">Last Client</div><div class="value">${lastClient}</div></div>
<div class="btns">
<a class="primary" href="${target}">Open Target</a>
<button class="secondary" onclick="navigator.clipboard.writeText(document.getElementById('target').innerText).then(()=>alert('Copied'))">Copy URL</button>
</div>
<footer>Powered by Lucky + Cloudflare Workers</footer>
</div>
</body></html>`;
      return new Response(html,{headers:{"content-type":"text/html;charset=utf-8"}});
    }

    const target = await env.STUN.get("target");
    if(!target) return new Response("Target not configured",{status:404});
    return Response.redirect(target,302);
  }
}
