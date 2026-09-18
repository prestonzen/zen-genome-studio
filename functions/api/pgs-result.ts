import { cloudReportResponse, type CloudEnv } from '../_lib/cloud'

const fallback = {
  state: 'missing', mode: 'cloud', modelId: 'PGS003895', trait: 'Standing height', modelVariants: 62419,
  matchedVariants: 0, coveragePercent: 0, weightCoveragePercent: 0,
  interpretation: 'No protected polygenic result has been published.',
  nextStep: 'Run the studio locally, then publish the compact result summary.',
  sourceNote: 'No raw genome data is stored in this cloud preview.',
}

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => cloudReportResponse(env, 'pgs-height', fallback)

export const onRequestPost: PagesFunction = async () => Response.json({ error: 'Polygenic calculations run only in the private local workspace.' }, { status: 405 })
