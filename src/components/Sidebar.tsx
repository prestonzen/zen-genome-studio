import { CircleDot, Compass, LayoutDashboard } from 'lucide-react'
import type { ViewName } from '../types'

const items = [
  { name: 'Overview' as const, icon: LayoutDashboard },
  { name: 'Explore' as const, icon: Compass },
  { name: 'Record' as const, icon: CircleDot },
]

type SidebarProps = {
  active: ViewName
  onChange: (view: ViewName) => void
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand" aria-label="Preston Genome Studio">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="brand-name">PRESTON</span>
        <span className="brand-product">GENOME STUDIO</span>
      </div>

      <nav className="primary-nav" aria-label="Primary navigation">
        {items.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={active === name ? 'nav-item active' : 'nav-item'}
            onClick={() => onChange(name)}
            type="button"
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{name}</span>
          </button>
        ))}
      </nav>

      <p className="research-note">Research and education only</p>
    </aside>
  )
}

