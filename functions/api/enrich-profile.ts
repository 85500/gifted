export const onRequestPost: PagesFunction = async (context) => {
  const { url } = await context.request.json()
  if (!url) return new Response('Bad request', { status:400 })
  try {
    const resp = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0 GiftedBot' }})
    const html = await resp.text()
    const meta = [...html.matchAll(/<(title|meta)[^>]+>/gi)].map(m=>m[0]).join(' ')
    const text = (meta + ' ' + (html.slice(0, 20000))).toLowerCase()
    const detectors: Record<string, RegExp> = {
      espresso: /(espresso|barista|aeropress|v60|chemex)/,
      coffee: /(coffee|bean|roast)/,
      cycling: /(cycling|strava|peloton|road bike|mtb)/,
      running: /(runner|marathon|strava|5k|10k)/,
      hiking: /(hiking|trail|backpacking|thru-hike)/,
      gaming: /(steam|xbox|playstation|nintendo|twitch)/,
      zelda: /(zelda|hyrule)/,
      starwars: /(star wars|skywalker|jedi)/,
      diy: /(3d print|solder|maker|arduino|raspberry)/,
      guitar: /(guitar|fender|gibson|strat)/,
      vinyl: /(vinyl|turntable|record)/,
      skincare: /(skincare|retinol|serum)/,
      plants: /(monstera|philodendron|succulent|houseplant)/
    }
    const hits = Object.entries(detectors).filter(([k,re])=> re.test(text)).map(([k])=>k)
    const imgMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)/i) || html.match(/name=["']twitter:image["'][^>]+content=["']([^"']+)/i)
    const avatar = imgMatch?.[1]
    return new Response(JSON.stringify({ signals: hits, avatar }), { headers:{'Content-Type':'application/json'} })
  } catch {
    return new Response(JSON.stringify({ signals: [] }), { headers:{'Content-Type':'application/json'} })
  }
}
