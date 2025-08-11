import { clamp } from './util'
import { INTEREST_CLUSTERS, OCCASION_BOOST } from './interests'

type ProfileSignals = {
  keywords: string[]
  locations?: string[]
  orgs?: string[]
}

export type GiftContext = {
  occasion: string
  relationship?: string
  budgetMin?: number
  budgetMax?: number
  needBy?: string
}

export type CandidateProduct = {
  title: string
  url: string
  price?: number
  prime?: boolean
  snippet?: string
  image?: string
  sourceDomain?: string
  cluster?: string
}

export function clusterAffinity(signals: ProfileSignals, occasion: string) {
  const text = (signals.keywords || []).join(' ').toLowerCase()
  const base: Record<string, number> = {}
  for (const [cluster, kws] of Object.entries(INTEREST_CLUSTERS)) {
    let score = 0
    for (const kw of kws) {
      if (text.includes(kw)) score += 1
    }
    base[cluster] = score
  }
  const boost = OCCASION_BOOST[occasion] || {}
  for (const [k, v] of Object.entries(boost)) {
    base[k] = (base[k] || 0) + (v || 0) as number
  }
  const max = Math.max(1, ...Object.values(base))
  Object.keys(base).forEach(k => base[k] = base[k] / max)
  return base
}

export function scoreProduct(p: CandidateProduct, ctx: GiftContext) {
  const w = { interest: 0.45, price: 0.25, shipping: 0.15, quality: 0.15 }

  const interest = p.cluster ? 1 : 0.4

  let price = 0.6
  if (p.price && (ctx.budgetMin || ctx.budgetMax)) {
    const min = ctx.budgetMin ?? 0
    const max = ctx.budgetMax ?? Math.max(min, 9999)
    price = p.price >= min && p.price <= max ? 1 : 0.2
  }

  let shipping = 0.5
  if (ctx.needBy) {
    shipping = p.prime ? 1 : 0.3
  }

  const quality = (p.snippet || '').toLowerCase().includes("best seller") || (p.snippet || '').toLowerCase().includes("amazon's choice") ? 1 : 0.5

  return clamp(w.interest*interest + w.price*price + w.shipping*shipping + w.quality*quality, 0, 1)
}
