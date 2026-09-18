import { createSessionToken, passwordMatches, passwordProtectionConfigured, passwordProtectionEnabled, requestIsSameOrigin, sessionCookie } from '../../_lib/auth'
import type { CloudEnv } from '../../_lib/cloud'

export const onRequestPost: PagesFunction<CloudEnv> = async ({ env, request }) => {
  if (!requestIsSameOrigin(request)) return new Response('Forbidden', { status: 403 })
  if (!passwordProtectionEnabled(env)) return new Response(null, { status: 303, headers: { Location: new URL('/', request.url).toString() } })
  if (!passwordProtectionConfigured(env)) return new Response('Password protection is not fully configured.', { status: 503 })

  let candidate: string
  const contentType = request.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    const payload = await request.json().catch(() => null) as { password?: unknown } | null
    candidate = typeof payload?.password === 'string' ? payload.password : ''
  } else {
    const form = await request.formData()
    const password = form.get('password')
    candidate = typeof password === 'string' ? password : ''
  }

  if (candidate.length > 256 || !await passwordMatches(candidate, env.SITE_PASSWORD!)) {
    return new Response(null, { status: 303, headers: { Location: new URL('/?auth=failed', request.url).toString() } })
  }

  const response = new Response(null, { status: 303, headers: { Location: new URL('/', request.url).toString() } })
  response.headers.append('Set-Cookie', sessionCookie(await createSessionToken(env, request), request))
  return response
}
