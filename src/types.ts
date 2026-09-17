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

export type ViewName = 'Overview' | 'Explore' | 'Record'
export type LandscapeTab = 'Chromosomes' | 'Clinical' | 'Traits'
