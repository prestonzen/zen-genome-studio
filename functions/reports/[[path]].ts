export const onRequest: PagesFunction = async () => Response.json(
  { error: 'Direct report paths are not available.' },
  { status: 404, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } },
)
