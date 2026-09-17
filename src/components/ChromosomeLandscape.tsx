import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Database,
  Dna,
  FileSearch,
  Gauge,
  Layers3,
  LoaderCircle,
  Microscope,
  ScanSearch,
  Wrench,
} from 'lucide-react'
import { chromosomes } from '../data/chromosomes'
import { genomeRegions, polygenicModels, type GenomeRegion } from '../data/genomeRegions'
import type { LandscapeTab, LocalStatus, TraitReport } from '../types'
import { TermTip } from './TermTip'

type ChromosomeLandscapeProps = {
  activeTab: LandscapeTab
  onTabChange: (tab: LandscapeTab) => void
  selected: string
  onSelect: (chromosome: string) => void
  report: TraitReport
  status: LocalStatus
}

const maxLength = chromosomes[0].length

function ChromosomeBody({ index }: { index: number }) {
  return (
    <span className="chromosome-body" aria-hidden="true">
      {Array.from({ length: 12 }, (_, band) => (
        <i key={band} className={(band + index) % 3 === 0 ? 'band dark' : (band + index) % 4 === 0 ? 'band mid' : 'band light'} />
      ))}
    </span>
  )
}

function RegionDetail({ region, report }: { region: GenomeRegion; report: TraitReport }) {
  const trait = region.traitId ? report.traits.find((item) => item.id === region.traitId) : undefined
  return (
    <article className="region-detail" aria-live="polite">
      <header>
        <div><span>{region.category}</span><h3>{region.symbol}</h3><p>{region.title}</p></div>
        <a href={region.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open evidence for ${region.symbol}`}><ArrowUpRight size={17} /></a>
      </header>
      <p>{region.summary}</p>
      <div className="region-interpretation"><Microscope size={18} /><p><strong>What it can tell you</strong>{region.interpretation}</p></div>
      {trait && <div className="region-result"><span>Your current report</span><strong>{trait.result}</strong><small>{trait.callNote}</small></div>}
    </article>
  )
}

function GenomeMap({ selected, onSelect, report }: Pick<ChromosomeLandscapeProps, 'selected' | 'onSelect' | 'report'>) {
  const chosen = chromosomes.find((item) => item.name === selected) ?? chromosomes[10]
  const regions = useMemo(() => genomeRegions.filter((item) => item.chromosome === chosen.name), [chosen.name])
  const [selectedRegionId, setSelectedRegionId] = useState(regions[0]?.id ?? '')

  const selectedRegion = regions.find((item) => item.id === selectedRegionId) ?? regions[0]

  return (
    <>
      <div className="landscape-legend" aria-label="Visualization legend">
        <span><i className="legend-dot coral" />Curated region</span>
        <span><i className="legend-dot cyan" />Trait result available</span>
        <span><i className="legend-outline" />Selected chromosome</span>
      </div>

      <div className="chromosome-grid" aria-label="Human chromosomes">
        {chromosomes.map((chromosome, index) => {
          const height = 56 + Math.round((chromosome.length / maxLength) * 112)
          const active = chromosome.name === selected
          const regionCount = genomeRegions.filter((region) => region.chromosome === chromosome.name).length
          return (
            <button className={active ? 'chromosome active' : 'chromosome'} key={chromosome.name} onClick={() => onSelect(chromosome.name)} type="button" aria-label={`Select chromosome ${chromosome.name}, ${regionCount} curated regions`}>
              <span className="chromosome-plot" style={{ height }}><ChromosomeBody index={index} />{regionCount > 0 && <i className="marker cyan" style={{ top: `${22 + ((index * 13) % 55)}%` }} />}</span>
              <span className="chromosome-label">{chromosome.name}</span>
              {regionCount > 0 && <small>{regionCount}</small>}
            </button>
          )
        })}
      </div>

      <div className="genome-detail-grid">
        <section className="detail-track">
          <div className="detail-heading"><strong>Chromosome {chosen.name}</strong><span>{(chosen.length / 1_000_000).toFixed(1)} Mb</span><small>{regions.length} CURATED REGION{regions.length === 1 ? '' : 'S'}</small></div>
          <div className="track-stage" aria-label={`Curated regions on chromosome ${chosen.name}`}>
            <div className="track-bands">{Array.from({ length: 20 }, (_, index) => <i key={index} className={index % 3 === 0 ? 'dark' : index % 4 === 0 ? 'mid' : 'light'} />)}</div>
            {regions.map((region) => (
              <button key={region.id} className={selectedRegion?.id === region.id ? 'gene-marker active' : 'gene-marker'} style={{ left: `${Math.min(98, Math.max(2, region.positionMb / (chosen.length / 1_000_000) * 100))}%` }} type="button" onClick={() => setSelectedRegionId(region.id)} aria-label={`Explore ${region.symbol}`} aria-expanded={selectedRegion?.id === region.id}><i /><span>{region.symbol}</span></button>
            ))}
          </div>
          <div className="axis"><span>0</span><span>{Math.round(chosen.length / 2_000_000)} Mb</span><span>{Math.round(chosen.length / 1_000_000)} Mb</span></div>
          {regions.length > 0 ? <div className="region-selector" aria-label="Curated genes and regions">{regions.map((region) => <button className={selectedRegion?.id === region.id ? 'active' : ''} key={region.id} type="button" onClick={() => setSelectedRegionId(region.id)}>{region.symbol}<ChevronRight size={14} /></button>)}</div> : <div className="no-regions"><ScanSearch size={18} /><span>No curated consumer-trait regions on this chromosome yet.</span></div>}
        </section>
        {selectedRegion ? <RegionDetail region={selectedRegion} report={report} /> : <aside className="region-detail empty"><Dna size={30} /><h3>Choose a marked chromosome</h3><p>Curated regions with explainable consumer-trait biology will appear here.</p></aside>}
      </div>
    </>
  )
}

function PolygenicView() {
  const [selected, setSelected] = useState(polygenicModels[0])
  return (
    <div className="polygenic-view">
      <header><div><Gauge size={24} /><span><strong>Polygenic workbench</strong><small><TermTip compact term="Polygenic score" definition="A weighted total built from many DNA variants. It estimates a tendency relative to a comparison group, not a destiny or diagnosis." /></small></span></div><p>No personal score is displayed until its inputs and comparison population are validated.</p></header>
      <div className="polygenic-grid">
        <div className="polygenic-list">
          {polygenicModels.map((model) => (
            <button key={model.id} className={selected.id === model.id ? 'active' : ''} onClick={() => setSelected(model)} type="button" aria-expanded={selected.id === model.id}>
              <span><strong>{model.title}</strong><small>{model.scale}</small></span><i><b style={{ width: `${model.readiness}%` }} /></i><em>{model.status}</em><ChevronRight size={16} />
            </button>
          ))}
        </div>
        <article className="polygenic-detail">
          <span>SELECTED MODEL</span><h3>{selected.title}</h3><b>{selected.status}</b><p>{selected.summary}</p>
          <div><Layers3 size={19} /><p><strong>What happens next</strong>{selected.next}</p></div>
          <ol><li><i>1</i>Match variants and effect alleles</li><li><i>2</i>Calculate the weighted dosage sum</li><li><i>3</i>Normalize against a relevant population</li><li><i>4</i>Report uncertainty and missing coverage</li></ol>
          <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open model source <ArrowUpRight size={15} /></a>
        </article>
      </div>
    </div>
  )
}

function DataLayersView({ status }: Pick<ChromosomeLandscapeProps, 'status'>) {
  const layers = [
    { id: 'vcf', icon: Dna, title: 'Whole-genome VCF', state: status.source.present ? 'Connected' : 'Missing', ready: status.source.present, summary: 'Best current source for called small variants and the compact consumer report.', contribution: 'Millions of genomic positions represented as called differences from GRCh38.' },
    { id: 'reads', icon: Database, title: 'Compressed sequencing reads', state: status.reads.present ? 'Detected' : 'Not configured', ready: status.reads.present, summary: 'Original evidence for confirming calls and running specialized analysis.', contribution: 'Can support structural variants, HLA, repeat expansions, and re-calling after a full local pipeline.' },
    { id: 'ancestry', icon: FileSearch, title: 'AncestryDNA microarray', state: status.ancestry.present ? 'Connected' : 'Available to add', ready: status.ancestry.present, summary: 'A second technology covering a selected set of common variants.', contribution: 'Useful for cross-checking overlapping rsIDs and filling some presumed-reference markers after strand and build harmonization.' },
    { id: 'pgs', icon: Gauge, title: 'PGS Catalog models', state: 'Library ready', ready: true, summary: 'Published scoring files with effect alleles, weights, and evaluation metadata.', contribution: 'Adds reproducible polygenic models; it does not add new DNA and must be matched to ancestry and genome build.' },
  ]
  const [selected, setSelected] = useState(layers[0])
  const [pipeline, setPipeline] = useState<{ available: boolean; tools: { archive: boolean; aligner: boolean; variants: boolean; polygenic: boolean }; note: string } | null>(null)
  const [checking, setChecking] = useState(false)

  async function checkPipeline() {
    setChecking(true)
    try {
      const response = await fetch('/api/pipeline-status')
      if (!response.ok) throw new Error('Pipeline check failed')
      setPipeline(await response.json())
    } catch {
      setPipeline({ available: false, tools: { archive: false, aligner: false, variants: false, polygenic: false }, note: 'The local analysis environment could not be checked.' })
    } finally {
      setChecking(false)
    }
  }

  const pipelineRows = pipeline ? [
    { label: 'Open compressed reads', plain: 'Genozip reader', ready: pipeline.tools.archive },
    { label: 'Map reads to the genome', plain: 'DNA aligner', ready: pipeline.tools.aligner },
    { label: 'Build and inspect variants', plain: 'Variant tools', ready: pipeline.tools.variants },
    { label: 'Calculate published scores', plain: 'Polygenic workflow', ready: pipeline.tools.polygenic },
  ] : []
  return (
    <div className="data-layers-view">
      <header><div><Layers3 size={24} /><span><strong>Private data layers</strong><small>Each source has a different job</small></span></div><p>Sources stay separate until their genome build, strand, and allele conventions are reconciled.</p></header>
      <div className="layer-stack">
        {layers.map((layer, index) => {
          const Icon = layer.icon
          return <button key={layer.id} type="button" className={selected.id === layer.id ? 'active' : ''} onClick={() => setSelected(layer)} aria-expanded={selected.id === layer.id}><span className="layer-index">0{index + 1}</span><Icon size={21} /><span><strong>{layer.title}</strong><small>{layer.summary}</small></span><em className={layer.ready ? 'ready' : ''}>{layer.ready && <Check size={12} />}{layer.state}</em><ChevronRight size={17} /></button>
        })}
      </div>
      <article className="layer-detail"><span>SELECTED LAYER</span><h3>{selected.title}</h3><p>{selected.contribution}</p><div><Database size={18} /><p><strong>Privacy boundary</strong>{selected.id === 'pgs' ? 'Only public score definitions are downloaded. Personal genotype calculations remain local.' : 'The browser receives status and summaries, never the original genomic file.'}</p></div></article>
      <section className="pipeline-check">
        <header><div><Wrench size={19} /><span><strong>Analysis tools</strong><small>One click checks Ubuntu; nothing is uploaded or installed.</small></span></div><button type="button" onClick={checkPipeline} disabled={checking}>{checking ? <LoaderCircle className="spin" size={15} /> : <ScanSearch size={15} />}{checking ? 'Checking' : pipeline ? 'Check again' : 'Check tools'}</button></header>
        {pipeline ? <><p>{pipeline.note}</p><div>{pipelineRows.map((row) => <span key={row.label}><i className={row.ready ? 'ready' : ''}>{row.ready ? <Check size={11} /> : '!'}</i><b>{row.label}</b><small>{row.ready ? 'Ready' : `${row.plain} needed`}</small></span>)}</div></> : <p>Select <strong>Check tools</strong> to see exactly which parts of the deeper FASTQ and polygenic pipeline are ready.</p>}
      </section>
    </div>
  )
}

export function ChromosomeLandscape(props: ChromosomeLandscapeProps) {
  const tabs: LandscapeTab[] = ['Genome map', 'Polygenic', 'Data layers']
  return (
    <section className="landscape-panel interactive-landscape">
      <div className="landscape-header"><div><h2>Genome explorer</h2><p>Move from chromosomes to genes, models, and source layers.</p></div><span className="preview-label">INTERACTIVE</span></div>
      <div className="tab-list" role="tablist" aria-label="Genome explorer views">{tabs.map((tab) => <button key={tab} className={props.activeTab === tab ? 'active' : ''} onClick={() => props.onTabChange(tab)} role="tab" aria-selected={props.activeTab === tab} type="button">{tab}</button>)}</div>
      <div className="landscape-content">{props.activeTab === 'Genome map' ? <GenomeMap selected={props.selected} onSelect={props.onSelect} report={props.report} /> : props.activeTab === 'Polygenic' ? <PolygenicView /> : <DataLayersView status={props.status} />}</div>
    </section>
  )
}
