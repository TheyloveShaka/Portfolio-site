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

export interface StackItem {
  name: string
  icon?: SimpleIcon
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
      { name: 'SQL' },
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
      { name: 'Zustand' },
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
      { name: 'SQL' },
      { name: 'REST APIs' },
    ],
  },
  {
    id: 'ai',
    label: 'AI / GenAI',
    items: [
      { name: 'Claude', icon: siClaude },
      { name: 'GitHub Copilot', icon: siGithubcopilot },
      { name: 'Gemini', icon: siGooglegemini },
      { name: 'Groq' },
      { name: 'RAG' },
      { name: 'LLM Integration' },
      { name: 'Prompt Engineering' },
      { name: 'Multi-Agent Systems' },
      { name: 'Vector Databases' },
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
      { name: 'Playwright' },
    ],
  },
  {
    id: 'leadership',
    label: 'Leadership',
    items: [
      { name: 'Project planning and delegation' },
      { name: 'Requirements and specs' },
      { name: 'Client communication' },
      { name: 'Technical documentation' },
    ],
  },
  {
    id: 'standards',
    label: 'Standards',
    items: [{ name: 'TOGAF 10' }],
  },
]

export const brandedTools = stack.flatMap(group => group.items.filter((item): item is Required<StackItem> => Boolean(item.icon)))
