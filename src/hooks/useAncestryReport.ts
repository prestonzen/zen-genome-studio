import { useCallback, useEffect, useState } from 'react'
import type { AncestryReport } from '../types'

const missingAncestryReport: AncestryReport = {
  state: 'missing',
  mode: 'local',
  sourceName: 'Private ancestry report',
  sourceNote: 'No imported ancestry estimate is connected',
  profiles: [],
}

export function useAncestryReport() {
  const [ancestryReport, setAncestryReport] = useState<AncestryReport>(missingAncestryReport)
  const [ancestryLoading, setAncestryLoading] = useState(true)

  const refreshAncestryReport = useCallback(async () => {
    setAncestryLoading(true)
    try {
      const response = await fetch('/api/ancestry-report')
      if (!response.ok) throw new Error('Ancestry report request failed')
      setAncestryReport((await response.json()) as AncestryReport)
    } catch {
      setAncestryReport(missingAncestryReport)
    } finally {
      setAncestryLoading(false)
    }
  }, [])

  useEffect(() => {
    const firstCheck = window.setTimeout(refreshAncestryReport, 0)
    return () => window.clearTimeout(firstCheck)
  }, [refreshAncestryReport])

  return { ancestryReport, ancestryLoading, refreshAncestryReport }
}
