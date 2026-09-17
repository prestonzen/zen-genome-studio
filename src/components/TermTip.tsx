import { useId } from 'react'
import { CircleHelp } from 'lucide-react'

type TermTipProps = {
  term: string
  definition: string
  compact?: boolean
}

export function TermTip({ term, definition, compact = false }: TermTipProps) {
  const definitionId = useId()

  return (
    <span
      className={compact ? 'term-tip compact' : 'term-tip'}
      tabIndex={0}
      aria-describedby={definitionId}
    >
      <span>{term}</span><CircleHelp size={compact ? 12 : 14} aria-hidden="true" />
      <span id={definitionId} className="term-definition" role="tooltip">{definition}</span>
    </span>
  )
}
