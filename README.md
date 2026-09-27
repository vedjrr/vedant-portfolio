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
- Live visitor counter: real visits only, ticking up as people arrive (Abacus hit + SSE stream)
- Live presence: "N here" with visitor flags, plus other visitors' pixel cursors, pinned to the content under them so they line up at any window size
- Guestbook whiteboard with no sign-in: draw or type anywhere, undo your own marks, live for everyone, and an owner-only eraser
- Clawd naps in the footer: pet it to wake it, it watches your pointer, and pets are counted
- Konami code (or ten quick pets) sends a Clawd parade across the screen
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

Without it the site still runs; presence, cursors and the guestbook stay hidden.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_REALTIME_URL` | URL of the realtime Worker, e.g. `https://vedant-portfolio-realtime.<you>.workers.dev` |

Counters (visits and Clawd pets) use the free Abacus API and need no setup; see `counters` in `src/data/site.ts`.

## Realtime Worker (presence, cursors, guestbook)

`worker/` is a Cloudflare Worker with one SQLite-backed Durable Object. It runs on the Workers Free plan, which needs no card: past a daily limit, requests fail until 00:00 UTC instead of costing money.

```bash
cd worker
npm install
npx wrangler login
npm run deploy                           # prints the workers.dev URL
npx wrangler secret put ADMIN_SECRET     # optional: turns on the guestbook eraser
```

Set `ALLOWED_ORIGINS` in `worker/wrangler.jsonc` to the site's domains. For local work, copy `worker/.dev.vars.example` to `worker/.dev.vars` and run `npm run dev` (port 8787).

Guestbook limits: each visitor (by IP) can add 150 marks an hour and keep 300 a day, notes are 60 characters with no links, and the board holds 5,000 marks.

Moderation: open `/guestbook#admin=<ADMIN_SECRET>` once in your browser. The key is saved in that browser and removed from the address bar, and an Erase tool appears. Click a mark to erase it, or Shift-click to erase everything that visitor added.
