import avatar from '@assets/photos/shaka-avatar.webp'
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

const MASTER_COPY_PARAGRAPHS = [
  'Hi! I\'m Shaka! Let me tell you a bit about me. It all began when I was a kid and I touched a computer to try to make it do something I wanted. And it worked. My life has never been the same since. From that moment on, I was hooked.',
  'Every interaction with tech since has really just been me chasing that same magic - poking around in settings I didn\'t understand, breaking things on purpose to see how they worked, and slowly figuring out how to bend a machine to my will.',
  'That chase eventually turned into a career. I\'m a Developer & AI Engineer based in Kampala, Uganda, and I still get the same rush today that I did back then.',
  "I have some knowledge of tools like React, TypeScript, Python, and LLM-powered apps and agents, but I'm always open to learning and to tackling challenges or projects in tech and tools I'm yet to learn.",
  "Outside of code, I'm a comic-book universe fan, a nerd who can't stop reading about quantum physics and astrophysics, a 2010s music lover, I'm always behind on some sitcom, and you'll usually find me either on the game or watching Man United when I'm not building something.",
]

function About() {
  const { aboutWindow, openOrFocusWindow } = useWindows()

  return (
    <Window window={aboutWindow} mobileMaxHeight="458px">
      <div className="about-window-content p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="about-heading-row">
            <h1 className="font-display font-bold text-display-xl text-ink m-0">
              Shaka Nathan K
            </h1>
            <img
              src={avatar}
              alt="Shaka Nathan K"
              width={88}
              height={88}
              className="about-avatar"
            />
          </div>
          <p className="font-display font-medium text-display-l text-ink-2 m-0">
            Developer · AI Engineer · Project Lead
          </p>
          <p className="font-ui text-body text-ink-2 m-0 flex items-center gap-2">
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
            I build web platforms and AI-powered tools end to end, and lead the projects that
            need someone to own the whole thing.
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

        <div className="flex flex-col gap-4" style={{ maxWidth: 'var(--measure)' }}>
          {MASTER_COPY_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="font-ui text-body text-ink-2 m-0">
              {paragraph}
            </p>
          ))}

          <p className="font-ui text-body text-ink-2 m-0">
            I&apos;m studying Information Systems and Technology at Makerere University, and I&apos;ve
            been developing professionally for two years. I work freelance today, with the goal of
            growing that into my own agency, and I&apos;m working towards my certifications.
          </p>

          <p className="font-ui text-body text-ink-2 m-0">
            At Makerere I led Team Makerere 1 to an award in The Open Group&apos;s INITIATE Enterprise
            Architecture Competition for Students 2026, with ConnectedCare 360, an enterprise
            architecture built with TOGAF and ArchiMate.
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
