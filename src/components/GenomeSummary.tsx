import { ArrowRight, Check, Dna, FileCheck2, FlaskConical, Layers3, Microscope, ScanSearch } from 'lucide-react'
import type { LocalStatus, TraitReport } from '../types'
import { TermTip } from './TermTip'

type GenomeSummaryProps = {
  status: LocalStatus
  report: TraitReport
  onOpenPrivacy: () => void
}

const depths = [
  {
    id: 'carrier', icon: FileCheck2, title: 'Carrier test', reach: 'Selected conditions', coverage: 12,
    detail: 'Checks a predefined list of genes or variants linked to inherited conditions. It answers a narrow clinical question well.',
  },
  {
    id: 'exome', icon: FlaskConical, title: 'Exome', reach: 'Protein-coding 1–2%', coverage: 28,
    detail: 'Reads the exons that make proteins. It is easier to interpret, but largely misses regulatory and other non-coding DNA.',
  },
  {
    id: 'vcf', icon: Dna, title: 'Whole-genome calls', reach: 'Genome-wide variants', coverage: 82,
    detail: 'A WGS VCF contains called differences across the whole genome and can power curated trait and clinical summaries.',
  },
  {
    id: 'fastq', icon: ScanSearch, title: 'Raw sequencing reads', reach: 'Original sequence evidence', coverage: 100,
    detail: 'FASTQ preserves the original short sequencing reads so the genome can be aligned and called again with specialized tools.',
  },
]

export function GenomeSummary({ status, report, onOpenPrivacy }: GenomeSummaryProps) {
  const directTraits = report.traits.filter((trait) => /^\d+ marker(?:s)? directly observed/.test(trait.callNote) || /^[1-9]\d* directly observed/.test(trait.callNote)).length
  const personalReport = report.state === 'ready'
  const hasWgsCalls = status.source.present || personalReport
  const hasRawReads = status.reads.present
  const readState = status.mode === 'cloud' ? 'Local only' : hasRawReads ? 'Ready' : 'Missing'
  return (
    <section className="genome-summary">
      <header>
        <div><span className="section-kicker">{personalReport ? 'YOUR DNA TOOLBOX' : 'GENOME TOOLBOX'}</span><h2>{personalReport ? 'What your files can actually reveal' : 'What genome files can reveal'}</h2><p>{personalReport ? 'Start with the answer, then open the technical layer only when it helps.' : 'Explore the available analysis layers without treating fictional examples as personal findings.'}</p></div>
        <div className="summary-stats">
          <span><strong>{report.traits.length}</strong><small>traits explained</small></span>
          <span><strong>{directTraits}</strong><small>with a direct marker</small></span>
          <span><strong>{readState}</strong><small>raw-read archive</small></span>
        </div>
      </header>

      <div className="depth-compare">
        {depths.map(({ id, icon: Icon, title, reach, coverage, detail }) => {
          const available = id === 'vcf' ? hasWgsCalls : id === 'fastq' ? hasRawReads : false
          const displayTitle = available && id === 'vcf' ? 'Your WGS calls' : available && id === 'fastq' ? 'Your raw reads' : status.mode === 'cloud' && id === 'fastq' ? 'Raw reads stay local' : title
          return <article className={available ? 'active' : ''} key={id}>
            <div><Icon size={19} /><span><strong>{displayTitle}</strong><small>{reach}</small></span>{available && <i><Check size={11} /> Available</i>}</div>
            <span className="depth-meter"><b style={{ width: `${coverage}%` }} /></span>
            <p>{detail}</p>
          </article>
        })}
      </div>

      <div className="summary-next">
        <div><Microscope size={20} /><p><strong>What FASTQ adds next</strong>Confirm uncertain calls, inspect complete-gene coverage, and run structural-variant, HLA, repeat, mitochondrial, and ancestry pipelines.</p></div>
        <div><Layers3 size={20} /><p><strong>What it does not add automatically</strong>A raw read is not an interpretation. Each result still needs a caller, a model, quality checks, and a comparison population.</p></div>
        <button type="button" onClick={onOpenPrivacy}>{status.mode === 'cloud' ? 'Open data status' : 'Open local tools'} <ArrowRight size={16} /></button>
      </div>

      <footer>
        <TermTip term="FASTQ" definition="The original sequencing reads plus a quality score for every DNA letter. It is the evidence used to rebuild variant calls." />
        <TermTip term="Exome" definition="The roughly 1–2% of the genome that directly codes for proteins. Useful, but much narrower than whole-genome sequencing." />
        <TermTip term="Carrier test" definition="A targeted test for variants that may be passed to children, usually in a predefined set of inherited conditions." />
        <TermTip term="Full-gene check" definition="A coverage and variant audit across the important coding, splice, and sometimes regulatory regions of a gene. It requires aligned reads, not FASTQ alone." />
      </footer>
    </section>
  )
}
