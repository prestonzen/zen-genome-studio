import { useEffect, useId, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'

type TermTipProps = {
  term: string
  definition: string
  compact?: boolean
}

export function TermTip({ term, definition, compact = false }: TermTipProps) {
  const definitionId = useId()
  const tipRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!tipRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  return (
    <span
      ref={tipRef}
      className={`${compact ? 'term-tip compact' : 'term-tip'}${open ? ' open' : ''}`}
      tabIndex={0}
      role="button"
      aria-expanded={open}
      aria-describedby={definitionId}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          event.currentTarget.blur()
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setOpen((current) => !current)
        }
      }}
    >
      <span>{term}</span><CircleHelp size={compact ? 12 : 14} aria-hidden="true" />
      <span id={definitionId} className="term-definition" role="tooltip">{definition}</span>
    </span>
  )
}
