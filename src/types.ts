export type DeploymentMode = 'local' | 'cloud'

export type LocalStatus = {
  mode: DeploymentMode
  source: {
    present: boolean
    bytes?: number
  }
  opencravat: boolean
  openCravatUrl: string
}

export type ViewName = 'Overview' | 'Discover' | 'Summary' | 'Record'
export type LandscapeTab = 'Chromosomes' | 'Clinical' | 'Traits'

export type TraitCategory = 'Appearance' | 'Senses & food' | 'Performance'
export type EvidenceLevel = 'Strong' | 'Moderate' | 'Exploratory'

export type TraitResult = {
  id: string
  category: TraitCategory
  title: string
  result: string
  summary: string
  evidence: EvidenceLevel
  markerCount: number
  callNote: string
  sourceName: string
  sourceUrl: string
}

export type TraitReport = {
  state: 'ready' | 'demo' | 'missing'
  mode: DeploymentMode
  build: 'GRCh38'
  generatedAt?: string
  reportLabel: string
  sourceNote: string
  caveat: string
  eyeProbabilities?: {
    brown: number
    intermediate: number
    blue: number
  }
  traits: TraitResult[]
  quickRead: string[]
}
