import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Coffee,
  Database,
  Dumbbell,
  Ear,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  HeartPulse,
  Info,
  Leaf,
  Lightbulb,
  Milk,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Utensils,
  Wine,
} from 'lucide-react'
import type { ClinicalFinding, ClinicalReport, EvidenceLevel, LocalStatus, TraitCategory, TraitReport, TraitResult, ViewName } from '../types'
import { GenomeAtlas } from './GenomeAtlas'
import { TermTip } from './TermTip'

type TraitReportProps = {
  report: TraitReport
  loading: boolean
  onRefresh: () => void
  onNavigate: (view: ViewName) => void
}

type SummaryViewProps = TraitReportProps & {
  clinicalReport: ClinicalReport
  clinicalLoading: boolean
  onRefreshClinical: () => void
  privacyMode: boolean
  onTogglePrivacy: () => void
}

const categories: TraitCategory[] = ['Appearance', 'Senses & food', 'Performance', 'Curiosities']

function TraitIcon({ id, size = 22 }: { id: string; size?: number }) {
  if (id === 'eye-colour') return <Eye size={size} />
  if (id === 'hair-pigmentation') return <Sparkles size={size} />
  if (id === 'freckling') return <Sun size={size} />
  if (id === 'lactose') return <Milk size={size} />
  if (id.includes('caffeine')) return <Coffee size={size} />
  if (id === 'bitter-taste') return <Utensils size={size} />
  if (id === 'earwax') return <Ear size={size} />
  if (id === 'cilantro') return <Leaf size={size} />
  if (id === 'alcohol-response') return <Wine size={size} />
  if (id === 'photic-sneeze') return <Lightbulb size={size} />
  if (id === 'actn3') return <Dumbbell size={size} />
  return <Activity size={size} />
}

function EvidenceTag({ level }: { level: EvidenceLevel }) {
  return <span className={`evidence-tag ${level.toLowerCase()}`}>{level}</span>
}

const traitDefinitions: Partial<Record<string, string>> = {
  'alcohol-response': 'Alcohol flushing means facial or skin warmth and redness after drinking, often because acetaldehyde is cleared more slowly. This marker is not a safe-drinking score.',
  actn3: 'ACTN3 makes a protein in fast-twitch muscle fibres. A genotype changes protein status but cannot predict athletic talent.',
  lactose: 'Lactase persistence is the tendency to keep producing the lactose-digesting enzyme after childhood.',
  'photic-sneeze': 'The photic sneeze reflex is sneezing after moving into bright light. This marker only shifts the odds.',
}

const clinicalDefinitions = {
  classification: 'The laboratory\'s evidence label for a variant-condition relationship. It is displayed as reported and may evolve as evidence changes.',
  carrier: 'A carrier finding usually means one altered copy in a recessive-disease gene. It is not the same as having that recessive condition.',
  incidental: 'A clinically relevant result found outside the original reason for testing. The report\'s own follow-up guidance remains the controlling interpretation.',
  secondary: 'A finding intentionally sought in an actionable gene list during clinical sequencing, separate from the original testing indication.',
}

const CLINVAR_CLASSIFICATION_URL = 'https://www.ncbi.nlm.nih.gov/clinvar/docs/clinsig/'
const ACMG_SECONDARY_URL = 'https://pubmed.ncbi.nlm.nih.gov/40568962/'

function TraitTitle({ trait }: { trait: TraitResult }) {
  const definition = traitDefinitions[trait.id]
  return definition ? <TermTip compact term={trait.title} definition={definition} /> : <>{trait.title}</>
}

function markerCoverage(trait: TraitResult) {
  if (typeof trait.observedMarkers === 'number') {
    return { direct: trait.observedMarkers, percent: trait.markerCount ? Math.round(trait.observedMarkers / trait.markerCount * 100) : 0 }
  }
  const match = trait.callNote.match(/^(\d+)/)
  if (!match) return null
  const direct = Number(match[1])
  return { direct, percent: trait.markerCount ? Math.round(direct / trait.markerCount * 100) : 0 }
}

function formatRefreshTime(value?: string) {
  if (!value) return 'Refresh time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Refresh time unavailable'
  return `Last refreshed ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)}`
}

function ReportSourceStrip({ report, readsPresent }: { report: TraitReport; readsPresent?: boolean }) {
  const demo = report.state === 'demo'
  const cloud = report.mode === 'cloud'
  return (
    <div className="report-source-strip">
      <div><FileText size={25} /><span><strong>{report.reportLabel}</strong><small>{report.sourceNote}</small><em>{demo ? 'Demo data' : formatRefreshTime(report.generatedAt)}</em></span></div>
      <div><Database size={25} /><span><strong>{readsPresent === undefined ? report.build : readsPresent ? 'Raw reads detected' : 'Reads not configured'}</strong><small>{readsPresent === undefined ? 'Human reference' : readsPresent ? 'Available for deeper local analysis' : 'VCF results still available'}</small></span></div>
      <div><ShieldCheck size={25} /><span><strong>{demo ? 'Demo only' : cloud ? 'Protected sync' : 'Local report'}</strong><small>{demo ? 'No personal genome loaded' : cloud ? 'Derived summary only; raw DNA stays local' : 'Generated and stored on this device'}</small></span></div>
    </div>
  )
}

function MissingReport({ loading, onRefresh }: Pick<TraitReportProps, 'loading' | 'onRefresh'>) {
  return (
    <section className="missing-report">
      <Sparkles size={34} />
      <div>
        <h2>Your consumer report is ready to be built</h2>
        <p>Run the private trait builder once, then refresh. It reads the VCF without changing it and saves only a small local summary.</p>
        <code>powershell -ExecutionPolicy Bypass -File .\scripts\build-private-traits.ps1</code>
      </div>
      <button type="button" onClick={onRefresh}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh report</button>
    </section>
  )
}

function resultStateFor(trait: TraitResult) {
  if (trait.resultState) return trait.resultState
  const coverage = markerCoverage(trait)
  if (!coverage) return trait.callNote.toLowerCase().includes('reference preview') ? 'partial' : 'unresolved'
  if (coverage.direct === 0) return 'unresolved'
  return coverage.direct === trait.markerCount ? 'observed' : 'partial'
}

function ResultStateTag({ trait }: { trait: TraitResult }) {
  const state = resultStateFor(trait)
  const label = state === 'observed' ? 'Directly observed' : state === 'partial' ? 'Partial calls' : 'Unresolved'
  return <span className={`result-state ${state}`}>{label}</span>
}

function ChromosomeLinks({ chromosomes = [] }: Pick<TraitResult, 'chromosomes'>) {
  if (!chromosomes.length) return <span className="empty-detail">Not mapped in this summary</span>
  return <span className="chromosome-links">{chromosomes.map((chromosome) => <a key={chromosome} href={`https://www.ensembl.org/Homo_sapiens/Location/Chromosome?r=${encodeURIComponent(chromosome)}`} target="_blank" rel="noreferrer">Chr {chromosome}</a>)}</span>
}

function EvidenceList({ traits }: { traits: TraitResult[] }) {
  return (
    <section className="result-index" aria-label="Personal trait results">
      {traits.map((trait, index) => {
        const coverage = markerCoverage(trait)
        const openByDefault = index === 0
        return (
          <details className={`result-record ${resultStateFor(trait)}`} key={trait.id} open={openByDefault}>
            <summary>
              <span className="result-icon"><TraitIcon id={trait.id} /></span>
              <span className="result-name"><small>{trait.category}</small><strong>{trait.title}</strong></span>
              <span className="result-call"><small>Personal result</small><strong>{trait.result}</strong></span>
              <span className="result-coverage">{coverage ? <><i><b style={{ width: `${coverage.percent}%` }} /></i><small>{coverage.direct}/{trait.markerCount} explicit markers</small></> : <small>Coverage unavailable</small>}</span>
              <span className="result-labels"><ResultStateTag trait={trait} /><EvidenceTag level={trait.evidence} /></span>
              <ArrowRight size={16} />
            </summary>
            <div className="result-record-detail">
              <section className="result-explanation"><strong>Plain-language read</strong><p>{trait.summary}</p><small>{trait.callNote}</small></section>
              <dl>
                <div><dt>Genes / region</dt><dd>{trait.genes?.join(' · ') || 'Not listed'}</dd></div>
                <div><dt>Chromosomes</dt><dd><ChromosomeLinks chromosomes={trait.chromosomes} /></dd></div>
                <div><dt>What it is</dt><dd>{trait.definition || 'A published genetic association or model.'}</dd></div>
                <div><dt>What it cannot tell you</dt><dd>{trait.limitation || 'It is not a guarantee or diagnosis.'}</dd></div>
              </dl>
              <a href={trait.sourceUrl} target="_blank" rel="noreferrer">{trait.sourceName} <ExternalLink size={14} /></a>
            </div>
          </details>
        )
      })}
    </section>
  )
}

type DiscoverViewProps = TraitReportProps & { status: LocalStatus }

export function DiscoverView({ report, status, loading, onRefresh, onNavigate }: DiscoverViewProps) {
  const [category, setCategory] = useState<'All' | TraitCategory>('All')
  const [mode, setMode] = useState<'results' | 'atlas'>('results')
  const [explore, setExplore] = useState(false)
  const [query, setQuery] = useState('')
  const visibleTraits = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return report.traits.filter((trait) => {
      if (category !== 'All' && trait.category !== category) return false
      if (!explore && trait.evidence === 'Exploratory') return false
      if (!normalized) return true
      return [trait.title, trait.result, trait.summary, ...(trait.genes ?? []), ...(trait.chromosomes ?? [])].join(' ').toLowerCase().includes(normalized)
    })
  }, [category, explore, query, report.traits])
  const directCount = report.traits.filter((trait) => resultStateFor(trait) === 'observed').length
  const partialCount = report.traits.filter((trait) => resultStateFor(trait) === 'partial').length
  const unresolvedCount = report.traits.filter((trait) => resultStateFor(trait) === 'unresolved').length

  return (
    <main className="workspace consumer-workspace">
      <section className="consumer-intro"><div><span className="section-kicker">DISCOVER</span><h1>Traits and associations</h1><p>Your calculated results first, then the wider science library. Missing calls stay visibly unresolved.</p></div><button type="button" onClick={() => onNavigate('Summary')}><FileText size={17} /> Full summary</button></section>
      <ReportSourceStrip report={report} readsPresent={status.reads.present} />
      <section className="discover-metrics" aria-label="Trait result status">
        <span><strong>{report.traits.length}</strong><small>curated traits</small></span>
        <span className="observed"><strong>{directCount}</strong><small>directly observed</small></span>
        <span className="partial"><strong>{partialCount}</strong><small>partial panels</small></span>
        <span className="unresolved"><strong>{unresolvedCount}</strong><small>need complete calls</small></span>
        <p><Info size={16} /><span>The GWAS Catalog contains over a million published top associations. This studio shows only results with a responsible interpretation path.</span></p>
      </section>
      <div className="discovery-controls">
        <div className="studio-mode" role="tablist" aria-label="Discovery mode">
          <button className={mode === 'results' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'results'} onClick={() => setMode('results')}>My results</button>
          <button className={mode === 'atlas' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'atlas'} onClick={() => setMode('atlas')}>Analysis library</button>
        </div>
        <div className="evidence-lens"><span><strong>{explore ? 'Explore associations' : 'Evidence first'}</strong><small>{explore ? 'Includes early and low-predictive signals' : 'Hides exploratory-only results'}</small></span><button className={explore ? 'toggle active' : 'toggle'} type="button" role="switch" aria-checked={explore} onClick={() => setExplore((current) => !current)} aria-label="Toggle exploratory associations"><i /></button><TermTip compact term="Evidence lens" definition="Evidence first shows stronger or moderate results. Explore also shows reproducible but weak, ancestry-sensitive, or individually low-predictive associations." /></div>
      </div>
      {report.state === 'missing' ? <MissingReport loading={loading} onRefresh={onRefresh} /> : (
        mode === 'atlas' ? <GenomeAtlas readsPresent={status.reads.present} onExploreResults={() => setMode('results')} /> : <section className="trait-canvas result-browser">
          <div className="result-toolbar">
            <div className="consumer-tabs" role="tablist" aria-label="Trait categories">
              {(['All', ...categories] as const).map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} role="tab" aria-selected={category === item} type="button">{item}</button>)}
            </div>
            <label className="trait-search"><span>Search results</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Trait, gene, chromosome" /></label>
          </div>
          {visibleTraits.length ? <EvidenceList traits={visibleTraits} /> : <section className="exploration-gate"><Sparkles size={25} /><div><h3>No matching results</h3><p>Change the category, search, or evidence lens.</p></div></section>}
        </section>
      )}
    </main>
  )
}

function ClinicalFindingRow({ finding }: { finding: ClinicalFinding }) {
  const clinVarUrl = `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(`${finding.gene} ${finding.variant}`)}`
  return (
    <details className="clinical-finding-row">
      <summary>
        <span className="clinical-gene">{finding.gene}</span>
        <span><strong>{finding.associatedCondition}</strong><small>{finding.variant}</small></span>
        <span className={`clinical-class ${finding.classification.toLowerCase().replaceAll(' ', '-')}`}>{finding.classification}</span>
        <ArrowRight size={16} />
      </summary>
      <div className="clinical-finding-detail">
        <dl>
          <div><dt>Transcript</dt><dd>{finding.transcript}</dd></div>
          <div><dt>Zygosity</dt><dd>{finding.zygosity}</dd></div>
          <div><dt>Inheritance</dt><dd>{finding.inheritance}</dd></div>
        </dl>
        <div className="clinical-definition-row"><TermTip compact term={finding.classification} definition={clinicalDefinitions.classification} /><a href={clinVarUrl} target="_blank" rel="noreferrer">Check current ClinVar records <ExternalLink size={13} /></a></div>
        <p><strong>What the report means</strong>{finding.plainMeaning}</p>
        <p><strong>Follow-up written in the report</strong>{finding.reportFollowUp}</p>
      </div>
    </details>
  )
}

function ClinicalReportPanel({ clinicalReport, clinicalLoading, onRefreshClinical, privacyMode, onTogglePrivacy }: Pick<SummaryViewProps, 'clinicalReport' | 'clinicalLoading' | 'onRefreshClinical' | 'privacyMode' | 'onTogglePrivacy'>) {
  const ready = clinicalReport.state === 'ready'
  return (
    <section className="clinical-report-panel" aria-labelledby="clinical-report-title">
      <header>
        <div><span className="section-kicker">CLINICIAN-REVIEWED</span><h2 id="clinical-report-title"><HeartPulse size={20} /> Clinical report</h2><p>Imported from the interpreted WGS report. These labels are displayed as reported and are not recalculated by Zen Genome Studio.</p></div>
        <button className="privacy-command" type="button" onClick={onTogglePrivacy}>{privacyMode ? <Eye size={16} /> : <EyeOff size={16} />}{privacyMode ? 'Reveal private details' : 'Turn on privacy mode'}</button>
      </header>
      {!ready ? (
        <div className="clinical-empty"><ShieldCheck size={22} /><span><strong>{clinicalReport.mode === 'cloud' ? 'Private by design' : 'Clinical summary not connected'}</strong><small>{clinicalReport.sourceNote}</small></span>{clinicalReport.mode === 'local' && <button type="button" onClick={onRefreshClinical}><RefreshCw size={15} className={clinicalLoading ? 'spin' : ''} /> Check again</button>}</div>
      ) : privacyMode ? (
        <div className="clinical-privacy-lock"><ShieldCheck size={26} /><div><strong>Clinical details hidden</strong><p>Privacy mode conceals diagnoses, genes, variants, and finding counts. Reveal only when you are ready to view personal health information.</p></div></div>
      ) : (
        <div className="clinical-report-content">
          <div className="clinical-source-line"><span><FileText size={16} /> {clinicalReport.reportLabel}</span><span>{clinicalReport.reportDate ? `Report date ${clinicalReport.reportDate}` : 'Local report'}</span><b>Not recalculated</b></div>
          <div className="clinical-status-grid">
            <article><small>Primary findings</small><strong>{clinicalReport.primaryFindings.status}</strong><p>{clinicalReport.primaryFindings.note}</p></article>
            <article><small><TermTip compact term="ACMG secondary findings" definition={clinicalDefinitions.secondary} /></small><strong>{clinicalReport.secondaryFindings.status}</strong><span>{clinicalReport.secondaryFindings.panel}</span><p>{clinicalReport.secondaryFindings.note}</p></article>
          </div>
          <div className="clinical-evidence-links"><span>Interpretation context</span><a href={CLINVAR_CLASSIFICATION_URL} target="_blank" rel="noreferrer">ClinVar classification terms <ExternalLink size={12} /></a><a href={ACMG_SECONDARY_URL} target="_blank" rel="noreferrer">ACMG SF v3.3 <ExternalLink size={12} /></a></div>
          <section className="clinical-group">
            <div><span><strong><TermTip compact term="Incidental findings" definition={clinicalDefinitions.incidental} /></strong><small>Clinically relevant findings unrelated to the original reason for testing.</small></span><b>{clinicalReport.incidentalFindings.length}</b></div>
            {clinicalReport.incidentalFindings.map((finding) => <ClinicalFindingRow finding={finding} key={finding.id} />)}
          </section>
          <section className="clinical-group">
            <div><span><strong><TermTip compact term="Carrier findings" definition={clinicalDefinitions.carrier} /></strong><small>One altered copy in a recessive-disease gene; a carrier result is not the same as having that recessive condition.</small></span><b>{clinicalReport.carrierFindings.length}</b></div>
            {clinicalReport.carrierFindings.map((finding) => <ClinicalFindingRow finding={finding} key={finding.id} />)}
          </section>
          <details className="clinical-limitations"><summary>Report limitations <ArrowRight size={15} /></summary><ul>{clinicalReport.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
        </div>
      )}
    </section>
  )
}

export function SummaryView({ report, loading, onRefresh, onNavigate, clinicalReport, clinicalLoading, onRefreshClinical, privacyMode, onTogglePrivacy }: SummaryViewProps) {
  const grouped = categories.map((category) => ({ category, traits: report.traits.filter((trait) => trait.category === category) }))
  return (
    <main className="workspace consumer-workspace">
      <section className="consumer-intro summary-intro"><div><h1>Your genome, in plain English</h1><p>The useful highlights first. Evidence and limitations stay attached.</p></div><button type="button" onClick={() => window.print()}><FileText size={17} /> Print or save</button></section>
      <ReportSourceStrip report={report} />
      <div className="summary-grid">
        <section className="summary-paper">
          <ClinicalReportPanel clinicalReport={clinicalReport} clinicalLoading={clinicalLoading} onRefreshClinical={onRefreshClinical} privacyMode={privacyMode} onTogglePrivacy={onTogglePrivacy} />
          {report.state === 'missing' ? <MissingReport loading={loading} onRefresh={onRefresh} /> : (
            <>
            <header><h2>The short version</h2><p>{report.caveat}</p></header>
            <div className="summary-lead">
              {report.quickRead.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>)}
            </div>
            {grouped.map(({ category, traits }) => (
              <section className="summary-section" key={category}>
                <h3>{category}</h3>
                {traits.map((trait) => <article key={trait.id}><div><strong><TraitTitle trait={trait} /></strong><EvidenceTag level={trait.evidence} /></div><h4>{trait.result}</h4><p>{trait.summary}</p><a href={trait.sourceUrl} target="_blank" rel="noreferrer">{trait.sourceName}</a></article>)}
              </section>
            ))}
            </>
          )}
        </section>
        <aside className="summary-rail">
          <h2>How to read this</h2>
          <div><EvidenceTag level="Strong" /><p>Validated model or a marker with a large, repeatedly observed effect.</p></div>
          <div><EvidenceTag level="Moderate" /><p>Useful signal, but several genes or life factors can change the outcome.</p></div>
          <div><EvidenceTag level="Exploratory" /><p>Interesting biology, not a prediction or a basis for training decisions.</p></div>
          <section><Info size={18} /><p>Clinical findings come from the interpreted laboratory report. Consumer traits and PGS results are separate evidence layers and never override it.</p></section>
          <button type="button" onClick={() => onNavigate('Discover')}><ArrowRight size={17} /> Back to Discover</button>
        </aside>
      </div>
    </main>
  )
}
