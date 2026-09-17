import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import zlib from 'node:zlib'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1])
}

const vcfPath = args.get('--vcf')
const outputPath = args.get('--output')

if (!vcfPath || !outputPath) {
  console.error('Usage: node build-private-traits.mjs --vcf <file.vcf.gz> --output <trait-report.json>')
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

function call(rsid) {
  const direct = observed.get(rsid)
  if (direct) return { ...direct, observed: true }
  const ref = markers[rsid].ref
  return { genotype: [ref, ref], filter: 'PRESUMED_REF', depth: 0, quality: 0, observed: false }
}

function dosage(rsid, allele) {
  return call(rsid).genotype.filter((base) => base === allele).length
}

function callNote(rsids) {
  const direct = rsids.filter((rsid) => call(rsid).observed).length
  const inferred = rsids.length - direct
  if (!inferred) return `${direct} marker${direct === 1 ? '' : 's'} directly observed in the VCF`
  return `${direct} directly observed; ${inferred} presumed reference in the variant-only VCF`
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
    id: 'alcohol-response', category: 'Senses & food', title: 'Alcohol flush marker',
    result: aldh2ReducedDose > 0 ? 'Reduced ALDH2 activity variant present' : 'Common ALDH2 activity marker',
    summary: aldh2ReducedDose > 0
      ? 'The common reduced-activity ALDH2 variant is present and can increase flushing and acetaldehyde exposure. This is not a safe-drinking score.'
      : 'The common ALDH2 reduced-activity variant was not observed. Alcohol response and health risk still cannot be inferred from this marker alone.',
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
  sourceNote: 'Derived locally from a variant-only whole-genome VCF',
  caveat: 'Absent sites are presumed reference because this VCF stores variants only. Confirm important calls against a gVCF or read data. Traits are tendencies, not guarantees.',
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
