import type { CloudEnv } from './cloud'

const encoder = new TextEncoder()
const COOKIE_NAME = 'zen_session'
const SESSION_SECONDS = 12 * 60 * 60

export function passwordProtectionEnabled(env: CloudEnv) {
  return Boolean(env.SITE_PASSWORD?.trim())
}

export function passwordProtectionConfigured(env: CloudEnv) {
  return Boolean(env.SITE_PASSWORD && env.SITE_PASSWORD.length >= 12 && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32)
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  let difference = left.length ^ right.length
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0)
  }
  return difference === 0
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}

async function signingKey(env: CloudEnv) {
  const material = await digest(`${env.SESSION_SECRET}\u0000${env.SITE_PASSWORD}`)
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

async function signature(env: CloudEnv, payload: string) {
  const signed = await crypto.subtle.sign('HMAC', await signingKey(env), encoder.encode(payload))
  return bytesToBase64Url(new Uint8Array(signed))
}

function cookieValue(request: Request) {
  const cookies = request.headers.get('Cookie')?.split(';') ?? []
  const entry = cookies.map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`))
  if (!entry) return ''
  try {
    return decodeURIComponent(entry.slice(COOKIE_NAME.length + 1))
  } catch {
    return ''
  }
}

export async function passwordMatches(candidate: string, expected: string) {
  const [candidateDigest, expectedDigest] = await Promise.all([digest(candidate), digest(expected)])
  return constantTimeEqual(candidateDigest, expectedDigest)
}

export async function createSessionToken(env: CloudEnv, request: Request) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS
  const host = bytesToBase64Url(encoder.encode(new URL(request.url).host.toLowerCase()))
  const payload = `v1.${expires}.${host}`
  return `${payload}.${await signature(env, payload)}`
}

export async function requestIsAuthenticated(env: CloudEnv, request: Request) {
  if (!passwordProtectionEnabled(env)) return true
  if (!passwordProtectionConfigured(env)) return false
  const token = cookieValue(request)
  const parts = token.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') return false
  const expires = Number(parts[1])
  const host = bytesToBase64Url(encoder.encode(new URL(request.url).host.toLowerCase()))
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || parts[2] !== host) return false
  const payload = parts.slice(0, 3).join('.')
  const expected = await signature(env, payload)
  return constantTimeEqual(encoder.encode(parts[3]), encoder.encode(expected))
}

function secureCookie(request: Request) {
  const url = new URL(request.url)
  return url.protocol === 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1'
}

export function sessionCookie(token: string, request: Request) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secureCookie(request) ? '; Secure' : ''}`
}

export function clearedSessionCookie(request: Request) {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookie(request) ? '; Secure' : ''}`
}

export function requestIsSameOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  if (origin === 'null') return request.headers.get('Sec-Fetch-Site') === 'same-origin'

  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return false
  }

  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('X-Forwarded-Host')?.split(',')[0]?.trim()
  if (originUrl.origin === requestUrl.origin || (forwardedHost && originUrl.host === forwardedHost)) return true

  // Local Pages preview can rewrite the request host internally. This browser-set
  // signal still distinguishes a real same-origin form post from a cross-site one.
  return request.headers.get('Sec-Fetch-Site') === 'same-origin'
}

export function withSecurityHeaders(response: Response, protectedMode: boolean) {
  const secured = new Response(response.body, response)
  secured.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; worker-src 'none'")
  secured.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  secured.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  secured.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  secured.headers.set('Referrer-Policy', 'no-referrer')
  secured.headers.set('X-Content-Type-Options', 'nosniff')
  secured.headers.set('X-Frame-Options', 'DENY')
  secured.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  if (protectedMode) secured.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return secured
}
