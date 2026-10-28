import {
  siClaude,
  siCss,
  siD3,
  siDocker,
  siFastapi,
  siFramer,
  siGit,
  siGithub,
  siGithubcopilot,
  siGooglegemini,
  siGreensock,
  siHtml5,
  siJavascript,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPreact,
  siPython,
  siReact,
  siReactrouter,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
  siVite,
} from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { IconType } from 'react-icons'
import {
  TbApi,
  TbBolt,
  TbBuildingArch,
  TbClipboardText,
  TbDatabase,
  TbDatabaseSearch,
  TbFileSearch,
  TbFileText,
  TbHierarchy2,
  TbListCheck,
  TbMasksTheater,
  TbMessages,
  TbPaw,
  TbPlugConnected,
  TbTerminal2,
} from 'react-icons/tb'

export interface StackItem {
  name: string
  icon?: SimpleIcon
  glyph?: IconType
}

export interface StackGroup {
  id: 'languages' | 'frontend' | 'backend' | 'ai' | 'devops' | 'leadership' | 'standards'
  label: string
  items: StackItem[]
}

export const stack: StackGroup[] = [
  {
    id: 'languages',
    label: 'Languages',
    items: [
      { name: 'TypeScript', icon: siTypescript },
      { name: 'JavaScript', icon: siJavascript },
      { name: 'Python', icon: siPython },
      { name: 'Java', icon: siOpenjdk },
      { name: 'SQL', glyph: TbDatabase },
      { name: 'HTML5', icon: siHtml5 },
      { name: 'CSS3', icon: siCss },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend & UI',
    items: [
      { name: 'React', icon: siReact },
      { name: 'Next.js', icon: siNextdotjs },
      { name: 'Vite', icon: siVite },
      { name: 'Tailwind CSS', icon: siTailwindcss },
      { name: 'Framer Motion', icon: siFramer },
      { name: 'GSAP', icon: siGreensock },
      { name: 'React Router', icon: siReactrouter },
      { name: 'Preact', icon: siPreact },
      { name: 'D3.js', icon: siD3 },
      { name: 'Zustand', glyph: TbPaw },
    ],
  },
  {
    id: 'backend',
    label: 'Backend & Data',
    items: [
      { name: 'Node.js', icon: siNodedotjs },
      { name: 'FastAPI', icon: siFastapi },
      { name: 'Supabase', icon: siSupabase },
      { name: 'PostgreSQL', icon: siPostgresql },
      { name: 'MongoDB', icon: siMongodb },
      { name: 'SQL', glyph: TbDatabase },
      { name: 'REST APIs', glyph: TbApi },
    ],
  },
  {
    id: 'ai',
    label: 'AI / GenAI',
    items: [
      { name: 'Claude', icon: siClaude },
      { name: 'GitHub Copilot', icon: siGithubcopilot },
      { name: 'Gemini', icon: siGooglegemini },
      { name: 'Groq', glyph: TbBolt },
      { name: 'RAG', glyph: TbFileSearch },
      { name: 'LLM Integration', glyph: TbPlugConnected },
      { name: 'Prompt Engineering', glyph: TbTerminal2 },
      { name: 'Multi-Agent Systems', glyph: TbHierarchy2 },
      { name: 'Vector Databases', glyph: TbDatabaseSearch },
    ],
  },
  {
    id: 'devops',
    label: 'DevOps & Tooling',
    items: [
      { name: 'Git', icon: siGit },
      { name: 'GitHub', icon: siGithub },
      { name: 'Docker', icon: siDocker },
      { name: 'Vercel', icon: siVercel },
      { name: 'Playwright', glyph: TbMasksTheater },
    ],
  },
  {
    id: 'leadership',
    label: 'Leadership',
    items: [
      { name: 'Project planning and delegation', glyph: TbListCheck },
      { name: 'Requirements and specs', glyph: TbClipboardText },
      { name: 'Client communication', glyph: TbMessages },
      { name: 'Technical documentation', glyph: TbFileText },
    ],
  },
  {
    id: 'standards',
    label: 'Standards',
    items: [{ name: 'TOGAF 10', glyph: TbBuildingArch }],
  },
]

export type BrandedTool = StackItem & { icon: SimpleIcon }

export const brandedTools = stack.flatMap(group => group.items.filter((item): item is BrandedTool => Boolean(item.icon)))
