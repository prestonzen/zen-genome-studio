import { Activity, CircleOff, Sparkles } from 'lucide-react'
import { chromosomes, demoMarkers } from '../data/chromosomes'
import type { LandscapeTab } from '../types'

type ChromosomeLandscapeProps = {
  activeTab: LandscapeTab
  onTabChange: (tab: LandscapeTab) => void
  selected: string
  onSelect: (chromosome: string) => void
}

const maxLength = chromosomes[0].length

function ChromosomeBody({ index }: { index: number }) {
  return (
    <span className="chromosome-body" aria-hidden="true">
      {Array.from({ length: 12 }, (_, band) => (
        <i
          key={band}
          className={(band + index) % 3 === 0 ? 'band dark' : (band + index) % 4 === 0 ? 'band mid' : 'band light'}
        />
      ))}
    </span>
  )
}

function ChromosomeView({ selected, onSelect }: Pick<ChromosomeLandscapeProps, 'selected' | 'onSelect'>) {
  const chosen = chromosomes.find((item) => item.name === selected) ?? chromosomes[10]

  return (
    <>
      <div className="landscape-legend" aria-label="Visualization legend">
        <span><i className="legend-dot coral" />Visual demo signal</span>
        <span><i className="legend-dot cyan" />Reference marker</span>
        <span><i className="legend-outline" />Selected chromosome</span>
      </div>

      <div className="chromosome-grid" aria-label="Human chromosomes">
        {chromosomes.map((chromosome, index) => {
          const height = 56 + Math.round((chromosome.length / maxLength) * 112)
          const active = chromosome.name === selected
          return (
            <button
              className={active ? 'chromosome active' : 'chromosome'}
              key={chromosome.name}
              onClick={() => onSelect(chromosome.name)}
              type="button"
              aria-label={`Select chromosome ${chromosome.name}`}
            >
              <span className="chromosome-plot" style={{ height }}>
                <ChromosomeBody index={index} />
                <i className="marker cyan" style={{ top: `${18 + ((index * 17) % 58)}%` }} />
                {index % 3 === 0 && <i className="marker coral" style={{ top: `${34 + ((index * 11) % 42)}%` }} />}
              </span>
              <span className="chromosome-label">{chromosome.name}</span>
            </button>
          )
        })}
      </div>

      <div className="detail-track">
        <div className="detail-heading">
          <strong>Chromosome {chosen.name}</strong>
          <span>{(chosen.length / 1_000_000).toFixed(1)} Mb reference length</span>
          <small>VISUAL DEMO</small>
        </div>
        <div className="track-stage" aria-label={`Reference preview for chromosome ${chosen.name}`}>
          <div className="track-bands">
            {Array.from({ length: 20 }, (_, index) => (
              <i key={index} className={index % 3 === 0 ? 'dark' : index % 4 === 0 ? 'mid' : 'light'} />
            ))}
          </div>
          {demoMarkers.map((position, index) => (
            <i
              key={position}
              className={index % 4 === 0 ? 'track-marker coral' : 'track-marker cyan'}
              style={{ left: `${position}%`, height: `${26 + (index % 3) * 10}px` }}
            />
          ))}
        </div>
        <div className="axis"><span>0</span><span>{Math.round(chosen.length / 2_000_000)} Mb</span><span>{Math.round(chosen.length / 1_000_000)} Mb</span></div>
      </div>
    </>
  )
}

function AwaitingView({ tab }: { tab: Exclude<LandscapeTab, 'Chromosomes'> }) {
  const clinical = tab === 'Clinical'
  return (
    <div className="awaiting-view">
      <div className={clinical ? 'awaiting-symbol clinical' : 'awaiting-symbol traits'}>
        {clinical ? <Activity size={32} /> : <Sparkles size={32} />}
      </div>
      <div>
        <h3>{clinical ? 'Clinical annotations will appear here' : 'Trait annotations will appear here'}</h3>
        <p>Run the VCF through OpenCRAVAT, then return to explore the annotated results. No personal findings are simulated in this preview.</p>
      </div>
      <div className="empty-signal"><CircleOff size={16} /> No analysis result loaded</div>
    </div>
  )
}

export function ChromosomeLandscape({ activeTab, onTabChange, selected, onSelect }: ChromosomeLandscapeProps) {
  const tabs: LandscapeTab[] = ['Chromosomes', 'Clinical', 'Traits']
  return (
    <section className="landscape-panel">
      <div className="landscape-header">
        <h2>Variant landscape</h2>
        <span className="preview-label">Reference preview</span>
      </div>
      <div className="tab-list" role="tablist" aria-label="Variant views">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => onTabChange(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="landscape-content">
        {activeTab === 'Chromosomes' ? (
          <ChromosomeView selected={selected} onSelect={onSelect} />
        ) : (
          <AwaitingView tab={activeTab} />
        )}
      </div>
    </section>
  )
}

