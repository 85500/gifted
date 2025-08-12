import { recommendGifts } from './_util'
import type { EnrichedProfile } from '../../src/types'

export const onRequestPost: PagesFunction<{ AFFILIATE_TAG?: string }> = async ({ request, env }) => {
  const body = await request.json() as { profile: EnrichedProfile }
  const { ideas, evidence } = recommendGifts({
    signals: body.profile.signals || {},
    owns: body.profile.owns || [],
    nogos: body.profile.nogos || [],
    affiliateTag: env.AFFILIATE_TAG
  })

  const list = ideas.map(it => ({
    id: it.id,
    title: it.title,
    url: it.url,
    image: it.image,
    priceHint: it.priceHint,
    tags: it.tags,
    reason: it.reasonTmpl || 'Good fit based on detected signals',
    evidence,
    score: (it as any).score ?? it.weight ?? 1
  }))

  return new Response(JSON.stringify(list), { headers: { 'content-type': 'application/json' } })
}
