import {
  Activity,
  ArrowRight,
  Brain,
  ChevronRight,
  Dna,
  Eye,
  FlaskConical,
  Gauge,
  LockKeyhole,
  Moon,
  Pill,
  Ruler,
  ScanSearch,
  ShieldAlert,
  ShieldPlus,
  Sparkles,
  Sun,
  Utensils,
  Users,
} from 'lucide-react'
import { genomeAtlas } from '../data/genomeAtlas'
import type { AtlasItem } from '../types'

type GenomeAtlasProps = {
  readsPresent: boolean
  onExploreResults: () => void
}

function AtlasIcon({ id }: { id: string }) {
  if (id.includes('eye')) return <Eye size={19} />
  if (id.includes('hair')) return <Sparkles size={19} />
  if (id.includes('skin') || id.includes('sneeze')) return <Sun size={19} />
  if (id.includes('height')) return <Ruler size={19} />
  if (id.includes('chronotype')) return <Moon size={19} />
  if (id.includes('pharmcat')) return <Pill size={19} />
  if (id.includes('blood-group') || id.includes('blood-traits') || id.includes('hla')) return <ShieldPlus size={19} />
  if (id.includes('kinship') || id.includes('roh')) return <Users size={19} />
  if (id.includes('taste') || id.includes('lactose') || id.includes('cilantro')) return <Utensils size={19} />
  if (id.includes('personality') || id.includes('intelligence')) return <Brain size={19} />
  if (id.includes('sv') || id.includes('repeats')) return <ScanSearch size={19} />
  if (id.includes('mtdna') || id.includes('ydna')) return <FlaskConical size={19} />
  return <Dna size={19} />
}

function SignalGraphic({ item }: { item: AtlasItem }) {
  if (item.id === 'height-atlas') {
    return <span className="signal-density" aria-label="Many variants required">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ height: `${20 + Math.sin(index / 17 * Math.PI) * 70}%` }} />)}</span>
  }
  if (item.id === 'skin-atlas') return <span className="skin-spectrum" aria-label="Pigmentation spectrum"><i /><i /><i /><i /><i /></span>
  if (item.status === 'Ready now') return <span className="signal-bar"><i style={{ width: item.id === 'eye-atlas' ? '78%' : item.id === 'cilantro-atlas' ? '38%' : '64%' }} /></span>
  if (item.status === 'Not reliable') return <span className="signal-noise">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ transform: `translateY(${(index % 3 - 1) * 4}px)` }} />)}</span>
  return <span className="signal-sequence">A C G T A C G T</span>
}

function statusClass(status: AtlasItem['status']) {
  if (status === 'Ready now') return 'ready'
  if (status === 'Full model') return 'model'
  if (status === 'Not reliable') return 'limit'
  return 'pipeline'
}

export function GenomeAtlas({ readsPresent, onExploreResults }: GenomeAtlasProps) {
  return (
    <div className="atlas-layout">
      <section className="atlas-table" aria-label="Genome analysis atlas">
        <header className="atlas-columns"><span>Trait / analysis</span><span>Signal</span><span>Result / status</span><span>Scale</span></header>
        {genomeAtlas.map((group) => (
          <section className={`atlas-group atlas-${group.id}`} key={group.id}>
            <header><div><AtlasIcon id={`${group.id}-atlas`} /><strong>{group.title}</strong></div><p>{group.description}</p></header>
            {group.items.map((item) => {
              const content = (
                <>
                  <span className="atlas-name"><AtlasIcon id={item.id} /><strong>{item.title}</strong></span>
                  <SignalGraphic item={item} />
                  <span className="atlas-result"><b className={statusClass(item.status)}><i />{item.status}</b><strong>{item.result}</strong><small>{item.detail}</small></span>
                  <span className="atlas-scale">{item.scale}<ChevronRight size={16} /></span>
                </>
              )
              return item.sourceUrl
                ? <a className="atlas-row" key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer">{content}</a>
                : <div className="atlas-row" key={item.id}>{content}</div>
            })}
          </section>
        ))}
      </section>

      <aside className="analysis-ladder">
        <div className="ladder-title"><Gauge size={21} /><div><h2>Analysis ladder</h2><p>From called variants to deeper biology.</p></div></div>
        <ol>
          <li><span>1</span><div><strong>Variant results</strong><p>Compact models and single markers already available from the VCF.</p></div></li>
          <li><span>2</span><div><strong>Polygenic models</strong><p>Thousands of harmonized variants for traits such as height.</p></div></li>
          <li><span>3</span><div><strong>Read-level pipelines</strong><p>Re-analyze the raw reads for structural variants, HLA, and repeats.</p></div></li>
        </ol>
        <div className={`reads-proof ${readsPresent ? 'detected' : ''}`}>
          {readsPresent ? <LockKeyhole size={18} /> : <ShieldAlert size={18} />}
          <p><strong>{readsPresent ? 'Raw reads detected' : 'Raw reads not configured'}</strong><span>{readsPresent ? 'Available locally; never sent to the browser.' : 'Add the Genozip filename to your private local settings.'}</span></p>
        </div>
        <button type="button" onClick={onExploreResults}><Activity size={17} /> Explore my results <ArrowRight size={17} /></button>
      </aside>
    </div>
  )
}
