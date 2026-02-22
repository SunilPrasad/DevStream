\# DevStream - Product Requirements



\## Product Vision

DevStream is a mobile-first tech blog aggregator. It pulls articles from

top engineering blogs and presents them as full screen swipeable cards.

Each card shows an AI-generated detailed summary so users get real insight

without leaving the app. Swipe up for the next article, swipe down to go back.



---



\## User Stories



\### Feed Experience

\- As a user I see one full screen article card at a time

\- As a user I swipe up to move to the next article

\- As a user I swipe down to go back to the previous article

\- As a user each card shows a detailed 10-15 line summary of the article

\- As a user I see a shimmer skeleton card while the summary is generating

\- As a user I tap "Read Original Post" at the bottom of the card to open

&nbsp; the full article in a new browser tab

\- As a user I see the source blog logo in the top right corner of the card

\- As a user I see the article image at the top of the card

\- As a user my position in the feed is remembered so I resume where

&nbsp; I left off on my next visit

\- As a user the feed starts from a random article on my very first visit



---



\## Card Design



\### Visual Layout

```

┌──────────────────────────────────┐

│                                  │

│      Article Image (30%)         │ ← from RSS feed

│      Fallback: source blog logo  │

│                                  │

├──────────────────────────────────┤

│                        \[Logo]    │ ← source blog logo, top right

│                                  │

│  Article Title                   │ ← bold, large, prominent

│                                  │

│  Summary line 1...               │ ← 10-15 lines of detailed

│  Summary line 2...               │   readable prose generated

│  Summary line 3...               │   by Claude API

│  Summary line 4...               │

│  Summary line 5...               │

│  Summary line 6...               │

│  ...                             │

│                                  │

│  12 Jan 2025          (muted)    │ ← published date

│                                  │

│  \[ Read Original Post → ]        │ ← accent blue CTA, new tab

└──────────────────────────────────┘

```



\### Skeleton Loading Card Layout

```

┌──────────────────────────────────┐

│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← image placeholder shimmer (30%)

│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │

├──────────────────────────────────┤

│                        \[░░░░]    │ ← logo placeholder

│                                  │

│  ░░░░░░░░░░░░░░░░░░░░░░░░        │ ← title placeholder

│  ░░░░░░░░░░░░░░░░░░              │

│                                  │

│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← body text placeholders

│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   using Bootstrap

│  ░░░░░░░░░░░░░░░░░░░░░░░░        │   placeholder shimmer

│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │

│  ░░░░░░░░░░░░░░░░░░░░░░          │

│                                  │

│  ░░░░░░░░░░░░░░                  │ ← date placeholder

└──────────────────────────────────┘

```



\### Card Interactions

\- Swipe up → transition to next article with smooth upward animation

\- Swipe down → transition to previous article with smooth downward animation

\- Tap "Read Original Post" → open article URL in new browser tab

\- While user reads current card, next 2 cards are pre-summarized silently

&nbsp; in the background so swiping feels instant



---



\## Article Pool



\### What Happens on App Load

Fetch lightweight metadata only from all 7 RSS sources:

\- Article title

\- Article URL (the link to original post)

\- Image URL (extracted from RSS if available)

\- Published date

\- Source blog name

\- Source blog logo URL



\### What Does NOT Happen on App Load

\- No full article content is fetched

\- No Claude API calls are made

\- No summarization of any kind



\### Pool Construction Logic

\- Fetch all 7 sources in parallel via rss2json.com API

\- If a source fails to load skip it silently — do not crash

\- Merge into one pool using strict round robin interleaving:

&nbsp; Netflix\[0], Meta\[0], Google\[0], Uber\[0], Airbnb\[0], Microsoft\[0],

&nbsp; GitHub\[0], Netflix\[1], Meta\[1], Google\[1] ... and so on

\- This ensures feed always feels varied — never bunches same source

\- Pool order is fixed for the entire session

\- Store pool as a signal in feed.service.ts



---



\## On Demand Summarization



\### When Summarization Triggers

\- When a card is about to become the currently visible active card

\- Pre-triggered silently for the next 2 cards ahead in the background



\### Summarization Process

1\. Check memory cache (Map<articleUrl, string>) — if hit use instantly

2\. If cache miss: fetch full article content from the article URL

3\. Send content to Claude API with this instruction:

&nbsp;  "Write a detailed 10 to 15 line summary of this article in plain

&nbsp;   readable prose. Do not use bullet points. Write as flowing paragraphs

&nbsp;   that give the reader genuine insight into what the article covers."

4\. Store result in memory cache keyed by article URL

5\. Update card signal with the summary — card re-renders automatically



\### Loading State

\- Show skeleton card using Bootstrap placeholder shimmer classes

\- Skeleton mirrors the real card layout exactly

\- Shimmer animation runs until summary is ready



\### Error State

\- If Claude API call fails for any reason:

&nbsp; - Show card with article title visible

&nbsp; - Show message: "Summary unavailable for this article"

&nbsp; - Always still show "Read Original Post" link so user is never stuck



---



\## Progress Persistence



\### Saving Progress

\- After every swipe save the current article index to localStorage

\- Key: devstream\_last\_index

\- Value: integer index into the article pool



\### Restoring Progress on App Load

\- Read devstream\_last\_index from localStorage on startup

\- If value exists and is a valid index → resume feed from that article

\- If value is missing, null, or out of range → pick a random valid index



\### What is Never Persisted

\- Article summaries — always regenerated fresh each session

\- Article pool or order — always rebuilt fresh each session

\- Any Claude API responses



---



\## RSS Sources (all active in MVP, no follow/unfollow)

| Blog                | RSS URL                                                       |

|---------------------|---------------------------------------------------------------|

| Netflix Tech Blog   | https://netflixtechblog.com/feed                              |

| Meta Engineering    | https://engineering.fb.com/feed/                              |

| Google Developers   | https://developers.googleblog.com/feeds/posts/default         |

| Uber Engineering    | https://www.uber.com/en-US/blog/engineering/rss/              |

| Airbnb Engineering  | https://medium.com/feed/airbnb-engineering                    |

| Microsoft           | https://devblogs.microsoft.com/engineering-at-microsoft/feed/ |

| GitHub Blog         | https://github.blog/feed/                                     |



---



\## Non Functional Requirements

\- Mobile first — primary experience designed for phone screen

\- Tablet and desktop: card centered, max-width 480px, dark bg fills rest

\- No backend — 100% client side

\- Smooth 60fps swipe transitions

\- App must handle RSS fetch failures gracefully — never white screen

\- Works on latest Chrome, Firefox, Safari, Edge

\- Zoneless Angular — no zone.js dependency



---



\## Out of Scope for MVP

\- Follow or unfollow individual blog sources

\- Filter feed by source

\- Search across articles

\- Bookmarking or saving articles

\- Dark and light mode toggle (dark only for now)

\- User accounts or authentication

\- Push notifications

\- Sharing articles

