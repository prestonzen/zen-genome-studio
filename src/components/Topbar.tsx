import { CircleHelp, ExternalLink, Settings } from 'lucide-react'

type TopbarProps = {
  connected: boolean
  sourceReady: boolean
  openCravatUrl: string
}

export function Topbar({ connected, sourceReady, openCravatUrl }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="system-status" aria-label="Local system status">
        <span><i className={connected ? 'status-dot ok' : 'status-dot waiting'} />OpenCRAVAT</span>
        <span><i className="status-dot ok" />Local only</span>
        <span><i className={sourceReady ? 'status-dot ok' : 'status-dot waiting'} />{sourceReady ? 'Source ready' : 'Source check'}</span>
      </div>
      <div className="top-actions">
        <button type="button" onClick={() => window.open(openCravatUrl, '_blank', 'noopener,noreferrer')}>
          <ExternalLink size={16} />
          <span>Open in new tab</span>
        </button>
        <button className="icon-button" type="button" title="Settings" aria-label="Settings">
          <Settings size={18} />
        </button>
        <button className="icon-button" type="button" title="Help" aria-label="Help">
          <CircleHelp size={18} />
        </button>
      </div>
    </header>
  )
}

