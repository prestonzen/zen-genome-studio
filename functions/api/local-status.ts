export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      mode: 'cloud',
      source: { present: false },
      reads: { present: false },
      opencravat: false,
      openCravatUrl: '',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
