export type Meta = {
  title?: string
  description?: string
  image?: string
  textSample?: string
  links: string[]
  sameAs: string[]
  handles: string[]
  person?: { name?: string, jobTitle?: string, addressLocality?: string }
}

export async function fetchHtml(url: string) {
  const r = await fetch(url, { headers: { 'accept': 'text/html,*/*', 'user-agent': 'Mozilla/5.0 GiftedBot' } })
  return await r.text()
}

export function extractMeta(html: string, baseUrl: string): Meta {
  const m = {
    title: matchContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
           matchContent(html, /<title[^>]*>([^<]+)<\/title>/i),
    description: matchContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
                 matchContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
    image: matchContent(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i),
    textSample: snippetFromHtml(html),
    links: Array.from(new Set(Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)).map(x=>resolveUrl(baseUrl, x[1])))),
    sameAs: [],
    handles: [],
    person: undefined
  }

  // JSON-LD Person:
  try {
    const ld = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    for (const s of ld) {
      try {
        const j = JSON.parse(s[1])
        const arr = Array.isArray(j) ? j : [j]
        for (const obj of arr) {
          if ((obj['@type'] === 'Person' || (Array.isArray(obj['@type']) && obj['@type'].includes('Person')))) {
            const sa = obj.sameAs || []
            if (Array.isArray(sa)) m.sameAs.push(...sa)
            m.person = {
              name: obj.name,
              jobTitle: obj.jobTitle,
              addressLocality: obj.address?.addressLocality || obj.homeLocation?.name
            }
          }
        }
      } catch {}
    }
  } catch {}

  // Handles from urls or text
  const text = ((m.title||'') + ' ' + (m.description||'') + ' ' + (m.textSample||'')).toLowerCase()
  const handleLike = Array.from(text.matchAll(/@([a-z0-9_\.]{3,25})/g)).map(x=>x[1])
  m.handles.push(...handleLike)

  return m
}

function resolveUrl(baseUrl: string, href: string) {
  try { return new URL(href, baseUrl).toString() } catch { return href }
}

function matchContent(html: string, re: RegExp) {
  const m = re.exec(html)
  return m ? decode(m[1]) : undefined
}

function snippetFromHtml(html: string) {
  const txt = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')
  return txt.split(/\s+/).slice(0, 160).join(' ')
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

// Inference

export function inferSignals(meta: Meta): Record<string, number> {
  const text = ((meta.title || '') + ' ' + (meta.description || '') + ' ' + (meta.textSample || '') + ' ' + meta.links.join(' ') + ' ' + meta.sameAs.join(' ')).toLowerCase()
  const s: Record<string, number> = {}
  const bump = (k: string, v=0.2) => s[k] = Math.min(1, (s[k] || 0) + v)

  // Ecosystems
  if (/\biphone|ios|macbook|imac|airpods|magsafe|apple watch\b/.test(text)) bump('ecosystem.apple', .75)
  if (/\bandroid|pixel\b/.test(text)) bump('ecosystem.android', .75)
  if (/\bgalaxy\b/.test(text)) bump('ecosystem.samsung', .6)
  // Gaming platforms
  if (/\bplaystation|ps5|ps4|dualsense\b/.test(text)) bump('gaming.playstation', .8)
  if (/\bxbox\b/.test(text)) bump('gaming.xbox', .8)
  if (/\bnintendo|switch\b/.test(text)) bump('gaming.nintendo', .8)
  if (/\bsteamcommunity\.com|steam deck|pc gamer\b/.test(text)) bump('gaming.pc', .7)
  // Hobbies
  if (/\bstrava|garmin|half marathon|ultra|trail run|10k\b/.test(text)) bump('hobby.running', .7)
  if (/\bpeloton|fitness|crossfit|weightlifting\b/.test(text)) bump('hobby.fitness', .5)
  if (/\bfujifilm|sony\s*a[0-9]|canon eos|nikon z\b/.test(text)) bump('hobby.photography', .7)
  if (/\baeropress|v60|df64|breville barista|espresso\b/.test(text)) bump('hobby.coffee', .6)
  if (/\bgoodreads\.com|storygraph|sci[- ]?fi|fantasy novels\b/.test(text)) bump('hobby.reading', .5)
  if (/\bspotify\.com|apple music|bandcamp\b/.test(text)) bump('hobby.music', .4)
  if (/\bgithub\.com|docker|kubernetes|open source|neural network|kaggle\b/.test(text)) bump('persona.techie', .7)

  // Accounts
  for (const link of meta.links.concat(meta.sameAs)) {
    if (/linkedin\.com\/in\//.test(link)) bump('account.linkedin', .6)
    if (/instagram\.com\//.test(link)) bump('account.instagram', .6)
    if (/(x|twitter)\.com\//.test(link)) bump('account.twitter', .6)
    if (/steamcommunity\.com\//.test(link)) bump('account.steam', .7)
    if (/goodreads\.com\//.test(link)) bump('account.goodreads', .7)
    if (/strava\.com\//.test(link)) bump('account.strava', .7)
    if (/github\.com\//.test(link)) bump('account.github', .7)
  }

  return s
}

export function inferOwnsAndNoGos(meta: Meta, s: Record<string, number>): { owns: string[], nogos: string[] } {
  const text = ((meta.title || '') + ' ' + (meta.description || '') + ' ' + (meta.textSample || '')).toLowerCase()
  const owns: string[] = []
  const nogos: string[] = []

  // Ownership cues
  if (/(my|our)\s+ps5|dualsense/i.test(text) || s['gaming.playstation']>0.6) owns.push('playstation-ecosystem')
  if (/(my|our)\s+xbox/i.test(text) || s['gaming.xbox']>0.6) owns.push('xbox-ecosystem')
  if (/(my|our)\s+switch/i.test(text) || s['gaming.nintendo']>0.6) owns.push('switch-ecosystem')
  if (/(iphone|my\s+iphone)/i.test(text) || s['ecosystem.apple']>0.6) owns.push('iphone/ios')
  if (/(pixel|android phone)/i.test(text) || s['ecosystem.android']>0.6) owns.push('android')

  // No-gos from contradictions (avoid cross-platform controllers)
  if (s['gaming.playstation']>0.5) nogos.push('xbox')
  if (s['gaming.xbox']>0.5) nogos.push('playstation')
  if (s['ecosystem.apple']>0.5) nogos.push('random-micro-usb')

  return { owns: Array.from(new Set(owns)), nogos: Array.from(new Set(nogos)) }
}

// Gift engine

export type GiftRuleContext = {
  signals: Record<string, number>
  owns: string[]
  nogos: string[]
  affiliateTag?: string
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

export function mkAmazonSearchUrl(q: string, tag?: string) {
  const base = 'https://www.amazon.com/s'
  const u = new URL(base)
  u.searchParams.set('k', q)
  if (tag) u.searchParams.set('tag', tag)
  return u.toString()
}

export function recommendGifts(ctx: GiftRuleContext): { ideas: GiftIdea[], evidence: string[] } {
  const s = ctx.signals, owns = new Set(ctx.owns || []), nogos = new Set(ctx.nogos || [])
  const ev: string[] = []
  const pushEv = (k: string, v: number) => { if (v > 0.49) ev.push(`${k}=${(Math.round(v*100))}%`) }

  for (const [k,v] of Object.entries(s)) pushEv(k, v)

  const tag = ctx.affiliateTag

  // Curated catalog (no gift cards, all affiliateable searches)
  const CATALOG: GiftIdea[] = [
    // Platform-specific, accessory-first (complements likely ownership)
    { id:'ps5-charging-dock', title:'PS5 DualSense Charging Dock',
      url: mkAmazonSearchUrl('PS5 DualSense charging dock', tag), priceHint:'$25–$40',
      tags:['gaming','playstation'], requires:['gaming.playstation'], excludes:['gaming.xbox','gaming.nintendo'],
      reasonTmpl:'Useful daily accessory for PS5 owners.'
    },
    { id:'ps5-headset', title:'PS5-Compatible Wireless Headset',
      url: mkAmazonSearchUrl('PlayStation 5 wireless headset', tag), priceHint:'$70–$180',
      tags:['gaming','playstation'], requires:['gaming.playstation']
    },
    { id:'xbox-quickcharge', title:'Xbox Controller Quick-Charge Kit',
      url: mkAmazonSearchUrl('Xbox controller rechargeable battery and charging station', tag), priceHint:'$25–$40',
      tags:['gaming','xbox'], requires:['gaming.xbox']
    },
    { id:'switch-carry', title:'Nintendo Switch Carry Case + Glass',
      url: mkAmazonSearchUrl('Nintendo Switch OLED carry case tempered glass', tag), priceHint:'$20–$35',
      tags:['gaming','nintendo'], requires:['gaming.nintendo']
    },
    { id:'steamdeck-stand', title:'Steam Deck Dock/Stand (USB-C)',
      url: mkAmazonSearchUrl('Steam Deck dock stand usb c hub', tag), priceHint:'$30–$90',
      tags:['gaming','pc'], requires:['gaming.pc']
    },
    // Apple/Android ecosystems
    { id:'magsafe-stand', title:'MagSafe 3-in-1 Stand',
      url: mkAmazonSearchUrl('magsafe 3 in 1 charging stand', tag), priceHint:'$50–$120',
      tags:['apple','charging'], requires:['ecosystem.apple'], excludes:['ecosystem.android'],
      reasonTmpl:'Great if they have iPhone + AirPods/Watch.'
    },
    { id:'android-stand', title:'USB-C Multi-Device Charging Stand',
      url: mkAmazonSearchUrl('usb c charging stand phone earbuds watch', tag), priceHint:'$40–$100',
      tags:['android','charging'], requires:['ecosystem.android']
    },
    // Running / Fitness
    { id:'running-headlamp', title:'Runner’s Lightweight Headlamp (USB-C)',
      url: mkAmazonSearchUrl('running headlamp lightweight usb c', tag), priceHint:'$20–$45',
      tags:['running'], requires:['hobby.running']
    },
    { id:'balega-socks', title:'Premium Running Socks (2–6 pack)',
      url: mkAmazonSearchUrl('premium running socks blister', tag), priceHint:'$20–$40',
      tags:['running'], requires:['hobby.running']
    },
    // Photography
    { id:'sdxc-pro', title:'UHS-II SDXC Card (High Speed)',
      url: mkAmazonSearchUrl('UHS-II SDXC 128GB', tag), priceHint:'$35–$90',
      tags:['photography'], requires:['hobby.photography']
    },
    // Coffee
    { id:'aeropress-bundle', title:'AeroPress Upgrades Bundle',
      url: mkAmazonSearchUrl('AeroPress flow control metal filter cap', tag), priceHint:'$20–$50',
      tags:['coffee'], requires:['hobby.coffee']
    },
    // Bookish
    { id:'clip-light', title:'Rechargeable Book Clip Light (Warm/Neutral)',
      url: mkAmazonSearchUrl('book light rechargeable warm', tag), priceHint:'$15–$25',
      tags:['reading'], requires:['hobby.reading']
    }
  ]

  const ideas = CATALOG.map(item => {
    // Exclusions: platform mismatch and auto no-gos
    const excl = (item.excludes || []).some(e => s[e] && s[e] > 0.4) or item.tags.some(t => nogos.has(t))
    if (excl) return null
    const reqFail = (item.requires || []).some(r => !s[r] || s[r] < 0.45)
    if (reqFail) return null

    // Already-own heuristic: skip "core" if ownership implies already solved
    if (owns.has('playstation-ecosystem') && /ps5.*controller/i.test(item.title)) return null

    // Score: weight by matching signals + accessory-first preference
    let score = (item.requires || []).reduce((acc, r) => acc + (s[r] || 0), 0)
    if (/dock|stand|case|socks|light|bundle|charge/i.test(item.title)) score += 0.2
    score += Math.random() * 0.03
    return { ...item, score }
  }).filter(Boolean).sort((a,b)=> (b!.score as number) - (a!.score as number)) as GiftIdea[]

  return { ideas: ideas.slice(0, 16), evidence: ev }
}
