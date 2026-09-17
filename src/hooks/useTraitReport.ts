import { useCallback, useEffect, useState } from 'react'
import { demoTraitReport } from '../data/demoTraitReport'
import type { TraitReport } from '../types'

const missingReport: TraitReport = {
  state: 'missing',
  mode: 'local',
  build: 'GRCh38',
  reportLabel: 'Private trait report',
  sourceNote: 'Generate a report from the local VCF',
  caveat: 'Traits are tendencies, not guarantees.',
  traits: [],
  quickRead: [],
}

export function useTraitReport() {
  const [report, setReport] = useState<TraitReport>(missingReport)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/trait-report')
      if (!response.ok) throw new Error('Trait report request failed')
      const result = (await response.json()) as TraitReport
      setReport(result.state === 'demo' ? demoTraitReport : result)
    } catch {
      setReport(import.meta.env.DEV ? missingReport : demoTraitReport)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const firstCheck = window.setTimeout(refresh, 0)
    return () => window.clearTimeout(firstCheck)
  }, [refresh])

  return { report, loading, refresh }
}
