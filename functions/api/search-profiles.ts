export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as any
  const { fullName, location, birthYear, employer, school, hints } = await context.request.json()
  const key = env.GOOGLE_CSE_KEY
  const cx = env.GOOGLE_CSE_ID

  const domains = [
    'linkedin.com', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'threads.net',
    'github.com', 'pinterest.com', 'goodreads.com', 'steamcommunity.com', 'spotify.com', 'youtube.com'
  ]

  const queryParts = [fullName, location, birthYear, employer, school, hints].filter(Boolean).join(' ')
  const siteFilter = domains.map(d => `site:${d}`).join(' OR ')
  const q = `${queryParts} (${siteFilter})`

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', key)
  url.searchParams.set('cx', cx)
  url.searchParams.set('q', q)
  url.searchParams.set('num', '10')

  const resp = await fetch(url.toString())
  if (!resp.ok) return new Response(JSON.stringify({ hits: [] }), { headers: { 'Content-Type': 'application/json' } })
  const json = await resp.json()

  function score(item:any){
    const t = `${item.title} ${item.snippet}`.toLowerCase()
    let s = 0
    for (const part of [fullName, location, birthYear, employer, school, hints]){
      if (!part) continue
      const tokens = String(part).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      for (const token of tokens){ if (t.includes(token)) s += 1 }
    }
    return Math.min(1, s/8)
  }

  const hits = (json.items || []).map((it:any) => ({
    title: it.title,
    url: it.link,
    site: new URL(it.link).hostname.replace('www.', ''),
    snippet: it.snippet,
    image: it.pagemap?.cse_image?.[0]?.src || it.pagemap?.thumbnail?.[0]?.src,
    score: score(it)
  }))
  .sort((a:any,b:any) => b.score - a.score)

  return new Response(JSON.stringify({ hits }), { headers: { 'Content-Type': 'application/json' } })
}
