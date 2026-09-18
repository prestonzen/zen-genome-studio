export type CloudEnv = {
  GENOME_REPORTS?: R2Bucket
  SITE_PASSWORD?: string
  SESSION_SECRET?: string
}

export type CloudReportName = 'trait' | 'clinical' | 'ancestry' | 'pgs-height'

type ReportManifest = {
  schemaVersion: number
  publishedAt: string
  reports: Array<{
    id: CloudReportName
    key: string
    bytes: number
    sha256: string
    generatedAt?: string
  }>
}

const REPORT_KEYS: Record<CloudReportName, string> = {
  trait: 'reports/trait-report.json',
  clinical: 'reports/clinical-report.json',
  ancestry: 'reports/ancestry-report.json',
  'pgs-height': 'reports/pgs-height-result.json',
}

const MAX_REPORT_BYTES = 2_000_000

export const privateJsonHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}

export function privateReportsEnabled(env: CloudEnv) {
  return Boolean(env.SITE_PASSWORD?.trim() && env.GENOME_REPORTS)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function cloudReportResponse(
  env: CloudEnv,
  reportName: CloudReportName,
  fallback: Record<string, unknown>,
) {
  if (!privateReportsEnabled(env)) {
    return Response.json(fallback, { headers: privateJsonHeaders })
  }

  const object = await env.GENOME_REPORTS!.get(REPORT_KEYS[reportName])
  if (!object) {
    return Response.json(fallback, { headers: privateJsonHeaders })
  }
  if (object.size > MAX_REPORT_BYTES) {
    return Response.json({ error: 'The protected report is larger than the configured safety limit.' }, { status: 502, headers: privateJsonHeaders })
  }

  try {
    const payload: unknown = JSON.parse(await object.text())
    if (!isRecord(payload)) throw new Error('Report root must be an object')
    return Response.json({ ...payload, state: 'ready', mode: 'cloud' }, { headers: privateJsonHeaders })
  } catch {
    return Response.json({ error: 'The protected report could not be read.' }, { status: 502, headers: privateJsonHeaders })
  }
}

export async function readReportManifest(env: CloudEnv): Promise<ReportManifest | null> {
  if (!privateReportsEnabled(env)) return null
  const object = await env.GENOME_REPORTS!.get('reports/manifest.json')
  if (!object || object.size > MAX_REPORT_BYTES) return null
  try {
    const value: unknown = JSON.parse(await object.text())
    if (!isRecord(value) || !Array.isArray(value.reports) || typeof value.publishedAt !== 'string') return null
    return value as ReportManifest
  } catch {
    return null
  }
}
