export type CandidateProfile = {
  id: string
  name: string
  url: string
  source: 'brave' | 'google' | 'direct'
  snippet?: string
  image?: string
  locationHint?: string
  confidence: number
}

export type EnrichedProfile = {
  url: string
  title?: string
  description?: string
  image?: string
  links: string[]
  textSample?: string
  signals: Record<string, number>  // e.g., { 'ecosystem.apple': 0.8, 'gaming.playstation': 0.7 }
}

export type PersonalizeOptions = {
  minPrice?: number
  maxPrice?: number
  knownNoGos?: string[]     // e.g., ['xbox', 'scented']
  knownOwns?: string[]      // e.g., ['playstation5', 'iphone15pro']
  extraLikes?: string[]     // free text tags
}

export type Recommendation = {
  id: string
  title: string
  reason: string
  evidence: string[]
  url?: string
  image?: string
  priceHint?: string
  score: number
  tags: string[]
}
