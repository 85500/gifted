/**
 * POST /api/recs
 * { profile: EnrichedProfile, prefs: PersonalizeOptions }
 * Runs rule engine to produce curated list with evidence.
 */
import type { EnrichedProfile } from '../../src/types'
import { recommendGifts } from './_util'

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json() as { profile: EnrichedProfile, prefs: any }
  const { ideas, evidence } = recommendGifts({ signals: body.profile.signals || {}, prefs: body.prefs || {} })

  const list = ideas.map(it => ({
    id: it.id,
    title: it.title,
    url: it.url,
    image: it.image,
    priceHint: it.priceHint,
    tags: it.tags,
    reason: it.reasonTmpl || 'Good fit based on signals',
    evidence,
    score: it.weight || 1
  }))

  return new Response(JSON.stringify(list), { headers: { 'content-type': 'application/json' } })
}
