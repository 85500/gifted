export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as any
  const { identity, picked, occasion } = await context.request.json()
  const key = env.GOOGLE_CSE_KEY
  const cx = env.GOOGLE_CSE_ID
  const tag = env.AMAZON_ASSOCIATE_TAG
  // Enrich selected profile for real interests
  let enriched:string[] = []
  if (picked?.url) {
    try {
      const enr = await fetch(new URL('/api/enrich-profile', context.request.url).toString(), {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: picked.url })
      })
      const ej = await enr.json()
      enriched = ej.signals || []
    } catch {}
  }

  const profileTokens = [identity?.fullName, identity?.location, identity?.birthYear, identity?.employer, identity?.school, identity?.hints, picked?.title, picked?.snippet, enriched.join(' ')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const clusters = {
    tech: [/ai|linux|raspberry|arduino|mechanical keyboard|programmer|software/],
    gamer: [/steam|xbox|playstation|nintendo|twitch|mmorpg|gamer/],
    outdoors: [/hiking|camping|trail|backpack|climbing|kayak|fishing/],
    homechef: [/espresso|coffee|chef|baking|wine|sous vide|kitchen/],
    maker: [/3d print|solder|woodworking|cnc|sewing|cosplay/],
    fitness: [/gym|running|cycling|marathon|yoga|peloton|crossfit/],
    bookworm: [/book|novel|author|goodreads|library|kindle/],
    music: [/spotify|band|guitar|piano|vinyl|concert|dj/],
    fashion: [/fashion|sneaker|skincare|makeup|style|watch/],
    cozyhome: [/decor|plant|candle|blanket|frame|aeropress|home/],
    parent: [/mom|dad|parent|baby|newborn|toddler/],
    pet: [/dog|cat|pet|puppy|kitten|aquarium/]
  } as const

  const votes: Record<string, number> = {}
  for (const [k, regs] of Object.entries(clusters)){
    votes[k] = regs.reduce((acc, r) => acc + (r.test(profileTokens) ? 1 : 0), 0)
  }

  const boosts: Record<string, Record<string, number>> = {
    wedding: { cozyhome: 2, homechef: 1 },
    anniversary: { homechef: 1, music: 1, fashion: 1 },
    birthday: {},
    new_baby: { parent: 3 },
    housewarming: { cozyhome: 3 }
  }
  Object.entries(boosts[occasion?.occasion || 'birthday'] || {}).forEach(([k,v])=> votes[k] = (votes[k]||0)+v)

  const topClusters = Object.entries(votes).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k)

  const CLUSTER_QUERIES: Record<string, string[]> = {
    tech: ["mechanical keyboard hot-swap wireless", "usb-c hub 8-in-1", "anker power bank 20k"],
    gamer: ["xbox elite controller", "steam deck dock", "gaming headset wireless"],
    outdoors: ["daypack 20l hiking", "ultralight camp chair", "rechargeable headlamp"],
    homechef: ["espresso scale timer", "cast iron skillet 12 inch", "chef knife 8 inch"],
    maker: ["soldering station", "3d printer filament sampler", "rotary tool kit"],
    fitness: ["adjustable dumbbells", "massage gun", "foam roller"],
    bookworm: ["kindle paperwhite", "book light", "fountain pen"],
    music: ["noise cancelling headphones", "bluetooth speaker", "vinyl cleaning kit"],
    fashion: ["leather wallet rfid", "silk pillowcase", "watch box"],
    cozyhome: ["weighted blanket", "scented candle set", "aeropress"],
    parent: ["baby monitor", "diaper bag backpack", "white noise machine"],
    pet: ["automatic pet feeder", "dog harness no pull", "cat tree"]
  }

  const needPrime = !!occasion?.needBy
  const budgetMin = Number(occasion?.budgetMin || 0)
  const budgetMax = Number(occasion?.budgetMax || 999999)

  async function searchAmazon(query:string){
    const q = `${query} site:amazon.com ${needPrime ? ' Prime' : ''}`
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', key)
    url.searchParams.set('cx', cx)
    url.searchParams.set('q', q)
    url.searchParams.set('num', '5')
    const r = await fetch(url.toString())
    const j = await r.json()
    const items = (j.items||[]).map((it:any)=>({
      title: it.title,
      rawUrl: it.link,
      snippet: it.snippet,
      image: it.pagemap?.cse_image?.[0]?.src,
      domain: (new URL(it.link)).hostname
    }))
    return items
  }

  function withAffiliate(rawUrl:string){
    try {
      const u = new URL(rawUrl)
      if (u.hostname.includes('amazon.')){
        u.searchParams.set('tag', tag)
        return u.toString()
      }
    } catch{}
    return rawUrl
  }

  function priceGuessFromTitle(t:string){
    return undefined as number|undefined
  }

  const results:any[] = []
  for (const cluster of topClusters){
    for (const q of CLUSTER_QUERIES[cluster] || []){
      const found = await searchAmazon(q)
      for (const f of found){
        const price = priceGuessFromTitle(f.title)
        if (price && (price < budgetMin || price > budgetMax)) continue
        const why = `${cluster} • ${occasion?.occasion || 'gift'} • ${(f.snippet||'').toLowerCase().includes("amazon's choice")?"Amazon's Choice" : (f.snippet||'').toLowerCase().includes('best seller')? 'Best Seller' : 'well-reviewed'}`
        results.push({
          title: f.title,
          url: withAffiliate(f.rawUrl),
          snippet: f.snippet,
          image: f.image,
          why,
          priceText: price ? `$${price}` : undefined
        })
      }
    }
  }

  if (results.length < 9){
    const universal = [
      'https://www.amazon.com/dp/B07FZ8S74R',
      'https://www.amazon.com/dp/B00E8BDS60',
      'https://www.amazon.com/dp/B09G3HRMVB',
      'https://www.amazon.com/dp/B079PZ8LBS',
      'https://www.amazon.com/dp/B07WZ8WT6G'
    ]
    for (const u of universal){
      results.push({
        title: 'Highly-rated classic pick',
        url: withAffiliate(u),
        snippet: 'Universal favorite with thousands of positive reviews',
        image: undefined,
        why: 'Failsafe crowd-pleaser'
      })
    }
  }

  const seen = new Set<string>()
  const deduped:any[] = []
  for (const r of results){
    const k = r.title.toLowerCase().replace(/[^a-z0-9]+/g,' ')
    if (!seen.has(k)) { seen.add(k); deduped.push(r) }
  }

  return new Response(JSON.stringify({ items: deduped.slice(0, 18) }), { headers: { 'Content-Type': 'application/json' } })
}
