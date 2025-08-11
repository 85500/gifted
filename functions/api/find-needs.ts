export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as any
  const { fullName, location } = await context.request.json()
  const key = env.GOOGLE_CSE_KEY, cx = env.GOOGLE_CSE_ID
  const quoted = `"${fullName}"`
  const sites = ['amazon.com/hz/wishlist','theknot.com/registry','zola.com/registry','babylist.com','myregistry.com','target.com/gift-registry']
  const q = `${quoted} (${sites.map(s=>`site:${s}`).join(' OR ')}) ${location||''}`
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', key); url.searchParams.set('cx', cx); url.searchParams.set('q', q); url.searchParams.set('num','5')
  const r = await fetch(url.toString()); const j = await r.json()
  const hits = (j.items||[]).map((it:any)=>({ title: it.title, url: it.link, snippet: it.snippet }))
  return new Response(JSON.stringify({ hits }), { headers:{'Content-Type':'application/json'} })
}
