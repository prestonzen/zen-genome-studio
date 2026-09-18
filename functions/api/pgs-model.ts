import { readReportManifest, type CloudEnv } from '../_lib/cloud'

const models = [
  {
    id: 'PGS003895',
    title: 'Standing height',
    name: 'INI50',
    variants: 62419,
    build: 'GRCh38',
    weightType: 'beta',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS003895/',
  },
  {
    id: 'PGS002684',
    title: 'Sleep chronotype',
    name: 'Chronotype SBayesR',
    variants: 977159,
    build: 'GRCh38',
    weightType: 'effect weight',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS002684/',
  },
  {
    id: 'PGS000027',
    title: 'BMI tendency',
    name: 'BMI PRS',
    variants: 2100302,
    build: 'GRCh38',
    weightType: 'effect weight',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS000027/',
  },
]

const model = models[0]

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => {
  const manifest = await readReportManifest(env)
  const published = Boolean(manifest?.reports.some((report) => report.id === 'pgs-height'))
  return Response.json({
    mode: 'cloud',
    installed: published,
    model,
    models: models.map((item) => ({ ...item, installed: published })),
    note: published ? 'Three protected result snapshots are available. Recalculation still runs only on the private computer.' : 'PGS models can only be installed in the private local workspace.',
  }, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}

export const onRequestPost: PagesFunction = async () => Response.json({
  mode: 'cloud',
  installed: false,
  model,
  models: models.map((item) => ({ ...item, installed: false })),
  error: 'Cloudflare never downloads or calculates models against private genome data.',
}, { status: 403, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
