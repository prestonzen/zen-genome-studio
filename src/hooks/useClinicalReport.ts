import { useCallback, useEffect, useState } from 'react'
import type { ClinicalReport } from '../types'

const missingClinicalReport: ClinicalReport = {
  state: 'missing',
  mode: 'local',
  reportLabel: 'Private clinical report',
  sourceNote: 'No clinician-reviewed summary is connected',
  primaryFindings: { status: 'Not connected', note: 'Add a private clinical-report.json file to view the laboratory report here.' },
  secondaryFindings: { status: 'Not connected', panel: 'Not connected', note: 'No clinical report data is available.' },
  carrierFindings: [],
  incidentalFindings: [],
  limitations: [],
}

export function useClinicalReport() {
  const [clinicalReport, setClinicalReport] = useState<ClinicalReport>(missingClinicalReport)
  const [clinicalLoading, setClinicalLoading] = useState(true)

  const refreshClinicalReport = useCallback(async () => {
    setClinicalLoading(true)
    try {
      const response = await fetch('/api/clinical-report')
      if (!response.ok) throw new Error('Clinical report request failed')
      setClinicalReport((await response.json()) as ClinicalReport)
    } catch {
      setClinicalReport(missingClinicalReport)
    } finally {
      setClinicalLoading(false)
    }
  }, [])

  useEffect(() => {
    const firstCheck = window.setTimeout(refreshClinicalReport, 0)
    return () => window.clearTimeout(firstCheck)
  }, [refreshClinicalReport])

  return { clinicalReport, clinicalLoading, refreshClinicalReport }
}
