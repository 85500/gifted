/**
 * GET /api/enrich?url=...
 * Fetches the page, extracts OG/Twitter meta + links; infers signals.
 */
import { extractMeta, inferSignals } from './_util'
import type { EnrichedProfile } from '../../src/types'

export const onRequestGet: PagesFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return new Response('[]', { headers: { 'content-type': 'application/json' } })

  try {
    const r = await fetch(url, { headers: { 'accept': 'text/html,*/*' } })
    const html = await r.text()
    const meta = extractMeta(html, url)
    const signals = inferSignals(meta)
    const payload: EnrichedProfile = {
      url,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      textSample: meta.textSample,
      links: meta.links,
      signals
    }
    return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
