import { passwordProtectionConfigured, passwordProtectionEnabled, requestIsAuthenticated, withSecurityHeaders } from './_lib/auth'
import type { CloudEnv } from './_lib/cloud'

const AUTH_ROUTES = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/status'])

function passwordPage(failed: boolean) {
  const error = failed ? '<p class="error" role="alert">That password did not match.</p>' : ''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#071116">
  <title>Zen Genome Studio - Private access</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,Arial,sans-serif;background:#050b0f;color:#edf7f8}
    *{box-sizing:border-box} body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:#050b0f}
    main{width:min(100%,460px);border:1px solid #1d3a45;border-radius:6px;background:#09161c;box-shadow:0 24px 70px rgba(0,0,0,.36)}
    header{border-bottom:1px solid #17303a;padding:22px 24px;display:flex;align-items:center;gap:13px}
    .mark{width:34px;height:34px;border:1px solid #31c9ed;display:grid;place-items:center;color:#31c9ed;font:700 13px/1 ui-monospace,monospace}
    header span{display:grid;gap:4px} header strong{font-size:14px} header small{color:#7f99a4;font:500 9px/1.2 ui-monospace,monospace;text-transform:uppercase}
    section{padding:30px 24px 24px} h1{margin:0;font-size:28px;letter-spacing:0} p{margin:10px 0 0;color:#91a8b1;font-size:13px;line-height:1.55}
    form{margin-top:24px;display:grid;gap:10px} label{color:#9cb2bb;font:600 9px/1 ui-monospace,monospace;text-transform:uppercase}
    input{width:100%;height:48px;border:1px solid #2b4c59;border-radius:4px;padding:0 13px;color:#f5fbfc;background:#061016;font:500 15px/1 ui-monospace,monospace;outline:none}
    input:focus{border-color:#31c9ed;box-shadow:0 0 0 3px rgba(49,201,237,.1)}
    button{height:46px;border:1px solid #31c9ed;border-radius:4px;color:#041116;background:#31c9ed;font-weight:700;cursor:pointer}
    button:hover{background:#63d8f1}.error{margin:0;color:#ff7b73}.boundary{margin-top:20px;border-top:1px solid #17303a;padding-top:16px;display:flex;gap:9px;color:#5edda8;font:500 10px/1.4 ui-monospace,monospace}
  </style>
</head>
<body>
  <main>
    <header><span class="mark">ZG</span><span><strong>Zen Genome Studio</strong><small>Protected report workspace</small></span></header>
    <section>
      <h1>Private access</h1>
      <p>Enter the shared password to open the derived genome reports.</p>
      <form method="post" action="/api/auth/login">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required autofocus>
        ${error}
        <button type="submit">Unlock studio</button>
      </form>
      <p class="boundary">Raw VCF and sequencing files are not stored in this site.</p>
    </section>
  </main>
</body>
</html>`
}

export const onRequest: PagesFunction<CloudEnv> = async (context) => {
  const protectedMode = passwordProtectionEnabled(context.env)
  if (!protectedMode) return withSecurityHeaders(await context.next(), false)
  if (!passwordProtectionConfigured(context.env)) {
    return withSecurityHeaders(new Response('Password protection is not fully configured.', { status: 503 }), true)
  }

  const url = new URL(context.request.url)
  if (AUTH_ROUTES.has(url.pathname)) return withSecurityHeaders(await context.next(), true)
  if (await requestIsAuthenticated(context.env, context.request)) return withSecurityHeaders(await context.next(), true)

  const acceptsHtml = context.request.method === 'GET' && (context.request.headers.get('Accept') ?? '').includes('text/html')
  if (acceptsHtml) {
    return withSecurityHeaders(new Response(passwordPage(url.searchParams.get('auth') === 'failed'), { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }), true)
  }
  return withSecurityHeaders(Response.json({ error: 'Authentication required.' }, { status: 401 }), true)
}
