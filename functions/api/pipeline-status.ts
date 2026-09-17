export const onRequestGet: PagesFunction = async () => {
  return Response.json({
    mode: 'cloud',
    available: false,
    tools: { archive: false, aligner: false, variants: false, polygenic: false },
    files: { vcf: false, reads: false },
    note: 'Analysis tools run only in the private local workspace.',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
