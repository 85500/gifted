# Gifted

A Cloudflare Pages app that verifies the right person and returns a curated, ranked Amazon-affiliate gift list.

## Quick start

1. Create a Cloudflare Pages project connected to this GitHub repo.
2. Build command: `npm run build` • Output: `dist`
3. Environment variables (Production & Preview):
   - `AMAZON_ASSOCIATE_TAG`
   - `GOOGLE_CSE_KEY`
   - `GOOGLE_CSE_ID`
   - `ADSENSE_CLIENT_ID`
4. Deploy and test `/api/search-profiles` & `/api/recommend`.
