import { clearedSessionCookie, requestIsSameOrigin } from '../../_lib/auth'
import type { CloudEnv } from '../../_lib/cloud'

export const onRequestPost: PagesFunction<CloudEnv> = async ({ request }) => {
  if (!requestIsSameOrigin(request)) return new Response('Forbidden', { status: 403 })
  const response = new Response(null, { status: 303, headers: { Location: new URL('/', request.url).toString() } })
  response.headers.append('Set-Cookie', clearedSessionCookie(request))
  return response
}
