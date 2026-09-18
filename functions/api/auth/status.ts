import { passwordProtectionEnabled, requestIsAuthenticated } from '../../_lib/auth'
import type { CloudEnv } from '../../_lib/cloud'

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env, request }) => Response.json({
  enabled: passwordProtectionEnabled(env),
  authenticated: await requestIsAuthenticated(env, request),
}, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
