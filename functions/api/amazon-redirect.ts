export const onRequestGet: PagesFunction = async (context) => {
  const env = context.env as any
  const url = new URL(context.request.url)
  const target = url.searchParams.get('url')
  if (!target) return new Response('Missing url', { status: 400 })
  try {
    const u = new URL(target)
    if (u.hostname.includes('amazon.')){
      u.searchParams.set('tag', env.AMAZON_ASSOCIATE_TAG)
    }
    return Response.redirect(u.toString(), 302)
  } catch (e) {
    return new Response('Bad url', { status: 400 })
  }
}
