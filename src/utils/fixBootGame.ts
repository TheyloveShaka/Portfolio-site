import type { Terminal } from 'xterm'

type Step = 'fixmbr' | 'fixboot' | 'rebuildbcd'

interface StepInfo {
  done: string
  vague: string
  exact: string
}

const STEPS: Step[] = ['fixmbr', 'fixboot', 'rebuildbcd']

const STEP_INFO: Record<Step, StepInfo> = {
  fixmbr: {
    done: 'Master boot record rewritten.',
    vague: 'The master boot record is damaged. bootrec has a switch for that.',
    exact: 'Try: bootrec /fixmbr',
  },
  fixboot: {
    done: 'Boot sector rewritten.',
    vague: 'The boot sector needs rewriting too.',
    exact: 'Try: bootrec /fixboot',
  },
  rebuildbcd: {
    done: 'Boot configuration rebuilt.',
    vague: 'The PC cannot find Windows. Rebuild the boot configuration data.',
    exact: 'Try: bootrec /rebuildbcd',
  },
}

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const YELLOW = '\x1b[1;93m'
const GREEN = '\x1b[1;92m'
const CYAN = '\x1b[96m'
const RED = '\x1b[1;91m'
const BAR = '\x1b[94m\u2588\x1b[0m'
const BAR_BLOCKS = 16

const PROMPT = `${YELLOW}X:\\Sources>${RESET} `
const CONFIRM_PROMPT = 'Add installation to boot list? Yes(Y)/No(N)/All(A): '

export interface FixBootGame {
  handle: (line: string) => void
  isBusy: () => boolean
  dispose: () => void
}

interface Options {
  onExit: (won: boolean) => void
}

export const createFixBootGame = (term: Terminal, { onExit }: Options): FixBootGame => {
  const done = new Set<Step>()
  const hintLevel: Record<Step, number> = { fixmbr: 0, fixboot: 0, rebuildbcd: 0 }
  const timers: number[] = []
  let busy = true
  let confirming = false
  let moves = 0
  let finished = false

  const line = (text = '') => term.write(`${text}\r\n`)

  const later = (ms: number, run: () => void) => {
    timers.push(window.setTimeout(run, ms))
  }

  const prompt = () => {
    busy = false
    term.write(confirming ? CONFIRM_PROMPT : PROMPT)
  }

  const markDone = (step: Step) => {
    const fresh = !done.has(step)
    done.add(step)
    line('The operation completed successfully.')
    if (fresh) line(`${CYAN}[${done.size}/3]${RESET} ${STEP_INFO[step].done}`)
    if (done.size === STEPS.length) {
      win()
      return
    }
    prompt()
  }

  const scan = (then: () => void) => {
    busy = true
    line('Scanning all disks for Windows installations.')
    line(`${DIM}Please wait, since this may take a while...${RESET}`)
    later(900, () => {
      line('Successfully scanned Windows installations.')
      line('Total identified Windows installations: 1')
      line('[1]  C:\\Windows')
      then()
    })
  }

  const win = () => {
    busy = true
    finished = true
    line()
    line('All repairs done. Restarting...')
    later(700, () => {
      term.write('Starting Windows  ')
      for (let i = 0; i < BAR_BLOCKS; i++) later(110 * i, () => term.write(BAR))
      later(110 * BAR_BLOCKS + 400, () => {
        line()
        line()
        line(`${GREEN}It boots!${RESET}`)
        line(`Fixed in ${moves} command${moves === 1 ? '' : 's'}. That rush is why I still do this.`)
        line(`${DIM}Opening my projects...${RESET}`)
        later(1100, () => onExit(true))
      })
    })
  }

  const hint = () => {
    const next = STEPS.find((step) => !done.has(step))
    if (!next) return
    const info = STEP_INFO[next]
    line(`${CYAN}Hint:${RESET} ${hintLevel[next] === 0 ? info.vague : info.exact}`)
    hintLevel[next] = Math.min(1, hintLevel[next] + 1)
  }

  const bootrec = (flag: string | undefined) => {
    switch (flag) {
      case undefined:
      case '/?':
        line('Usage: bootrec [/FixMbr | /FixBoot | /ScanOs | /RebuildBcd]')
        line('  /FixMbr      Writes a new master boot record')
        line('  /FixBoot     Writes a new boot sector')
        line('  /ScanOs      Scans all disks for Windows installations')
        line('  /RebuildBcd  Rebuilds the boot configuration data')
        prompt()
        return
      case '/fixmbr':
        markDone('fixmbr')
        return
      case '/fixboot':
        markDone('fixboot')
        return
      case '/scanos':
        scan(prompt)
        return
      case '/rebuildbcd':
        scan(() => {
          confirming = true
          prompt()
        })
        return
      default:
        line(`bootrec: unknown switch ${flag}. Type bootrec /? for the list.`)
        prompt()
    }
  }

  const answer = (reply: string) => {
    const choice = reply.charAt(0)
    if (choice === 'y' || choice === 'a') {
      confirming = false
      markDone('rebuildbcd')
      return
    }
    if (choice === 'n') {
      confirming = false
      line('Nothing was added. The PC still cannot find Windows.')
      prompt()
      return
    }
    prompt()
  }

  const handle = (raw: string) => {
    if (busy || finished) return
    const input = raw.trim().toLowerCase()
    if (confirming) {
      answer(input)
      return
    }
    if (!input) {
      prompt()
      return
    }
    moves++
    const [command, flag] = input.split(/\s+/)
    switch (command) {
      case 'bootrec':
      case 'bootrec.exe':
        bootrec(flag)
        return
      case 'hint':
      case 'help':
        hint()
        prompt()
        return
      case 'dir':
        line(' Directory of X:\\Sources')
        line('  boot.wim    recovery    setup.exe')
        prompt()
        return
      case 'cls':
      case 'clear':
        term.clear()
        prompt()
        return
      case 'exit':
      case 'quit':
        busy = true
        line('Recovery closed. The PC is still broken. Run fix-boot to try again.')
        onExit(false)
        return
      default:
        line(`'${command}' is not recognized as an internal or external command,`)
        line('operable program or batch file.')
        prompt()
    }
  }

  line(`${DIM}Restarting VOYAGER1...${RESET}`)
  later(700, () => {
    line()
    line(`${RED}BOOTMGR is missing${RESET}`)
    line('Press Ctrl+Alt+Del to restart')
  })
  later(1700, () => {
    line()
    line(`${YELLOW}This PC won't boot.${RESET} I fixed one of these as a kid. Your turn.`)
    line('You are on the recovery disk. Repair the boot in three commands.')
    line(`${DIM}Type hint if you get stuck, or exit to give up.${RESET}`)
    line()
    prompt()
  })

  return {
    handle,
    isBusy: () => busy,
    dispose: () => timers.forEach((id) => window.clearTimeout(id)),
  }
}
