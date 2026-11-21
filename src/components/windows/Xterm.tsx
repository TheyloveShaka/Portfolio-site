import { useEffect, useRef } from 'react'
import Window from '@components/windows/Window'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { useWindows } from '@contexts/WindowsContext'
import { processCommand, config, getPrompt } from '@/utils/terminalCommandProcessor'
import { createFixBootGame, type FixBootGame } from '@/utils/fixBootGame'
import { isMobile } from 'react-device-detect'

const FIX_BOOT_TEASER = '\x1b[2mTry\x1b[0m \x1b[1;93mfix-boot\x1b[0m \x1b[2mto fix a broken PC, or help for more.\x1b[0m\r\n'

const TerminalWindow = () => {
  const { terminalWindow, openOrFocusWindow } = useWindows()
  const openRef = useRef(openOrFocusWindow)
  openRef.current = openOrFocusWindow

  const terminalRef = useRef<HTMLDivElement>(null)
  const terminal = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const game = useRef<FixBootGame | null>(null)

  const initializeTerminal = () => {
    if (terminalRef.current) {
      terminal.current = new Terminal(config)
      fitAddon.current = new FitAddon()
      terminal.current.loadAddon(fitAddon.current)
      terminal.current.open(terminalRef.current)
      fitAddon.current.fit()

      if (terminal.current) {
        if (isMobile) {
          processCommand('ipconfig', terminal.current)
        }
        processCommand('neofetch', terminal.current)
        terminal.current.write(FIX_BOOT_TEASER)
      }

      terminal.current.write(getPrompt())
      terminal.current.onData(handleTerminalData)
    }
  }

  let inputBuffer = ''

  const startFixBoot = (term: Terminal) => {
    game.current = createFixBootGame(term, {
      onExit: (won) => {
        game.current = null
        term.write(getPrompt())
        if (won) openRef.current('caseStudies')
      },
    })
  }

  const handleTerminalData = (data: string) => {
    if (game.current?.isBusy()) return
    if (data === '\r') {
      const command = inputBuffer
      inputBuffer = ''
      const term = terminal.current
      if (!term) return
      term.write('\r\n')
      if (game.current) {
        game.current.handle(command)
        return
      }
      const name = command.trim().toLowerCase()
      if (name === 'fix-boot' || name === 'fixboot') {
        startFixBoot(term)
        return
      }
      processCommand(command, term)
      term.write(getPrompt())
    } else if (data === '\x7f') {
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1)
        terminal.current?.write('\b \b')
      }
    } else {
      inputBuffer += data
      terminal.current?.write(data)
    }
  }

  useEffect(() => {
    initializeTerminal()

    return () => {
      game.current?.dispose()
      if (terminal.current) {
        terminal.current.dispose()
      }
    }
  }, [])

  return (
    <Window window={terminalWindow}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </Window>
  )
}

export default TerminalWindow
