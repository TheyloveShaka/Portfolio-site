import { projectKindLabel } from '@/data/caseStudies'
import type { ProjectKind } from '@/data/caseStudies'

const NEUTRAL_KINDS: ReadonlySet<ProjectKind> = new Set<ProjectKind>(['commercial', 'passion'])
interface ConceptBadgeProps {
  kind: ProjectKind
}

function ConceptBadge({ kind }: ConceptBadgeProps) {
  const label = projectKindLabel[kind]
  const neutral = NEUTRAL_KINDS.has(kind)
  return (
    <span className={neutral ? 'concept-badge concept-badge--neutral' : 'concept-badge'}>
      {label}
    </span>
  )
}

export default ConceptBadge
