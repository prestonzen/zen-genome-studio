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
const ancestryRelation = (args.get('--ancestry-relation') || 'unknown').toLowerCase()

if (!vcfPath || !outputPath) {
  console.error('Usage: node build-private-traits.mjs --vcf <file.vcf.gz> --output <trait-report.json> [--ancestry <AncestryDNA.zip>] [--ancestry-relation <self|mother|father|parent>]')
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
  rs3827760: { ref: 'T', gene: 'EDAR' },
  rs4481887: { ref: 'G', gene: 'OR2M7 region' },
  rs66800491: { ref: 'A', gene: 'PVRL3 region' },
  rs885479: { ref: 'N', gene: 'MC1R' },
  rs1110400: { ref: 'N', gene: 'MC1R' },
  rs28777: { ref: 'N', gene: 'SLC45A2' },
  rs1042602: { ref: 'N', gene: 'TYR' },
  rs2378249: { ref: 'N', gene: 'PIGU' },
  rs2402130: { ref: 'N', gene: 'SLC24A4' },
  rs683: { ref: 'N', gene: 'TYRP1' },
  rs12821256: { ref: 'N', gene: 'KITLG' },
  rs3114908: { ref: 'N', gene: 'ANKRD11' },
  rs10756819: { ref: 'N', gene: 'BNC2' },
  rs17128291: { ref: 'N', gene: 'SLC24A4' },
  rs2238289: { ref: 'N', gene: 'HERC2' },
  rs1129038: { ref: 'N', gene: 'HERC2' },
  rs1667394: { ref: 'N', gene: 'HERC2' },
  rs1126809: { ref: 'N', gene: 'TYR' },
  rs1470608: { ref: 'N', gene: 'OCA2' },
  rs12441727: { ref: 'N', gene: 'OCA2' },
  rs1545397: { ref: 'N', gene: 'OCA2' },
  rs1426654: { ref: 'N', gene: 'SLC24A5' },
  rs6119471: { ref: 'N', gene: 'ASIP' },
  rs6059655: { ref: 'N', gene: 'RALY' },
  rs3212355: { ref: 'N', gene: 'MC1R' },
  rs8051733: { ref: 'N', gene: 'DEF8' },
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
  let ibs0 = 0
  let ibs1 = 0
  let ibs2 = 0
  const complement = { A: 'T', T: 'A', C: 'G', G: 'C' }
  const vcfInput = fs.createReadStream(vcfPath)
  const vcfSource = vcfPath.endsWith('.gz') ? vcfInput.pipe(zlib.createGunzip()) : vcfInput
  const vcfLines = readline.createInterface({ input: vcfSource, crlfDelay: Infinity })

  for await (const line of vcfLines) {
    if (!line || line.startsWith('#')) continue
    const fields = line.split('\t')
    if (fields.length < 10 || (fields[6] !== 'PASS' && fields[6] !== '.')) continue
    const chromosome = fields[0].replace(/^chr/i, '')
    if (!/^([1-9]|1\d|2[0-2])$/.test(chromosome)) continue
    if (fields[3].length !== 1 || fields[4].length !== 1 || fields[4].includes(',')) continue
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
    const remaining = [...ancestryGenotype]
    let sharedAlleles = 0
    for (const allele of genotype) {
      const matchIndex = remaining.indexOf(allele)
      if (matchIndex >= 0) {
        sharedAlleles++
        remaining.splice(matchIndex, 1)
      }
    }
    overlap++
    if (directMatch || complementedMatch) matching++
    if (sharedAlleles === 0) ibs0++
    else if (sharedAlleles === 1) ibs1++
    else ibs2++
  }

  const concordancePercent = overlap ? Math.round((matching / overlap) * 10_000) / 100 : 0
  const ibs0Percent = overlap ? Math.round((ibs0 / overlap) * 100_000) / 1_000 : 0
  const ibs1Percent = overlap ? Math.round((ibs1 / overlap) * 10_000) / 100 : 0
  const ibs2Percent = overlap ? Math.round((ibs2 / overlap) * 10_000) / 100 : 0
  const declaredParent = ['mother', 'father', 'parent', 'child'].includes(ancestryRelation)
  const samePerson = overlap >= 1_000 && concordancePercent >= 95
  const parentChildPattern = overlap >= 1_000 && ibs0Percent <= 0.5 && ibs1Percent >= 30 && ibs1Percent <= 65
  return {
    status: samePerson ? 'compatible' : declaredParent && parentChildPattern ? 'family-compatible' : 'review',
    relationship: ancestryRelation,
    overlap,
    matching,
    concordancePercent,
    ibs0,
    ibs1,
    ibs2,
    ibs0Percent,
    ibs1Percent,
    ibs2Percent,
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

function markerObserved(rsid) {
  return observed.has(rsid) || (ancestryUsable && ancestryObserved.has(rsid))
}

function observedCount(rsids) {
  return rsids.filter(markerObserved).length
}

function resultState(rsids) {
  const direct = observedCount(rsids)
  if (direct === 0) return 'unresolved'
  return direct === rsids.length ? 'observed' : 'partial'
}

function singleMarkerResult(rsid, resolvedResult) {
  return markerObserved(rsid) ? resolvedResult() : 'Not determined from this VCF'
}

function traitMetadata(rsids, genes, chromosomes, definition, limitation) {
  const direct = observedCount(rsids)
  return {
    resultState: resultState(rsids),
    observedMarkers: direct,
    missingMarkers: rsids.length - direct,
    markerIds: rsids,
    genes,
    chromosomes,
    definition,
    limitation,
  }
}

function callNote(rsids) {
  const direct = rsids.filter((rsid) => observed.has(rsid) || (ancestryUsable && ancestryObserved.has(rsid))).length
  const unresolved = rsids.length - direct
  if (!ancestryUsable) {
    if (!unresolved) return `${direct} marker${direct === 1 ? '' : 's'} directly observed in the VCF`
    return `${direct} directly observed; ${unresolved} unresolved because this VCF lists variant sites only`
  }

  const vcfCount = rsids.filter((rsid) => observed.has(rsid)).length
  const ancestryOnly = rsids.filter((rsid) => !observed.has(rsid) && ancestryObserved.has(rsid)).length
  const inBoth = rsids.filter((rsid) => observed.has(rsid) && ancestryObserved.has(rsid)).length
  const detail = [
    vcfCount ? `${vcfCount} in WGS` : '',
    ancestryOnly ? `${ancestryOnly} added by AncestryDNA` : '',
    inBoth ? `${inBoth} checked in both` : '',
  ].filter(Boolean).join(', ')
  const prefix = unresolved
    ? `${direct} directly observed across your files`
    : `${direct} marker${direct === 1 ? '' : 's'} directly observed across your files`
  return `${prefix}${detail ? ` (${detail})` : ''}${unresolved ? `; ${unresolved} unresolved without callable-reference data` : ''}`
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
const edarDose = dosage('rs3827760', 'C')
const asparagusDetectionDose = dosage('rs4481887', 'A')
const motionLowerDose = dosage('rs66800491', 'G')

const skinPanelIds = [
  'rs1805007', 'rs1805008', 'rs11547464', 'rs885479', 'rs1805006', 'rs1110400',
  'rs12203592', 'rs1800407', 'rs16891982', 'rs28777', 'rs12913832', 'rs1042602',
  'rs1393350', 'rs2378249', 'rs12896399', 'rs2402130', 'rs683', 'rs12821256',
  'rs3114908', 'rs10756819', 'rs17128291', 'rs2238289', 'rs1129038', 'rs1667394',
  'rs1126809', 'rs1470608', 'rs12441727', 'rs1545397', 'rs1426654', 'rs6119471',
  'rs6059655', 'rs3212355', 'rs8051733',
]
const skinObserved = observedCount(skinPanelIds)

const eyeDirect = observedCount(eyeIds)
const hairDirect = observedCount(mc1rIds)
const frecklingIds = [...mc1rIds, 'rs12203592']
const eyeDisplayResult = eyeDirect === eyeIds.length ? eyeResult : eyeDirect ? `${eyeResult} (provisional)` : 'Not determined from this VCF'
const hairDisplayResult = hairDirect ? hairResult : 'Not determined from this VCF'

const traits = [
  {
    id: 'eye-colour', category: 'Appearance', title: 'Eye colour', result: eyeDisplayResult,
    summary: eyeDirect === eyeIds.length
      ? `The complete six-marker IrisPlex model places the strongest probability in the ${eyeResult.toLowerCase()}.`
      : `${eyeDirect} of 6 IrisPlex markers are explicit in this variant-only VCF. The current direction is provisional; a complete callable genotype set is needed before treating its probabilities as calibrated.`,
    evidence: 'Strong', markerCount: 6, callNote: callNote(eyeIds), sourceName: 'IrisPlex model', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
    ...traitMetadata(eyeIds, ['HERC2', 'OCA2', 'SLC24A4', 'SLC45A2', 'TYR', 'IRF4'], ['5', '6', '11', '14', '15'], 'IrisPlex combines six pigmentation markers to estimate blue, intermediate, and brown eye-colour probabilities.', 'The model needs all six genotypes. Intermediate colours are less accurately classified, and this variant-only VCF does not prove that unlisted sites are reference.'),
  },
  {
    id: 'hair-pigmentation', category: 'Appearance', title: 'Hair pigmentation', result: hairDisplayResult,
    summary: hairDirect ? hairSummary : 'None of the six compact MC1R markers were explicitly reported, so this VCF cannot support a personal hair-pigmentation result.',
    evidence: 'Moderate', markerCount: 6, callNote: callNote(mc1rIds), sourceName: 'HIrisPlex-S', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
    ...traitMetadata(mc1rIds, ['MC1R'], ['16'], 'MC1R changes the balance of darker eumelanin and red-yellow pheomelanin.', 'Hair colour is polygenic. This compact MC1R subset is not the complete 22-marker HIrisPlex hair model.'),
  },
  {
    id: 'freckling', category: 'Appearance', title: 'Freckling & sun response',
    result: observedCount(frecklingIds) ? (highImpactMc1r + dosage('rs12203592', 'T') > 0 ? 'Some freckling signal' : 'No risk allele in the observed subset') : 'Not determined from this VCF',
    summary: 'MC1R and IRF4 markers contribute to freckling and sun response, but exposure and many additional variants matter substantially.',
    evidence: 'Moderate', markerCount: 7, callNote: callNote(frecklingIds), sourceName: 'HIrisPlex-S', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
    ...traitMetadata(frecklingIds, ['MC1R', 'IRF4'], ['6', '16'], 'Freckling reflects pigmentation biology plus ultraviolet exposure.', 'A partial marker panel cannot rule out freckling tendency or predict sun damage.'),
  },
  {
    id: 'skin-pigmentation', category: 'Appearance', title: 'Skin pigmentation model readiness',
    result: `${skinObserved} of ${skinPanelIds.length} tracked model markers observed`,
    summary: 'This audits a 33-marker rsID subset of the published 36-SNP HIrisPlex-S skin model. It does not guess a skin-shade category without the complete validated model and callable genotypes.',
    evidence: 'Moderate', markerCount: skinPanelIds.length, callNote: callNote(skinPanelIds), sourceName: 'HIrisPlex-S validation', sourceUrl: 'https://doi.org/10.1016/j.fsigen.2018.04.004',
    ...traitMetadata(skinPanelIds, ['MC1R', 'IRF4', 'OCA2', 'HERC2', 'SLC45A2', 'SLC24A4', 'SLC24A5', 'TYR', 'TYRP1', 'KITLG', 'BNC2', 'ASIP'], ['5', '6', '9', '11', '12', '14', '15', '16', '20'], 'HIrisPlex-S uses 36 markers to estimate probabilities across five broad skin-pigmentation categories.', 'Skin pigmentation is not ethnicity. A category will remain withheld until all required genotypes and the official model are run locally.'),
    resultState: skinObserved === skinPanelIds.length ? 'partial' : skinObserved ? 'partial' : 'unresolved',
  },
  {
    id: 'hair-thickness', category: 'Appearance', title: 'Hair-fibre thickness (EDAR)',
    result: singleMarkerResult('rs3827760', () => edarDose === 2 ? 'Two copies of the thicker-hair-associated marker' : edarDose === 1 ? 'One copy of the thicker-hair-associated marker' : 'Ancestral EDAR marker observed'),
    summary: 'The EDAR p.Val370Ala variant has a biological effect on hair-follicle development and is associated with straighter, thicker fibres, especially in East Asian and Native American populations.',
    evidence: 'Moderate', markerCount: 1, callNote: callNote(['rs3827760']), sourceName: 'EDAR functional study', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/18561327/',
    ...traitMetadata(['rs3827760'], ['EDAR'], ['2'], 'EDAR helps shape hair follicles, teeth, and sweat glands during development.', 'One marker cannot predict an exact hair texture, hairstyle, or strand diameter.'),
  },
  {
    id: 'lactose', category: 'Senses & food', title: 'Lactose digestion',
    result: singleMarkerResult('rs4988235', () => lactoseDose > 0 ? 'European-associated lactase-persistence signal' : 'European marker does not show persistence'),
    summary: !markerObserved('rs4988235')
      ? 'The key European-associated marker was not explicitly reported, so no personal lactose-digestion result is shown.'
      : lactoseDose > 0
      ? 'A common lactase-persistence allele is present. This marker is most informative in people with European-associated ancestry.'
      : 'This European-associated marker does not show lactase persistence; other populations can carry different persistence variants.',
    evidence: 'Strong', markerCount: 1, callNote: callNote(['rs4988235']), sourceName: 'Lactase persistence review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29063188/',
    ...traitMetadata(['rs4988235'], ['MCM6', 'LCT'], ['2'], 'Lactase persistence means continuing to produce the lactose-digesting enzyme after childhood.', 'This one marker is most informative for European-associated persistence. Symptoms also depend on dose, gut microbiome, and other ancestry-specific variants.'),
  },
  {
    id: 'caffeine-metabolism', category: 'Senses & food', title: 'Caffeine metabolism',
    result: singleMarkerResult('rs762551', () => caffeineDose === 2 ? 'Faster metabolism signal' : caffeineDose === 1 ? 'Intermediate metabolism signal' : 'Slower metabolism signal'),
    summary: 'CYP1A2 contributes to caffeine clearance, but smoking, medication, hormones, liver function and habits can change the real response.',
    evidence: 'Moderate', markerCount: 1, callNote: callNote(['rs762551']), sourceName: 'Caffeine genetics review', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4242593/',
    ...traitMetadata(['rs762551'], ['CYP1A2'], ['15'], 'CYP1A2 is a liver enzyme that clears much of the caffeine in the body.', 'A single marker is not a measured caffeine half-life and does not account for medication, smoking, hormones, dose, or liver function.'),
  },
  {
    id: 'bitter-taste', category: 'Senses & food', title: 'Bitter taste',
    result: observedCount(['rs713598', 'rs1726866', 'rs10246939']) ? (bitterScore >= 5 ? 'Higher bitter sensitivity signal' : bitterScore <= 1 ? 'Lower signal in the observed subset' : 'Mixed sensitivity signal') : 'Not determined from this VCF',
    summary: 'Three TAS2R38 markers influence sensitivity to PTC-like bitter compounds. Food preferences are more complicated than this panel.',
    evidence: 'Moderate', markerCount: 3, callNote: callNote(['rs713598', 'rs1726866', 'rs10246939']), sourceName: 'TAS2R38 review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/40498099/',
    ...traitMetadata(['rs713598', 'rs1726866', 'rs10246939'], ['TAS2R38'], ['7'], 'TAS2R38 detects a family of bitter compounds used in common taste tests.', 'The classic tasting haplotypes require all three markers; preferences and many real foods involve other receptors and learned experience.'),
  },
  {
    id: 'earwax', category: 'Senses & food', title: 'Earwax type',
    result: singleMarkerResult('rs17822931', () => earwaxDryDose === 2 ? 'Dry type likely' : 'Wet type likely'),
    summary: 'ABCC11 is one of the unusual everyday traits where a single marker has a large effect.',
    evidence: 'Strong', markerCount: 1, callNote: callNote(['rs17822931']), sourceName: 'ABCC11 study', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16444273/',
    ...traitMetadata(['rs17822931'], ['ABCC11'], ['16'], 'ABCC11 strongly influences wet versus dry earwax and also contributes to underarm odour chemistry.', 'The result is shown only when this marker is explicitly called.'),
  },
  {
    id: 'cilantro', category: 'Senses & food', title: 'Cilantro perception',
    result: singleMarkerResult('rs72921001', () => cilantroLowerSoapDose === 2 ? 'Lower soapy-taste tendency' : cilantroLowerSoapDose === 1 ? 'Slightly lower soapy-taste tendency' : 'Typical marker profile'),
    summary: 'This olfactory-region marker shifts the odds only slightly. Culture, exposure and other variants matter more than this result.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs72921001']), sourceName: 'Cilantro perception GWAS', sourceUrl: 'https://doi.org/10.1186/2044-7248-1-22',
    ...traitMetadata(['rs72921001'], ['OR6A2 region'], ['11'], 'A smell-receptor region slightly shifts whether cilantro is described as soapy.', 'This is a small odds shift, not a taste test. Culture and repeated exposure often matter more.'),
  },
  {
    id: 'alcohol-response', category: 'Senses & food', title: 'Alcohol breakdown (ALDH2)',
    result: singleMarkerResult('rs671', () => aldh2ReducedDose > 0 ? 'Reduced-activity marker linked to flushing' : 'Common-activity marker observed'),
    summary: !markerObserved('rs671')
      ? 'The ALDH2 rs671 site is absent from this variant-only VCF, which is not enough to call it normal. A gVCF or read-level genotype is needed.'
      : aldh2ReducedDose > 0
      ? 'This reduced-activity variant can let acetaldehyde build up, making the face or skin feel hot and turn red after alcohol. It does not establish a safe amount to drink.'
      : 'The common-activity genotype was explicitly observed at this marker. That does not make alcohol risk-free or predict the full response.',
    evidence: 'Strong', markerCount: 1, callNote: callNote(['rs671']), sourceName: 'ALDH2 review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39075523/',
    ...traitMetadata(['rs671'], ['ALDH2'], ['12'], 'ALDH2 clears acetaldehyde, a toxic intermediate produced while the body processes alcohol.', 'This marker is not a safe-drinking score. Alcohol risk also involves dose, ADH genes, medications, health, and behaviour.'),
  },
  {
    id: 'asparagus-odour', category: 'Senses & food', title: 'Asparagus odour perception',
    result: singleMarkerResult('rs4481887', () => asparagusDetectionDose > 0 ? 'Greater odour-detection tendency' : 'Lower odour-detection tendency'),
    summary: 'A marker near a cluster of olfactory-receptor genes is associated with whether people can smell asparagus metabolites in urine.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs4481887']), sourceName: 'Asparagus odour GWAS', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3002398/',
    ...traitMetadata(['rs4481887'], ['OR2M7 region'], ['1'], 'This association concerns smelling the sulphurous metabolites after eating asparagus, not whether a person produces them.', 'The marker was studied mainly in European-associated cohorts and does not determine lived perception.'),
  },
  {
    id: 'actn3', category: 'Performance', title: 'ACTN3 muscle protein',
    result: singleMarkerResult('rs1815739', () => actn3StopDose === 2 ? 'Alpha-actinin-3 absent' : actn3StopDose === 1 ? 'One functional ACTN3 copy' : 'Two functional ACTN3 copies'),
    summary: 'ACTN3 has a reproducible biological effect, but it cannot predict talent, body type, or the training plan that will work best.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs1815739']), sourceName: 'ACTN3 review', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23681449/',
    ...traitMetadata(['rs1815739'], ['ACTN3'], ['11'], 'ACTN3 makes alpha-actinin-3 in fast-twitch muscle fibres.', 'Protein status is not an athletic-talent score. Training, body size, skill, recovery, and many other genes dominate performance.'),
  },
  {
    id: 'caffeine-sensitivity', category: 'Performance', title: 'Caffeine sensitivity',
    result: singleMarkerResult('rs5751876', () => sensitivityDose === 2 ? 'Higher sensitivity signal' : sensitivityDose === 1 ? 'Mixed response marker' : 'Lower sensitivity signal'),
    summary: 'This ADORA2A marker may influence caffeine response, but sleep, dose, timing and tolerance are more useful day to day.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs5751876']), sourceName: 'ADORA2A study', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6642114/',
    ...traitMetadata(['rs5751876'], ['ADORA2A'], ['22'], 'ADORA2A helps mediate adenosine signalling, one pathway through which caffeine affects alertness and anxiety.', 'This weak association cannot replace observing how dose and timing affect sleep or anxiety.'),
  },
  {
    id: 'motion-sickness', category: 'Performance', title: 'Motion-sickness tendency',
    result: singleMarkerResult('rs66800491', () => motionLowerDose === 2 ? 'Lower-susceptibility marker signal' : motionLowerDose === 1 ? 'Intermediate marker signal' : 'Higher-susceptibility marker signal'),
    summary: 'This is the lead marker from a 35-locus motion-sickness GWAS. A complete score explained only a small portion of variation in the discovery cohort.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs66800491']), sourceName: 'Motion-sickness GWAS', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4383869/',
    ...traitMetadata(['rs66800491'], ['PVRL3 region'], ['3'], 'Motion sickness reflects conflict between visual, vestibular, and other sensory signals.', 'One lead marker is not the published 35-locus score, and age, sex, migraine history, vehicle, and habituation matter.'),
  },
  {
    id: 'photic-sneeze', category: 'Curiosities', title: 'Bright-light sneeze reflex',
    result: singleMarkerResult('rs10427255', () => photicSneezeDose === 2 ? 'Higher-odds marker profile' : photicSneezeDose === 1 ? 'Intermediate marker profile' : 'Lower-odds marker profile'),
    summary: 'A common marker changes the odds of sneezing when moving into bright light, but this is a probabilistic association rather than a diagnosis.',
    evidence: 'Exploratory', markerCount: 1, callNote: callNote(['rs10427255']), sourceName: 'Photic sneeze GWAS', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6428856/',
    ...traitMetadata(['rs10427255'], ['ZEB2 region'], ['2'], 'The photic sneeze reflex is sneezing after moving into bright light.', 'This marker only shifts the odds and cannot establish whether the reflex is present.'),
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
    : sourceComparison?.status === 'family-compatible'
      ? 'WGS trait report with a separate AncestryDNA family comparison'
    : ancestryReady
      ? 'Derived from the WGS VCF; AncestryDNA is connected but kept separate after source validation'
      : 'Derived locally from a variant-only whole-genome VCF',
  caveat: ancestryUsable
    ? `WGS remains primary. AncestryDNA build 37 calls fill only curated rsID gaps; ${crossChecked.length} markers were cross-checked and ${discordant} differed. Confirm important results against aligned reads. Traits are tendencies, not guarantees.`
    : sourceComparison?.status === 'family-compatible'
      ? `The separate AncestryDNA file shows a parent-child sharing pattern: ${(100 - sourceComparison.ibs0Percent).toFixed(3)}% of ${sourceComparison.overlap.toLocaleString('en-US')} overlapping autosomal calls share at least one allele. A parent's genotype cannot fill the child's missing calls, so it does not change the trait report.`
    : ancestryReady
      ? `AncestryDNA was not blended: ${sourceComparison.concordancePercent}% of ${sourceComparison.overlap.toLocaleString('en-US')} overlapping calls agreed. Confirm both files belong to the same person and sample before combining them. WGS remains primary.`
      : 'Unlisted sites in this variant-only VCF are treated as unresolved, not normal-reference calls. Confirm missing markers against a gVCF or aligned reads. Traits are tendencies, not guarantees.',
  sourceValidation: sourceComparison ? { ancestry: sourceComparison } : undefined,
  eyeProbabilities: eyeDirect === eyeIds.length ? { brown, intermediate, blue } : undefined,
  traits,
  quickRead: [
    eyeDirect === eyeIds.length ? `${eyeResult} is the complete six-marker eye-colour result.` : `Eye colour is provisional because ${eyeDirect} of 6 model markers are explicit.`,
    hairDirect ? `${hairResult}; hair colour remains polygenic.` : 'Hair pigmentation needs explicit calls at the compact MC1R panel.',
    markerObserved('rs4988235') ? `${lactoseDose > 0 ? 'A European-associated lactase-persistence signal is present' : 'The European marker does not show lactase persistence'}.` : 'Lactose digestion is unresolved in this variant-only VCF.',
    markerObserved('rs762551') ? `${caffeineDose === 2 ? 'Caffeine metabolism leans faster' : caffeineDose === 1 ? 'Caffeine metabolism is intermediate' : 'Caffeine metabolism leans slower'}; real response still depends on dose and context.` : 'Caffeine metabolism is unresolved in this variant-only VCF.',
  ],
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 })
console.log(`Private trait report created with ${traits.length} plain-language results.`)
