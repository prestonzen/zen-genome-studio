import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import zlib from 'node:zlib'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1])

const vcfPath = args.get('--vcf')
const scorePath = args.get('--score')
const outputPath = args.get('--output')

if (!vcfPath || !scorePath || !outputPath) {
  console.error('Usage: node build-private-pgs.mjs --vcf <file.vcf.gz> --score <PGS.txt.gz> --output <result.json>')
  process.exit(1)
}

function inputLines(filePath) {
  const input = fs.createReadStream(filePath)
  const source = filePath.endsWith('.gz') ? input.pipe(zlib.createGunzip()) : input
  return readline.createInterface({ input: source, crlfDelay: Infinity })
}

const recordsByPosition = new Map()
const modelRecords = []
let columns = null
let totalModelRows = 0
let totalModelWeight = 0

for await (const line of inputLines(scorePath)) {
  if (!line || line.startsWith('##')) continue
  if (line.startsWith('#')) continue
  if (!columns) {
    columns = line.split('\t')
    continue
  }

  const fields = line.split('\t')
  const row = Object.fromEntries(columns.map((name, index) => [name, fields[index] || '']))
  totalModelRows++
  const chromosome = (row.hm_chr || row.chr_name).replace(/^chr/i, '')
  const position = Number(row.hm_pos || row.chr_position)
  const effectAllele = row.effect_allele.toUpperCase()
  const otherAllele = row.other_allele.toUpperCase()
  const weight = Number(row.effect_weight)
  if (Number.isFinite(weight)) totalModelWeight += Math.abs(weight)
  if (!/^([1-9]|1\d|2[0-2])$/.test(chromosome) || !Number.isInteger(position) || !/^[ACGT]$/.test(effectAllele) || !/^[ACGT]$/.test(otherAllele) || !Number.isFinite(weight)) continue

  const record = { id: `${row.rsID || `${chromosome}:${position}`}:${effectAllele}:${otherAllele}`, rsid: row.rsID, chromosome, position, effectAllele, otherAllele, weight }
  modelRecords.push(record)
  const key = `${chromosome}:${position}`
  const atPosition = recordsByPosition.get(key) || []
  atPosition.push(record)
  recordsByPosition.set(key, atPosition)
}

const complement = { A: 'T', T: 'A', C: 'G', G: 'C' }
const scored = new Set()
let weightedScore = 0
let effectAlleles = 0
let observedWeight = 0
let passCalls = 0
let filteredCalls = 0
let incompatibleCalls = 0

for await (const line of inputLines(vcfPath)) {
  if (!line || line.startsWith('#')) continue
  const fields = line.split('\t')
  if (fields.length < 10) continue
  const chromosome = fields[0].replace(/^chr/i, '')
  const key = `${chromosome}:${fields[1]}`
  const candidates = recordsByPosition.get(key)
  if (!candidates) continue

  if (fields[6] !== 'PASS' && fields[6] !== '.') {
    filteredCalls += candidates.length
    continue
  }

  const format = fields[8].split(':')
  const sample = fields[9].split(':')
  const genotypeValue = sample[format.indexOf('GT')]
  if (!genotypeValue || genotypeValue.includes('.')) continue
  const siteAlleles = [fields[3], ...fields[4].split(',')].map((allele) => allele.toUpperCase())
  const genotype = genotypeValue.split(/[|/]/).map((value) => siteAlleles[Number(value)]).filter(Boolean)
  if (genotype.length !== 2) continue

  passCalls++
  for (const record of candidates) {
    if (scored.has(record.id)) continue
    let effectAllele = record.effectAllele
    let otherAllele = record.otherAllele
    const direct = siteAlleles.includes(effectAllele) && siteAlleles.includes(otherAllele)
    const flippedEffect = complement[effectAllele]
    const flippedOther = complement[otherAllele]
    const flipped = siteAlleles.includes(flippedEffect) && siteAlleles.includes(flippedOther)
    if (!direct && !flipped) {
      incompatibleCalls++
      continue
    }
    if (flipped && !direct) {
      effectAllele = flippedEffect
      otherAllele = flippedOther
    }
    if (genotype.some((allele) => allele !== effectAllele && allele !== otherAllele)) {
      incompatibleCalls++
      continue
    }

    const dosage = genotype.filter((allele) => allele === effectAllele).length
    weightedScore += dosage * record.weight
    effectAlleles += dosage
    observedWeight += Math.abs(record.weight)
    scored.add(record.id)
  }
}

const modelVariants = totalModelRows
const positionedVariants = modelRecords.length
const matchedVariants = scored.size
const coveragePercent = modelVariants ? Math.round((matchedVariants / modelVariants) * 10_000) / 100 : 0
const weightCoveragePercent = totalModelWeight ? Math.round((observedWeight / totalModelWeight) * 10_000) / 100 : 0
const roundedScore = Math.round(weightedScore * 1_000_000) / 1_000_000

const result = {
  state: 'ready',
  mode: 'local',
  modelId: 'PGS003895',
  trait: 'Standing height',
  generatedAt: new Date().toISOString(),
  modelVariants,
  positionedVariants,
  matchedVariants,
  coveragePercent,
  weightCoveragePercent,
  weightedScore: roundedScore,
  effectAlleles,
  passCalls,
  filteredCalls,
  incompatibleCalls,
  interpretation: `The value ${roundedScore.toFixed(4)} is the exact weighted contribution from ${matchedVariants.toLocaleString()} score variants explicitly present in the VCF. It is a measured partial score, not a height estimate.`,
  nextStep: `The current file reports variant sites, not every confidently normal-reference site. ${coveragePercent}% of this model was directly measurable, so a percentile or centimetre estimate would be false precision until a callable genotype dataset and an ancestry-matched reference distribution are added.`,
  sourceNote: 'Calculated locally from the private GRCh38 VCF and PGS003895. No genotype data was uploaded.',
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
const temporaryPath = `${outputPath}.tmp`
fs.writeFileSync(temporaryPath, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 })
fs.renameSync(temporaryPath, outputPath)
console.log(JSON.stringify({ modelId: result.modelId, matchedVariants, modelVariants, coveragePercent, weightedScore: roundedScore }))
