export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      state: 'missing',
      mode: 'cloud',
      sourceName: 'Private ancestry report',
      sourceNote: 'Personal ancestry estimates are never included in the public Cloudflare preview',
      profiles: [],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
