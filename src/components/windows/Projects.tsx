import { useCallback, useRef, useState } from 'react'
import { TbBrandGithub, TbExternalLink } from 'react-icons/tb'
import Window from './Window'
import CaseStudyMedia from '@components/CaseStudyMedia'
import ConceptBadge from '@components/ConceptBadge'
import { useWindows } from '@contexts/WindowsContext'
import { caseStudies } from '@/data/caseStudies'

function CaseStudiesFolder() {
  const { caseStudiesWindow, openCaseStudy } = useWindows()
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const visibilityRef = useRef<Map<string, number>>(new Map())

  const reportVisibility = useCallback((id: string, ratio: number) => {
    visibilityRef.current.set(id, ratio)
    let bestId: string | null = null
    let bestRatio = 0.5
    visibilityRef.current.forEach((r, key) => {
      if (r > bestRatio) {
        bestRatio = r
        bestId = key
      }
    })
    setActiveVideoId((prev) => (prev === bestId ? prev : bestId))
  }, [])

  const openTile = (id: string) => openCaseStudy(id)

  return (
    <Window window={caseStudiesWindow} innerScroll>
      <div className="explorer-content">
        <div className="explorer-menu-row" aria-hidden="true">
          File Edit View Favorites Tools Help
        </div>
        <div className="explorer-address-row">
          <span className="explorer-address-row__label">Address</span>
          Portfolio / Projects
        </div>
        <div className="explorer-pane">
          <ul className="case-tile-grid">
            {caseStudies.map((study) => {
              const evidence = study.metrics
                .map((m) => `${m.label}: ${m.verified ? m.value : 'Outcome not yet measured'}`)
                .join(' · ')

              return (
                <li key={study.id} className="case-tile-item">
                  <div
                    className="case-tile"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open project: ${study.title}`}
                    onClick={() => openTile(study.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openTile(study.id)
                      }
                    }}
                  >
                    <div className="case-tile__media-wrap">
                      <CaseStudyMedia
                        study={study}
                        variant="tile"
                        active={activeVideoId === study.id}
                        onVisibilityChange={(ratio) => reportVisibility(study.id, ratio)}
                      />
                      {(study.live || study.repo) && (
                        <div className="case-tile__overlay">
                          <span className="case-tile__overlay-stack">{study.stack.join(', ')}</span>
                          <span className="case-tile__overlay-links">
                            {study.repo && (
                              <a
                                href={study.repo}
                                target="_blank"
                                rel="noreferrer"
                                className="case-tile__overlay-link"
                                aria-label={`${study.title} repository`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <TbBrandGithub aria-hidden="true" />
                              </a>
                            )}
                            {study.live && (
                              <a
                                href={study.live}
                                target="_blank"
                                rel="noreferrer"
                                className="case-tile__overlay-link"
                                aria-label={`${study.title} live site`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <TbExternalLink aria-hidden="true" />
                              </a>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="case-tile__filename">{study.id}-walkthrough.mp4</div>
                    <div className="case-tile__body">
                      <ConceptBadge kind={study.kind} />
                      <p className="case-tile__eyebrow">{study.eyebrow}</p>
                      <h3 className="case-tile__headline">{study.headline}</h3>
                      <p className="case-tile__summary">{study.summary}</p>
                      <p className="case-tile__evidence">{evidence}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="explorer-status-strip">{caseStudies.length} projects</div>
      </div>
    </Window>
  )
}

export default CaseStudiesFolder
