import { useEffect, useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'
import { AncestryView } from './components/AncestryView'
import { ChromosomeLandscape } from './components/ChromosomeLandscape'
import { GenomeSummary } from './components/GenomeSummary'
import { PrivacyView } from './components/PrivacyView'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { DiscoverView, SummaryView } from './components/TraitReport'
import { useLocalStatus } from './hooks/useLocalStatus'
import { useClinicalReport } from './hooks/useClinicalReport'
import { useAncestryReport } from './hooks/useAncestryReport'
import { useTraitReport } from './hooks/useTraitReport'
import type { LandscapeTab, ViewName } from './types'

function formatSource(bytes?: number, cloudMode = false) {
  if (cloudMode) return 'No genome uploaded to Cloudflare'
  if (!bytes) return 'Source check pending'
  return `${Math.round(bytes / 1_000_000)} MB • source protected`
}

function App() {
  const { status, checking, refresh } = useLocalStatus()
  const { report, loading: reportLoading, refresh: refreshReport } = useTraitReport()
  const { clinicalReport, clinicalLoading, refreshClinicalReport } = useClinicalReport()
  const { ancestryReport, ancestryLoading, refreshAncestryReport } = useAncestryReport()
  const [view, setView] = useState<ViewName>('Overview')
  const [tab, setTab] = useState<LandscapeTab>('Genome map')
  const [selectedChromosome, setSelectedChromosome] = useState('11')
  const [privacyMode, setPrivacyMode] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const cloudMode = status.mode === 'cloud'

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  function changeView(next: ViewName) {
    setView(next)
    if (next === 'Overview') setTab('Genome map')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function openAnalysis() {
    if (cloudMode) {
      setNotice('This cloud preview never receives genome files. Connect your private analysis server when it is ready.')
      return
    }
    if (!status.opencravat) {
      setNotice('The technical variant explorer is offline. Open Privacy to check the local analysis services.')
      return
    }
    window.open(status.openCravatUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={privacyMode ? 'app-shell safe' : 'app-shell'}>
      <Sidebar active={view} onChange={changeView} />
      <Topbar connected={status.opencravat} sourceReady={status.source.present} mode={status.mode} onOpenAnalysis={openAnalysis} />

      {view === 'Discover' ? (
        <DiscoverView report={report} status={status} loading={reportLoading} onRefresh={refreshReport} onNavigate={changeView} />
      ) : view === 'Ancestry' ? (
        <AncestryView report={ancestryReport} loading={ancestryLoading} privacyMode={privacyMode} onRefresh={refreshAncestryReport} onTogglePrivacy={() => setPrivacyMode((current) => !current)} />
      ) : view === 'Summary' ? (
        <SummaryView
          report={report}
          loading={reportLoading}
          onRefresh={refreshReport}
          onNavigate={changeView}
          clinicalReport={clinicalReport}
          clinicalLoading={clinicalLoading}
          onRefreshClinical={refreshClinicalReport}
          privacyMode={privacyMode}
          onTogglePrivacy={() => setPrivacyMode((current) => !current)}
        />
      ) : view === 'Privacy' ? (
        <PrivacyView
          status={status}
          checking={checking}
          privacyMode={privacyMode}
          onRefresh={refresh}
          onTogglePrivacy={() => setPrivacyMode((current) => !current)}
          onOpenAnalysis={openAnalysis}
          onNotice={setNotice}
        />
      ) : (
      <main className="workspace" data-testid="scene-overview">
        <section className="page-intro">
          <div>
            <h1>Your DNA, translated</h1>
            <p>{cloudMode ? 'A privacy-safe preview with no genome data' : 'Start with plain-language answers, then explore the science underneath'}</p>
          </div>
          <div className="source-actions">
            <div className="source-file">
              <FileText size={28} strokeWidth={1.6} />
              <span><strong>{cloudMode ? 'Private genome source' : 'Whole-genome VCF'}</strong><small>{formatSource(status.source.bytes, cloudMode)}</small></span>
              <ShieldCheck className="source-shield" size={17} />
            </div>
          </div>
        </section>

        <div className="dashboard-grid overview-grid">
          <div className="main-column">
            <GenomeSummary status={status} report={report} onOpenPrivacy={() => changeView('Privacy')} />
            <ChromosomeLandscape
              activeTab={tab}
              onTabChange={setTab}
              selected={selectedChromosome}
              onSelect={setSelectedChromosome}
              report={report}
            />
          </div>
        </div>
      </main>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
