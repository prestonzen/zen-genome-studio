import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Dna,
  Download,
  Gauge,
  Layers3,
  LoaderCircle,
  Microscope,
  Ruler,
} from 'lucide-react'
import { chromosomes, type ChromosomeInfo } from '../data/chromosomes'
import { genomeRegions, polygenicModels, type GenomeRegion } from '../data/genomeRegions'
import { heightPgsModel } from '../data/pgsCatalog'
import type { LandscapeTab, PgsResult, TraitReport } from '../types'
import { TermTip } from './TermTip'

type ChromosomeLandscapeProps = {
  activeTab: LandscapeTab
  onTabChange: (tab: LandscapeTab) => void
  selected: string
  onSelect: (chromosome: string) => void
  report: TraitReport
}

const maxLength = chromosomes[0].length

function ChromosomeBody({ index }: { index: number }) {
  return <span className="chromosome-body" aria-hidden="true">{Array.from({ length: 12 }, (_, band) => <i key={band} className={(band + index) % 3 === 0 ? 'band dark' : (band + index) % 4 === 0 ? 'band mid' : 'band light'} />)}</span>
}

function ChromosomeDetail({ chromosome, regionCount }: { chromosome: ChromosomeInfo; regionCount: number }) {
  return (
    <article className="region-detail chromosome-overview" aria-live="polite">
      <header><div><span>CHROMOSOME OVERVIEW</span><h3>Chromosome {chromosome.name}</h3><p>{chromosome.title}</p></div><Ruler size={24} /></header>
      <p>{chromosome.summary}</p>
      <div className="chromosome-examples"><strong>Examples on this chromosome</strong>{chromosome.examples.map((example) => <span key={example}>{example}</span>)}</div>
      <div className="region-interpretation"><Dna size={18} /><p><strong>How to read this map</strong>A chromosome holds hundreds or thousands of genes and regulatory regions. The {regionCount} marked item{regionCount === 1 ? '' : 's'} here are curated examples, not everything this chromosome does.</p></div>
    </article>
  )
}

function RegionDetail({ region, report, onBack }: { region: GenomeRegion; report: TraitReport; onBack: () => void }) {
  const trait = region.traitId ? report.traits.find((item) => item.id === region.traitId) : undefined
  return (
    <article className="region-detail" aria-live="polite">
      <button className="region-back" type="button" onClick={onBack}><ChevronLeft size={14} /> Chromosome overview</button>
      <header>
        <div><span>{region.category}</span><h3>{region.symbol}</h3><p>{region.title}</p></div>
        <a href={region.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open evidence for ${region.symbol}`}><ArrowUpRight size={17} /></a>
      </header>
      <p>{region.summary}</p>
      <div className="region-interpretation"><Microscope size={18} /><p><strong>What it can tell you</strong>{region.interpretation}</p></div>
      {trait ? <div className="region-result"><span>Your current report</span><strong>{trait.result}</strong><small>{trait.callNote}</small></div> : <div className="region-result neutral"><span>Your current report</span><strong>No personal result calculated here</strong><small>This region needs a specialized caller or a complete validated model.</small></div>}
    </article>
  )
}

function GenomeMap({ selected, onSelect, report }: Pick<ChromosomeLandscapeProps, 'selected' | 'onSelect' | 'report'>) {
  const chosen = chromosomes.find((item) => item.name === selected) ?? chromosomes[10]
  const regions = useMemo(() => genomeRegions.filter((item) => item.chromosome === chosen.name), [chosen.name])
  const [selectedRegionId, setSelectedRegionId] = useState('')
  const selectedRegion = regions.find((item) => item.id === selectedRegionId)

  return (
    <>
      <div className="landscape-legend" aria-label="Visualization legend"><span><i className="legend-dot cyan" />Curated example</span><span><i className="legend-outline" />Selected chromosome</span><span>Choose any chromosome for an explanation</span></div>
      <div className="chromosome-grid" aria-label="Human chromosomes">
        {chromosomes.map((chromosome, index) => {
          const height = 56 + Math.round((chromosome.length / maxLength) * 112)
          const active = chromosome.name === selected
          const regionCount = genomeRegions.filter((region) => region.chromosome === chromosome.name).length
          return (
            <button className={active ? 'chromosome active' : 'chromosome'} key={chromosome.name} onClick={() => onSelect(chromosome.name)} type="button" aria-label={`Select chromosome ${chromosome.name}: ${chromosome.title}`} aria-pressed={active}>
              <span className="chromosome-plot" style={{ height }}><ChromosomeBody index={index} />{regionCount > 0 && <i className="marker cyan" style={{ top: `${22 + ((index * 13) % 55)}%` }} />}</span>
              <span className="chromosome-label">{chromosome.name}</span>{regionCount > 0 && <small>{regionCount}</small>}
            </button>
          )
        })}
      </div>
      <div className="genome-detail-grid">
        <section className="detail-track">
          <div className="detail-heading"><strong>Chromosome {chosen.name}</strong><span>{(chosen.length / 1_000_000).toFixed(1)} million DNA letters</span><small>{regions.length} CURATED EXAMPLE{regions.length === 1 ? '' : 'S'}</small></div>
          <div className="track-stage" aria-label={`Curated regions on chromosome ${chosen.name}`}>
            <div className="track-bands">{Array.from({ length: 20 }, (_, index) => <i key={index} className={index % 3 === 0 ? 'dark' : index % 4 === 0 ? 'mid' : 'light'} />)}</div>
            {regions.map((region) => <button key={region.id} className={selectedRegion?.id === region.id ? 'gene-marker active' : 'gene-marker'} style={{ left: `${Math.min(98, Math.max(2, region.positionMb / (chosen.length / 1_000_000) * 100))}%` }} type="button" onClick={() => setSelectedRegionId(region.id)} aria-label={`Explore ${region.symbol}: ${region.title}`} aria-pressed={selectedRegion?.id === region.id}><i /><span>{region.symbol}</span></button>)}
          </div>
          <div className="axis"><span>Start</span><span>Middle</span><span>End</span></div>
          <div className="region-selector" aria-label="Chromosome and curated region details">
            <button className={!selectedRegion ? 'active' : ''} type="button" onClick={() => setSelectedRegionId('')}>Overview<ChevronRight size={14} /></button>
            {regions.map((region) => <button className={selectedRegion?.id === region.id ? 'active' : ''} key={region.id} type="button" onClick={() => setSelectedRegionId(region.id)}>{region.symbol}<ChevronRight size={14} /></button>)}
          </div>
        </section>
        {selectedRegion ? <RegionDetail region={selectedRegion} report={report} onBack={() => setSelectedRegionId('')} /> : <ChromosomeDetail chromosome={chosen} regionCount={regions.length} />}
      </div>
    </>
  )
}

type PgsModelState = {
  mode: 'local' | 'cloud'
  installed: boolean
  bytes?: number
  installedAt?: string
  model: typeof heightPgsModel
  note?: string
  error?: string
}

const missingPgsResult: PgsResult = {
  state: 'missing', mode: 'local', modelId: heightPgsModel.id, trait: 'Standing height', modelVariants: heightPgsModel.variants,
  matchedVariants: 0, coveragePercent: 0, weightCoveragePercent: 0,
  interpretation: 'No personal calculation has been run.', nextStep: 'Calculate against the private VCF.', sourceNote: 'No result yet.',
}

function PolygenicView() {
  const [selectedId, setSelectedId] = useState(polygenicModels[0].id)
  const [pgsState, setPgsState] = useState<PgsModelState | null>(null)
  const [result, setResult] = useState<PgsResult>(missingPgsResult)
  const [installing, setInstalling] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const selected = polygenicModels.find((model) => model.id === selectedId) ?? polygenicModels[0]

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetch('/api/pgs-model', { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject(new Error('Model status failed'))),
      fetch('/api/pgs-result', { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject(new Error('Result status failed'))),
    ]).then(([modelState, scoreResult]: [PgsModelState, PgsResult]) => { setPgsState(modelState); setResult(scoreResult) }).catch((error) => {
      if (error instanceof Error && error.name !== 'AbortError') setPgsState(null)
    })
    return () => controller.abort()
  }, [])

  async function installHeightModel() {
    setInstalling(true)
    try {
      const response = await fetch('/api/pgs-model', { method: 'POST', headers: { 'X-Zen-Local': '1' } })
      setPgsState(await response.json() as PgsModelState)
    } catch {
      setPgsState((current) => current ? { ...current, error: 'The model download could not be completed.' } : null)
    } finally { setInstalling(false) }
  }

  async function calculateHeightScore() {
    setCalculating(true)
    try {
      const response = await fetch('/api/pgs-result', { method: 'POST', headers: { 'X-Zen-Local': '1' } })
      setResult(await response.json() as PgsResult)
    } catch {
      setResult({ ...missingPgsResult, state: 'error', error: 'The private VCF could not be scored.' })
    } finally { setCalculating(false) }
  }

  const hasResult = result.state === 'ready'
  const heightReadiness = hasResult ? Math.max(8, result.coveragePercent) : pgsState?.installed ? 45 : polygenicModels[0].readiness

  return (
    <div className="polygenic-view">
      <header><div><Gauge size={24} /><span><strong>Polygenic results</strong><small><TermTip compact term="Polygenic score" definition="A weighted total built from many DNA variants. It estimates a tendency relative to a comparison group, not a destiny or diagnosis." /></small></span></div><p>Real calculations show coverage first. A percentile appears only after a matching reference population is available.</p></header>
      <div className="polygenic-grid">
        <div className="polygenic-list">
          {polygenicModels.map((model) => <button key={model.id} className={selected.id === model.id ? 'active' : ''} onClick={() => setSelectedId(model.id)} type="button" aria-expanded={selected.id === model.id}><span><strong>{model.title}</strong><small>{model.id === 'height-pgs' ? '62,419 variants' : model.scale}</small></span><i><b style={{ width: `${model.id === 'height-pgs' ? heightReadiness : model.readiness}%` }} /></i><em>{model.id === 'height-pgs' && hasResult ? `${result.coveragePercent}% measured` : model.id === 'height-pgs' && pgsState?.installed ? 'Ready to calculate' : model.status}</em><ChevronRight size={16} /></button>)}
        </div>
        <article className="polygenic-detail">
          <span>SELECTED MODEL</span><h3>{selected.title}</h3><b>{selected.id === 'height-pgs' && hasResult ? 'Personal calculation available' : selected.status}</b><p>{selected.summary}</p>
          {selected.id === 'height-pgs' && hasResult ? (
            <section className="pgs-result-card">
              <header><span><small>OBSERVED WEIGHTED SCORE</small><strong>{result.weightedScore?.toFixed(4)}</strong></span><b>Partial result</b></header>
              <div className="pgs-metrics"><span><strong>{result.matchedVariants.toLocaleString()}</strong><small>of {result.modelVariants.toLocaleString()} model variants directly present</small></span><span><strong>{result.coveragePercent}%</strong><small>direct genotype coverage</small></span><span><strong>{result.weightCoveragePercent}%</strong><small>model weight represented</small></span><span><strong>{result.effectAlleles?.toLocaleString()}</strong><small>effect-allele copies counted</small></span></div>
              <div className="pgs-coverage"><span><i style={{ width: `${result.coveragePercent}%` }} /></span><small>Directly observed in the variant-only VCF</small></div>
              <p><strong>What this number means</strong>{result.interpretation}</p><p><strong>Why there is no percentile yet</strong>{result.nextStep}</p>
              <button type="button" onClick={calculateHeightScore} disabled={calculating}>{calculating ? <LoaderCircle className="spin" size={14} /> : <Gauge size={14} />}{calculating ? 'Recalculating' : 'Recalculate from VCF'}</button>
            </section>
          ) : selected.id === 'height-pgs' ? (
            <section className={pgsState?.installed ? 'pgs-installer installed' : 'pgs-installer'}>
              <header><div><Download size={17} /><span><strong>{pgsState?.installed ? `${heightPgsModel.id} is ready` : `Add ${heightPgsModel.id}`}</strong><small>{heightPgsModel.variants.toLocaleString()} public weights · {heightPgsModel.build}</small></span></div><button type="button" onClick={pgsState?.installed ? calculateHeightScore : installHeightModel} disabled={installing || calculating || pgsState?.mode === 'cloud'}>{installing || calculating ? <LoaderCircle className="spin" size={14} /> : pgsState?.installed ? <Gauge size={14} /> : <Download size={14} />}{installing ? 'Adding model' : calculating ? 'Calculating' : pgsState?.installed ? 'Calculate my score' : 'Add locally'}</button></header>
              <p>{result.error || pgsState?.error || pgsState?.note || 'The public score definition is local. Calculation reads the private VCF without uploading it.'}</p>
            </section>
          ) : <div><Layers3 size={19} /><p><strong>What is still needed</strong>{selected.next}</p></div>}
          <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open model source <ArrowUpRight size={15} /></a>
        </article>
      </div>
    </div>
  )
}

export function ChromosomeLandscape(props: ChromosomeLandscapeProps) {
  const tabs: LandscapeTab[] = ['Genome map', 'Polygenic']
  return (
    <section className="landscape-panel interactive-landscape">
      <div className="landscape-header"><div><h2>Genome explorer</h2><p>Choose a chromosome for plain-English context, then open a marked region for personal results.</p></div><span className="preview-label">INTERACTIVE</span></div>
      <div className="tab-list" role="tablist" aria-label="Genome explorer views">{tabs.map((tab) => <button key={tab} className={props.activeTab === tab ? 'active' : ''} onClick={() => props.onTabChange(tab)} role="tab" aria-selected={props.activeTab === tab} type="button">{tab}</button>)}</div>
      <div className="landscape-content">{props.activeTab === 'Genome map' ? <GenomeMap selected={props.selected} onSelect={props.onSelect} report={props.report} /> : <PolygenicView />}</div>
    </section>
  )
}
