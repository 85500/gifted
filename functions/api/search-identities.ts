/**
 * GET /api/search-identities?name=...&location=...
 * Multi-query search (Brave or Google CSE), then crawl top results to extract JSON-LD sameAs and handles.
 * Clusters by repeated handles/sameAs/domains to boost confidence. Returns { auto?: CandidateProfile, candidates: CandidateProfile[] }.
 */
import type { CandidateProfile } from '../../src/types'
import { fetchHtml, extractMeta } from './_util'

export const onRequestGet: PagesFunction<{
  BRAVE_SEARCH_KEY?: string,
  GOOGLE_CSE_KEY?: string,
  GOOGLE_CSE_ID?: string
}> = async ({ request, env }) => {
  const { searchParams } = new URL(request.url)
  const name = (searchParams.get('name') || '').trim()
  const location = (searchParams.get('location') || '').trim()
  if (!name) return json({ auto: null, candidates: [] })

  const queries = buildQueries(name, location)
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

  // Crawl top 8 to extract signals for clustering
  const top = dedup(results).slice(0, 8)
  const enriched = await Promise.all(top.map(async it => {
    try {
      const html = await fetchHtml(it.url)
      const meta = extractMeta(html, it.url)
      const nameMatch = scoreNameMatch(name, it.title || meta.title || '')
      const locMatch = location ? scoreLocation(location, (it.snippet || '') + ' ' + (meta.textSample || '') + ' ' + (meta.title || '')) : 0
      const handles = Array.from(new Set(meta.handles))
      const sameAs = Array.from(new Set(meta.sameAs))
      const conf = clamp(0.1 + 0.55*nameMatch + 0.2*locMatch + 0.15*Math.min(1, (handles.length + sameAs.length)/4), 0, 0.98)
      return { ...it, handles, sameAs, conf, meta }
    } catch { return { ...it, handles: [], sameAs: [], conf: 0.2, meta: { links: [] } } }
  }))

  // Cluster by overlapping handles/sameAs/domains
  const clusters: { items: any[], score: number }[] = []
  for (const e of enriched) {
    const domain = hostname(e.url)
    let match = clusters.find(c => c.items.some(x => intersects(x.handles, e.handles) || intersects(x.sameAs, e.sameAs) || hostname(x.url) === domain))
    if (!match) {
      match = { items: [], score: 0 }
      clusters.push(match)
    }
    match.items.push(e)
    match.score += e.conf
  }

  const best = clusters.sort((a,b)=>b.score - a.score)[0]
  let auto: CandidateProfile | null = null
  const candidates: CandidateProfile[] = []

  if (best) {
    const topItem = best.items.sort((a,b)=>b.conf - a.conf)[0]
    auto = {
      id: topItem.url,
      name: topItem.title?.split('|')[0]?.trim() || name,
      url: topItem.url,
      source: env.BRAVE_SEARCH_KEY ? 'brave' : 'google',
      snippet: topItem.snippet,
      image: topItem.image,
      handles: topItem.handles,
      sameAs: topItem.sameAs,
      locationHint: location || undefined,
      confidence: clamp(topItem.conf + Math.min(0.15, best.items.length*0.03), 0, 0.98)
    }
  }

  for (const e of enriched) {
    candidates.push({
      id: e.url,
      name: e.title?.split('|')[0]?.trim() || name,
      url: e.url,
      source: env.BRAVE_SEARCH_KEY ? 'brave' : 'google',
      snippet: e.snippet,
      image: e.image,
      handles: e.handles,
      sameAs: e.sameAs,
      locationHint: location || undefined,
      confidence: e.conf
    })
  }

  return json({ auto, candidates: candidates.sort((a,b)=>b.confidence - a.confidence).slice(0,12) })
}

function buildQueries(name: string, location?: string) {
  const parts = [
    `"${name}" (site:linkedin.com/in OR site:instagram.com OR site:twitter.com OR site:x.com OR site:steamcommunity.com OR site:goodreads.com OR site:about.me OR site:github.com)`,
    `${name} profile`,
    `${name} ${location||''} social`
  ]
  if (location) parts.push(`"${name}" "${location}" profile`)
  return parts
}

function dedup(items: any[]) {
  const seen = new Set<string>()
  const out: any[] = []
  for (const it of items) {
    if (!it.url) continue
    const h = hostname(it.url)+ '|' + (it.title||'')
    if (seen.has(h)) continue
    seen.add(h)
    out.push(it)
  }
  return out
}

function hostname(u: string) { try { return new URL(u).hostname.replace(/^www\./,'') } catch { return u } }
function intersects(a: string[], b: string[]) { return a.some(x => b.includes(x)) }
function scoreNameMatch(queryName: string, title: string) {
  const q = queryName.toLowerCase().split(/\s+/).filter(Boolean)
  const t = title.toLowerCase()
  if (q.length === 0) return 0
  let m = 0; for (const part of q) if (t.includes(part)) m++
  return m / q.length
}
function scoreLocation(loc: string, text: string) { return text.toLowerCase().includes(loc.toLowerCase()) ? 1 : 0 }
function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)) }
function json(obj: any) { return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json' } }) }
