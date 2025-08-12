export type Meta = {
  title?: string
  description?: string
  image?: string
  textSample?: string
  links: string[]
}

export function extractMeta(html: string, baseUrl: string): Meta {
  const m = {
    title: matchContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
           matchContent(html, /<title[^>]*>([^<]+)<\/title>/i),
    description: matchContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
                 matchContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
    image: matchContent(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i),
    textSample: snippetFromHtml(html),
    links: Array.from(new Set(Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)).map(x=>resolveUrl(baseUrl, x[1]))))
  }
  return m
}

function resolveUrl(baseUrl: string, href: string) {
  try {
    return new URL(href, baseUrl).toString()
  } catch { return href }
}

function matchContent(html: string, re: RegExp) {
  const m = re.exec(html)
  return m ? decode(m[1]) : undefined
}

function snippetFromHtml(html: string) {
  const txt = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')
  return txt.split(/\s+/).slice(0, 120).join(' ')
}

function decode(s: string) {
  try {
    return s
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
  } catch { return s }
}

// --- Signals ---

export function inferSignals(meta: Meta): Record<string, number> {
  const text = ((meta.title || '') + ' ' + (meta.description || '') + ' ' + (meta.textSample || '') + ' ' + meta.links.join(' ')).toLowerCase()

  const signals: Record<string, number> = {}
  const bump = (k: string, v=0.2) => signals[k] = Math.min(1, (signals[k] || 0) + v)

  // Ecosystems
  if (/\biphone|ios|macbook|imac|airpods|magsafe|apple watch\b/.test(text)) bump('ecosystem.apple', .6)
  if (/\bandroid|pixel\b/.test(text)) bump('ecosystem.android', .6)
  if (/\bgalaxy\b/.test(text)) bump('ecosystem.samsung', .6)
  // Gaming platforms
  if (/\bplaystation|ps5|ps4\b/.test(text)) bump('gaming.playstation', .7)
  if (/\bxbox\b/.test(text)) bump('gaming.xbox', .7)
  if (/\bnintendo|switch\b/.test(text)) bump('gaming.nintendo', .7)
  if (/\bsteamcommunity\.com|steamdeck\b/.test(text)) bump('gaming.pc', .6)
  // Hobbies
  if (/\bstrava|garmin|half marathon|ultra|trail run|10k\b/.test(text)) bump('hobby.running', .7)
  if (/\bpeloton|fitness|crossfit|weightlifting\b/.test(text)) bump('hobby.fitness', .4)
  if (/\bfujifilm|sony\s*a[0-9]|canon eos|nikon z\b/.test(text)) bump('hobby.photography', .7)
  if (/\bespresso|aeropress|v60|lido grinder|df64|breville barista\b/.test(text)) bump('hobby.coffee', .6)
  if (/\bgoodreads\.com|storygraph|sci[- ]?fi|fantasy novels\b/.test(text)) bump('hobby.reading', .5)
  // Music
  if (/\bspotify\.com|apple music|bandcamp\b/.test(text)) bump('hobby.music', .4)
  // Tech enthusiast
  if (/\bgithub\.com|docker|kubernetes|open source|ai model|neural network\b/.test(text)) bump('persona.techie', .6)

  // Direct links imply accounts
  for (const link of meta.links) {
    if (/linkedin\.com\/in\//.test(link)) bump('account.linkedin', .5)
    if (/instagram\.com\//.test(link)) bump('account.instagram', .5)
    if (/x\.com\//.test(link) || /twitter\.com\//.test(link)) bump('account.twitter', .5)
    if (/steamcommunity\.com\//.test(link)) bump('account.steam', .6)
    if (/goodreads\.com\//.test(link)) bump('account.goodreads', .6)
    if (/strava\.com\//.test(link)) bump('account.strava', .6)
  }

  return signals
}

// --- Gift rule engine ---

export type GiftRuleContext = {
  signals: Record<string, number>,
  prefs: {
    minPrice?: number
    maxPrice?: number
    knownNoGos?: string[]
    knownOwns?: string[]
    extraLikes?: string[]
  }
}

export type GiftIdea = {
  id: string
  title: string
  url?: string
  image?: string
  priceHint?: string
  tags: string[]
  requires?: string[]
  excludes?: string[]
  weight?: number
  reasonTmpl?: string
}

export function recommendGifts(ctx: GiftRuleContext): { ideas: GiftIdea[], evidence: string[] } {
  const ev: string[] = []
  const s = ctx.signals
  const owns = new Set((ctx.prefs.knownOwns || []).map(x=>x.toLowerCase()))
  const nogos = new Set((ctx.prefs.knownNoGos || []).map(x=>x.toLowerCase()))

  const pushEv = (k: string, val: number) => { if (val > 0.49) ev.push(`${k}=${(Math.round(val*100))}%`) }

  for (const [k, v] of Object.entries(s)) pushEv(k, v)

  // Curated catalog (non-exhaustive, safe to extend)
  const CATALOG: GiftIdea[] = [
    // Gaming – platform specific
    { id:'ps5-dualsense-edge', title:'DualSense Edge Pro Controller (PS5)',
      url:'https://www.amazon.com/s?k=DualSense+Edge&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'~$199', tags:['gaming','playstation'],
      requires:['gaming.playstation'], excludes:['gaming.xbox','gaming.nintendo'],
      reasonTmpl:'High-end PS5 controller; only if they’re in the PlayStation ecosystem.'
    },
    { id:'xbox-elite-v2', title:'Xbox Elite Wireless Controller Series 2',
      url:'https://www.amazon.com/s?k=Xbox+Elite+Series+2&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'~$179', tags:['gaming','xbox'],
      requires:['gaming.xbox'], excludes:['gaming.playstation','gaming.nintendo'],
      reasonTmpl:'Top-tier Xbox controller; skip if they don’t game on Xbox.'
    },
    { id:'switch-pro', title:'Nintendo Switch Pro Controller',
      url:'https://www.amazon.com/s?k=Switch+Pro+Controller&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'~$69', tags:['gaming','nintendo'],
      requires:['gaming.nintendo'], excludes:['gaming.playstation','gaming.xbox'],
      reasonTmpl:'Great for Switch owners; avoid if no Switch signals.'
    },
    { id:'steam-gift-card', title:'Steam Gift Card (Digital)',
      url:'https://www.amazon.com/s?k=Steam+gift+card&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$20–$100', tags:['gaming','pc'],
      requires:['gaming.pc'], excludes:[], reasonTmpl:'For PC/Steam gamers; flexible and safe.'
    },
    // Apple
    { id:'magsafe-stand', title:'MagSafe 3-in-1 Stand',
      url:'https://www.amazon.com/s?k=magsafe+3+in+1+stand&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$50–$120', tags:['apple','charging'],
      requires:['ecosystem.apple'], excludes:['ecosystem.android'],
      reasonTmpl:'Useful if they have iPhone + AirPods/Watch; skip if not in Apple world.'
    },
    // Running
    { id:'nathan-vest', title:'Hydration Running Vest (Unisex)',
      url:'https://www.amazon.com/s?k=running+hydration+vest&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$60–$140', tags:['running','outdoors'],
      requires:['hobby.running'], reasonTmpl:'Great for Strava/runner types.'
    },
    { id:'balega-socks', title:'Premium Running Socks (2–6 pack)',
      url:'https://www.amazon.com/s?k=running+socks&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$20–$40', tags:['running'], requires:['hobby.running'] },
    // Photography
    { id:'sdxc-pro', title:'UHS-II SDXC Card (High Speed)',
      url:'https://www.amazon.com/s?k=UHS-II+SDXC&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$35–$90', tags:['photography'],
      requires:['hobby.photography'], reasonTmpl:'Always useful; brand-agnostic.'
    },
    // Coffee
    { id:'aeropress-upgrade', title:'AeroPress Flow Control + Filters Bundle',
      url:'https://www.amazon.com/s?k=AeroPress+Flow+Control&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$20–$50', tags:['coffee'],
      requires:['hobby.coffee']
    },
    // Universal but smart
    { id:'gift-experiences', title:'Experience Gift (local class/workshop)',
      url:'https://www.amazon.com/s?k=experience+gift+card&tag=YOUR_AFFILIATE_TAG',
      image:'', priceHint:'$50–$200', tags:['experience'], reasonTmpl:'Non-clutter gift aligned to their interests.'
    }
  ]

  // Scoring
  const min = ctx.prefs.minPrice ?? 0
  const max = ctx.prefs.maxPrice ?? 1e9
  const ideas = CATALOG.map(item => {
    // Exclusions
    const exclByNogos = item.tags.some(t => nogos.has(t)) || (item.excludes || []).some(e => s[e] && s[e] > 0.4)
    const reqFail = (item.requires || []).some(r => !s[r] || s[r] < 0.4)
    if (exclByNogos || reqFail) return null

    // "Already own" elimination (rough, by id/tags)
    if (Array.from(owns).some(o => item.id.includes(o) || item.tags.includes(o))) return null

    // Price sanity (parse first number in priceHint if present)
    let priceOk = true
    if (item.priceHint) {
      const nums = item.priceHint.match(/\d+/g)?.map(Number) || []
      if (nums.length === 1) priceOk = (nums[0] >= min && nums[0] <= max)
      if (nums.length >= 2) priceOk = (Math.max(...nums) >= min && Math.min(*nums) <= max)
    }

    if (!priceOk) return null

    // Base score from matching required signals
    let score = (item.weight || 1) * (item.requires || []).reduce((acc, r) => acc + (s[r] || 0), 0)

    // Bonus: extraLikes matching tags
    const extra = (ctx.prefs.extraLikes || []).join(' ').toLowerCase()
    if (extra) {
      if (item.tags.some(t => extra.includes(t))) score += 0.25
      if ((item.title + ' ' + (item.reasonTmpl || '')).toLowerCase().includes(extra)) score += 0.15
    }

    // Tiny diversity noise
    score += Math.random() * 0.05

    return { ...item, score }
  }).filter(Boolean).sort((a,b) => b!.score - a!.score).slice(0, 16)

  return { ideas: ideas as GiftIdea[], evidence: ev }
}
