export type PgsModelDefinition = {
  id: string
  title: string
  shortTitle: string
  name: string
  variants: number
  build: 'GRCh38'
  weightType: string
  category: 'Body' | 'Sleep'
  sourceUrl: string
  downloadUrl: string
  fileName: string
  ancestryNote: string
  licenseNote?: string
}

export const pgsModels: PgsModelDefinition[] = [
  {
    id: 'PGS003895',
    title: 'Standing height',
    shortTitle: 'Height',
    name: 'INI50',
    variants: 62_419,
    build: 'GRCh38',
    weightType: 'beta',
    category: 'Body',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS003895/',
    downloadUrl: 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/PGS003895/ScoringFiles/Harmonized/PGS003895_hmPOS_GRCh38.txt.gz',
    fileName: 'PGS003895_hmPOS_GRCh38.txt.gz',
    ancestryNote: 'Multi-ancestry model; a calibrated personal estimate still needs an ancestry-matched reference distribution.',
  },
  {
    id: 'PGS002684',
    title: 'Chronotype (morning-person tendency)',
    shortTitle: 'Sleep chronotype',
    name: 'other_MORNINGPERSON.SBayesR',
    variants: 977_159,
    build: 'GRCh38',
    weightType: 'beta',
    category: 'Sleep',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS002684/',
    downloadUrl: 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/PGS002684/ScoringFiles/Harmonized/PGS002684_hmPOS_GRCh38.txt.gz',
    fileName: 'PGS002684_hmPOS_GRCh38.txt.gz',
    ancestryNote: 'The underlying GWAS was European; published evaluations include several broad ancestry groups, but calibration remains population-specific.',
  },
  {
    id: 'PGS000027',
    title: 'Body mass index (BMI) tendency',
    shortTitle: 'BMI tendency',
    name: 'GPS_BMI',
    variants: 2_100_302,
    build: 'GRCh38',
    weightType: 'reported',
    category: 'Body',
    sourceUrl: 'https://www.pgscatalog.org/score/PGS000027/',
    downloadUrl: 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/PGS000027/ScoringFiles/Harmonized/PGS000027_hmPOS_GRCh38.txt.gz',
    fileName: 'PGS000027_hmPOS_GRCh38.txt.gz',
    ancestryNote: 'Developed primarily in European-associated cohorts. BMI is not body-fat percentage and measured height and weight remain more informative.',
    licenseNote: 'PGS Catalog lists this score for academic research use; the scoring file stays local and is not redistributed.',
  },
]

export const heightPgsModel = pgsModels[0]
