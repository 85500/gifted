/**
 * GET /api/search-profiles?name=...&location=...&birthYear=...&url=...
 * Uses Brave Search API if BRAVE_SEARCH_KEY is set; otherwise falls back to Google Custom Search (GOOGLE_CSE_KEY & GOOGLE_CSE_ID).
 * If a direct profile URL is provided, it is returned as the first candidate.
 */
import type { CandidateProfile } from '../../src/types'

export const onRequestGet: PagesFunction<{
  BRAVE_SEARCH_KEY?: string,
  GOOGLE_CSE_KEY?: string,
  GOOGLE_CSE_ID?: string
}> = async ({ request, env }) => {
  const { searchParams } = new URL(request.url)
  const name = (searchParams.get('name') || '').trim()
  const location = (searchParams.get('location') || '').trim()
  const birthYear = (searchParams.get('birthYear') || '').trim()
  const directUrl = (searchParams.get('url') || '').trim()

  if (!name && !directUrl) {
    return new Response(JSON.stringify([]), { headers: { 'content-type': 'application/json' } })
  }

  const candidates: CandidateProfile[] = []

  if (directUrl) {
    candidates.push({
      id: 'direct:' + directUrl,
      name,
      url: directUrl,
      source: 'direct',
      confidence: 0.95
    })
  }

  const queries = buildQueries(name, location, birthYear)
  let results: any[] = []

  if (env.BRAVE_SEARCH_KEY) {
    for (const q of queries) {
      const r = await fetch('https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(q), {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': env.BRAVE_SEARCH_KEY }
      })
      if (r.ok) {
        const j = await r.json()
        const items = (j.web?.results || []).map((x: any) => ({
          title: x.title, url: x.url, snippet: x.description, image: x.profile?.img || x.thumb || undefined
        }))
        results.push(...items)
      }
    }
  } else if (env.GOOGLE_CSE_KEY && env.GOOGLE_CSE_ID) {
    for (const q of queries) {
      const u = new URL('https://customsearch.googleapis.com/customsearch/v1')
      u.searchParams.set('key', env.GOOGLE_CSE_KEY)
      u.searchParams.set('cx', env.GOOGLE_CSE_ID)
      u.searchParams.set('q', q)
      const r = await fetch(u.toString())
      if (r.ok) {
        const j = await r.json()
        const items = (j.items || []).map((x: any) => ({
          title: x.title, url: x.link, snippet: x.snippet, image: x.pagemap?.cse_thumbnail?.[0]?.src
        }))
        results.push(...items)
      }
    }
  }

  // Consolidate & score
  const seen = new Set<string>()
  for (const it of results) {
    if (!it.url || seen.has(it.url)) continue
    seen.add(it.url)
    const nameMatch = scoreNameMatch(name, it.title || '')
    const locMatch = location ? scoreLocation(location, (it.snippet || '') + ' ' + it.title) : 0
    const conf = Math.min(0.98, 0.2 + 0.6*nameMatch + 0.2*locMatch)
    candidates.push({
      id: it.url,
      name: it.title?.split('|')[0]?.trim() || name,
      url: it.url,
      source: env.BRAVE_SEARCH_KEY ? 'brave' : 'google',
      snippet: it.snippet,
      image: it.image,
      locationHint: locMatch > 0.3 ? location : undefined,
      confidence: conf
    })
  }

  // Dedup by domain preference for social profiles
  const prioritized = candidates.sort((a,b)=>b.confidence - a.confidence).filter((c, idx, arr) => {
    return arr.findIndex(x => new URL(x.url).hostname === new URL(c.url).hostname) === idx
  }).slice(0, 12)

  return new Response(JSON.stringify(prioritized), { headers: { 'content-type': 'application/json' } })
}

function buildQueries(name: string, location?: string, birthYear?: string) {
  const basics = [
    `${name} linkedin`,
    `${name} instagram`,
    `${name} twitter`,
    `${name} github`,
    `${name} steam`,
    `${name} strava`,
    `${name} goodreads`,
    `${name} site:about.me`,
  ]
  if (location) basics.push(`${name} ${location}`)
  if (birthYear) basics.push(`${name} born ${birthYear}`)
  return basics
}

function scoreNameMatch(queryName: string, title: string) {
  const q = queryName.toLowerCase().split(/\s+/).filter(Boolean)
  const t = title.toLowerCase()
  if (q.length === 0) return 0
  let m = 0
  for (const part of q) if (t.includes(part)) m++
  return m / q.length
}

function scoreLocation(loc: string, text: string) {
  return text.toLowerCase().includes(loc.toLowerCase()) ? 1 : 0
}
