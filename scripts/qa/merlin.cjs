const path = require('path')
const { chromium } = require('C:/Users/DELL/Desktop/projects/Money makers/frozen-basket/node_modules/playwright')

const url = process.argv[2] || 'http://localhost:3000'
const outDir = path.join(__dirname, '..', '..', 'docs', 'shots')

const results = []
const record = (label, pass, detail) => {
  results.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' - ' + detail : ''}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function run(viewport) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  await context.addInitScript(() => {
    window.__ml = { bg: 0, lastBg: null, balloons: [] }
    setInterval(() => {
      const c = document.querySelector('.clippy')
      if (c) {
        const bg = c.style.backgroundPosition || getComputedStyle(c).backgroundPosition
        if (bg !== window.__ml.lastBg) {
          window.__ml.lastBg = bg
          window.__ml.bg++
        }
      }
      const b = document.querySelector('.clippy-balloon')
      if (b) {
        const cs = getComputedStyle(b)
        const shown = !b.hasAttribute('hidden') && cs.display !== 'none' && cs.visibility !== 'hidden' && b.textContent.trim().length > 0
        const txt = b.textContent.trim()
        if (shown && window.__ml.balloons[window.__ml.balloons.length - 1] !== txt) window.__ml.balloons.push(txt)
      }
    }, 60)
  })
  const page = await context.newPage()
  const ml = () => page.evaluate(() => ({ bg: window.__ml.bg, balloons: [...window.__ml.balloons] }))

  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('#window-about', { timeout: 20000 })
  await page.waitForSelector('.clippy', { timeout: 20000 })
  await page.waitForTimeout(800)

  const merlinBox = async () => page.locator('.clippy').boundingBox()

  const clickMerlin = async () => {
    const box = await merlinBox()
    const vp = page.viewportSize()
    const x = Math.min(Math.max(box.x + box.width / 2, 2), vp.width - 2)
    const y = Math.min(Math.max(box.y + box.height / 2, 2), vp.height - 2)
    await page.mouse.click(x, y)
  }

  const chatWindowCount = async () => page.locator('#window-merlinChat').count()
  const chatVisible = async () => {
    const count = await chatWindowCount()
    if (count === 0) return false
    return page.locator('#window-merlinChat').first().isVisible()
  }
  const chatRootCount = async () => page.locator('.wizard-chat').count()

  const isMerlinChatFocused = async () =>
    page.evaluate(() => {
      const el = document.getElementById('window-merlinChat')
      if (!el) return false
      const zIndex = Number(getComputedStyle(el).zIndex) || 0
      const others = Array.from(document.querySelectorAll('[id^="window-"]'))
        .filter((n) => n.id !== 'window-merlinChat' && getComputedStyle(n).visibility === 'visible')
        .map((n) => Number(getComputedStyle(n).zIndex) || 0)
      return others.every((z) => z <= zIndex)
    })

  await clickMerlin()
  await page.waitForTimeout(300)
  record('single click opens the chat', await chatVisible())

  for (let i = 0; i < 3; i++) await clickMerlin()
  await page.waitForTimeout(300)
  record('3 fast clicks leave exactly one chat instance', (await chatWindowCount()) === 1 && (await chatRootCount()) === 1)

  for (let i = 0; i < 10; i++) await clickMerlin()
  await page.waitForTimeout(300)
  const afterTenClicksCount = await chatWindowCount()
  const afterTenClicksVisible = await chatVisible()
  const afterTenClicksFocused = await isMerlinChatFocused()
  record(
    '10 clicks leave exactly one chat window, open and focused',
    afterTenClicksCount === 1 && afterTenClicksVisible && afterTenClicksFocused,
    `count=${afterTenClicksCount} visible=${afterTenClicksVisible} focused=${afterTenClicksFocused}`,
  )

  const stateBeforeDrag = await chatVisible()
  const box = await merlinBox()
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 60, startY, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const stateAfterDrag = await chatVisible()
  record(
    'releasing a drag never opens or closes the chat',
    stateBeforeDrag === stateAfterDrag,
    `before=${stateBeforeDrag} after=${stateAfterDrag}`,
  )

  await clickMerlin()
  await page.waitForTimeout(300)
  record('chat open after explicit open step', await chatVisible())

  const beforeReply = await ml()
  await page.locator('#window-merlinChat input').fill('what projects')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(10000)
  const afterReply = await ml()
  record('a chat reply plays an animation and speaks a short line in the balloon', afterReply.bg > beforeReply.bg && afterReply.balloons.length > beforeReply.balloons.length, 'bgDelta=' + (afterReply.bg - beforeReply.bg) + ' newBalloons=' + JSON.stringify(afterReply.balloons.slice(beforeReply.balloons.length).slice(-1)))

  await page.locator('#window-merlinChat .close-window').click()
  await page.waitForTimeout(12000)
  const idleStart = await ml()
  await sleep(50000)
  const idleEnd = await ml()
  const idleBalloons = idleEnd.balloons.length - idleStart.balloons.length
  const idleMoves = idleEnd.bg - idleStart.bg
  record('50s idle with the chat closed: zero unprompted balloons (balloons only on interaction)', idleBalloons === 0, 'newBalloons=' + idleBalloons)
  record('50s idle with the chat closed: a gentle idle animation plays (25 to 45s cadence)', idleMoves > 0, 'spriteFrameChanges=' + idleMoves)

  const beforeGreet = await ml()
  await clickMerlin()
  await page.waitForTimeout(9000)
  const afterGreet = await ml()
  record('opening the chat plays an animation and speaks the greeting in his balloon', afterGreet.bg > beforeGreet.bg && afterGreet.balloons.slice(beforeGreet.balloons.length).some((x) => /Merlin/.test(x)), 'bgDelta=' + (afterGreet.bg - beforeGreet.bg) + ' balloons=' + JSON.stringify(afterGreet.balloons.slice(-1)))
  await page.locator('#window-merlinChat .close-window').click()
  await page.waitForTimeout(500)
  const closedOk = !(await chatVisible())
  await clickMerlin()
  await page.waitForTimeout(300)
  const reopenedOk = await chatVisible()
  record('close then reopen works', closedOk && reopenedOk, `closed=${closedOk} reopened=${reopenedOk}`)

  const taskbarButtonExists = await page.locator('#task-merlinChat').count()
  if (viewport.width >= 768) {
    await page.locator('#task-merlinChat').first().click()
    await page.waitForTimeout(300)
    const stillOpenAfterTaskbarClick = await chatVisible()
    const focusedAfterTaskbarClick = await isMerlinChatFocused()
    record(
      'taskbar button exists and restores/focuses (same contract as any other window)',
      taskbarButtonExists > 0 && stillOpenAfterTaskbarClick && focusedAfterTaskbarClick,
      `exists=${taskbarButtonExists} stillOpen=${stillOpenAfterTaskbarClick} focused=${focusedAfterTaskbarClick}`,
    )
  } else {
    record(
      'taskbar button DOM node exists (icon-only under 768px)',
      taskbarButtonExists > 0,
      `exists=${taskbarButtonExists}`,
    )
  }
  await page.locator('#window-merlinChat .close-window').click()
  await page.waitForTimeout(500)
  const taskbarGoneAfterClose = (await page.locator('#task-merlinChat').count()) === 0
  record('taskbar button disappears once the chat is closed', taskbarGoneAfterClose)

  await clickMerlin()
  await page.waitForTimeout(300)
  record('click after close reopens the chat', await chatVisible())

  await page.screenshot({ path: path.join(outDir, `merlin-${viewport.width}.png`) })

  const isPreexisting = (msg) =>
    msg.includes('findDOMNode') || msg.includes('ipapi.co') || msg.includes('Error fetching IP address') || msg.includes('ERR_FAILED')
  const wizardConsoleErrors = consoleErrors.filter((m) => !isPreexisting(m))
  const wizardPageErrors = pageErrors.filter((m) => !isPreexisting(m))
  record(
    'zero console errors from the wizard',
    wizardConsoleErrors.length === 0 && wizardPageErrors.length === 0,
    `consoleErrors=${JSON.stringify(wizardConsoleErrors)} pageErrors=${JSON.stringify(wizardPageErrors)} (${consoleErrors.length} total console errors, ${consoleErrors.length - wizardConsoleErrors.length} pre-existing/unrelated)`,
  )

  await context.close()
  await browser.close()
}

;(async () => {
  const only = process.argv[3]
  if (!only || only === '1440') await run({ width: 1440, height: 900 })
  if (!only || only === '375') await run({ width: 375, height: 812 })

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    console.log('FAILURES:')
    failed.forEach((f) => console.log(`  - ${f.label}${f.detail ? ' (' + f.detail + ')' : ''}`))
    process.exitCode = 1
  }
})()
