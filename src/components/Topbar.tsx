import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { DeploymentMode } from '../types'

type TopbarProps = {
  connected: boolean
  sourceReady: boolean
  mode: DeploymentMode
  onOpenAnalysis: () => void
}

export function Topbar({ connected, sourceReady, mode, onOpenAnalysis }: TopbarProps) {
  const cloudMode = mode === 'cloud'
  return (
    <header className="topbar">
      <div className="system-status" aria-label="Analysis system status">
        <span><i className={connected ? 'status-dot ok' : 'status-dot waiting'} />OpenCRAVAT</span>
        <span><i className="status-dot ok" />{cloudMode ? 'Cloud preview' : 'Local only'}</span>
        <span><i className={sourceReady || cloudMode ? 'status-dot ok' : 'status-dot waiting'} />{sourceReady ? 'Source ready' : cloudMode ? 'No genome uploaded' : 'Source check'}</span>
      </div>
      <div className="top-actions">
        <button type="button" onClick={onOpenAnalysis}>
          <ExternalLink size={16} />
          <span>{cloudMode ? 'Private analysis server' : 'Variant explorer'}</span>
        </button>
        <span className="top-privacy"><ShieldCheck size={15} /> Local summaries only</span>
      </div>
    </header>
  )
}
