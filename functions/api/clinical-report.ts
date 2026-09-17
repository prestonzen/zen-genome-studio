export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      state: 'missing',
      mode: 'cloud',
      reportLabel: 'Private clinical report',
      sourceNote: 'Clinical findings are never included in the public Cloudflare preview',
      primaryFindings: { status: 'Private', note: 'Open the local studio to view clinician-reviewed findings.' },
      secondaryFindings: { status: 'Private', panel: 'Private', note: 'No medical data is deployed.' },
      carrierFindings: [],
      incidentalFindings: [],
      limitations: [],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
