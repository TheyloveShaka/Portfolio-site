import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { TbBrandGithub, TbExternalLink } from 'react-icons/tb'
import Window from './Window'
import CaseStudyMedia from '@components/CaseStudyMedia'
import ConceptBadge from '@components/ConceptBadge'
import PenUnderline from '@components/PenUnderline'
import { useWindows } from '@contexts/WindowsContext'
import { caseStudies, CaseStudySection } from '@/data/caseStudies'

function renderBody(body: string, italicPrefix?: string): ReactNode[] {
  const lines = body.split('\n')
  const blocks: ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={`list-${blocks.length}`} className="case-essay__list">
        {listBuffer.map((item, i) => (
          <li key={i}>{item.replace(/^-\s*/, '')}</li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed)
      return
    }
    flushList()
    const isItalic = Boolean(italicPrefix) && trimmed.startsWith(italicPrefix as string)
    blocks.push(
      <p key={`p-${blocks.length}`} className={isItalic ? 'case-essay__paragraph case-essay__paragraph--italic' : 'case-essay__paragraph'}>
        {trimmed}
      </p>,
    )
  })
  flushList()
  return blocks
}

const SECTION_HEADINGS: Record<CaseStudySection['id'], string> = {
  problem: 'Problem',
  constraints: 'Constraints',
  'what-i-did': 'What I did',
  outcome: 'Outcome',
  'what-i-took-from-it': 'What I took from it',
}

function CaseStudyViewer() {
  const { caseStudyWindow, selectedCaseStudyId, closeWindow, isWindowFocused } = useWindows()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [expanded, setExpanded] = useState<Set<CaseStudySection['id']>>(
    () => new Set(['problem', 'constraints', 'what-i-did', 'outcome', 'what-i-took-from-it']),
  )

  const study = caseStudies.find((s) => s.id === selectedCaseStudyId) ?? caseStudies[0]

  useEffect(() => {
    let frame = 0
    let attempts = 0
    const tryFocus = () => {
      const root = document.getElementById('window-caseStudy')
      const hidden = root ? getComputedStyle(root).visibility === 'hidden' : true
      if (!hidden) {
        titleRef.current?.focus()
        return
      }
      attempts += 1
      if (attempts < 30) frame = requestAnimationFrame(tryFocus)
    }
    frame = requestAnimationFrame(tryFocus)
    return () => cancelAnimationFrame(frame)
  }, [selectedCaseStudyId, caseStudyWindow.visibility])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWindowFocused('caseStudy')) {
        closeWindow('caseStudy')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeWindow, isWindowFocused])

  const toggleSection = (id: CaseStudySection['id']) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Window window={caseStudyWindow}>
      <div className="case-viewer-content">
        <div className="case-viewer-paper">
          <h2 ref={titleRef} tabIndex={-1} className="case-viewer__title">
            {study.title}
          </h2>
          {study.kind && (
            <div className="case-viewer__badge-row">
              <ConceptBadge kind={study.kind} />
            </div>
          )}

          <CaseStudyMedia study={study} variant="viewer" active />

          <div className="case-viewer__lara-card">
            <p className="case-viewer__eyebrow">{study.eyebrow}</p>
            <h3 className="case-viewer__headline">{study.headline}</h3>
            <p className="case-viewer__summary">{study.summary}</p>
            <p className="case-viewer__metrics">
              {study.metrics
                .map((m) => `${m.label}: ${m.verified ? m.value : 'Outcome not yet measured'}`)
                .join(' · ')}
            </p>
          </div>

          <div className="case-essay">
            {study.sections.map((section) => {
              const isOpen = expanded.has(section.id)
              const headerId = `${study.id}-${section.id}-header`
              const panelId = `${study.id}-${section.id}-panel`
              const isPenHeading = section.id === 'what-i-took-from-it'

              return (
                <div key={section.id} className="case-essay__section">
                  <h3 className="case-essay__section-heading-wrap">
                    <button
                      type="button"
                      id={headerId}
                      className="case-essay__section-header"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleSection(section.id)}
                    >
                      {isPenHeading ? (
                        <span className="case-essay__pen-heading">
                          {SECTION_HEADINGS[section.id]}
                          <PenUnderline variant="static" />
                        </span>
                      ) : (
                        SECTION_HEADINGS[section.id]
                      )}
                      <span className="case-essay__chevron" aria-hidden="true">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={panelId} role="region" aria-labelledby={headerId} className="case-essay__panel">
                      {renderBody(section.body, 'Outcome not yet measured')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {(study.live || study.repo) && (
            <div className="case-viewer__links">
              {study.live && (
                <a href={study.live} target="_blank" rel="noreferrer" className="case-viewer__link">
                  <TbExternalLink aria-hidden="true" /> Live site
                </a>
              )}
              {study.repo && (
                <a href={study.repo} target="_blank" rel="noreferrer" className="case-viewer__link">
                  <TbBrandGithub aria-hidden="true" /> Repository
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Window>
  )
}

export default CaseStudyViewer
