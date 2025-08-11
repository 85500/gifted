export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as any
  const { fullName, location, birthYear, employer, school, hints, profileUrl } = await context.request.json()
  const key = env.GOOGLE_CSE_KEY, cx = env.GOOGLE_CSE_ID

  // If direct URL provided, verify
  if (profileUrl) {
    try {
      const ok = await fetch(profileUrl, { method: 'HEAD' })
      if (ok.status < 400) {
        return json({ hits: [{ title: fullName, url: profileUrl, site: new URL(profileUrl).hostname.replace('www.',''), snippet: 'Provided by user', image: undefined, score: 1 }] })
      }
    } catch {}
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean)
  const first = nameParts[0] || ''
  const last = nameParts[nameParts.length-1] || ''
  const middle = nameParts.length>2 ? nameParts.slice(1,-1).join(' ') : ''
  const nicknames = [first, first.replace(/(.*)ey$/,'$1ie'), first.replace(/(.*)y$/,'$1ie')].filter((v,i,a)=>v && a.indexOf(v)===i)

  // Extract @handles
  const handle = (hints||'').match(/@([a-z0-9._]+)/i)?.[1]
  const handleHosts = ['x.com','twitter.com','instagram.com','threads.net','github.com']
  const guessedUrls = handle ? handleHosts.map(h=>`https://${h}/${handle}`) : []

  const SITES_PRIMARY = ['linkedin.com/in','github.com','x.com','twitter.com','instagram.com','threads.net']
  const SITES_SECONDARY = ['facebook.com','goodreads.com','steamcommunity.com','spotify.com','youtube.com','pinterest.com','about.me']

  const quoted = `\"${fullName}\"`
  const disambig = [location, birthYear, employer, school].filter(Boolean).join(' ')

  const queries = [
    `${quoted} (${SITES_PRIMARY.map(d=>`site:${d}`).join(' OR ')}) ${disambig}`,
    `${quoted} intitle:${(employer||school||'profile')} (${SITES_PRIMARY.map(d=>`site:${d}`).join(' OR ')}) ${location||''}`,
    `${first} ${last} (${nicknames.join(' OR ')}) (${SITES_PRIMARY.map(d=>`site:${d}`).join(' OR ')}) ${disambig}`,
    `${quoted} (${SITES_SECONDARY.map(d=>`site:${d}`).join(' OR ')}) ${disambig}`
  ]

  const results:any[] = []

  // Try guessed handle URLs first
  for (const u of guessedUrls){
    try { const r = await fetch(u, { method:'HEAD' }); if (r.status<400) results.push({ title: `${first} ${last} (handle)`, url: u, site: new URL(u).hostname.replace('www.',''), snippet: 'From handle', image: undefined }) } catch {}
  }

  for (const q of queries){
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', key); url.searchParams.set('cx', cx); url.searchParams.set('q', q); url.searchParams.set('num','10')
    const r = await fetch(url.toString()); if (!r.ok) continue
    const j = await r.json()
    for (const it of (j.items||[])) {
      results.push({ title: it.title, url: it.link, site: new URL(it.link).hostname.replace('www.',''), snippet: it.snippet, image: it.pagemap?.cse_image?.[0]?.src || it.pagemap?.thumbnail?.[0]?.src })
    }
  }

  const tokens = [fullName, location, birthYear, employer, school].filter(Boolean).join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  function priRank(host:string){ if (host.includes('linkedin.com')) return 3; if (host.includes('github.com')) return 2.5; if (host.includes('x.com')||host.includes('twitter.com')||host.includes('instagram.com')) return 2; return 1 }
  function scoreRow(r:any){
    const text = `${r.title} ${r.snippet}`.toLowerCase()
    let s = 0
    for (const t of tokens) if (text.includes(t)) s += 1
    if (location && text.includes((location||'').toLowerCase())) s += 1.5
    s += priRank(r.site)
    return Math.min(1, s/10)
  }

  const dedup = new Map<string, any>()
  for (const r of results){ const k = r.url.split('?')[0]; if (!dedup.has(k)) dedup.set(k, r) }

  const hits = [...dedup.values()].map(h=>({...h, score: scoreRow(h)})).sort((a,b)=>b.score-a.score).slice(0,8)
  return json({ hits, needMoreHints: (hits[0]?.score || 0) < 0.6 })

  function json(obj:any){ return new Response(JSON.stringify(obj), { headers:{'Content-Type':'application/json'} }) }
}
