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
      const ruleName = url.searchParams.get("ruleName") || await env.STUN.get("ruleName") || "Lucky STUN";
      const now = new Date().toISOString();
      await env.STUN.put("target", target);
      await env.STUN.put("ruleName", ruleName);
      await env.STUN.put("lastUpdate", now);
      return Response.json({success:true,ruleName,target,lastUpdate:now});
    }

    if (url.pathname === "/api/status") {
      return Response.json({
        ruleName: await env.STUN.get("ruleName") || "Lucky STUN",
        target: await env.STUN.get("target"),
        lastUpdate: await env.STUN.get("lastUpdate")
      });
    }

    if (url.pathname === "/status") {
      const ruleName = await env.STUN.get("ruleName") || "Lucky STUN";
      const target = await env.STUN.get("target") || "Not configured";
      const lastUpdate = await env.STUN.get("lastUpdate") || "-";
      const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
      })[character]);
      const safeRuleName = escapeHtml(ruleName);
      const safeTarget = escapeHtml(target);
      const safeLastUpdate = escapeHtml(lastUpdate);
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
<div class="row"><div class="label">🚀 Rule Name</div><div class="value">${safeRuleName}</div></div>
<div class="row"><div class="label">🌐 Current URL</div><div class="value" id="target">${safeTarget}</div></div>
<div class="row"><div class="label">🕒 Last Update</div><div class="value" id="last-update" data-value="${safeLastUpdate}">-</div></div>
<div class="btns">
<a class="primary" href="${safeTarget}">Open Target</a>
<button class="secondary" id="copy">📋 一键复制</button>
</div>
<footer>Powered by Lucky + Cloudflare Workers</footer>
</div>
<script>
const target = document.getElementById("target");
const lastUpdate = document.getElementById("last-update");
const updatedAt = new Date(lastUpdate.dataset.value);
lastUpdate.textContent = Number.isNaN(updatedAt.getTime()) ? lastUpdate.dataset.value : updatedAt.toLocaleString("zh-CN");
document.getElementById("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(target.textContent);
  alert("已复制");
});
setTimeout(() => location.reload(), 30000);
</script>
</body></html>`;
      return new Response(html,{headers:{"content-type":"text/html;charset=utf-8"}});
    }

    const target = await env.STUN.get("target");
    if(!target) return new Response("Target not configured",{status:404});
    return Response.redirect(target,302);
  }
}
