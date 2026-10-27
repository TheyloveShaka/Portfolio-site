import type { Agent } from 'clippyts'

const FRIENDLY_ANIMATIONS = ['Wave', 'GetAttention', 'Pleased', 'Congratulate', 'Acknowledge', 'Greet'] as const
const GREET_ANIMATION = 'Greet'
const GREETING_LINE = 'Hey, I am Merlin. Ask me about Shaka\'s work.'
const ANIMATION_BUSY_MS = 7000
const SPEECH_WORD_MS = 200
const SPEECH_TAIL_MS = 2000

let busyUntil = 0

export const isMerlinBusy = (): boolean => Date.now() < busyUntil

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

export const performMerlin = (agent: Agent, animation: string | null, line?: string): void => {
  agent.stop()
  let busyMs = 0
  if (animation && agent.hasAnimation(animation)) {
    agent.play(animation)
    busyMs += ANIMATION_BUSY_MS
  }
  if (line) {
    agent.speak(line, false)
    busyMs += line.split(/\s+/).length * SPEECH_WORD_MS + SPEECH_TAIL_MS
  }
  busyUntil = Date.now() + busyMs
}

export const playFriendly = (agent: Agent): void => {
  const options = FRIENDLY_ANIMATIONS.filter((name) => agent.hasAnimation(name))
  if (options.length) performMerlin(agent, pick(options))
}

export const greet = (agent: Agent): void => performMerlin(agent, GREET_ANIMATION, GREETING_LINE)

export const playIdle = (agent: Agent): void => {
  const options = agent.animations().filter((name) => name.startsWith('Idle'))
  if (!options.length) return
  agent.play(pick(options))
  busyUntil = Date.now() + ANIMATION_BUSY_MS
}
