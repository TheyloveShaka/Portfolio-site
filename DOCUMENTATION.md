# Shaka's Portfolio: technical documentation

A Windows XP Luna desktop, rebuilt as a portfolio. Vite 5, React 18, TypeScript, Tailwind 3, framer-motion 10. Dev server: `npm run dev` on port 3000.

## 1. Architecture

### Entry

`index.html` loads `src/main.tsx`, which imports the fonts, `styles/tokens.css`, `index.css`, `styles/decor.css` and `styles/content-windows.css`, then mounts the providers (Client, Animations, Theme, Windows) around `App.tsx`.

### Boot

`components/screens/LoadingScreen.tsx` types about 0.9s of diagnostics with `windups`, then hands over to the desktop. A skip control is live from the first frame (Esc or Enter). The `fastboot` flag (stored through `utils/zenFs.ts`) and `prefers-reduced-motion` both go straight to the desktop. The hand-off follows `bootHandoff` in `styles/motion.ts`: the taskbar and icons reveal, then About opens and takes focus. The boot sets `data-intro-started` and `data-intro-done` on `<body>` and fires matching window events. Merlin waits for them.

### Scroll shell

`App.tsx` renders a fixed `.wallpaper-layer`, a fixed taskbar, and `#app`. At 768px and up the canvas is exactly the viewport tall and the desktop does not scroll. Under 768px its `min-height` is recomputed from the lowest `[data-window-root]`, `.icons` and `.desk-column`, plus `--taskbar-h` and `--sp-6`, whenever a window opens or moves.

### Windows

- `contexts/WindowsContext.tsx` owns the `WindowKey` union, the open queue (last entry is focused, order sets z-index), icon positions and window positions. Positions persist to IndexedDB through ZenFS and fail soft if storage is unavailable.
- `components/windows/Window.tsx` is the one window shell: title bar, close button, 4px drag threshold, grain body and a 70vh scroll clamp. It has three placements:
  - document-positioned on desktop (`utils/windowLayout.ts` picks and clamps the spot)
  - in-flow under 768px, except About and Merlin, which float
  - viewport-docked for `merlinChat`
- To add a window: extend `WindowKey`, add its entry to `windows` in the context, give it a default icon position in `zenFs.ts`, write a component that wraps `<Window>`, and mount it in `App.tsx`.

### Taskbar

`components/Navbar.tsx` renders the brand label, one `IconTask` button per open window, and the socials from `data/profile.ts`. Task buttons show icon and caption on desktop. Under 768px they become 44px icon-only buttons with an `aria-label`, and the row scrolls sideways if it overflows. The taskbar height is `--taskbar-h` (40px, 44px under 768px).

### Desktop decor

- `components/desktop/DeskColumn.tsx`: the right-hand column (Polaroids, StickyNote, GithubActivity). It scales down on short viewports so Merlin and the taskbar never cover it.
- `components/desktop/Polaroids.tsx`: the portrait polaroid at 1.5x. It develops on first view and straightens on hover.
- `components/desktop/GithubActivity.tsx`: the last 5 months of `react-github-calendar` in an XP card. It hides itself on error.
- `components/desktop/AsciiSky.tsx`: a canvas of ASCII clouds over the wallpaper sky, capped at 24fps. The cursor parts them. It pauses offscreen and when the tab is hidden, and renders one static frame under reduced motion.
- `components/desktop/StickyNote.tsx`: the availability note and the quote, in Caveat.
- `components/PenUnderline.tsx`: the single pen stroke used wherever Shaka speaks for himself.
- `components/desktop/SkillsOrbit.tsx`: the skills orbit, at the bottom of About inside `FitToWidth`. It has 4 rings (18, 24, 30 and 38s), a pause control, and hover to pause. It renders static under 768px and under reduced motion.
- Styles live in `styles/decor.css` and `styles/orbit.css`.

### Case studies

- Data: `src/data/caseStudies.ts`, one entry per study. It holds the eyebrow, headline, summary, metrics, the five sections, the concept flag, links and media.
- Folder: `components/windows/Projects.tsx` (the Projects window). Viewer: `components/windows/CaseStudyViewer.tsx`, opened through `openCaseStudy(id)`.
- Media: `components/CaseStudyMedia.tsx`. It mounts a video only when the tile is in view, plays one tile at a time, and keeps the poster under reduced motion or Save-Data.
- Files: `public/case-studies/<id>/walkthrough.mp4` and `poster.webp`.

### Video pipeline

`node scripts/media/record-walkthroughs.cjs <id> <url>` records a silent 10 to 12s scroll-through with Playwright and encodes it with ffmpeg. The clip is under 2MB and holds the hero for 2s. The poster is a 1280x720 WebP taken from the hero. Raw captures go to `scripts/media/.raw/` (git-ignored). To record a local build, serve it first with `node scripts/media/static-server.cjs <dir> [port=4400] [prefix]`.

### QA scripts

All of them `require` Playwright from `../frozen-basket/node_modules`. That path is hard-coded, so install Playwright locally if that folder moves.

| Script | What it checks |
|---|---|
| `node scripts/qa/shots.cjs <url> <tag>` | Screenshots at 1440, 1280, 768 and 375 into `docs/shots/<tag>-<width>.png`, plus page error counts |
| `node scripts/qa/case-windows-b2.cjs <url>` | Case Studies, the viewer, Hire Me and Approach: fonts, no ASK text, no em dash, Esc and focus |
| `node scripts/qa/merlin.cjs <url>` | 24 Merlin checks: click vs drag, one chat instance, silence when idle, taskbar button, close and reopen |
| `node scripts/qa/probe.cjs <WxH> <url> "<js body>"` | Runs one expression in the page and prints the result |

### Tokens

`src/styles/tokens.css` is the source of truth for colour, type scale, the 4px spacing scale (`--sp-*`), radius, elevation, and motion durations and easings. Reduced motion zeroes the object durations. `src/styles/motion.ts` mirrors the durations and easings as numbers for framer-motion and JS timers, so change both together. Components use tokens, not raw px, ms or hex values.

### Fonts

@fontsource, imported in `main.tsx`: Fira Sans (UI, and title bars at 13px bold), Bricolage Grotesque Variable (display), Caveat Variable (the handwriting voice) and Fira Mono (boot and terminal). `fontaine` in `vite.config.ts` generates metric-matched fallback faces, so nothing falls back to a system default.

### Grain

- Global: `.global-live-grain` in `App.css` is a fixed layer at 200% size. It uses a 192px tile at opacity 0.8, animated `0.5s steps(6)`, and stops under reduced motion.
- Grey bodies: `.grain::before` in `decor.css` uses the same tile at `--grain-size` (224px) and `--grain-opacity` (0.42), with multiply.
- Texture: `src/assets/textures/live-grain.png`, generated to match the reference's statistics.

### Merlin

- `components/wizard/Wizard.tsx` loads the clippyts agent (`public/assets/agents/Merlin.js`) after the boot finishes. It stays silent until clicked.
- A click moves less than 4px and always opens or focuses the chat. It never toggles it closed.
- The sprite is clamped inside the viewport, above the taskbar, after load, after a drag and on resize.
- `WizardChat.tsx` renders the chat in the shared window shell, docked to the viewport, with its own taskbar button and wizard icon (`assets/icons/xp/merlin.svg`).
- `wizardBrain.ts` maps keywords to an intent. An intent returns reply text, a spoken line, an agent animation and an optional window to open.

## 2. Where to edit copy and data

| What | File |
|---|---|
| Voice, drafts, sign-off status | `docs/COPY.md` |
| About (the master copy is verbatim, do not edit it without Shaka) | `src/components/windows/About.tsx` |
| Email, booking link, socials | `src/data/profile.ts` |
| Case studies | `src/data/caseStudies.ts` |
| Stack groups and brand icons (About list and orbit) | `src/data/stack.ts` |
| Hire Me, My Approach.txt | `src/components/windows/HireMe.tsx`, `Approach.tsx` |
| Sticky note, photo caption | `src/components/desktop/StickyNote.tsx`, `Polaroids.tsx` |
| Merlin's replies | `src/components/wizard/wizardBrain.ts` (first message in `WizardChat.tsx`) |
| Window captions and icons | `src/contexts/WindowsContext.tsx` |
| Meta tags | `index.html` |

## 3. Open ASK list

These are waiting on Shaka. Each one is a launch blocker until it is resolved.

1. Resume PDF. Set `resumeUrl` in `src/data/profile.ts`. The Resume icon only renders once it is set.
2. Email and booking link (`profile.email` and `profile.bookingUrl`). Hire Me's "Open email draft" stays disabled until the email is set.
3. Real LinkedIn, Instagram and WhatsApp addresses. They currently point at the bare platform URLs.
4. Confirm the portrait crop.
5. School and degree, years building, and roles held, for the About experience paragraph.
6. Budget bands in UGX for Hire Me.
7. The live URL per case study, and which ones are concepts. Frozen Basket's concept flag is unconfirmed.
8. Privacy: The Venue Menu summary names a real person. Confirm before it ships.
9. OG image (1200x630), canonical URL and theme colour.

## 4. Deploy

`npm run deploy` builds and publishes `dist/` through gh-pages. `dist/` is git-ignored and untracked.
