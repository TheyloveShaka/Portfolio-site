import portrait from '@assets/photos/shaka-hackathon.webp'
import Window from './Window'
import { useWindows } from '@contexts/WindowsContext'
import CopyEmailAction from '@components/CopyEmailAction'
import PenUnderline from '@components/PenUnderline'
import StackIcon from '@components/StackIcon'
import { CLOSING_QUOTE } from '@components/desktop/StickyNote'
import { profile } from '@/data/profile'
import { stack } from '@/data/stack'

const UNDERLINE_PHRASE = 'have fun trying.'
const QUOTE_LEAD = CLOSING_QUOTE.slice(0, CLOSING_QUOTE.length - UNDERLINE_PHRASE.length)

const KAGA_SYSTEMS_URL = 'https://kaga-systems.vercel.app'

const STORY_PARAGRAPHS = [
  'Hi, I\'m Shaka! Let me tell you a bit about me. From drawing in Paint and searching \'cool photos\' to tinkering with settings and hardware as a kid, I\'ve always loved the computer and its systems. The first time I ever fixed a boot-up problem, that joy and satisfaction never left me.',
  'Every interaction with tech since has really just been me chasing that same magic. Problem solving, building and customization are my drive.',
  'That chase eventually turned into a career. I\'m a Developer & AI Engineer based in Kampala, Uganda, and I still get the same rush today that I did back then.',
  'I have some knowledge of tools like React, TypeScript, Python, and LLM-powered apps and agents, but I\'m always open to learning and to tackling challenges or projects in tech and tools I\'m yet to learn.',
  'Outside of code, I\'m a fan of comics and quantum physics, a 2010s music lover, I\'m always behind on some sitcom, and you\'ll usually find me on the game, at the gym or watching Man United when I\'m not building something.',
]

function KagaSystemsLink() {
  return (
    <a className="kaga-link" href={KAGA_SYSTEMS_URL} target="_blank" rel="noopener noreferrer">
      <span className="kaga-link__badge" aria-hidden="true">
        <svg viewBox="0 0 40 32" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M9.5 4.5H5.5V13.5H2.5V18.5H5.5V27.5H9.5" />
            <path d="M30.5 4.5H34.5V13.5H37.5V18.5H34.5V27.5H30.5" />
            <path d="M14.5 6V26" />
            <path d="M25.5 6 15.5 16 25.5 26" />
          </g>
        </svg>
      </span>
      Kaga Systems
    </a>
  )
}

function About() {
  const { aboutWindow, openOrFocusWindow } = useWindows()

  return (
    <Window window={aboutWindow} mobileMaxHeight="458px">
      <div className="about-window-content p-6 flex flex-col gap-6">
        <div className="about-intro">
          <div className="about-portrait">
            <img
              src={portrait}
              alt="Shaka at the UCC Testbed Hackathon in Kampala"
              width={520}
              height={768}
            />
          </div>
          <div className="about-intro__text">
          <h1 className="font-display font-bold text-display-xl text-ink m-0">
            Shaka Nathan K
          </h1>
          <p className="font-display font-medium text-display-l text-ink-2 m-0">
            Developer · AI Engineer · Project Lead
          </p>
          <p className="font-ui text-body text-ink-2 m-0 flex flex-wrap items-center gap-x-2">
            <span
              aria-hidden="true"
              className="inline-block"
              style={{ width: 8, height: 8, borderRadius: 'var(--radius-round)', background: 'var(--success)' }}
            />
            Kampala, Uganda ·{' '}
            <span className="font-semibold" style={{ color: 'var(--success)' }}>
              Available for work
            </span>
          </p>
          <p className="font-ui text-lead text-ink m-0">
            I build web platforms, LLM-powered tools, and lead the projects that solve problems
            and earn. I own <KagaSystemsLink />.
          </p>

          <div className="about-cta-row">
            <button
              type="button"
              className="btn-primary"
              onClick={() => openOrFocusWindow('caseStudies')}
            >
              View projects
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => openOrFocusWindow('hireMe')}
            >
              Hire me
            </button>
          </div>

          <CopyEmailAction email={profile.email} />
          </div>
        </div>

        <div className="flex flex-col gap-4" style={{ maxWidth: 'var(--measure)' }}>
          {STORY_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="font-ui text-body text-ink-2 m-0">
              {paragraph}
            </p>
          ))}

          <p className="font-ui text-body text-ink-2 m-0">
            I studied Information Systems and Technology at Makerere University, and I&apos;ve been
            developing professionally for two years. I work freelance today, with the goal of growing
            that into my own agency, <KagaSystemsLink />, and I&apos;m working towards my professional
            certifications.
          </p>

          <p className="font-ui text-body text-ink-2 m-0">
            At Makerere I led Team Makerere 1 to win an award in The Open Group&apos;s INITIATE
            Enterprise Architecture Competition for Students 2026, with ConnectedCare 360, an
            enterprise architecture built with TOGAF and ArchiMate.
          </p>

          <p className="font-ui text-body text-ink-2 m-0">
            In November 2026 I also took part in the Uganda Communications Commission&apos;s Testbed
            Hackathon, on using AI to make online spaces safer for children, where I built my
            team&apos;s evaluation data and scoring.
          </p>

          <p className="font-hand m-0" style={{ fontSize: 'var(--fs-hand-note)', lineHeight: 'var(--lh-hand-note)', color: 'var(--pen)', fontWeight: 'var(--fw-medium)' }}>
            {QUOTE_LEAD}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              {UNDERLINE_PHRASE}
              <PenUnderline variant="static" />
            </span>
          </p>
        </div>

        <div className="stack-groups">
          {stack.map((group) => (
            <div key={group.id} className="stack-group">
              <h2 className="stack-group__heading">{group.label}</h2>
              <ul className="stack-group__list" role="list">
                {group.items.map((item) => (
                  <li key={item.name} className="stack-item">
                    <span className="stack-item__icon" aria-hidden="true">
                      <StackIcon icon={item.icon} glyph={item.glyph} />
                    </span>
                    <span className="stack-item__name">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Window>
  )
}

export default About
