export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as any
  const { fullName, location, birthYear, employer, school, hints, profileUrl } = await context.request.json()
  const key = env.GOOGLE_CSE_KEY, cx = env.GOOGLE_CSE_ID

  if (profileUrl) {
    try {
      const ok = await fetch(profileUrl, { method: 'HEAD' })
      if (ok.status < 400) {
        return json({ hits: [{ title: fullName, url: profileUrl, site: new URL(profileUrl).hostname.replace('www.',''), snippet: 'Provided by user', image: undefined, score: 1 }] })
      }
    } catch {}
  }

  const SITES_PRIMARY = ['linkedin.com/in','github.com','x.com','twitter.com','instagram.com','threads.net']
  const SITES_SECONDARY = ['facebook.com','goodreads.com','steamcommunity.com','spotify.com','youtube.com','pinterest.com']

  const quoted = `"${fullName}"`
  const disambig = [location, birthYear, employer, school, hints].filter(Boolean).join(' ')

  const queries = [
    `${quoted} (${SITES_PRIMARY.map(d=>`site:${d}`).join(' OR ')}) ${disambig}`,
    `${quoted} intitle:${(employer||school||'profile')} (${SITES_PRIMARY.map(d=>`site:${d}`).join(' OR ')}) ${location||''}`,
    `${quoted} (${SITES_SECONDARY.map(d=>`site:${d}`).join(' OR ')}) ${disambig}`
  ]

  const results:any[] = []
  for (const q of queries){
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', key); url.searchParams.set('cx', cx); url.searchParams.set('q', q); url.searchParams.set('num','10')
    const r = await fetch(url.toString()); if (!r.ok) continue
    const j = await r.json()
    for (const it of (j.items||[])) {
      results.push({ title: it.title, url: it.link, site: new URL(it.link).hostname.replace('www.',''), snippet: it.snippet, image: it.pagemap?.cse_image?.[0]?.src || it.pagemap?.thumbnail?.[0]?.src })
    }
  }

  const priRank=(host:string)=> host.includes('linkedin.com')?3 : host.includes('github.com')?2.5 : (host.includes('x.com')||host.includes('twitter.com')||host.includes('instagram.com'))?2 : 1
  const tokens = [fullName, location, birthYear, employer, school, hints].filter(Boolean).join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

  function scoreRow(r:any){ const text = `${r.title} ${r.snippet}`.toLowerCase(); let s=0; for (const t of tokens) if (text.includes(t)) s+=1; s+=priRank(r.site); return Math.min(1, s/10) }

  const dedup = new Map<string, any>()
  for (const r of results){ const k = r.url.split('?')[0]; if (!dedup.has(k)) dedup.set(k, r) }

  const hits = [...dedup.values()].map(h=>({...h, score: scoreRow(h)})).sort((a,b)=>b.score-a.score).slice(0,8)
  return json({ hits, needMoreHints: (hits[0]?.score || 0) < 0.6 })

  function json(obj:any){ return new Response(JSON.stringify(obj), { headers:{'Content-Type':'application/json'} }) }
}
