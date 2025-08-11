export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function daysUntil(dateStr?: string) {
  if (!dateStr) return undefined
  const target = new Date(dateStr)
  const now = new Date()
  const ms = target.getTime() - now.getTime()
  return Math.ceil(ms / (1000*60*60*24))
}

export function uniqBy<T>(arr: T[], key: (x: T) => string) {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of arr) {
    const k = key(item)
    if (!seen.has(k)) { seen.add(k); out.push(item) }
  }
  return out
}
