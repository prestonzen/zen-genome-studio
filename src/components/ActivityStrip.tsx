import { Check, Clock3, FileCheck2, Server } from 'lucide-react'
import type { DeploymentMode } from '../types'

type ActivityStripProps = {
  connected: boolean
  sourceReady: boolean
  mode: DeploymentMode
}

export function ActivityStrip({ connected, sourceReady, mode }: ActivityStripProps) {
  const cloudMode = mode === 'cloud'
  const events = cloudMode
    ? [
        { icon: FileCheck2, label: 'Private genome', detail: 'Not uploaded', ready: true },
        { icon: Server, label: 'Analysis server', detail: 'Connect later', ready: false },
        { icon: Clock3, label: 'Cloud interface', detail: 'Ready to deploy', ready: true },
      ]
    : [
        { icon: FileCheck2, label: 'Private VCF source', detail: sourceReady ? 'Available' : 'Check path', ready: sourceReady },
        { icon: Server, label: 'OpenCRAVAT service', detail: connected ? 'Connected' : 'Awaiting setup', ready: connected },
        { icon: Clock3, label: 'Analysis queue', detail: 'No jobs running', ready: true },
      ]

  return (
    <section className="activity-strip" aria-label="Recent activity">
      <h3>{cloudMode ? 'Deployment status' : 'Local activity'}</h3>
      <div className="activity-items">
        {events.map(({ icon: Icon, label, detail, ready }) => (
          <div className="activity-item" key={label}>
            <Icon size={17} />
            <span><strong>{label}</strong><small>{detail}</small></span>
            <i className={ready ? 'activity-state ready' : 'activity-state'}>{ready && <Check size={11} />}</i>
          </div>
        ))}
      </div>
    </section>
  )
}
