export type CandidateProfile = {
  id: string
  name: string
  url: string
  source: 'brave' | 'google' | 'direct'
  snippet?: string
  image?: string
  handles?: string[]
  sameAs?: string[]
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
  signals: Record<string, number>
  owns: string[]
  nogos: string[]
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
