import Window from './Window'
import { useWindows } from '@contexts/WindowsContext'
import SkillsOrbit from '@components/desktop/SkillsOrbit'

const MENU_ITEMS = ['File', 'Edit', 'Format', 'View', 'Help']

const PARAGRAPHS = [
  'Before I write a line of code, I look. I pull real references, sites that solve a piece of the problem well, and name the specific move worth taking from each. If I can\'t point at it, I don\'t trust it.',
  'Then I plan. I mix structured waterfall planning, with requirements, scope and phases written down first, with agile iteration for prototypes, which get built in short rounds, shown early and changed fast. The plan sets the edges and the iteration fills them in.',
  'I use TOGAF 10 in both planning and build to map a business process or an idea to the applications, data and technology that have to carry it. It keeps me honest about what a system is actually for.',
  'My sites and systems are very product-centred. I work out what is really being sold, shown or run, and build outward from that: the bottle, the menu, the vendor, the rate board. The design serves the product, never the reverse.',
  'Three habits hold it together. Before anything ships, someone who isn\'t me looks at it and says yes or no. I design for the phone first, because most people will see the site on one. And images are the product, so I source real ones, generate what I can\'t source, or say plainly what is missing.',
  'No filler. If a sentence doesn\'t earn its place, it doesn\'t ship.',
]

function Approach() {
  const { approachWindow } = useWindows()

  return (
    <Window window={approachWindow}>
      <div className="approach-content">
        <div className="approach-menu-row" aria-hidden="true">
          {MENU_ITEMS.join('   ')}
        </div>
        <div className="approach-paper">
          <h2 className="approach__title">My Approach</h2>
          {PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="approach__paragraph">
              {paragraph}
            </p>
          ))}
          <SkillsOrbit className="orbit-panel--bare" />
        </div>
      </div>
    </Window>
  )
}

export default Approach
