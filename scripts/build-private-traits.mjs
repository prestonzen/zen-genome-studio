import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import zlib from 'node:zlib'
import { strFromU8, unzipSync } from 'fflate'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1])
}

const vcfPath = args.get('--vcf')
const outputPath = args.get('--output')
const ancestryPath = args.get('--ancestry')

if (!vcfPath || !outputPath) {
  console.error('Usage: node build-private-traits.mjs --vcf <file.vcf.gz> --output <trait-report.json> [--ancestry <AncestryDNA.zip>]')
  process.exit(1)
}

const markers = {
  rs12913832: { ref: 'A', gene: 'HERC2' },
  rs1800407: { ref: 'C', gene: 'OCA2' },
  rs12896399: { ref: 'G', gene: 'SLC24A4' },
  rs16891982: { ref: 'C', gene: 'SLC45A2' },
  rs1393350: { ref: 'G', gene: 'TYR' },
  rs12203592: { ref: 'C', gene: 'IRF4' },
  rs11547464: { ref: 'G', gene: 'MC1R' },
  rs1805006: { ref: 'C', gene: 'MC1R' },
  rs1805007: { ref: 'C', gene: 'MC1R' },
  rs1805008: { ref: 'C', gene: 'MC1R' },
  rs1805009: { ref: 'G', gene: 'MC1R' },
  rs2228479: { ref: 'G', gene: 'MC1R' },
  rs4988235: { ref: 'G', gene: 'MCM6/LCT' },
  rs762551: { ref: 'C', gene: 'CYP1A2' },
  rs5751876: { ref: 'T', gene: 'ADORA2A' },
  rs713598: { ref: 'C', gene: 'TAS2R38' },
  rs1726866: { ref: 'G', gene: 'TAS2R38' },
  rs10246939: { ref: 'T', gene: 'TAS2R38' },
  rs17822931: { ref: 'C', gene: 'ABCC11' },
  rs1815739: { ref: 'C', gene: 'ACTN3' },
  rs72921001: { ref: 'C', gene: 'OR6A2 region' },
  rs10427255: { ref: 'C', gene: 'ZEB2 region' },
  rs671: { ref: 'G', gene: 'ALDH2' },
}

const observed = new Map()
const input = fs.createReadStream(vcfPath)
const source = vcfPath.endsWith('.gz') ? input.pipe(zlib.createGunzip()) : input
const lines = readline.createInterface({ input: source, crlfDelay: Infinity })

for await (const line of lines) {
  if (!line || line.startsWith('#')) continue
  const fields = line.split('\t')
  if (fields.length < 10) continue
  const ids = fields[2].split(';')
  const matched = ids.find((id) => Object.hasOwn(markers, id))
  if (!matched) continue

  const formatKeys = fields[8].split(':')
  const sampleValues = fields[9].split(':')
  const sample = Object.fromEntries(formatKeys.map((key, index) => [key, sampleValues[index]]))
  const alleles = [fields[3], ...fields[4].split(',')]
  const genotype = (sample.GT || './.')
    .split(/[|/]/)
    .map((value) => value === '.' ? '?' : alleles[Number(value)] || '?')

  observed.set(matched, {
    genotype,
    filter: fields[6],
    depth: Number(sample.DP || 0),
    quality: Number(sample.GQ || 0),
  })
}

const ancestryObserved = new Map()
const ancestryAll = new Map()
let ancestryReady = false

if (ancestryPath && fs.existsSync(ancestryPath)) {
  let ancestryText = ''
  if (ancestryPath.toLowerCase().endsWith('.zip')) {
    const entries = unzipSync(fs.readFileSync(ancestryPath))
    const entryName = Object.keys(entries).find((name) => /\.(txt|csv)$/i.test(name))
    if (!entryName) throw new Error('No text-format DNA export was found inside the AncestryDNA archive.')
    ancestryText = strFromU8(entries[entryName])
  } else {
    ancestryText = fs.readFileSync(ancestryPath, 'utf8')
  }

  const build37 = /build\s*37(?:\.1)?\s+coordinates/i.test(ancestryText)
  const forwardStrand = /forward\s*\(\+\)\s*strand/i.test(ancestryText)
  ancestryReady = build37 && forwardStrand

  if (!ancestryReady) {
    throw new Error('AncestryDNA source must declare build 37 coordinates and the forward strand before it can be used.')
  }

  for (const line of ancestryText.split(/\r?\n/)) {
    if (!line.startsWith('rs')) continue
    const fields = line.split(/[\t,]/)
    const rsid = fields[0]
    if (!/^rs\d+$/.test(rsid) || fields.length < 5) continue
    const genotype = [fields[3], fields[4]].map((allele) => allele.trim().toUpperCase())
    if (genotype.some((allele) => !/^[ACGT]$/.test(allele))) continue
    ancestryAll.set(rsid, genotype)
    if (Object.hasOwn(markers, rsid)) ancestryObserved.set(rsid, { genotype })
  }
}

function sameGenotype(left, right) {
  return [...left].sort().join('') === [...right].sort().join('')
}

const crossChecked = [...ancestryObserved.keys()].filter((rsid) => observed.has(rsid))
const concordant = crossChecked.filter((rsid) => sameGenotype(observed.get(rsid).genotype, ancestryObserved.get(rsid).genotype))
const discordant = crossChecked.length - concordant.length

async function compareSources() {
  if (!ancestryReady) return null
  let overlap = 0
  let matching = 0
  const complement = { A: 'T', T: 'A', C: 'G', G: 'C' }
  const vcfInput = fs.createReadStream(vcfPath)
  const vcfSource = vcfPath.endsWith('.gz') ? vcfInput.pipe(zlib.createGunzip()) : vcfInput
  const vcfLines = readline.createInterface({ input: vcfSource, crlfDelay: Infinity })

  for await (const line of vcfLines) {
    if (!line || line.startsWith('#')) continue
    const fields = line.split('\t')
    if (fields.length < 10 || (fields[6] !== 'PASS' && fields[6] !== '.')) continue
    const rsid = fields[2].split(';').find((id) => ancestryAll.has(id))
    if (!rsid) continue
    const formatKeys = fields[8].split(':')
    const sampleValues = fields[9].split(':')
    const gt = sampleValues[formatKeys.indexOf('GT')]
    if (!gt || gt.includes('.')) continue
    const alleles = [fields[3], ...fields[4].split(',')]
    const genotype = gt.split(/[|/]/).map((value) => alleles[Number(value)])
    if (genotype.some((allele) => !/^[ACGT]$/.test(allele))) continue

    const ancestryGenotype = ancestryAll.get(rsid)
    const directMatch = sameGenotype(genotype, ancestryGenotype)
    const complementedMatch = sameGenotype(genotype, ancestryGenotype.map((allele) => complement[allele]))
    overlap++
    if (directMatch || complementedMatch) matching++
  }

  const concordancePercent = overlap ? Math.round((matching / overlap) * 10_000) / 100 : 0
  return {
    status: overlap >= 1_000 && concordancePercent >= 95 ? 'compatible' : 'review',
    overlap,
    matching,
    concordancePercent,
  }
}

const sourceComparison = await compareSources()
const ancestryUsable = sourceComparison?.status === 'compatible'

function call(rsid) {
  const direct = observed.get(rsid)
  if (direct) return { ...direct, observed: true, source: 'vcf' }
  const ancestry = ancestryUsable ? ancestryObserved.get(rsid) : null
  if (ancestry) return { ...ancestry, filter: 'ANCESTRY_ARRAY', depth: 0, quality: 0, observed: true, source: 'ancestry' }
  const ref = markers[rsid].ref
  return { genotype: [ref, ref], filter: 'PRESUMED_REF', depth: 0, quality: 0, observed: false, source: 'presumed' }
}

function dosage(rsid, allele) {
  return call(rsid).genotype.filter((base) => base === allele).length
}

function callNote(rsids) {
  const direct = rsids.filter((rsid) => observed.has(rsid) || (ancestryUsable && ancestryObserved.has(rsid))).length
  const inferred = rsids.length - direct
  if (!ancestryUsable) {
    if (!inferred) return `${direct} marker${direct === 1 ? '' : 's'} directly observed in the VCF`
    return `${direct} directly observed; ${inferred} presumed reference in the variant-only VCF`
  }

  const vcfCount = rsids.filter((rsid) => observed.has(rsid)).length
  const ancestryOnly = rsids.filter((rsid) => !observed.has(rsid) && ancestryObserved.has(rsid)).length
  const inBoth = rsids.filter((rsid) => observed.has(rsid) && ancestryObserved.has(rsid)).length
  const detail = [
    vcfCount ? `${vcfCount} in WGS` : '',
    ancestryOnly ? `${ancestryOnly} added by AncestryDNA` : '',
    inBoth ? `${inBoth} checked in both` : '',
  ].filter(Boolean).join(', ')
  const prefix = inferred
    ? `${direct} directly observed across your files`
    : `${direct} marker${direct === 1 ? '' : 's'} directly observed across your files`
  return `${prefix}${detail ? ` (${detail})` : ''}${inferred ? `; ${inferred} presumed reference` : ''}`
}

function roundedPercentages(values) {
  const rounded = values.map((value) => Math.round(value * 10) / 10)
  rounded[0] = Math.round((rounded[0] + (100 - rounded.reduce((sum, value) => sum + value, 0))) * 10) / 10
  return rounded
}

const eyeIds = ['rs12913832', 'rs1800407', 'rs12896399', 'rs16891982', 'rs1393350', 'rs12203592']
const blueScore = 3.94
  + dosage('rs12913832', 'A') * -4.81
  + dosage('rs1800407', 'T') * 1.40
  + dosage('rs12896399', 'G') * -0.58
  + dosage('rs16891982', 'C') * -1.30
  + dosage('rs1393350', 'A') * 0.47
  + dosage('rs12203592', 'T') * 0.70
const intermediateScore = 0.65
  + dosage('rs12913832', 'A') * -1.79
  + dosage('rs1800407', 'T') * 0.87
  + dosage('rs12896399', 'G') * -0.03
  + dosage('rs16891982', 'C') * -0.50
  + dosage('rs1393350', 'A') * 0.27
  + dosage('rs12203592', 'T') * 0.73
const denominator = 1 + Math.exp(blueScore) + Math.exp(intermediateScore)
const [brown, intermediate, blue] = roundedPercentages([
  (1 / denominator) * 100,
  (Math.exp(intermediateScore) / denominator) * 100,
  (Math.exp(blueScore) / denominator) * 100,
])
const eyeResult = brown >= blue && brown >= intermediate
  ? 'Brown / hazel range'
  : blue >= intermediate
    ? 'Blue range'
    : 'Intermediate range'

const mc1rIds = ['rs11547464', 'rs1805006', 'rs1805007', 'rs1805008', 'rs1805009', 'rs2228479']
const highImpactMc1r = dosage('rs11547464', 'A')
  + dosage('rs1805006', 'A')
  + dosage('rs1805007', 'T')
  + dosage('rs1805008', 'T')
  + dosage('rs1805009', 'C')
const lowerImpactMc1r = dosage('rs2228479', 'A')
const hairResult = highImpactMc1r >= 2
  ? 'Red-hair pigmentation signal'
  : highImpactMc1r === 1
    ? 'Mixed pigmentation signal'
    : lowerImpactMc1r > 0
      ? 'Darker pigmentation with a lighter modifier'
      : 'Darker pigmentation signal'
const hairSummary = highImpactMc1r > 0
  ? 'The panel includes an MC1R variant associated with lower eumelanin, but hair colour still depends on many genes.'
  : lowerImpactMc1r > 0
    ? 'No high-impact MC1R red-hair variant was observed; one lower-impact MC1R modifier is present.'
    : 'No high-impact MC1R red-hair variant was observed in this compact panel.'

const lactoseDose = dosage('rs4988235', 'A')
const caffeineDose = dosage('rs762551', 'A')
const sensitivityDose = dosage('rs5751876', 'T')
const bitterScore = dosage('rs713598', 'G') + dosage('rs1726866', 'G') + dosage('rs10246939', 'C')
const earwaxDryDose = dosage('rs17822931', 'T')
const actn3StopDose = dosage('rs1815739', 'T')
const cilantroLowerSoapDose = dosage('rs72921001', 'A')
const photicSneezeDose = dosage('rs10427255', 'C')
const aldh2ReducedDose = dosage('rs671', 'A')

const traits = [
  {
    id: 'eye-colour', category: 'Appearance', title: 'Eye colour', result: eyeResult,
    summary: `The six-marker IrisPlex model places the strongest probability in the ${eyeResult.toLowerCase()}. Intermediate colours remain harder to predict than blue or brown.`,
    evidence: 'Strong', markerCount: 6, callNote: callNote(eyeIds), sourceName: 'IrisPlex model', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
  },
  {
    id: 'hair-pigmentation', category: 'Appearance', title: 'Hair pigmentation', result: hairResult,
    summary: hairSummary, evidence: 'Moderate', markerCount: 6, callNote: callNote(mc1rIds), sourceName: 'HIrisPlex-S', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
  },
  {
    id: 'freckling', category: 'Appearance', title: 'Freckling & sun response',
    result: highImpactMc1r + dosage('rs12203592', 'T') > 0 ? 'Some freckling signal' : 'Lower freckling signal',
    summary: 'MC1R and IRF4 markers contribute to freckling, but sun exposure and additional variants matter substantially.',
    evidence: 'Moderate', markerCount: 7, callNote: callNote([...mc1rIds, 'rs12203592']), sourceName: 'HIrisPlex-S', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
  },
  {
    id: 'lactose', category: 'Senses & food', title: 'Lactose digestion',
    result: lactoseDose > 0 ? 'Lactase persistence signal' : 'Lower lactase persistence signal',
    summary: lactoseDose > 0
      ? 'A common lactase-persistence allele is present. This marker is most informative in people with European-associated ancestry.'
      : 'This European-associated marker does not show lactase persistence; other populations can carry different persistence variants.',
    evidence: 'Strong', markerCount: 1, callNote: callNote(['rs4988235']), sourceName: 'Lactase persistence review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29063188/',
  },
  {
    id: 'caffeine-metabolism', category: 'Senses & food', title: 'Caffeine metabolism',
    result: caffeineDose === 2 ? 'Faster metabolism signal' : caffeineDose === 1 ? 'Intermediate metabolism signal' : 'Slower metabolism signal',
    summary: 'CYP1A2 contributes to caffeine clearance, but smoking, medication, hormones, liver function and habits can change the real response.',
    evidence: 'Moderate', markerCount: 1, callNote: callNote(['rs762551']), sourceName: 'Caffeine genetics review', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4242593/',
  },
  {
    id: 'bitter-taste', category: 'Senses & food', title: 'Bitter taste',
    result: bitterScore >= 5 ? 'Higher bitter sensitivity signal' : bitterScore <= 1 ? 'Lower bitter sensitivity signal' : 'Mixed sensitivity signal',
    summary: 'Three TAS2R38 markers influence sensitivity to PTC-like bitter compounds. Food preferences are more complicated than this panel.',
    evidence: 'Moderate', markerCount: 3, callNote: callNote(['rs713598', 'rs1726866', 'rs10246939']), sourceName: 'TAS2R38 review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/40498099/',
  },
  {
    id: 'earwax', category: 'Senses & food', title: 'Earwax type',
    result: earwaxDryDose === 2 ? 'Dry type likely' : 'Wet type likely',
    summary: 'ABCC11 is one of the unusual everyday traits where a single marker has a large effect.',
    evidence: 'Strong', markerCount: 1, callNote: callNote(['rs17822931']), sourceName: 'ABCC11 study', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16444273/',
  },
  {
    id: 'cilantro', category: 'Senses & food', title: 'Cilantro perception',
    result: cilantroLowerSoapDose === 2 ? 'Lower soapy-taste tendency' : cilantroLowerSoapDose === 1 ? 'Slightly lower soapy-taste tendency' : 'Typical soapy-taste sensitivity marker',
    summary: 'This olfactory-region marker shifts the odds only slightly. Culture, exposure and other variants matter more than this result.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs72921001']), sourceName: 'Cilantro perception GWAS', sourceUrl: 'https://doi.org/10.1186/2044-7248-1-22',
  },
  {
    id: 'alcohol-response', category: 'Senses & food', title: 'Alcohol breakdown (ALDH2)',
    result: aldh2ReducedDose > 0 ? 'Slower breakdown marker linked to flushing' : 'Common breakdown marker; flush variant not detected',
    summary: aldh2ReducedDose > 0
      ? 'This reduced-activity variant can let acetaldehyde build up, making the face or skin feel hot and turn red after alcohol. It does not establish a safe amount to drink.'
      : 'The common variant strongly linked to facial warmth and redness after alcohol was not observed. That does not make alcohol risk-free or predict your full response.',
    evidence: 'Strong', markerCount: 1, callNote: callNote(['rs671']), sourceName: 'ALDH2 review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39075523/',
  },
  {
    id: 'actn3', category: 'Performance', title: 'ACTN3 muscle protein',
    result: actn3StopDose === 2 ? 'Alpha-actinin-3 absent' : actn3StopDose === 1 ? 'One functional ACTN3 copy' : 'Alpha-actinin-3 likely present',
    summary: 'ACTN3 has a reproducible biological effect, but it cannot predict talent, body type, or the training plan that will work best.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs1815739']), sourceName: 'ACTN3 review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23681449/',
  },
  {
    id: 'caffeine-sensitivity', category: 'Performance', title: 'Caffeine sensitivity',
    result: sensitivityDose === 2 ? 'Higher sensitivity signal' : sensitivityDose === 1 ? 'Mixed response marker' : 'Lower sensitivity signal',
    summary: 'This ADORA2A marker may influence caffeine response, but sleep, dose, timing and tolerance are more useful day to day.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs5751876']), sourceName: 'ADORA2A study', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6642114/',
  },
  {
    id: 'photic-sneeze', category: 'Curiosities', title: 'Bright-light sneeze reflex',
    result: photicSneezeDose === 2 ? 'Higher-odds marker profile' : photicSneezeDose === 1 ? 'Intermediate marker profile' : 'Lower-odds marker profile',
    summary: 'A common marker changes the odds of sneezing when moving into bright light, but this is a probabilistic association rather than a diagnosis.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs10427255']), sourceName: 'Photic sneeze GWAS', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6428856/',
  },
]

const report = {
  state: 'ready',
  mode: 'local',
  build: 'GRCh38',
  generatedAt: new Date().toISOString(),
  reportLabel: 'Private trait report',
  sourceNote: ancestryUsable
    ? `Derived locally from the WGS VCF plus ${ancestryObserved.size} curated AncestryDNA markers`
    : ancestryReady
      ? 'Derived from the WGS VCF; AncestryDNA is connected but kept separate after source validation'
      : 'Derived locally from a variant-only whole-genome VCF',
  caveat: ancestryUsable
    ? `WGS remains primary. AncestryDNA build 37 calls fill only curated rsID gaps; ${crossChecked.length} markers were cross-checked and ${discordant} differed. Confirm important results against aligned reads. Traits are tendencies, not guarantees.`
    : ancestryReady
      ? `AncestryDNA was not blended: ${sourceComparison.concordancePercent}% of ${sourceComparison.overlap.toLocaleString('en-US')} overlapping calls agreed. Confirm both files belong to the same person and sample before combining them. WGS remains primary.`
      : 'Absent sites are presumed reference because this VCF stores variants only. Confirm important calls against a gVCF or read data. Traits are tendencies, not guarantees.',
  sourceValidation: sourceComparison ? { ancestry: sourceComparison } : undefined,
  eyeProbabilities: { brown, intermediate, blue },
  traits,
  quickRead: [
    `${eyeResult} is the leading eye-colour result (${Math.max(brown, intermediate, blue).toFixed(1)}%).`,
    `${hairResult}; hair colour remains polygenic.`,
    `${lactoseDose > 0 ? 'A lactase-persistence signal is present' : 'No European-associated lactase-persistence signal was observed'}.`,
    `${caffeineDose === 2 ? 'Caffeine metabolism leans faster' : caffeineDose === 1 ? 'Caffeine metabolism is intermediate' : 'Caffeine metabolism leans slower'}; fitness genetics remains exploratory.`,
  ],
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 })
console.log(`Private trait report created with ${traits.length} plain-language results.`)
