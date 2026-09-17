import { Check, ExternalLink, EyeOff, MonitorUp, Radio, RefreshCw, ShieldCheck, Square } from 'lucide-react'

type InsightRailProps = {
  connected: boolean
  sourceReady: boolean
  checking: boolean
  recordSafe: boolean
  recording: boolean
  elapsed: number
  openCravatUrl: string
  onRefresh: () => void
  onToggleSafe: () => void
  onStartRecording: () => void
  onStopRecording: () => void
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = (seconds % 60).toString().padStart(2, '0')
  return `00:${minutes}:${remainder}`
}

export function InsightRail(props: InsightRailProps) {
  const {
    connected,
    sourceReady,
    checking,
    recordSafe,
    recording,
    elapsed,
    openCravatUrl,
    onRefresh,
    onToggleSafe,
    onStartRecording,
    onStopRecording,
  } = props

  return (
    <aside className="insight-rail">
      <section className="rail-section readiness">
        <div className="rail-heading">
          <h3>Analysis readiness</h3>
          <button className="icon-button" onClick={onRefresh} type="button" aria-label="Refresh status" title="Refresh status">
            <RefreshCw size={16} className={checking ? 'spin' : ''} />
          </button>
        </div>
        <div className="check-row">
          <span className={connected ? 'check-icon ok' : 'check-icon waiting'}>{connected ? <Check size={14} /> : <Radio size={12} />}</span>
          <span>OpenCRAVAT</span><strong>{connected ? 'Ready' : 'Waiting'}</strong>
        </div>
        <div className="check-row">
          <span className={sourceReady ? 'check-icon ok' : 'check-icon waiting'}>{sourceReady ? <Check size={14} /> : <Radio size={12} />}</span>
          <span>VCF source</span><strong>{sourceReady ? 'Found' : 'Missing'}</strong>
        </div>
        <div className="check-row">
          <span className="check-icon ok"><ShieldCheck size={14} /></span>
          <span>Privacy boundary</span><strong>Local</strong>
        </div>
      </section>

      <section className="rail-section safe-mode">
        <div className="toggle-line">
          <div>
            <h3>Record-safe mode</h3>
            <p>Hides file paths and sensitive result details.</p>
          </div>
          <button
            className={recordSafe ? 'toggle active' : 'toggle'}
            type="button"
            role="switch"
            aria-checked={recordSafe}
            onClick={onToggleSafe}
            aria-label="Toggle record-safe mode"
          >
            <i />
          </button>
        </div>
        <div className="safe-status"><EyeOff size={14} /> {recordSafe ? 'Private details hidden' : 'Recording guard off'}</div>
      </section>

      <section className="rail-section record-controls">
        <h3>Record session</h3>
        <div className="record-time"><i className={recording ? 'live' : ''} />{formatTime(elapsed)}</div>
        <button
          className={recording ? 'record-button stop' : 'record-button'}
          type="button"
          onClick={recording ? onStopRecording : onStartRecording}
        >
          {recording ? <Square size={15} fill="currentColor" /> : <span className="record-dot" />}
          {recording ? 'Stop & save' : 'Start recording'}
        </button>
      </section>

      <section className="rail-section open-cravat">
        <h3>OpenCRAVAT</h3>
        <p>Open the local analysis interface in a new tab.</p>
        <button type="button" onClick={() => window.open(openCravatUrl, '_blank', 'noopener,noreferrer')}>
          <ExternalLink size={16} /> Open OpenCRAVAT
        </button>
      </section>

      <div className="local-lock"><MonitorUp size={15} /> Nothing leaves this computer</div>
    </aside>
  )
}

