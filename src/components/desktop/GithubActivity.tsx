import { Component, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import GitHubCalendar from 'react-github-calendar'
import type { Activity } from 'react-github-calendar'
import '@/styles/desk.css'

const GITHUB_USER = 'TheyloveShaka'
const GITHUB_URL = `https://github.com/${GITHUB_USER}`
const DAYS_SHOWN = 150
const WEEK_COLUMNS = 22
const LABEL_FONT_PX = 11
const LABEL_BAND_PX = LABEL_FONT_PX + 8
const HEAT_THEME = {
  light: ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)'],
}

const lastFiveMonths = (data: Array<Activity>): Array<Activity> => data.slice(-DAYS_SHOWN)

interface HideOnErrorState {
  failed: boolean
}

class HideOnError extends Component<{ children: ReactNode }, HideOnErrorState> {
  state: HideOnErrorState = { failed: false }

  static getDerivedStateFromError(): HideOnErrorState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

const useBlockMetrics = (ref: RefObject<HTMLDivElement>) => {
  const [metrics, setMetrics] = useState({ size: 8, margin: 3 })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => {
      const width = el.clientWidth
      if (!width) return
      const margin = width < 200 ? 2 : 3
      const size = Math.max(3, Math.min(11, Math.floor(width / WEEK_COLUMNS) - margin))
      setMetrics((prev) => (prev.size === size && prev.margin === margin ? prev : { size, margin }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return metrics
}

function GithubActivity() {
  const chartRef = useRef<HTMLDivElement>(null)
  const { size, margin } = useBlockMetrics(chartRef)
  const chartHeight = LABEL_BAND_PX + 7 * (size + margin) - margin

  return (
    <HideOnError>
      <section className="gh-card" aria-labelledby="gh-card-title">
        <div className="gh-card__header">
          <h2 id="gh-card-title" className="gh-card__title">
            GitHub activity
          </h2>
        </div>
        <div className="gh-card__body">
          <div ref={chartRef} className="gh-card__chart" style={{ minHeight: chartHeight }}>
            <GitHubCalendar
              username={GITHUB_USER}
              year="last"
              throwOnError
              transformData={lastFiveMonths}
              transformTotalCount={false}
              blockSize={size}
              blockMargin={margin}
              blockRadius={2}
              fontSize={LABEL_FONT_PX}
              hideColorLegend
              hideTotalCount
              showWeekdayLabels={false}
              colorScheme="light"
              theme={HEAT_THEME}
            />
          </div>
          <a className="gh-card__link" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
      </section>
    </HideOnError>
  )
}

export default GithubActivity
