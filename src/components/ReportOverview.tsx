import {
  ArrowRight,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  Globe2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { heightPgsModel } from '../data/pgsCatalog'
import type { AncestryReport, ClinicalReport, LocalStatus, PgsResult, TraitReport, ViewName } from '../types'
import { TermTip } from './TermTip'

type ReportOverviewProps = {
  status: LocalStatus
  traitReport: TraitReport
  clinicalReport: ClinicalReport
  ancestryReport: AncestryReport
  pgsResult: PgsResult
  privacyMode: boolean
  onTogglePrivacy: () => void
  onNavigate: (view: ViewName) => void
  onOpenPolygenic: () => void
}

const CLINVAR_URL = 'https://www.ncbi.nlm.nih.gov/clinvar/docs/clinsig/'
const ACMG_URL = 'https://pubmed.ncbi.nlm.nih.gov/40568962/'
const ANCESTRY_CONTEXT_URL = 'https://www.genome.gov/about-genomics/policy-issues/population-descriptors-in-genomics'

function formatSync(value?: string) {
  if (!value) return 'Current report cache'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Current report cache'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function ReportOverview({
  status,
  traitReport,
  clinicalReport,
  ancestryReport,
  pgsResult,
  privacyMode,
  onTogglePrivacy,
  onNavigate,
  onOpenPolygenic,
}: ReportOverviewProps) {
  const traitReady = traitReport.state === 'ready'
  const clinicalReady = clinicalReport.state === 'ready'
  const ancestrySelf = ancestryReport.profiles.find((profile) => profile.relationship === 'self')
  const ancestryReady = ancestryReport.state === 'ready' && Boolean(ancestrySelf)
  const pgsReady = pgsResult.state === 'ready'
  const topRegion = [...(ancestrySelf?.regions ?? [])].sort((a, b) => b.percent - a.percent)[0]
  const connectedCount = [traitReady, clinicalReady, ancestryReady, pgsReady].filter(Boolean).length
  const sourceMode = status.mode === 'cloud' ? 'Protected cloud sync' : 'Local analysis cache'

  return (
    <section className="report-overview" data-testid="scene-report-overview">
      <header>
        <div>
          <span className="section-kicker">CONNECTED REPORTS</span>
          <h2>Your results at a glance</h2>
          <p>The same locally generated report bundle powers this overview and every detailed section.</p>
        </div>
        <div className="report-overview-actions">
          <span><Database size={14} /> {connectedCount}/4 sources connected</span>
          <button type="button" onClick={onTogglePrivacy}>{privacyMode ? <Eye size={16} /> : <EyeOff size={16} />}{privacyMode ? 'Reveal details' : 'Hide details'}</button>
        </div>
      </header>

      <div className="report-overview-grid">
        <article className={traitReady ? 'report-snapshot ready' : 'report-snapshot'}>
          <div className="snapshot-heading"><span><Sparkles size={18} /></span><div><small>TRAITS</small><h3>Everyday biology</h3></div><b>{traitReady ? 'Ready' : traitReport.state === 'demo' ? 'Demo' : 'Missing'}</b></div>
          <div className="snapshot-result"><strong>{traitReady ? `${traitReport.traits.length} interpreted traits` : traitReport.state === 'demo' ? 'Reference examples only' : 'No report connected'}</strong><p>{traitReady ? traitReport.quickRead[0] : traitReport.sourceNote}</p></div>
          <div className="snapshot-context"><TermTip compact term="Evidence attached" definition="Each trait keeps its model or publication link, marker coverage, and evidence strength beside the result." /><span>{traitReady ? `${traitReport.traits.filter((trait) => trait.sourceUrl).length} cited results` : 'No personal result'}</span></div>
          <button type="button" onClick={() => onNavigate('Discover')}>Open traits <ArrowRight size={15} /></button>
        </article>

        <article className={clinicalReady ? 'report-snapshot ready clinical' : 'report-snapshot clinical'}>
          <div className="snapshot-heading"><span><HeartPulse size={18} /></span><div><small>CLINICAL</small><h3>Clinician report</h3></div><b>{clinicalReady ? 'Ready' : 'Missing'}</b></div>
          <div className="snapshot-result"><strong>{clinicalReady ? privacyMode ? 'Signed findings connected' : `${clinicalReport.incidentalFindings.length} incidental · ${clinicalReport.carrierFindings.length} carrier` : 'No report connected'}</strong><p>{clinicalReady ? privacyMode ? 'Counts, genes, and conditions are hidden by privacy mode.' : clinicalReport.primaryFindings.note : clinicalReport.sourceNote}</p></div>
          <div className="snapshot-context"><TermTip compact term="Clinician-interpreted" definition="Zen Genome Studio displays the laboratory report as transcribed. It does not reclassify a variant or replace genetic counseling." /><span>{clinicalReport.reportDate ? `Report ${clinicalReport.reportDate}` : 'Imported report'}</span></div>
          <button type="button" onClick={() => onNavigate('Summary')}>Open clinical report <ArrowRight size={15} /></button>
        </article>

        <article className={ancestryReady ? 'report-snapshot ready ancestry' : 'report-snapshot ancestry'}>
          <div className="snapshot-heading"><span><Globe2 size={18} /></span><div><small>ANCESTRY</small><h3>Regional estimate</h3></div><b>{ancestryReady ? 'Ready' : 'Missing'}</b></div>
          <div className="snapshot-result"><strong>{ancestryReady ? privacyMode ? 'Imported estimate connected' : `${topRegion?.label ?? 'Top region'} · ${topRegion?.percent ?? 0}%` : 'No estimate connected'}</strong><p>{ancestryReady ? privacyMode ? 'Regions, percentages, and family comparison are hidden by privacy mode.' : `${ancestrySelf?.regions.length ?? 0} reported regions for ${ancestrySelf?.label ?? 'the primary profile'}.` : ancestryReport.sourceNote}</p></div>
          <div className="snapshot-context"><TermTip compact term="Estimate, not identity" definition="Regional percentages compare DNA to a vendor's sampled reference groups. They do not measure culture, nationality, or every genealogical ancestor." /><span>{ancestryReport.sourceName}</span></div>
          <button type="button" onClick={() => onNavigate('Ancestry')}>Open ancestry <ArrowRight size={15} /></button>
        </article>

        <article className={pgsReady ? 'report-snapshot ready polygenic' : 'report-snapshot polygenic'}>
          <div className="snapshot-heading"><span><Gauge size={18} /></span><div><small>POLYGENIC</small><h3>Height score</h3></div><b>{pgsReady ? 'Ready' : 'Missing'}</b></div>
          <div className="snapshot-result"><strong>{pgsReady ? privacyMode ? 'Personal calculation connected' : `${pgsResult.coveragePercent}% direct coverage` : 'No result connected'}</strong><p>{pgsReady ? privacyMode ? 'The score and coverage details are hidden by privacy mode.' : pgsResult.interpretation : pgsResult.sourceNote}</p></div>
          <div className="snapshot-context"><TermTip compact term="Coverage before percentile" definition="The app shows how much of the published score was directly represented. It does not invent a percentile without a suitable ancestry-matched reference distribution." /><span>{pgsResult.modelId}</span></div>
          <button type="button" onClick={onOpenPolygenic}>Open score <ArrowRight size={15} /></button>
        </article>
      </div>

      <footer className="report-overview-provenance">
        <div><ShieldCheck size={18} /><p><strong>{sourceMode}</strong><span>Last bundle sync {formatSync(status.reports?.publishedAt ?? traitReport.generatedAt)}. Raw sequencing and VCF files remain on the private computer.</span></p></div>
        <nav aria-label="Report evidence sources">
          <a href={CLINVAR_URL} target="_blank" rel="noreferrer">ClinVar terms <ExternalLink size={12} /></a>
          <a href={ACMG_URL} target="_blank" rel="noreferrer">ACMG SF v3.3 <ExternalLink size={12} /></a>
          <a href={ANCESTRY_CONTEXT_URL} target="_blank" rel="noreferrer">NHGRI ancestry context <ExternalLink size={12} /></a>
          <a href={heightPgsModel.sourceUrl} target="_blank" rel="noreferrer">PGS Catalog <ExternalLink size={12} /></a>
        </nav>
      </footer>
    </section>
  )
}
