import type { EnrichedProfile } from '../../src/types'
import { fetchHtml, extractMeta, inferSignals, inferOwnsAndNoGos } from './_util'

export const onRequestGet: PagesFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return new Response('[]', { headers: { 'content-type': 'application/json' } })

  try {
    const html = await fetchHtml(url)
    const meta = extractMeta(html, url)
    const signals = inferSignals(meta)
    const { owns, nogos } = inferOwnsAndNoGos(meta, signals)

    const payload: EnrichedProfile = {
      url,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      textSample: meta.textSample,
      links: meta.links.concat(meta.sameAs),
      signals,
      owns,
      nogos
    }
    return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
