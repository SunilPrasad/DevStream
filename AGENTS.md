# DevStream - Agent Instructions

## Project Overview
DevStream is an Angular app that aggregates tech blog RSS feeds and displays
articles as full screen swipeable cards with on-demand AI summarization.
Users swipe up/down through articles. Summaries are generated only when a
card is about to be shown. No backend — fully client side.

---

## Tech Stack
- Angular v21 (latest) with standalone components
- Bootstrap v5.3.8 CSS only (no Bootstrap JS, no NGX-Bootstrap, no NG-Bootstrap)
- Bootstrap Icons v1.13 for iconography
- Angular CDK for swipe/gesture interactions
- Angular HttpClient for RSS and Claude API calls
- Vitest for testing (Angular v21 default)
- rss2json.com API to bypass RSS CORS issues
- Claude API for on-demand article summarization

---

## Folder Structure (enforce strictly, never deviate)
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── article.model.ts        ← ArticleMetadata interface
│   │   │   └── blog-source.model.ts    ← BlogSource interface
│   │   ├── services/
│   │   │   ├── rss.service.ts          ← Fetch and parse RSS feeds
│   │   │   ├── feed.service.ts         ← Build and manage article pool
│   │   │   └── summarizer.service.ts   ← Claude API on-demand summarization
│   │   └── constants/
│   │       └── blog-sources.ts         ← All RSS source URLs and metadata
│   ├── features/
│   │   └── feed/
│   │       ├── feed.component.ts       ← Main swipeable feed container
│   │       └── feed.component.html
│   └── shared/
│       └── components/
│           ├── article-card/           ← Single swipeable card component
│           └── skeleton-card/          ← Bootstrap placeholder shimmer card
├── styles/
│   └── custom-bootstrap.scss           ← Bootstrap SCSS overrides and dark theme

---

## Angular v21 Rules
- Standalone components only — no NgModules ever
- Signals for all state — use signal(), computed(), effect()
- Signal Forms for any form needs (v21 default)
- Zoneless change detection — no zone.js
- Use inject() function instead of constructor injection
- Async pipe in templates where signals are not used
- Lazy load all feature routes
- No `any` in TypeScript — explicit types always
- Vitest for all unit tests

---

## Bootstrap v5.3.8 Rules
- Install CSS only: npm i bootstrap@5.3.8
- Install icons: npm i bootstrap-icons
- Import Bootstrap SCSS in custom-bootstrap.scss so variables can be overridden
- Do NOT import bootstrap.bundle.js or any Bootstrap JS files anywhere
- Do NOT install NGX-Bootstrap or NG-Bootstrap
- Enable Bootstrap dark mode by setting data-bs-theme="dark" on root <html>
- Override Bootstrap CSS variables for dark sleek aesthetic:
    --bs-body-bg: #0a0a0a
    --bs-body-color: #e8e8e8
    --bs-card-bg: #141414
    --bs-border-color: #2a2a2a
    --bs-primary: #3b82f6
- Use Bootstrap utility classes for spacing, flex, and positioning
- Use Bootstrap card component as structural base for article cards
- Use Bootstrap placeholder classes for skeleton shimmer loading state
- Angular CDK handles all gestures and interactions — not Bootstrap JS

---

## Code Rules
- Small focused components — single responsibility
- Always handle loading, error, and empty states
- Never summarize articles in bulk or on app load — on demand only
- Signals preferred over RxJS for local component state
- Keep services pure and testable
- SCSS only for custom styles — no inline styles ever

---

## Summarization Rules
- Only summarize when a card is about to become the active visible card
- Pre-summarize next 2 cards silently in background
- Cache all summaries in memory using Map<articleUrl, string>
- Never persist summaries to localStorage — regenerate each session
- Show skeleton card while summary is being generated
- Claude API prompt must explicitly request 10-15 lines of detailed
  readable prose — not bullet points
- If summarization fails: show card with title and "Summary unavailable"
  message — always still show "Read Original Post" link

---

## Feed Logic Rules
- On app load: fetch all RSS sources via CORS proxy (corsproxy.io with allorigins.win fallback)
- Extract lightweight metadata only — no content, no summarization
- Interleave articles from all sources using round robin:
  (1 Cloudflare → 1 Meta → 1 Google → 1 Discord → 1 Shopify → 1 Microsoft
  → 1 GitHub → repeat)
- Fix interleaved order for the session
- Store article pool as a signal in feed.service.ts
- First ever visit: pick a random index as starting point
- Return visit: restore last saved index from localStorage
- If saved index is out of range: fall back to random start

---

## Card UI Rules (enforce strictly)
- Full screen card — one card visible at a time, nothing else
- Top 30% of card: article image sourced from RSS
  — fallback to source blog logo if no image in RSS
- Bottom 70% of card: text content section
  — Top right corner: source blog logo small and rounded
  — Article title: bold and prominent, large font
  — Summary body: 10-15 lines of detailed readable prose
  — Published date: small muted text using Bootstrap text-muted
  — Bottom of card: "Read Original Post" in accent blue as tappable
    link — opens article URL in new browser tab (_blank)
- Swipe up gesture: transition to next card (smooth upward animation)
- Swipe down gesture: transition to previous card (smooth downward animation)
- Card transition: CSS translate + opacity, smooth and physical feeling
- On mobile: card fills 100vw and 100vh — true full screen
- On tablet and desktop: card centered, max-width 480px,
  dark #0a0a0a background fills the rest of the screen

---

## Design Aesthetic
- Modern, sleek, minimal — inspired by Linear, Vercel, Raycast
- Dark first — deep dark background #0a0a0a at all times
- Card surface: #141414 or #1a1a1a
- Accent color: electric blue #3b82f6 — used for CTA and active states only
- Typography: Bootstrap default system font stack (San Francisco, Segoe UI,
  Roboto) — clean and legible
- Borders: subtle, use Bootstrap border utilities with --bs-border-color
  overridden to #2a2a2a
- No heavy drop shadows — subtle depth only
- Swipe animation must feel physical and satisfying — not janky

---

## Blog Sources
| Blog                | RSS URL                                                       |
|---------------------|---------------------------------------------------------------|
| Cloudflare Blog     | https://blog.cloudflare.com/rss/                              |
| Meta Engineering    | https://engineering.fb.com/feed/                              |
| Google Developers   | https://developers.googleblog.com/feeds/posts/default         |
| Discord Engineering | https://discord.com/blog/rss                                  |
| Shopify Engineering | https://shopify.engineering/index.xml                         |
| Microsoft           | https://devblogs.microsoft.com/engineering-at-microsoft/feed/ |
| GitHub Blog         | https://github.blog/feed/                                     |

---

## Session Instructions
At the start of every session:
1. Read AGENTS.md and REQUIREMENTS.md fully
2. Report current checklist status clearly
3. Proceed to the next unchecked step or ask which step to work on
4. Never break or regress any previously completed step

## Current Status
[x] Step 1 - Project scaffolded (Angular v21 + Bootstrap v5.3.8 + Zoneless)
[x] Step 2 - Models and constants defined
[x] Step 3 - RSS service and feed pool builder
[x] Step 4 - Summarizer service (Claude API, on demand, memory cached)
[x] Step 5 - Swipeable card feed UI with Angular CDK gestures
[x] Step 6 - Skeleton loading states using Bootstrap placeholders
[x] Step 7 - Progress persistence with localStorage
[x] Step 8 - UI polish, swipe animations, responsive tweaks