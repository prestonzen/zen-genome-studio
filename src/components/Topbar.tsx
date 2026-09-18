import { ExternalLink, LogOut, ShieldCheck } from 'lucide-react'
import type { DeploymentMode } from '../types'

type TopbarProps = {
  connected: boolean
  sourceReady: boolean
  mode: DeploymentMode
  authEnabled?: boolean
  onOpenAnalysis: () => void
}

export function Topbar({ connected, sourceReady, mode, authEnabled, onOpenAnalysis }: TopbarProps) {
  const cloudMode = mode === 'cloud'
  return (
    <header className="topbar">
      <div className="system-status" aria-label="Analysis system status">
        <span><i className={cloudMode || connected ? 'status-dot ok' : 'status-dot waiting'} />{cloudMode ? 'Pages + R2' : 'OpenCRAVAT'}</span>
        <span><i className="status-dot ok" />{cloudMode ? authEnabled ? 'Password gated' : 'Public demo' : 'Local only'}</span>
        <span><i className={sourceReady ? 'status-dot ok' : 'status-dot waiting'} />{sourceReady ? cloudMode ? 'Reports ready' : 'Source ready' : cloudMode ? 'No reports published' : 'Source check'}</span>
      </div>
      <div className="top-actions">
        {!cloudMode && <button type="button" onClick={onOpenAnalysis}>
          <ExternalLink size={16} />
          <span>Variant explorer</span>
        </button>}
        {cloudMode && authEnabled && <form className="signout-form" method="post" action="/api/auth/logout"><button type="submit" aria-label="Sign out" title="Sign out"><LogOut size={15} /><span>Sign out</span></button></form>}
        <span className="top-privacy"><ShieldCheck size={15} /> {cloudMode ? 'Derived reports only' : 'Local summaries only'}</span>
      </div>
    </header>
  )
}
