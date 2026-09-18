import { AlertTriangle, ArrowRight, CheckCircle2, CloudOff, Database, LoaderCircle } from 'lucide-react'
import type { LocalStatus } from '../types'

type DataProvenanceBannerProps = {
  status: LocalStatus
  checking: boolean
  apiAvailable: boolean
  onOpenStatus: () => void
}

const reportLabels = [
  ['trait', 'Traits'],
  ['clinical', 'Clinical'],
  ['ancestry', 'Ancestry'],
  ['polygenic', 'Polygenic'],
] as const

function formatSyncTime(value?: string) {
  if (!value) return 'Sync time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sync time unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function DataProvenanceBanner({ status, checking, apiAvailable, onOpenStatus }: DataProvenanceBannerProps) {
  const reportCount = reportLabels.filter(([key]) => status.reports?.[key]).length
  const synced = apiAvailable && reportCount > 0
  const complete = reportCount === reportLabels.length
  const state = checking ? 'checking' : !apiAvailable ? 'disconnected' : synced ? 'synced' : 'demo'
  const Icon = state === 'checking' ? LoaderCircle : state === 'disconnected' ? CloudOff : state === 'synced' ? Database : AlertTriangle

  const copy = state === 'checking' ? {
    eyebrow: 'CHECKING DATA SOURCE',
    title: 'Confirming whether this is demo or personal data',
    detail: 'The studio is checking for a protected report bundle before labeling any result as personal.',
  } : state === 'disconnected' ? {
    eyebrow: 'DEMO DATA · CLOUD API NOT CONNECTED',
    title: 'These are fictional examples, not your DNA',
    detail: 'The static site is online, but its secure report API did not answer. No personal summaries are loaded in this view.',
  } : state === 'demo' ? {
    eyebrow: 'DEMO DATA · NO PRIVATE SYNC',
    title: 'These are fictional examples, not your DNA',
    detail: 'The protected site is connected, but no prior report bundle was found. Visible trait values are demonstration data only.',
  } : {
    eyebrow: complete ? 'PRIVATE REPORT SYNC LOADED' : 'PARTIAL PRIVATE SYNC LOADED',
    title: complete ? 'Personal summary data is loaded' : `${reportCount} of ${reportLabels.length} personal summaries are loaded`,
    detail: `Derived reports last synced ${formatSyncTime(status.reports?.publishedAt)}. Raw VCF and FASTQ files remain off this site.`,
  }

  return (
    <section className={`data-provenance ${state}`} aria-live="polite" data-testid="data-provenance">
      <div className="provenance-copy">
        <span className="provenance-icon"><Icon className={state === 'checking' ? 'spin' : ''} size={23} /></span>
        <div><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.detail}</p></div>
      </div>
      <dl className="report-inventory" aria-label="Published report inventory">
        {reportLabels.map(([key, label]) => {
          const ready = Boolean(status.reports?.[key])
          return <div key={key}><dt>{label}</dt><dd className={ready ? 'ready' : ''}>{ready ? <><CheckCircle2 size={12} /> Synced</> : key === 'trait' ? 'Demo' : 'Not synced'}</dd></div>
        })}
      </dl>
      <button type="button" onClick={onOpenStatus}>Data status <ArrowRight size={15} /></button>
    </section>
  )
}
