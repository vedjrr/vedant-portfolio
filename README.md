# Vedant Ambre · Portfolio

Personal portfolio of Vedant Ambre, business analyst who ships software.

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- Tailwind CSS 4
- Geist Sans and Geist Pixel fonts
- `motion` for animation, `cmdk` for the command menu, `next-themes` for theming

## Features

- Profile header with a click-to-glitch avatar, rotating letter-flip subtitle and live status
- Live Maynooth clock (Europe/Dublin) ticking every second in the header
- Visitor counter (`/api/visitors`, backed by the free Abacus counter)
- GitHub contribution graph in GitHub greens, with streak and best-day stats, refreshed hourly
- Live "last pushed" card with the latest public commit
- Brand-coloured tech tags, pointer spotlight on project cards and a green scroll progress bar
- Name scramble effect on hover
- Command menu on `⌘K`, `Ctrl+K` or `/`
- Theme toggle on `D`, with a top-down wipe using the View Transitions API
- Synthesized UI click sounds (Web Audio) and haptics on supported devices
- Section titles scramble in, and hairlines and hatched separators sweep in on scroll
- Contribution graph fills with colour in a diagonal wave, and stats count up
- Staggered stack tags, magnetic connect links and a word-by-word quote reveal
- Education timeline line that fills as you scroll
- Project cards morph between the home page and the projects page (React `ViewTransition`)
- All `motion` animations follow the OS reduced-motion setting
- Projects page with every project

## Develop

```bash
npm install
npm run dev
```

Edit content in `src/data/site.ts`.

### Environment (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `COUNTER_NAMESPACE` | `vedantambre-portfolio` | Abacus namespace for the visitor count |
| `COUNTER_KEY` | `visits` | Abacus key for the visitor count |
| `COUNTER_OFFSET` | `471` | Added to the Abacus count so the public count starts at 479 |
