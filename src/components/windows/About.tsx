import avatar from '@assets/photos/shaka-avatar.webp'
import Window from './Window'
import { useWindows } from '@contexts/WindowsContext'
import CopyEmailAction from '@components/CopyEmailAction'
import PenUnderline from '@components/PenUnderline'
import StackIcon from '@components/StackIcon'
import FitToWidth from '@components/FitToWidth'
import SkillsOrbit from '@components/desktop/SkillsOrbit'
import { CLOSING_QUOTE } from '@components/desktop/StickyNote'
import { profile } from '@/data/profile'
import { stack } from '@/data/stack'

const UNDERLINE_PHRASE = 'have fun trying.'
const QUOTE_LEAD = CLOSING_QUOTE.slice(0, CLOSING_QUOTE.length - UNDERLINE_PHRASE.length)

const MASTER_COPY_PARAGRAPHS = [
  'Hi! I\'m Shaka! Let me tell you a bit about me. It all began when I was a kid and I touched a computer to try to make it do something I wanted. And it worked. My life has never been the same since. From that moment on, I was hooked.',
  'Every interaction with tech since has really just been me chasing that same magic - poking around in settings I didn\'t understand, breaking things on purpose to see how they worked, and slowly figuring out how to bend a machine to my will.',
  'That chase eventually turned into a career. I\'m a Developer & AI Engineer based in Kampala, Uganda, and I still get the same rush today that I did back then.',
  'On the frontend, I build with React and TypeScript, on the AI side I\'m deep into LLM-powered apps and agents, and underneath it all I lean on Python and data to make sense of things.',
]

function About() {
  const { aboutWindow, openOrFocusWindow } = useWindows()

  return (
    <Window window={aboutWindow} mobileMaxHeight="458px">
      <div className="about-window-content p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="font-display font-bold text-display-xl text-ink m-0">
            Shaka Nathan K
          </h1>
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
          <div className="flex items-start gap-4">
            <img
              src={avatar}
              alt="Shaka Nathan K"
              width={80}
              height={80}
              className="flex-shrink-0 about-avatar"
            />
            <p className="font-ui text-body text-ink-2 m-0">{MASTER_COPY_PARAGRAPHS[0]}</p>
          </div>
          {MASTER_COPY_PARAGRAPHS.slice(1).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="font-ui text-body text-ink-2 m-0">
              {paragraph}
            </p>
          ))}
          <p className="font-ui text-body text-ink-2 m-0">
            Lately that&apos;s meant building real products end-to-end - like{' '}
            <a
              href="https://the-venue-menu.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="text-link hover:text-link-hover"
            >
              The Venue Menu
            </a>
            , Uganda&apos;s wedding &amp; venue discovery platform.
          </p>
          <p className="font-ui text-body text-ink-2 m-0">
            Outside of code, I&apos;m a comic-book fan, an astrophysics nerd who can&apos;t stop
            reading about black holes, a music lover, I&apos;m always behind on some movie or
            anime, and you&apos;ll usually find me either gaming or watching sports when
            I&apos;m not building something.
          </p>

          <p className="font-ui text-small text-ink bg-luna-50 p-4 m-0" style={{ fontStyle: 'italic' }}>
            Pending from Shaka: how long he&apos;s been building professionally, his path so far
            (freelance, in-house, agency, his own product), any schooling or certifications worth
            naming, and a concrete AI Engineer example beyond The Venue Menu. This space fills in
            once he answers, not before.
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
              <ul className="stack-group__list">
                {group.items.map((item) => (
                  <li key={item.name} className="stack-item">
                    {item.icon && (
                      <span className="stack-item__icon" aria-hidden="true">
                        <StackIcon icon={item.icon} />
                      </span>
                    )}
                    <span className="stack-item__name">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FitToWidth>
          <SkillsOrbit />
        </FitToWidth>
      </div>
    </Window>
  )
}

export default About
