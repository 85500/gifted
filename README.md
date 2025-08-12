# Gifted Auto (v2.1)

**Fixes your three blockers:**
- Finds the **right person** with cross-link clustering (JSON-LD `sameAs`, repeated handles, domain overlap). Auto-picks when confidence ≥ 0.8.
- **No gift cards** (they earn $0) — catalog is accessory-first and affiliateable.
- **Zero manual inputs** — we infer platforms, hobbies, and even rough "owns/no-gos" from meta, text sample, and links.

## How it works
1) `/api/search-identities` (Brave or Google CSE) runs multiple targeted queries, crawls top results, extracts JSON-LD Person + `sameAs` + handles. It clusters across domains to boost identity confidence and **auto-picks** if confident.
2) `/api/enrich` fetches the chosen profile page, extracts OG/Twitter meta + links + JSON-LD, and infers signals (Apple/Android, PS/Xbox/Switch/PC, running, photography, coffee, reading, techie). It also infers **owns**/**no-gos** heuristically.
3) `/api/recs` uses a rule engine that **requires platform matches** and avoids mismatches. It never suggests gift cards, focuses on **accessories** that complement detected ecosystems, and uses your `AFFILIATE_TAG` to build Amazon search URLs.

## Cloudflare Pages
- Build: `npm run build` • Output dir: `dist`
- Set environment variables:
  - `BRAVE_SEARCH_KEY` (recommended) **or** `GOOGLE_CSE_KEY` + `GOOGLE_CSE_ID`
  - `AFFILIATE_TAG` (your Amazon Associate tag)

## Notes
- If auto confidence < 0.8, the UI shows top candidates so you can click the right one (still faster).
- The rule engine is extendable — add more domains/collectors and catalog entries as needed.
