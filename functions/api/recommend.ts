import { unstable_parseUrl as parseUrl } from 'worktop/cfw' // optional; Pages has URL, but we keep import-safe
export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as any
  const { identity, picked, occasion, prefs } = await context.request.json()
  const key = env.GOOGLE_CSE_KEY, cx = env.GOOGLE_CSE_ID, tag = env.AMAZON_ASSOCIATE_TAG

  let needs:any[] = []
  try {
    const n = await fetch(new URL('/api/find-needs', context.request.url).toString(), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ fullName: identity?.fullName, location: identity?.location })
    })
    const nj = await n.json(); needs = nj.hits || []
  } catch {}

  let enriched:string[] = []
  if (picked?.url) {
    try {
      const enr = await fetch(new URL('/api/enrich-profile', context.request.url).toString(), {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: picked.url })
      })
      const ej = await enr.json(); enriched = ej.signals || []
    } catch {}
  }

  const likes: string[] = (prefs?.likes||[]).map((x:string)=>x.toLowerCase())
  const dislikes: string[] = (prefs?.dislikes||[]).map((x:string)=>x.toLowerCase())
  const extraTags = (prefs?.tags||'').toLowerCase()

  // Build dynamic queries
  function buildQueries(cluster:string){
    const e = enriched.join(' ') + ' ' + extraTags + ' ' + likes.join(' ')
    const q: string[] = []
    const add=(s:string)=>{ if (!q.includes(s)) q.push(s) }
    // signal-driven
    if (/espresso|coffee/.test(e) && cluster==='homechef') add('espresso scale timer')
    if (/vinyl/.test(e) && cluster==='music') add('vinyl record cleaning kit')
    if (/hiking/.test(e) && cluster==='outdoors') add('ultralight camp chair')
    if (/running/.test(e) && cluster==='fitness') add('gps running watch')
    if (/(3d print|arduino|raspberry)/.test(e) && cluster==='maker') add('raspberry pi kit')
    if (/zelda/.test(e) && cluster==='gamer') add('zelda themed controller')
    if (/plants?/.test(e) && cluster==='cozyhome') add('full spectrum grow light')
    // likes boost
    if (likes.includes(cluster)) add(cluster + ' gift under 100')
    // fallbacks to ensure coverage
    const defaults:Record<string,string[]> = {
      tech:['mechanical keyboard hot-swap','usb-c hub 8-in-1','anker power bank 20k'],
      gamer:['xbox elite controller','gaming headset wireless','switch pro controller'],
      outdoors:['rechargeable headlamp','daypack 20l hiking','insulated bottle 40oz'],
      homechef:['cast iron skillet 12 inch','chef knife 8 inch','aeropress coffee maker'],
      maker:['soldering station','rotary tool kit','3d printer filament sampler'],
      fitness:['massage gun','foam roller','adjustable dumbbells'],
      bookworm:['kindle paperwhite','book light','fountain pen'],
      music:['bluetooth speaker','noise cancelling headphones','vinyl storage crate'],
      fashion:['watch box','leather wallet rfid','silk pillowcase'],
      cozyhome:['weighted blanket','scented candle set','frame set gallery wall'],
      parent:['white noise machine','baby monitor','diaper bag backpack'],
      pet:['automatic pet feeder','dog harness no pull','cat tree']
    }
    for (const d of (defaults[cluster]||[])) add(d)
    return q
  }

  const needPrime = !!occasion?.needBy
  const budgetMin = Number(occasion?.budgetMin || 0)
  const budgetMax = Number(occasion?.budgetMax || 999999)

  async function searchAmazon(query:string){
    const q = `${query} site:amazon.com ${needPrime ? ' Prime' : ''}`
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', key); url.searchParams.set('cx', cx); url.searchParams.set('q', q); url.searchParams.set('num','5')
    const r = await fetch(url.toString()); const j = await r.json()
    const items = (j.items||[]).map((it:any)=>({ title: it.title, rawUrl: it.link, snippet: it.snippet, image: it.pagemap?.cse_image?.[0]?.src, domain: (new URL(it.link)).hostname }))
    return items
  }

  function withAffiliate(rawUrl:string){
    try { const u = new URL(rawUrl); if (u.hostname.includes('amazon.')){ u.searchParams.set('tag', tag); return u.toString() } } catch{}
    return rawUrl
  }

  // Build cluster votes from identity text and likes/dislikes
  const textSeeds = [identity?.hints, enriched.join(' '), extraTags, likes.join(' '), picked?.title, picked?.snippet].filter(Boolean).join(' ').toLowerCase()
  const clusterList = ['tech','gamer','outdoors','homechef','maker','fitness','bookworm','music','fashion','cozyhome','parent','pet']
  const votes: Record<string, number> = {}; for (const c of clusterList){ votes[c]=0 }
  for (const c of clusterList){ if (new RegExp(c).test(textSeeds)) votes[c]+=2 }
  for (const c of likes){ votes[c]=(votes[c]||0)+3 }
  for (const c of dislikes){ votes[c]=(votes[c]||0)-3 }
  const occasionBoost: Record<string, Record<string, number>> = { wedding:{cozyhome:2,homechef:1}, anniversary:{homechef:1,music:1,fashion:1}, birthday:{}, new_baby:{parent:3}, housewarming:{cozyhome:3} }
  Object.entries(occasionBoost[occasion?.occasion || 'birthday'] || {}).forEach(([k,v])=> votes[k] = (votes[k]||0)+v)

  const topClusters = Object.entries(votes).sort((a,b)=>b[1]-a[1]).map(([k])=>k).filter(c=>!dislikes.includes(c)).slice(0,4)

  const results:any[] = []

  // Needs/wants first
  for (const h of (needs||[]).slice(0,2)){
    results.push({ title: 'On their public wishlist/registry', url: withAffiliate(h.url), snippet: h.title, image: undefined, why: 'Directly requested by them' })
  }

  // Gather items with per-cluster caps to avoid sameness
  for (const cluster of topClusters){
    let added = 0
    for (const q of buildQueries(cluster)){
      const found = await searchAmazon(q)
      for (const f of found){
        if (added>=4) break
        const titleLower = (f.title||'').toLowerCase()
        if (dislikes.some((d:string)=>titleLower.includes(d))) continue
        results.push({ title: f.title, url: withAffiliate(f.rawUrl), snippet: f.snippet, image: f.image, why: `${cluster} • ${(f.snippet||'').toLowerCase().includes("amazon's choice")?"Amazon's Choice":(f.snippet||'').toLowerCase().includes('best seller')?'Best Seller':'well-reviewed'}` })
        added++
      }
      if (added>=4) break
    }
  }

  // Fallback classics if thin
  if (results.length < 9){
    const universal=['https://www.amazon.com/dp/B07FZ8S74R','https://www.amazon.com/dp/B00E8BDS60','https://www.amazon.com/dp/B09G3HRMVB','https://www.amazon.com/dp/B079PZ8LBS','https://www.amazon.com/dp/B07WZ8WT6G']
    for (const u of universal){ results.push({ title:'Highly-rated classic pick', url: withAffiliate(u), snippet:'Universal favorite with thousands of positive reviews', image: undefined, why:'Failsafe crowd-pleaser' }) }
  }

  // Dedupe by normalized title
  const seen = new Set<string>(); const deduped:any[] = []
  for (const r of results){ const k = (r.title||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); if (!seen.has(k)) { seen.add(k); deduped.push(r) } }

  // Stable shuffle to avoid same order every time but keep deterministic per recipient
  const seed = (identity?.fullName || '') + (picked?.url || '') + (occasion?.occasion || '')
  function stableShuffle(arr:any[], seed:string){ const out=[...arr]; let x=0; for(const c of seed){ x=(x*31 + c.charCodeAt(0))>>>0 } for(let i=out.length-1;i>0;i--){ x=(1103515245*x+12345)>>>0; const j=x%(i+1); [out[i],out[j]]=[out[j],out[i]] } return out }
  const final = stableShuffle(deduped, seed).slice(0,18)

  return new Response(JSON.stringify({ items: final }), { headers:{'Content-Type':'application/json'} })
}
