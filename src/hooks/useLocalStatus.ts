import { useCallback, useEffect, useState } from 'react'
import type { LocalStatus } from '../types'

const emptyStatus: LocalStatus = {
  mode: import.meta.env.DEV ? 'local' : 'cloud',
  source: { present: false },
  reads: { present: false },
  opencravat: false,
  openCravatUrl: import.meta.env.DEV ? 'http://127.0.0.1:8080' : '',
}

export function useLocalStatus() {
  const [status, setStatus] = useState<LocalStatus>(emptyStatus)
  const [checking, setChecking] = useState(true)

  const refresh = useCallback(async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/local-status')
      if (!response.ok) throw new Error('Status request failed')
      setStatus((await response.json()) as LocalStatus)
    } catch {
      setStatus(emptyStatus)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const firstCheck = window.setTimeout(refresh, 0)
    const interval = window.setInterval(refresh, 10_000)
    return () => {
      window.clearTimeout(firstCheck)
      window.clearInterval(interval)
    }
  }, [refresh])

  return { status, checking, refresh }
}
