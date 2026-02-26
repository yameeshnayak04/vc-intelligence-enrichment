# VC Intelligence Interface

A production-oriented MVP for venture workflow execution:

**Discover → Profile → Enrich → Explain → Save**

The project is intentionally minimal: no auth, no backend database, and no background workers. It focuses on a fast operator loop for sourcing, company review, and enrichment-backed decision support.

## Project Overview

This application provides a lightweight VC intelligence workspace where users can:

- filter and scan a company universe,
- open company profiles,
- run server-side live enrichment from public web pages,
- capture rationale and notes,
- save searches and maintain custom lists.

## Features

- **Discover workspace**
	- Search by company name
	- Filter by sector and stage
	- Client-side pagination
	- Save current filters as reusable saved searches

- **Profile workspace**
	- Company overview (name, website, sector, stage, location)
	- Local notes per company
	- Add/remove company from user lists
	- Explainability section: _Why this company surfaced_

- **Live enrichment**
	- Trigger enrichment from the company website
	- Loading, success, and error handling
	- Structured output: summary, what-they-do bullets, keywords, derived signals, and sources
	- Local cache of enrichment result with “Last enriched at” display

- **Saved + Lists**
	- Saved search filter snapshots with one-click restore
	- Named custom lists with add/remove company actions
	- Per-list JSON export

## Live Enrichment Architecture

### Request path

1. UI sends `POST /api/enrich` with `{ website }` (+ optional metadata).
2. API validates and normalizes URL server-side.
3. API fetches only:
	 - homepage
	 - `/about` (if available)
4. API strips scripts/styles and extracts visible text.
5. API calls LLM endpoint using server env key (`process.env` only).
6. API returns strict structured JSON.
7. Client caches result in localStorage keyed by company ID.

### Security boundary

- LLM API key is read exclusively on the server route.
- No secret is exposed to the client bundle.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** React + Tailwind CSS
- **Persistence:** Browser localStorage
- **Server API:** Next.js route handlers (`app/api/*`)

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
npm install
npm run dev
```

App runs at: `http://localhost:3000`

### Quality checks

```bash
npm run lint
npm run build
```

## Environment Variables

Create `.env.local` in project root:

```bash
OPENAI_API_KEY=your_api_key_here
# optional
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

Notes:

- `OPENAI_API_KEY` is required for live enrichment.
- If missing, `/api/enrich` returns a controlled server error.

## Design Tradeoffs

- **localStorage over database**
	- Pros: zero infra, very fast MVP iteration
	- Cons: browser-scoped state, no multi-user sync, no cross-device continuity

- **Server-side enrichment route over direct client LLM calls**
	- Pros: protects API keys, centralizes fetch/parse logic
	- Cons: extra backend hop and route maintenance

- **Heuristic HTML text extraction (no headless browser)**
	- Pros: low complexity, predictable runtime/cost
	- Cons: can miss SPA-rendered content or dynamic sections

- **Strictly scoped crawl (homepage + /about)**
	- Pros: bounded latency and token usage
	- Cons: limited recall for deeper product/pricing pages

## Deployment Notes

- Deploy on Vercel or any Node-compatible host that supports Next.js App Router.
- Configure environment variables in deployment settings:
	- `OPENAI_API_KEY`
	- optional: `OPENAI_MODEL`, `OPENAI_API_URL`
- Build command: `npm run build`
- Start command: `npm run start` (if not using platform-native Next runtime)

Operational considerations:

- Add API rate limiting for `/api/enrich` before external launch.
- Consider response caching and request deduplication for repeated enrichments.
- Add telemetry (latency, fail rate, token usage) for production observability.
