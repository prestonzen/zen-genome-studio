export const onRequestGet: PagesFunction = async () => Response.json({
  state: 'missing', mode: 'cloud', modelId: 'PGS003895', trait: 'Standing height', modelVariants: 62419,
  matchedVariants: 0, coveragePercent: 0, weightCoveragePercent: 0,
  interpretation: 'Personal polygenic results are available only in the private local workspace.',
  nextStep: 'Run the studio locally to calculate against a private genotype file.',
  sourceNote: 'No genome data is stored in this cloud preview.',
}, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

export const onRequestPost: PagesFunction = async () => Response.json({ error: 'Polygenic calculations run only in the private local workspace.' }, { status: 405 })
