export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      state: 'demo',
      mode: 'cloud',
      build: 'GRCh38',
      reportLabel: 'Reference trait report',
      sourceNote: 'Fictional example - no genome uploaded',
      caveat: 'Traits are tendencies, not guarantees. The public demo contains no personal genotype data.',
      traits: [],
      quickRead: [],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
