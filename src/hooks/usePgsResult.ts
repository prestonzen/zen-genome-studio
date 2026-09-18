import { useCallback, useEffect, useState } from 'react'
import { heightPgsModel } from '../data/pgsCatalog'
import type { PgsResult } from '../types'

const missingPgsResult: PgsResult = {
  state: 'missing',
  mode: import.meta.env.DEV ? 'local' : 'cloud',
  modelId: heightPgsModel.id,
  trait: 'Standing height',
  modelVariants: heightPgsModel.variants,
  matchedVariants: 0,
  coveragePercent: 0,
  weightCoveragePercent: 0,
  interpretation: 'No personal calculation has been run.',
  nextStep: 'Calculate against the private VCF.',
  sourceNote: 'No result yet.',
}

export function usePgsResult() {
  const [pgsResult, setPgsResult] = useState<PgsResult>(missingPgsResult)
  const [pgsLoading, setPgsLoading] = useState(true)
  const [pgsCalculating, setPgsCalculating] = useState(false)

  const refreshPgsResult = useCallback(async () => {
    setPgsLoading(true)
    try {
      const response = await fetch('/api/pgs-result')
      if (!response.ok) throw new Error('PGS result request failed')
      setPgsResult((await response.json()) as PgsResult)
    } catch {
      setPgsResult(missingPgsResult)
    } finally {
      setPgsLoading(false)
    }
  }, [])

  const calculatePgsResult = useCallback(async () => {
    setPgsCalculating(true)
    try {
      const response = await fetch('/api/pgs-result', { method: 'POST', headers: { 'X-Zen-Local': '1' } })
      const result = (await response.json()) as PgsResult
      if (!response.ok) throw new Error(result.error || 'The private VCF could not be scored.')
      setPgsResult(result)
    } catch (error) {
      setPgsResult((current) => ({
        ...current,
        state: 'error',
        error: error instanceof Error ? error.message : 'The private VCF could not be scored.',
      }))
    } finally {
      setPgsCalculating(false)
    }
  }, [])

  useEffect(() => {
    const firstCheck = window.setTimeout(refreshPgsResult, 0)
    return () => window.clearTimeout(firstCheck)
  }, [refreshPgsResult])

  return { pgsResult, pgsLoading, pgsCalculating, refreshPgsResult, calculatePgsResult }
}
