import { cloudReportResponse, type CloudEnv } from '../_lib/cloud'

const fallback = {
  state: 'missing',
  mode: 'cloud',
  reportLabel: 'Private clinical report',
  sourceNote: 'No protected clinical summary is published',
  primaryFindings: { status: 'Private', note: 'Open the local studio to view clinician-reviewed findings.' },
  secondaryFindings: { status: 'Private', panel: 'Private', note: 'No clinical report data is available.' },
  carrierFindings: [],
  incidentalFindings: [],
  limitations: [],
}

export const onRequestGet: PagesFunction<CloudEnv> = async ({ env }) => cloudReportResponse(env, 'clinical', fallback)
