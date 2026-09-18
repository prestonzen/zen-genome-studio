import { useState } from 'react'
import { Database, Dna, ExternalLink, Eye, EyeOff, GitCompare, Globe2, RefreshCw, ShieldCheck, UserRound, Waypoints } from 'lucide-react'
import type { AncestryProfile, AncestryRegion, AncestryReport } from '../types'
import { TermTip } from './TermTip'

const NHGRI_ANCESTRY_URL = 'https://www.genome.gov/about-genomics/policy-issues/population-descriptors-in-genomics'

type AncestryViewProps = {
  report: AncestryReport
  loading: boolean
  privacyMode: boolean
  onRefresh: () => void
  onTogglePrivacy: () => void
}

type ComparisonRow = {
  id: string
  label: string
  broadRegion: string
  color: string
  selfPercent: number
  parentPercent: number
}

function RegionStrip({ profile }: { profile: AncestryProfile }) {
  return (
    <div className="ancestry-strip" aria-label={`${profile.label} ancestry region estimate`}>
      {profile.regions.filter((region) => region.percent > 0).map((region) => (
        <i key={region.id} style={{ width: `${region.percent}%`, background: region.color }} title={`${region.label}: ${region.percent}%`} />
      ))}
    </div>
  )
}

function mergeRegions(self?: AncestryProfile, parent?: AncestryProfile): ComparisonRow[] {
  const rows = new Map<string, ComparisonRow>()
  const add = (region: AncestryRegion, key: 'selfPercent' | 'parentPercent') => {
    const current = rows.get(region.id) ?? { id: region.id, label: region.label, broadRegion: region.broadRegion, color: region.color, selfPercent: 0, parentPercent: 0 }
    current[key] = region.percent
    rows.set(region.id, current)
  }
  self?.regions.forEach((region) => add(region, 'selfPercent'))
  parent?.regions.forEach((region) => add(region, 'parentPercent'))
  return [...rows.values()].sort((a, b) => Math.max(b.selfPercent, b.parentPercent) - Math.max(a.selfPercent, a.parentPercent))
}

function PercentCell({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <span className="ancestry-percent-cell" data-label={label}>
      <i><b style={{ width: `${Math.max(value, value ? 2 : 0)}%`, background: color }} /></i>
      <strong>{value}%</strong>
    </span>
  )
}

export function AncestryView({ report, loading, privacyMode, onRefresh, onTogglePrivacy }: AncestryViewProps) {
  const [showFamily, setShowFamily] = useState(false)
  const self = report.profiles.find((profile) => profile.relationship === 'self')
  const parent = report.profiles.find((profile) => profile.relationship !== 'self')
  const rows = mergeRegions(self, showFamily ? parent : undefined)
  const ready = report.state === 'ready' && Boolean(self)

  return (
    <main className="workspace ancestry-workspace">
      <section className="ancestry-intro">
        <div><Globe2 size={34} /><span><h1>Your ancestry layers</h1><p>Imported regional estimates today, reproducible open-reference analysis next.</p></span></div>
        <button type="button" onClick={onTogglePrivacy}>{privacyMode ? <Eye size={17} /> : <EyeOff size={17} />}{privacyMode ? 'Reveal private details' : 'Turn on privacy mode'}</button>
      </section>

      <section className="ancestry-definition">
        <Dna size={22} />
        <div><strong><TermTip compact term="Genetic ancestry is not the same as ethnicity" definition="Genetic ancestry estimates inherited similarity to sampled reference populations. Ethnicity describes shared culture, language, customs, heritage, or history and is not a biological measurement." /></strong><p>DNA can estimate similarity to sampled reference populations. It cannot measure culture, nationality, identity, or every genealogical ancestor.</p></div>
      </section>

      <div className="ancestry-layout">
        <section className="ancestry-main">
          <header className="ancestry-section-heading"><div><span>IMPORTED ESTIMATE</span><h2>Regional comparison</h2><p>{report.sourceNote}</p></div><b>{report.sourceName}</b></header>
          {ready && <div className="ancestry-source-context"><ShieldCheck size={16} /><p><strong>Displayed exactly as imported</strong><span>Zen Genome Studio does not recalculate these vendor percentages or blend the family profile into your result.</span></p><a href={NHGRI_ANCESTRY_URL} target="_blank" rel="noreferrer">How ancestry estimates work <ExternalLink size={13} /></a></div>}
          {!ready ? (
            <div className="ancestry-empty"><ShieldCheck size={25} /><div><strong>{report.mode === 'cloud' ? 'Private by design' : 'No imported estimate connected'}</strong><p>{report.sourceNote}</p></div>{report.mode === 'local' && <button type="button" onClick={onRefresh}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Check again</button>}</div>
          ) : privacyMode ? (
            <div className="ancestry-lock"><ShieldCheck size={28} /><div><strong>Ancestry details hidden</strong><p>Privacy mode conceals personal regions, percentages, and family comparisons.</p></div></div>
          ) : (
            <div className="ancestry-results">
              {parent && <div className="family-comparison-control"><div><UserRound size={18} /><span><strong>Family comparison</strong><small>Your mother's estimate is optional context and never changes your results.</small></span></div><button type="button" onClick={() => setShowFamily((current) => !current)}>{showFamily ? 'Hide comparison' : 'Compare with mother'}</button></div>}
              <div className="ancestry-profile-strips">
                {self && <div><span><strong>{self.label}</strong><small>Imported regional estimate</small></span><RegionStrip profile={self} /></div>}
                {showFamily && parent && <div><span><strong>{parent.label}</strong><small>Family comparison only</small></span><RegionStrip profile={parent} /></div>}
              </div>
              <div className={showFamily ? 'ancestry-table' : 'ancestry-table solo'} role="table" aria-label="Imported ancestry region comparison">
                <div className="ancestry-table-head" role="row"><span role="columnheader">Region</span><span role="columnheader">{self?.label}</span>{showFamily && <span role="columnheader">{parent?.label ?? 'Parent'}</span>}</div>
                {rows.map((row) => (
                  <div className="ancestry-row" role="row" key={row.id}>
                    <span className="ancestry-region" role="cell"><i style={{ background: row.color }} /><span><strong>{row.label}</strong><small>{row.broadRegion}</small></span></span>
                    <PercentCell value={row.selfPercent} color={row.color} label={self?.label ?? 'You'} />
                    {showFamily && <PercentCell value={row.parentPercent} color={row.color} label={parent?.label ?? 'Parent'} />}
                  </div>
                ))}
              </div>
              {showFamily && <div className="ancestry-family-note"><GitCompare size={20} /><p><strong>Do not average parent and child percentages.</strong> You inherit a random half of each parent's DNA, and each company update can move boundaries or relabel reference groups.</p></div>}
            </div>
          )}
        </section>

        <aside className="ancestry-method">
          <header><Database size={21} /><div><h2>Open-reference analysis</h2><p>Planned local pipeline; no personal percentages calculated yet.</p></div></header>
          <ol>
            <li><span>1</span><div><strong>Reference panel</strong><p>Use public GRCh38 samples from the 1000 Genomes 30x collection.</p></div></li>
            <li><span>2</span><div><strong>Quality and overlap</strong><p>Keep common, well-called, independent markers shared with the WGS VCF.</p></div></li>
            <li><span>3</span><div><strong>PCA projection</strong><p>Place the genome among reference cohorts without calling those clusters ethnicities.</p></div></li>
            <li><span>4</span><div><strong>Broad mixture</strong><p>Estimate coarse reference similarity with uncertainty; avoid fake country-level precision.</p></div></li>
          </ol>
          <div className="ancestry-reference-scope"><Waypoints size={18} /><p><strong>Good resolution</strong><span>Broad structure and sampled cohorts such as Kinh in Ho Chi Minh City (KHV) and Chinese Dai in Xishuangbanna (CDX).</span><strong>Weak resolution</strong><span>Fine labels such as Scottish, Irish, or German subregions.</span></p></div>
          <a href="https://www.internationalgenome.org/data-portal/data-collections/1000genomes_30x/" target="_blank" rel="noreferrer">1000 Genomes reference <ExternalLink size={15} /></a>
          <a href="https://www.cog-genomics.org/plink/2.0/strat" target="_blank" rel="noreferrer">PLINK population structure <ExternalLink size={15} /></a>
        </aside>
      </div>
    </main>
  )
}
