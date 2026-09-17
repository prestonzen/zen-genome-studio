export type DeploymentMode = 'local' | 'cloud'

export type LocalStatus = {
  mode: DeploymentMode
  source: {
    present: boolean
    bytes?: number
  }
  reads: {
    present: boolean
    bytes?: number
  }
  ancestry: {
    present: boolean
    bytes?: number
  }
  opencravat: boolean
  openCravatUrl: string
}

export type ViewName = 'Overview' | 'Discover' | 'Summary' | 'Record'
export type LandscapeTab = 'Genome map' | 'Polygenic' | 'Data layers'

export type TraitCategory = 'Appearance' | 'Senses & food' | 'Performance' | 'Curiosities'
export type EvidenceLevel = 'Strong' | 'Moderate' | 'Exploratory'

export type AtlasStatus = 'Ready now' | 'Full model' | 'Read pipeline' | 'Specialized' | 'Not reliable'

export type AtlasItem = {
  id: string
  title: string
  status: AtlasStatus
  result: string
  detail: string
  scale: string
  sourceUrl?: string
}

export type AtlasGroup = {
  id: string
  title: string
  description: string
  items: AtlasItem[]
}

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
  sourceValidation?: {
    ancestry: {
      status: 'compatible' | 'family-compatible' | 'review'
      relationship: string
      overlap: number
      matching: number
      concordancePercent: number
      ibs0: number
      ibs1: number
      ibs2: number
      ibs0Percent: number
      ibs1Percent: number
      ibs2Percent: number
    }
  }
  eyeProbabilities?: {
    brown: number
    intermediate: number
    blue: number
  }
  traits: TraitResult[]
  quickRead: string[]
}

export type ClinicalFindingCategory = 'carrier' | 'incidental'

export type ClinicalFinding = {
  id: string
  category: ClinicalFindingCategory
  gene: string
  transcript: string
  variant: string
  zygosity: string
  classification: string
  inheritance: string
  associatedCondition: string
  plainMeaning: string
  reportFollowUp: string
}

export type ClinicalReport = {
  state: 'ready' | 'missing'
  mode: DeploymentMode
  reportLabel: string
  reportDate?: string
  sourceNote: string
  primaryFindings: {
    status: string
    note: string
  }
  secondaryFindings: {
    status: string
    panel: string
    note: string
  }
  carrierFindings: ClinicalFinding[]
  incidentalFindings: ClinicalFinding[]
  limitations: string[]
}
