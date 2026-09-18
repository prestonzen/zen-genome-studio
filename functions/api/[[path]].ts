export const onRequest: PagesFunction = async () => Response.json(
  { error: 'API route not found.' },
  { status: 404, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } },
)
