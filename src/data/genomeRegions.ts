export type GenomeRegion = {
  id: string
  chromosome: string
  symbol: string
  positionMb: number
  title: string
  category: string
  summary: string
  interpretation: string
  traitId?: string
  sourceUrl: string
}

export const genomeRegions: GenomeRegion[] = [
  {
    id: 'tchh', chromosome: '1', symbol: 'TCHH', positionMb: 152.1, title: 'Hair form', category: 'Appearance',
    summary: 'TCHH helps organize proteins in the hair follicle and has reproducible associations with hair curvature.',
    interpretation: 'A real association exists, but one marker explains only a small fraction of hair-shape variation and behaves differently across populations.',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2775823/',
  },
  {
    id: 'lct', chromosome: '2', symbol: 'MCM6 / LCT', positionMb: 136.6, title: 'Lactose digestion', category: 'Food',
    summary: 'A regulatory region near LCT helps control whether lactase production persists into adulthood.',
    interpretation: 'The current report uses one strong European-associated marker. Other populations can carry different persistence variants.',
    traitId: 'lactose', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/29063188/',
  },
  {
    id: 'zeb2', chromosome: '2', symbol: '2q22.3', positionMb: 145.4, title: 'Bright-light sneeze', category: 'Curiosity',
    summary: 'A common variant in this region changes the odds of the photic sneeze reflex.',
    interpretation: 'This is an odds shift, not a deterministic result. Your observed response to bright light is more informative.',
    traitId: 'photic-sneeze', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6428856/',
  },
  {
    id: 'irf4', chromosome: '6', symbol: 'IRF4', positionMb: 0.4, title: 'Pigmentation and freckling', category: 'Appearance',
    summary: 'IRF4 participates in pigmentation biology and contributes to freckling and hair or eye colour models.',
    interpretation: 'It is one contributor among many. Sun exposure remains a major influence on visible freckling.',
    traitId: 'freckling', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
  },
  {
    id: 'hla', chromosome: '6', symbol: 'HLA region', positionMb: 31.0, title: 'Immune recognition', category: 'Deep analysis',
    summary: 'The HLA region contains highly variable immune genes involved in recognizing foreign material.',
    interpretation: 'Ordinary small-variant calls are not enough for reliable HLA typing. A specialized read-level caller is required.',
    sourceUrl: 'https://www.ebi.ac.uk/ipd/imgt/hla/',
  },
  {
    id: 'tas2r38', chromosome: '7', symbol: 'TAS2R38', positionMb: 141.9, title: 'Bitter taste', category: 'Senses',
    summary: 'TAS2R38 changes sensitivity to PTC-like bitter compounds found in some foods.',
    interpretation: 'The three-marker haplotype is informative, while food preferences still reflect learning, culture, and many other receptors.',
    traitId: 'bitter-taste', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/40498099/',
  },
  {
    id: 'or6a2', chromosome: '11', symbol: 'OR6A2 region', positionMb: 6.9, title: 'Cilantro perception', category: 'Senses',
    summary: 'This olfactory-receptor region is associated with detecting a soapy note in cilantro.',
    interpretation: 'The effect is small. Exposure and learned preference matter more than this single association.',
    traitId: 'cilantro', sourceUrl: 'https://doi.org/10.1186/2044-7248-1-22',
  },
  {
    id: 'actn3', chromosome: '11', symbol: 'ACTN3', positionMb: 66.5, title: 'Fast-twitch muscle protein', category: 'Performance',
    summary: 'ACTN3 encodes alpha-actinin-3, a protein expressed in fast-twitch muscle fibres.',
    interpretation: 'The protein-status result is biological, but it cannot predict athletic talent, body type, or the right training program.',
    traitId: 'actn3', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23681449/',
  },
  {
    id: 'aldh2', chromosome: '12', symbol: 'ALDH2', positionMb: 111.8, title: 'Alcohol metabolism', category: 'Food',
    summary: 'ALDH2 clears acetaldehyde, a toxic intermediate produced during alcohol metabolism.',
    interpretation: 'The common reduced-activity variant can contribute to flushing. This marker never establishes a safe amount of alcohol.',
    traitId: 'alcohol-response', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/39075523/',
  },
  {
    id: 'herc2', chromosome: '15', symbol: 'HERC2 / OCA2', positionMb: 28.3, title: 'Eye pigmentation', category: 'Appearance',
    summary: 'This region carries the strongest common signal in the six-marker IrisPlex eye-colour model.',
    interpretation: 'The complete model combines six markers and reports probabilities, especially for blue and brown categories.',
    traitId: 'eye-colour', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
  },
  {
    id: 'cyp1a2', chromosome: '15', symbol: 'CYP1A2', positionMb: 75.0, title: 'Caffeine clearance', category: 'Food',
    summary: 'CYP1A2 contributes to how quickly the liver clears caffeine.',
    interpretation: 'Medication, smoking, hormones, liver function, dose, and tolerance can outweigh this single marker.',
    traitId: 'caffeine-metabolism', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4242593/',
  },
  {
    id: 'abcc11', chromosome: '16', symbol: 'ABCC11', positionMb: 48.2, title: 'Earwax type', category: 'Everyday biology',
    summary: 'ABCC11 is an unusual consumer trait where one common marker has a large visible effect.',
    interpretation: 'It is more directly interpretable than most appearance or performance traits.',
    traitId: 'earwax', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16444273/',
  },
  {
    id: 'mc1r', chromosome: '16', symbol: 'MC1R', positionMb: 89.9, title: 'Hair pigmentation', category: 'Appearance',
    summary: 'MC1R influences the balance between darker eumelanin and lighter red-yellow pheomelanin.',
    interpretation: 'Multiple MC1R variants and many genes outside MC1R contribute to the final hair colour.',
    traitId: 'hair-pigmentation', sourceUrl: 'https://hirisplex.erasmusmc.nl/',
  },
  {
    id: 'adora2a', chromosome: '22', symbol: 'ADORA2A', positionMb: 24.4, title: 'Caffeine response', category: 'Performance',
    summary: 'ADORA2A is involved in adenosine signalling and has been studied in caffeine sensitivity.',
    interpretation: 'The current marker is exploratory. Sleep, timing, dose, and tolerance are better day-to-day guides.',
    traitId: 'caffeine-sensitivity', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6642114/',
  },
]

export const polygenicModels = [
  {
    id: 'height-pgs', title: 'Height', status: 'Model available', scale: 'Thousands of variants', readiness: 55,
    summary: 'A multi-ancestry height score exists, but a personal estimate still needs score retrieval, harmonization, ancestry normalization, and calibration.',
    next: 'Connect a PGS Catalog scoring file and calculate it against a normalized genotype dataset.',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS005005/',
  },
  {
    id: 'skin-model', title: 'Skin pigmentation', status: 'Forensic model', scale: '36 markers', readiness: 68,
    summary: 'HIrisPlex-S provides a validated categorical model. It is not a measure of identity, ethnicity, or attractiveness.',
    next: 'Implement the complete coefficients and validate every required marker before showing a category.',
    sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S1872497318302205',
  },
  {
    id: 'chronotype-pgs', title: 'Sleep chronotype', status: 'Research score', scale: 'Highly polygenic', readiness: 30,
    summary: 'Genetics contributes to morning-versus-evening preference, but schedule, light exposure, age, and sleep debt remain important.',
    next: 'Choose a validated score with matching ancestry evaluation and a meaningful comparison population.',
    sourceUrl: 'https://www.pgscatalog.org/trait/EFO_0004354/',
  },
  {
    id: 'body-pgs', title: 'Body composition', status: 'Research only', scale: 'Highly polygenic', readiness: 20,
    summary: 'Scores for BMI or fat distribution are population-level tendencies and do not prescribe nutrition or training.',
    next: 'Keep any future result separate from health advice and include environment and observed measurements.',
    sourceUrl: 'https://www.pgscatalog.org/',
  },
]
