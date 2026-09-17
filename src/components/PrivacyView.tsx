import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  HardDrive,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldCheck,
  TerminalSquare,
  Wrench,
} from 'lucide-react'
import type { LocalStatus, PipelineStatus } from '../types'

type PrivacyViewProps = {
  status: LocalStatus
  checking: boolean
  privacyMode: boolean
  onRefresh: () => void
  onTogglePrivacy: () => void
  onOpenAnalysis: () => void
  onNotice: (message: string) => void
}

const emptyPipeline: PipelineStatus = {
  mode: 'local',
  available: false,
  tools: { archive: false, aligner: false, variants: false, polygenic: false },
  note: 'Ubuntu has not been checked yet.',
}

export function PrivacyView({ status, checking, privacyMode, onRefresh, onTogglePrivacy, onOpenAnalysis, onNotice }: PrivacyViewProps) {
  const [pipeline, setPipeline] = useState<PipelineStatus>(emptyPipeline)
  const [checkingTools, setCheckingTools] = useState(true)
  const [launchingSetup, setLaunchingSetup] = useState(false)

  const checkTools = useCallback(async () => {
    setCheckingTools(true)
    try {
      const response = await fetch('/api/pipeline-status')
      if (!response.ok) throw new Error('Tool check failed')
      setPipeline(await response.json() as PipelineStatus)
    } catch {
      setPipeline({ ...emptyPipeline, mode: status.mode, note: status.mode === 'cloud' ? 'Deep analysis runs only in the private local workspace.' : 'Ubuntu could not be reached.' })
    } finally {
      setCheckingTools(false)
    }
  }, [status.mode])

  useEffect(() => {
    const timer = window.setTimeout(() => void checkTools(), 0)
    return () => window.clearTimeout(timer)
  }, [checkTools])

  const toolRows = useMemo(() => [
    { label: 'Open compressed reads', detail: 'Genozip reader', ready: pipeline.tools.archive },
    { label: 'Map raw reads', detail: 'DNA aligner', ready: pipeline.tools.aligner },
    { label: 'Inspect and rebuild variants', detail: 'Samtools + Bcftools', ready: pipeline.tools.variants },
    { label: 'Run reference-calibrated scores', detail: 'Nextflow workflow', ready: pipeline.tools.polygenic },
  ], [pipeline.tools])
  const readyCount = toolRows.filter((row) => row.ready).length

  async function launchSetup() {
    setLaunchingSetup(true)
    try {
      const response = await fetch('/api/open-tool-setup', { method: 'POST', headers: { 'X-Zen-Local': '1' } })
      const result = await response.json() as { launched?: boolean; error?: string }
      if (!response.ok || !result.launched) throw new Error(result.error || 'Setup could not open')
      onNotice('Ubuntu setup opened in Windows Terminal. Enter your Ubuntu password there, then select Check again.')
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'The setup window could not be opened.')
    } finally {
      setLaunchingSetup(false)
    }
  }

  return (
    <main className="workspace privacy-workspace">
      <section className="privacy-intro">
        <div><ShieldCheck size={34} /><span><h1>Privacy and local tools</h1><p>Control what the studio reveals and see exactly what is ready on this computer.</p></span></div>
        <button type="button" onClick={() => { onRefresh(); void checkTools() }} disabled={checking || checkingTools}>
          <RefreshCw size={16} className={checking || checkingTools ? 'spin' : ''} /> Check again
        </button>
      </section>

      <section className="privacy-mode-panel">
        <div className="privacy-mode-copy">
          <span className="privacy-mode-icon">{privacyMode ? <EyeOff size={24} /> : <Eye size={24} />}</span>
          <div><span>PRIVACY MODE</span><h2>{privacyMode ? 'Sensitive details are hidden' : 'Private details are visible'}</h2><p>Clinical findings, ancestry percentages, and family comparisons are concealed when privacy mode is on.</p></div>
        </div>
        <button className={privacyMode ? 'toggle active' : 'toggle'} type="button" role="switch" aria-checked={privacyMode} onClick={onTogglePrivacy} aria-label="Toggle privacy mode"><i /></button>
      </section>

      <div className="privacy-grid">
        <section className="privacy-card data-boundary">
          <header><LockKeyhole size={20} /><div><h2>Your data boundary</h2><p>Raw genome files stay outside this project.</p></div></header>
          <div className="boundary-flow">
            <span><HardDrive size={20} /><strong>Private files</strong><small>VCF, reads, AncestryDNA</small></span>
            <i aria-hidden="true">→</i>
            <span><Database size={20} /><strong>Local analysis</strong><small>Runs on this computer</small></span>
            <i aria-hidden="true">→</i>
            <span><ShieldCheck size={20} /><strong>Studio summaries</strong><small>No raw DNA in the public repo</small></span>
          </div>
          <dl className="privacy-source-list">
            <div><dt>Whole-genome VCF</dt><dd className={status.source.present ? 'ready' : ''}>{status.source.present ? 'Found locally' : 'Not found'}</dd></div>
            <div><dt>Compressed raw reads</dt><dd className={status.reads.present ? 'ready' : ''}>{status.reads.present ? 'Found locally' : 'Not found'}</dd></div>
            <div><dt>AncestryDNA file</dt><dd className={status.ancestry.present ? 'ready' : ''}>{status.ancestry.present ? 'Found locally' : 'Not found'}</dd></div>
          </dl>
        </section>

        <section className="privacy-card service-card">
          <header><Server size={20} /><div><h2>Technical variant explorer</h2><p>OpenCRAVAT is the detailed research layer.</p></div></header>
          <div className="service-state"><i className={status.opencravat ? 'ready' : ''}>{status.opencravat ? <Check size={14} /> : '!'}</i><span><strong>{status.opencravat ? 'OpenCRAVAT is running' : 'OpenCRAVAT is offline'}</strong><small>{status.opencravat ? 'Ready for technical variant review' : 'Start the local service before opening it'}</small></span></div>
          <button type="button" onClick={onOpenAnalysis}><ExternalLink size={16} /> Open variant explorer</button>
        </section>
      </div>

      <section className="tool-readiness">
        <header>
          <div><Wrench size={21} /><span><h2>Deeper genome tools</h2><p>These optional packages unlock the FASTQ archive and reference-calibrated polygenic workflows.</p></span></div>
          <span className={pipeline.available ? 'ubuntu-state ready' : 'ubuntu-state'}><TerminalSquare size={16} />{pipeline.available ? `${pipeline.distribution || 'Ubuntu'} connected` : status.mode === 'cloud' ? 'Local only' : 'Ubuntu unavailable'}</span>
        </header>
        <div className="tool-summary"><strong>{readyCount} of {toolRows.length} toolkits ready</strong><p>{pipeline.note}</p></div>
        <div className="tool-grid">
          {toolRows.map((row) => <article className={row.ready ? 'ready' : ''} key={row.label}><i>{row.ready ? <Check size={12} /> : '·'}</i><span><strong>{row.label}</strong><small>{row.ready ? 'Ready' : `${row.detail} not installed`}</small></span></article>)}
        </div>
        {status.mode === 'local' && pipeline.available && readyCount < toolRows.length && <div className="tool-actions"><p>Setup opens Ubuntu in a separate terminal because Ubuntu needs your password to install system packages.</p><button type="button" onClick={launchSetup} disabled={launchingSetup}>{launchingSetup ? <LoaderCircle className="spin" size={15} /> : <TerminalSquare size={15} />}{launchingSetup ? 'Opening setup' : 'Install missing tools'}</button></div>}
      </section>
    </main>
  )
}
