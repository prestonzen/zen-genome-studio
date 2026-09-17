import { useEffect, useRef, useState } from 'react'
import { ExternalLink, FileText, Play, ShieldCheck } from 'lucide-react'
import { ActivityStrip } from './components/ActivityStrip'
import { ChromosomeLandscape } from './components/ChromosomeLandscape'
import { InsightRail } from './components/InsightRail'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useLocalStatus } from './hooks/useLocalStatus'
import type { LandscapeTab, ViewName } from './types'

function formatSource(bytes?: number, cloudMode = false) {
  if (cloudMode) return 'No genome uploaded to Cloudflare'
  if (!bytes) return 'Source check pending'
  return `${Math.round(bytes / 1_000_000)} MB • source protected`
}

function App() {
  const { status, checking, refresh } = useLocalStatus()
  const [view, setView] = useState<ViewName>('Overview')
  const [tab, setTab] = useState<LandscapeTab>('Chromosomes')
  const [selectedChromosome, setSelectedChromosome] = useState('11')
  const [recordSafe, setRecordSafe] = useState(true)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const cloudMode = status.mode === 'cloud'

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  function changeView(next: ViewName) {
    setView(next)
    if (next === 'Explore') setTab('Clinical')
    if (next === 'Overview') setTab('Chromosomes')
    if (next === 'Record') document.querySelector('.record-controls')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setNotice('Screen recording is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' })
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `zen-genome-studio-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.webm`
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
        streamRef.current?.getTracks().forEach((track) => track.stop())
        setRecording(false)
      }
      stream.getVideoTracks()[0].onended = () => recorder.state !== 'inactive' && recorder.stop()
      recorder.start(1000)
      setElapsed(0)
      setRecording(true)
    } catch {
      setNotice('Recording was cancelled. Nothing was saved.')
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
  }

  function openAnalysis() {
    if (cloudMode) {
      setNotice('This cloud preview never receives genome files. Connect your private analysis server when it is ready.')
      return
    }
    if (!status.opencravat) {
      setNotice('OpenCRAVAT is not running yet. Ubuntu setup is the next step.')
      return
    }
    window.open(status.openCravatUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={recordSafe ? 'app-shell safe' : 'app-shell'}>
      <Sidebar active={view} onChange={changeView} />
      <Topbar connected={status.opencravat} sourceReady={status.source.present} mode={status.mode} onOpenAnalysis={openAnalysis} />

      <main className="workspace">
        <section className="page-intro">
          <div>
            <h1>Whole genome overview</h1>
            <p>{cloudMode ? 'A privacy-safe cloud preview with no genome data' : 'A private, local view of your variant analysis'}</p>
          </div>
          <div className="source-actions">
            <div className="source-file">
              <FileText size={28} strokeWidth={1.6} />
              <span><strong>{cloudMode ? 'Private genome source' : 'Whole-genome VCF'}</strong><small>{formatSource(status.source.bytes, cloudMode)}</small></span>
              <ShieldCheck className="source-shield" size={17} />
            </div>
            <button className="primary-command" type="button" onClick={openAnalysis}>
              <ExternalLink size={18} /> Open variant explorer
            </button>
            <button className="secondary-command" type="button" onClick={openAnalysis}>
              <Play size={18} /> Start analysis
            </button>
          </div>
        </section>

        <div className="dashboard-grid">
          <div className="main-column">
            <ChromosomeLandscape
              activeTab={tab}
              onTabChange={setTab}
              selected={selectedChromosome}
              onSelect={setSelectedChromosome}
            />
            <ActivityStrip connected={status.opencravat} sourceReady={status.source.present} mode={status.mode} />
          </div>
          <InsightRail
            connected={status.opencravat}
            sourceReady={status.source.present}
            mode={status.mode}
            checking={checking}
            recordSafe={recordSafe}
            recording={recording}
            elapsed={elapsed}
            onOpenAnalysis={openAnalysis}
            onRefresh={refresh}
            onToggleSafe={() => setRecordSafe((current) => !current)}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
