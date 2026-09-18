import { cloudReportResponse, type CloudEnv } from '../_lib/cloud'

const fallback = {
  state: 'demo',
  mode: 'cloud',
  build: 'GRCh38',
  reportLabel: 'Reference trait report',
  sourceNote: 'Fictional example - no protected report published',
  caveat: 'Traits are tendencies, not guarantees. The public demo contains no personal genotype data.',
  traits: [],
  quickRead: [],
}

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => cloudReportResponse(env, 'trait', fallback)
