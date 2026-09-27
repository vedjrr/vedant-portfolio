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
- Live presence: "N here" with visitor flags, plus other visitors' pixel cursors on desktop
- Guestbook pixel wall with GitHub sign-in: one note per account, no links, live updates, moderator hide
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

Without these the site still runs; presence, cursors and the guestbook stay hidden.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_REALTIME_URL` | URL of the realtime Worker, e.g. `https://vedant-portfolio-realtime.<you>.workers.dev` |
| `REALTIME_SECRET` | Shared secret the site sends to the Worker for guestbook writes |
| `SESSION_SECRET` | Long random string that signs the guestbook sign-in cookie |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth app for guestbook sign-in |
| `GUESTBOOK_ADMINS` | Comma-separated GitHub logins who can hide notes (default: the site's GitHub user) |

Counters (visits and Clawd pets) use the free Abacus API and need no setup; see `counters` in `src/data/site.ts`.

## Realtime Worker (presence, cursors, guestbook)

`worker/` is a Cloudflare Worker with one SQLite-backed Durable Object. It runs on the Workers Free plan, which needs no card: past a daily limit, requests fail until 00:00 UTC instead of costing money.

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put REALTIME_SECRET   # same value as the site's REALTIME_SECRET
npm run deploy                            # prints the workers.dev URL
```

Set `ALLOWED_ORIGINS` in `worker/wrangler.jsonc` to the site's domains. For local work, copy `worker/.dev.vars.example` to `worker/.dev.vars` and run `npm run dev` (port 8787).

GitHub sign-in: create an OAuth app at GitHub → Settings → Developer settings → OAuth Apps, with the callback URL `https://<your-domain>/api/auth/github/callback`. Use a second app with `http://localhost:3000/api/auth/github/callback` for local work.

Moderation: sign in as an admin and use Hide on a note. A hidden account can't sign again.
