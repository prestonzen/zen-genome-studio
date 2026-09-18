import { readReportManifest, type CloudEnv } from '../_lib/cloud'

const model = {
  id: 'PGS003895',
  title: 'Standing height',
  name: 'INI50',
  variants: 62419,
  build: 'GRCh38',
  weightType: 'beta',
  sourceUrl: 'https://www.pgscatalog.org/score/PGS003895/',
}

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => {
  const manifest = await readReportManifest(env)
  const published = Boolean(manifest?.reports.some((report) => report.id === 'pgs-height'))
  return Response.json({
    mode: 'cloud',
    installed: published,
    model,
    note: published ? 'A protected result snapshot is available. Recalculation still runs only on the private computer.' : 'PGS models can only be installed in the private local workspace.',
  }, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}

export const onRequestPost: PagesFunction = async () => Response.json({
  mode: 'cloud',
  installed: false,
  model,
  error: 'Cloudflare never downloads or calculates models against private genome data.',
}, { status: 403, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
