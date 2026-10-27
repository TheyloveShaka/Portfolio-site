import { FormEvent, MutableRefObject, useEffect, useRef, useState } from 'react'
import type { Agent } from 'clippyts'

import Window from '@components/windows/Window'
import { useWindows } from '@contexts/WindowsContext'
import { getWizardReply } from './wizardBrain'
import merlinIcon from '@assets/icons/xp/merlin.svg'
import './wizard.css'

interface ChatMessage {
  id: string
  from: 'merlin' | 'visitor'
  text: string
}

interface WizardChatProps {
  agentRef: MutableRefObject<Agent | null>
}

const STARTER: ChatMessage = {
  id: 'starter',
  from: 'merlin',
  text: 'Hey, I\'m Merlin. Ask me about Shaka\'s work, his stack, or how to reach him.',
}

const SUGGESTIONS = ['Projects', 'Skills', 'Contact', 'Tell me a joke']

let idCounter = 0
const nextId = () => `msg-${Date.now()}-${idCounter++}`

const WizardChat = ({ agentRef }: WizardChatProps) => {
  const { windows, openOrFocusWindow } = useWindows()
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const replyTimeoutRef = useRef<number>()

  useEffect(() => {
    const list = messagesRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(
    () => () => {
      if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current)
    },
    [],
  )

  const respondTo = (text: string) => {
    const visitorMsg: ChatMessage = { id: nextId(), from: 'visitor', text }
    setMessages((prev) => [...prev, visitorMsg])
    setIsTyping(true)

    if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current)

    const delay = 400 + Math.random() * 500
    replyTimeoutRef.current = window.setTimeout(() => {
      const reply = getWizardReply(text)
      setIsTyping(false)
      setMessages((prev) => [...prev, { id: nextId(), from: 'merlin', text: reply.text }])

      const agent = agentRef.current
      if (agent) {
        agent.stopCurrent()
        if (agent.hasAnimation(reply.animation)) {
          agent.play(reply.animation)
        }
        agent.speak(reply.speak, false)
      }

      if (reply.action) {
        openOrFocusWindow(reply.action)
      }
    }, delay)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    respondTo(trimmed)
  }

  const handleSuggestion = (label: string) => {
    respondTo(label)
  }

  return (
    <Window window={windows.merlinChat} mobileMaxHeight="min(60vh, 420px)">
      <div className="wizard-chat">
          <div className="wizard-chat-messages" ref={messagesRef} aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`wizard-chat-msg from-${m.from}`}>
                {m.from === 'merlin' && <img src={merlinIcon} alt="" className="wizard-chat-avatar" />}
                <div className="wizard-chat-bubble">{m.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="wizard-chat-typing" aria-label="Merlin is typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="wizard-chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="btn-secondary" onClick={() => handleSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>

          <form className="wizard-chat-inputrow" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="field-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Merlin something..."
              aria-label="Message to Merlin"
            />
            <button type="submit" className="btn-primary">Send</button>
          </form>
      </div>
    </Window>
  )
}

export default WizardChat
