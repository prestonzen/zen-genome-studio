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

function QuickIcon({ index }: { index: number }) {
  if (index === 0) return <Eye size={23} />
  if (index === 1) return <Sparkles size={23} />
  if (index === 2) return <Milk size={23} />
  if (index === 3) return <Dumbbell size={23} />
  return <Info size={23} />
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

function TraitTitle({ trait }: { trait: TraitResult }) {
  const definition = traitDefinitions[trait.id]
  return definition ? <TermTip compact term={trait.title} definition={definition} /> : <>{trait.title}</>
}

function markerCoverage(trait: TraitResult) {
  const match = trait.callNote.match(/^(\d+)/)
  if (!match) return null
  const direct = Number(match[1])
  return { direct, percent: trait.markerCount ? Math.round(direct / trait.markerCount * 100) : 0 }
}

function ReportSourceStrip({ report, readsPresent }: { report: TraitReport; readsPresent?: boolean }) {
  const demo = report.state === 'demo'
  return (
    <div className="report-source-strip">
      <div><FileText size={25} /><span><strong>{report.reportLabel}</strong><small>{report.sourceNote}</small></span></div>
      <div><Database size={25} /><span><strong>{readsPresent === undefined ? report.build : readsPresent ? 'Raw reads detected' : 'Reads not configured'}</strong><small>{readsPresent === undefined ? 'Human reference' : readsPresent ? 'Available for deeper local analysis' : 'VCF results still available'}</small></span></div>
      <div><ShieldCheck size={25} /><span><strong>{demo ? 'Demo only' : 'Local only'}</strong><small>{demo ? 'No personal genome loaded' : 'Your data stays on this device'}</small></span></div>
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

function EyeFeature({ report, trait }: { report: TraitReport; trait: TraitResult }) {
  const probabilities = report.eyeProbabilities ?? { brown: 0, intermediate: 0, blue: 0 }
  const rows = [
    { label: 'Brown', value: probabilities.brown, className: 'brown' },
    { label: 'Intermediate', value: probabilities.intermediate, className: 'intermediate' },
    { label: 'Blue', value: probabilities.blue, className: 'blue' },
  ]
  const leading = Math.max(...rows.map((row) => row.value))

  return (
    <article className="eye-feature">
      <div className="trait-heading">
        <div><h3>Eye colour</h3><p>Six-marker IrisPlex model</p></div>
        <EvidenceTag level={trait.evidence} />
      </div>
      <div className="eye-result-grid">
        <img src="/assets/hazel-iris.webp" alt="Brown and hazel iris reference visualization" />
        <div className="eye-score">
          <small>Most likely result</small>
          <strong>{trait.result}</strong>
          <span><TermTip compact term={`${leading.toFixed(1)}% model probability`} definition="A probability produced by the complete six-marker IrisPlex model. Most single-marker traits do not have a calibrated percentage like this." /></span>
          <div className="probability-list">
            {rows.map((row) => (
              <div className="probability-row" key={row.label}>
                <label>{row.label}</label>
                <span className="probability-track"><i className={row.className} style={{ width: `${Math.max(row.value, 1)}%` }} /></span>
                <b>{row.value.toFixed(1)}%</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="trait-explanation">{trait.summary}</p>
      <small className="call-note">{trait.callNote}</small>
    </article>
  )
}

function TraitSpotlight({ trait }: { trait: TraitResult }) {
  return (
    <article className="trait-spotlight">
      <div className="trait-heading">
        <div><h3><TraitTitle trait={trait} /></h3><p>{trait.markerCount} marker{trait.markerCount === 1 ? '' : 's'} reviewed</p></div>
        <EvidenceTag level={trait.evidence} />
      </div>
      {trait.id === 'hair-pigmentation' && (
        <div className="hair-swatches" aria-label="Hair pigmentation spectrum">
          {['#22170f', '#4a2f1d', '#795133', '#b38658'].map((color, index) => <i key={color} style={{ background: color }} className={index === 1 ? 'selected' : ''} />)}
        </div>
      )}
      <div className="spotlight-result"><TraitIcon id={trait.id} size={28} /><span><small>Result</small><strong>{trait.result}</strong></span></div>
      <p>{trait.summary}</p>
      <small className="call-note">{trait.callNote}</small>
    </article>
  )
}

function EvidenceList({ traits }: { traits: TraitResult[] }) {
  return (
    <section className="evidence-list">
      <div className="evidence-header"><div><h3>Evidence details</h3><p>What the model looked at and how much weight to give it.</p></div><span>{traits.length} results</span></div>
      <div className="evidence-rows">
        {traits.map((trait) => {
          const coverage = markerCoverage(trait)
          return (
            <article className="evidence-row" key={trait.id}>
              <TraitIcon id={trait.id} />
              <div><strong><TraitTitle trait={trait} /></strong><small>{trait.result}</small></div>
              <p>{trait.summary}</p>
              <div className="evidence-meta">{coverage ? <span className="coverage-meter" title={`${coverage.direct} of ${trait.markerCount} markers directly observed`}><i><b style={{ width: `${coverage.percent}%` }} /></i>{coverage.direct}/{trait.markerCount} direct</span> : <span>Reference example</span>}<EvidenceTag level={trait.evidence} /></div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function QuickRead({ report, onNavigate }: Pick<TraitReportProps, 'report' | 'onNavigate'>) {
  return (
    <aside className="quick-read">
      <h2>Your quick read</h2>
      <div className="quick-points">
        {report.quickRead.map((item, index) => {
          return <div key={item}><QuickIcon index={index} /><p>{item}</p></div>
        })}
      </div>
      <button type="button" onClick={() => onNavigate('Summary')}><FileText size={18} /> View full summary <ArrowRight size={18} /></button>
      <section className="privacy-proof">
        <h3><ShieldCheck size={17} /> Your data stays private</h3>
        <p>{report.state === 'demo' ? 'This public preview uses fictional results.' : 'The report was generated and loaded on this computer.'}</p>
      </section>
      <section className="honesty-note"><Info size={19} /><div><strong>Traits are tendencies, not guarantees.</strong><p>Environment, age, habits and many unmeasured variants still matter.</p></div></section>
    </aside>
  )
}

type DiscoverViewProps = TraitReportProps & { status: LocalStatus }

export function DiscoverView({ report, status, loading, onRefresh, onNavigate }: DiscoverViewProps) {
  const [category, setCategory] = useState<TraitCategory>('Appearance')
  const [mode, setMode] = useState<'results' | 'atlas'>('results')
  const [explore, setExplore] = useState(false)
  const visibleTraits = useMemo(() => report.traits.filter((trait) => trait.category === category && (explore || trait.evidence !== 'Exploratory')), [category, explore, report.traits])
  const eye = report.traits.find((trait) => trait.id === 'eye-colour')
  const hair = report.traits.find((trait) => trait.id === 'hair-pigmentation')
  const freckles = report.traits.find((trait) => trait.id === 'freckling')

  return (
    <main className="workspace consumer-workspace">
      <section className="consumer-intro"><div><span className="section-kicker">DISCOVER</span><h1>What your DNA can reveal</h1><p>Everyday traits, model limits, and deeper read-level analyses - in plain language.</p></div></section>
      <ReportSourceStrip report={report} readsPresent={status.reads.present} />
      <div className="discovery-controls">
        <div className="studio-mode" role="tablist" aria-label="Discovery mode">
          <button className={mode === 'results' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'results'} onClick={() => setMode('results')}>My results</button>
          <button className={mode === 'atlas' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'atlas'} onClick={() => setMode('atlas')}>Genome atlas</button>
        </div>
        <div className="evidence-lens"><span><strong>{explore ? 'Explore associations' : 'Evidence first'}</strong><small>{explore ? 'Includes early and low-predictive signals' : 'Hides exploratory-only results'}</small></span><button className={explore ? 'toggle active' : 'toggle'} type="button" role="switch" aria-checked={explore} onClick={() => setExplore((current) => !current)} aria-label="Toggle exploratory associations"><i /></button><TermTip compact term="Evidence lens" definition="Evidence first shows stronger or moderate results. Explore also shows reproducible but weak, ancestry-sensitive, or individually low-predictive associations." /></div>
      </div>
      {report.state === 'missing' ? <MissingReport loading={loading} onRefresh={onRefresh} /> : (
        mode === 'atlas' ? <GenomeAtlas readsPresent={status.reads.present} onExploreResults={() => setMode('results')} /> : <div className="consumer-grid">
          <section className="trait-canvas">
            <div className="consumer-tabs" role="tablist" aria-label="Trait categories">
              {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} role="tab" aria-selected={category === item} type="button">{item}</button>)}
              <span>{report.state === 'demo' ? 'Reference demo' : 'Private result'}</span>
            </div>
            {category === 'Appearance' && eye && hair && freckles ? (
              <>
                <div className="appearance-grid"><EyeFeature report={report} trait={eye} /><div className="appearance-secondary"><TraitSpotlight trait={hair} /><TraitSpotlight trait={freckles} /></div></div>
                <EvidenceList traits={visibleTraits} />
              </>
            ) : visibleTraits.length ? <EvidenceList traits={visibleTraits} /> : <section className="exploration-gate"><Sparkles size={25} /><div><h3>This category is exploratory</h3><p>Turn on <strong>Explore associations</strong> to see these signals with their limitations attached.</p></div></section>}
          </section>
          <QuickRead report={report} onNavigate={onNavigate} />
        </div>
      )}
    </main>
  )
}

function ClinicalFindingRow({ finding }: { finding: ClinicalFinding }) {
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
            <article><small>ACMG secondary findings</small><strong>{clinicalReport.secondaryFindings.status}</strong><span>{clinicalReport.secondaryFindings.panel}</span><p>{clinicalReport.secondaryFindings.note}</p></article>
          </div>
          <section className="clinical-group">
            <div><span><strong>Incidental findings</strong><small>Clinically relevant findings unrelated to the original reason for testing.</small></span><b>{clinicalReport.incidentalFindings.length}</b></div>
            {clinicalReport.incidentalFindings.map((finding) => <ClinicalFindingRow finding={finding} key={finding.id} />)}
          </section>
          <section className="clinical-group">
            <div><span><strong>Carrier findings</strong><small>One altered copy in a recessive-disease gene; a carrier result is not the same as having that recessive condition.</small></span><b>{clinicalReport.carrierFindings.length}</b></div>
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
