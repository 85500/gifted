# Gifted v2 (evidence-driven)

This iteration focuses on **two things** you asked for:
1) **Find the *right* person** reliably (stronger identity resolution).
2) **Stop generic lists** — only show gifts justified by real signals (and avoid what they won’t use).

## What changed
- Candidate picker with images + snippets (LinkedIn/Instagram/X/Steam/etc prioritized).
- Optional **direct URL** field — paste a profile and skip search.
- Server-side enrichment that scrapes **OG/Twitter meta + outlinks** and infers signals (ecosystem, platforms, hobbies).
- **Personalize step**: budget, no-gos, “already own,” and extra likes.
- **Rule-based recommender** ties items to signals and **excludes** platform mismatches (no Xbox controller for a PS5 person).
- Light diversity + per-signal caps to avoid same-y lists.

## Deploy notes (Cloudflare Pages)
- Functions live under `/functions/api/*` (Pages Functions).
- Set one of these in your Pages project **Environment Variables**:
  - `BRAVE_SEARCH_KEY` (preferred) — Brave Web Search API key.
  - or `GOOGLE_CSE_KEY` + `GOOGLE_CSE_ID` — Google Programmable Search API.
- Build command: `npm run build`
- Output dir: `dist`

## Local dev
```bash
npm i
npm run dev
```

## Roadmap (fast wins)
- Add more collectors: Steam profile parse (public games), Goodreads shelves, Strava stats.
- Surface “Not recommended because…” per item (transparency).
- Add small cold-start questionnaire for gift giver when signals are weak.
- Expand catalog + plug in Amazon PA-API if you have keys.
