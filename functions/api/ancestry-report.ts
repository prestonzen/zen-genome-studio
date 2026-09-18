import { cloudReportResponse, type CloudEnv } from '../_lib/cloud'

const fallback = {
  state: 'missing',
  mode: 'cloud',
  sourceName: 'Private ancestry report',
  sourceNote: 'No protected ancestry summary is published',
  profiles: [],
}

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => cloudReportResponse(env, 'ancestry', fallback)
