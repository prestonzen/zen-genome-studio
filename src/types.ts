export type LocalStatus = {
  source: {
    present: boolean
    bytes?: number
  }
  opencravat: boolean
  openCravatUrl: string
}

export type ViewName = 'Overview' | 'Explore' | 'Record'
export type LandscapeTab = 'Chromosomes' | 'Clinical' | 'Traits'

