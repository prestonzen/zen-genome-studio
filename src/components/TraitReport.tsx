import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Coffee,
  Database,
  Dumbbell,
  Ear,
  Eye,
  FileText,
  Info,
  Milk,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Utensils,
} from 'lucide-react'
import type { EvidenceLevel, TraitCategory, TraitReport, TraitResult, ViewName } from '../types'

type TraitReportProps = {
  report: TraitReport
  loading: boolean
  onRefresh: () => void
  onNavigate: (view: ViewName) => void
}

const categories: TraitCategory[] = ['Appearance', 'Senses & food', 'Performance']

function TraitIcon({ id, size = 22 }: { id: string; size?: number }) {
  if (id === 'eye-colour') return <Eye size={size} />
  if (id === 'hair-pigmentation') return <Sparkles size={size} />
  if (id === 'freckling') return <Sun size={size} />
  if (id === 'lactose') return <Milk size={size} />
  if (id.includes('caffeine')) return <Coffee size={size} />
  if (id === 'bitter-taste') return <Utensils size={size} />
  if (id === 'earwax') return <Ear size={size} />
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

function ReportSourceStrip({ report }: { report: TraitReport }) {
  const demo = report.state === 'demo'
  return (
    <div className="report-source-strip">
      <div><FileText size={25} /><span><strong>{report.reportLabel}</strong><small>{report.sourceNote}</small></span></div>
      <div><Database size={25} /><span><strong>{report.build}</strong><small>Human reference</small></span></div>
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
          <span>{leading.toFixed(1)}% leading probability</span>
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
        <div><h3>{trait.title}</h3><p>{trait.markerCount} marker{trait.markerCount === 1 ? '' : 's'} reviewed</p></div>
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
          return (
            <article className="evidence-row" key={trait.id}>
              <TraitIcon id={trait.id} />
              <div><strong>{trait.title}</strong><small>{trait.result}</small></div>
              <p>{trait.summary}</p>
              <div className="evidence-meta"><span>{trait.markerCount} marker{trait.markerCount === 1 ? '' : 's'}</span><EvidenceTag level={trait.evidence} /></div>
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

export function DiscoverView({ report, loading, onRefresh, onNavigate }: TraitReportProps) {
  const [category, setCategory] = useState<TraitCategory>('Appearance')
  const visibleTraits = useMemo(() => report.traits.filter((trait) => trait.category === category), [category, report.traits])
  const eye = report.traits.find((trait) => trait.id === 'eye-colour')
  const hair = report.traits.find((trait) => trait.id === 'hair-pigmentation')
  const freckles = report.traits.find((trait) => trait.id === 'freckling')

  return (
    <main className="workspace consumer-workspace">
      <section className="consumer-intro"><div><h1>Discover your everyday genetics</h1><p>Appearance, senses and performance signals - explained without the jargon.</p></div></section>
      <ReportSourceStrip report={report} />
      {report.state === 'missing' ? <MissingReport loading={loading} onRefresh={onRefresh} /> : (
        <div className="consumer-grid">
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
            ) : <EvidenceList traits={visibleTraits} />}
          </section>
          <QuickRead report={report} onNavigate={onNavigate} />
        </div>
      )}
    </main>
  )
}

export function SummaryView({ report, loading, onRefresh, onNavigate }: TraitReportProps) {
  const grouped = categories.map((category) => ({ category, traits: report.traits.filter((trait) => trait.category === category) }))
  return (
    <main className="workspace consumer-workspace">
      <section className="consumer-intro summary-intro"><div><h1>Your genome, in plain English</h1><p>The useful highlights first. Evidence and limitations stay attached.</p></div><button type="button" onClick={() => window.print()}><FileText size={17} /> Print or save</button></section>
      <ReportSourceStrip report={report} />
      {report.state === 'missing' ? <MissingReport loading={loading} onRefresh={onRefresh} /> : (
        <div className="summary-grid">
          <section className="summary-paper">
            <header><h2>The short version</h2><p>{report.caveat}</p></header>
            <div className="summary-lead">
              {report.quickRead.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>)}
            </div>
            {grouped.map(({ category, traits }) => (
              <section className="summary-section" key={category}>
                <h3>{category}</h3>
                {traits.map((trait) => <article key={trait.id}><div><strong>{trait.title}</strong><EvidenceTag level={trait.evidence} /></div><h4>{trait.result}</h4><p>{trait.summary}</p><a href={trait.sourceUrl} target="_blank" rel="noreferrer">{trait.sourceName}</a></article>)}
              </section>
            ))}
          </section>
          <aside className="summary-rail">
            <h2>How to read this</h2>
            <div><EvidenceTag level="Strong" /><p>Validated model or a marker with a large, repeatedly observed effect.</p></div>
            <div><EvidenceTag level="Moderate" /><p>Useful signal, but several genes or life factors can change the outcome.</p></div>
            <div><EvidenceTag level="Exploratory" /><p>Interesting biology, not a prediction or a basis for training decisions.</p></div>
            <section><Info size={18} /><p>Medical carrier and incidental findings belong in the clinician-reviewed report. This page intentionally focuses on non-medical traits.</p></section>
            <button type="button" onClick={() => onNavigate('Discover')}><ArrowRight size={17} /> Back to Discover</button>
          </aside>
        </div>
      )}
    </main>
  )
}
