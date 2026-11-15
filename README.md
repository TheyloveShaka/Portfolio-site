# Shaka's Portfolio
**Live:** https://shakas-portfolio.vercel.app

An interactive, Windows XP styled portfolio for **Shaka Nathan K**, developer, AI engineer and project lead based in Kampala, Uganda. A short typed boot hands over to a scrolling XP desktop: About opens on arrival, case studies live in an Explorer folder with silent walkthrough videos, and Merlin waits in the corner until you click him.

## What it is

- **Boot**: about 0.9s of typed diagnostics, then the desktop. Esc or Enter skips it, and `fastboot` or reduced motion goes straight to the desktop.
- **Desktop**: files on the left, a photo and a sticky note top-right, a skills orbit below the fold. The taskbar and wallpaper stay fixed while the desktop scrolls.
- **Windows**: About, Case Studies, the case study viewer, Hire Me, My Approach.txt, Terminal, Device and Credits, all sharing one XP Luna window shell.
- **Terminal**: an in-browser shell (`xterm.js` plus `@zenfs/core`) with `help`, `ls`, `neofetch`, `whoami`, `skills` and `socials`.
- **Merlin**: a clippyts assistant with a docked chat window and its own taskbar button.

## Tech stack

React 18, TypeScript, Vite 5, Tailwind 3, framer-motion 10, react-draggable, react-icons, simple-icons, windups, xterm.js, @zenfs/core, clippyts, and @fontsource for Fira Sans, Fira Mono, Bricolage Grotesque and Caveat.

## Documentation

See **[DOCUMENTATION.md](DOCUMENTATION.md)** for the architecture, where to edit copy and data, the video and QA scripts, and the open ASK list.

## Development

```bash
npm run dev       # Vite dev server on port 3000
npm run build     # production build into dist/
npm run preview   # preview the production build
npm run lint      # ESLint
```

## Deploy

```bash
npm run deploy    # builds and publishes dist/ via gh-pages
```

## Credits

Forked and adapted from **[kisimoff.com](https://kisimoff.com)** by **Valentin Kisimov** ([source](https://github.com/kisimoff/portfolio)). The OS-as-portfolio concept, the window system, the boot sequence and the terminal all start from his work. Thank you, Valentin.

- **Inspiration**: the OS-as-portfolio idea traces back to [Poolside FM](https://poolsuite.net/).
- **Merlin**: [clippy.js](https://github.com/pi0/clippy.js) via [clippyts](https://www.npmjs.com/package/clippyts).
- **Libraries**: [Xterm.js](https://xtermjs.org/), [ZenFS](https://zenfs.dev/core/), [react-draggable](https://www.npmjs.com/package/react-draggable), [framer-motion](https://www.npmjs.com/package/framer-motion), [simple-icons](https://simpleicons.org/).
