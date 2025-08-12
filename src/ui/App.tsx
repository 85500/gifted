import React, { useEffect, useState } from 'react'
import type { CandidateProfile, EnrichedProfile, Recommendation } from '../types'

export default function App() {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [autoPick, setAutoPick] = useState<CandidateProfile | null>(null)
  const [fallback, setFallback] = useState<CandidateProfile[]>([])
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null)
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null); setBusy(true); setAutoPick(null); setFallback([]); setEnriched(null); setRecs([])
    try {
      const res = await fetch('/api/search-identities?' + new URLSearchParams({ name, location }))
      const data = await res.json()
      if (data.auto && data.auto.confidence >= 0.8) {
        setAutoPick(data.auto)
        const e = await (await fetch('/api/enrich?' + new URLSearchParams({ url: data.auto.url }))).json()
        setEnriched(e)
        const r = await (await fetch('/api/recs', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ profile: e }) })).json()
        setRecs(r)
      } else {
        setFallback(data.candidates || [])
      }
    } catch (e:any) {
      setError(String(e))
    } finally { setBusy(false) }
  }

  async function pick(url: string) {
    setBusy(true); setError(null);
    try {
      const e = await (await fetch('/api/enrich?' + new URLSearchParams({ url }))).json()
      setEnriched(e)
      const r = await (await fetch('/api/recs', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ profile: e }) })).json()
      setRecs(r)
    } catch (e:any) {
      setError(String(e))
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎁 Gifted <span className="text-sky-400">Auto</span></h1>
        <div className="text-sm opacity-80">Zero manual prefs • No gift cards • Evidence-based</div>
      </header>

      <div className="bg-slate-900/60 rounded-2xl p-5 shadow">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm mb-1">Full name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Alex Chen" className="w-full bg-slate-800 rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Location hint (optional)</div>
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City/State/Country" className="w-full bg-slate-800 rounded px-3 py-2" />
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={run} disabled={!name || busy} className="bg-sky-500 hover:bg-sky-600 transition px-4 py-2 rounded-lg font-semibold disabled:opacity-60">
            {busy ? 'Working…' : 'Find & generate'}
          </button>
          <span className="text-sm opacity-70 self-center">We auto-pick when confident (≥ 0.8). Otherwise, you can choose.</span>
        </div>
      </div>

      {error && <div className="text-red-300 text-sm">{error}</div>}

      {autoPick && (
        <div className="bg-slate-900/60 rounded-2xl p-4">
          <div className="font-semibold">Auto-selected: {autoPick.name} <span className="text-xs opacity-70">({Math.round(autoPick.confidence*100)}% match)</span></div>
          <div className="text-xs opacity-70 break-words">{autoPick.url}</div>
        </div>
      )}

      {!autoPick && fallback.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm opacity-80">We’re not 80% confident yet — pick the right one:</div>
          <div className="grid md:grid-cols-2 gap-4">
            {fallback.map(c => (
              <button key={c.id} onClick={()=>pick(c.url)} className="bg-slate-900/60 rounded-2xl p-4 text-left hover:bg-slate-900 transition">
                <div className="flex gap-4">
                  <img src={c.image || '/placeholder.png'} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-800" />
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs opacity-70 break-words">{c.url}</div>
                    {c.locationHint && <div className="text-xs mt-1 opacity-80">📍 {c.locationHint}</div>}
                    <div className="text-xs mt-1 opacity-60">match {Math.round(c.confidence*100)}%</div>
                    {c.snippet && <div className="text-xs mt-2 opacity-80 line-clamp-2">{c.snippet}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {enriched && (
        <div className="bg-slate-900/60 rounded-2xl p-4 space-y-2">
          <div className="font-semibold">Detected signals</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(enriched.signals).sort((a,b)=>b[1]-a[1]).slice(0,16).map(([k,v]) => (
              <span key={k} className="px-2 py-1 rounded-full bg-slate-800 text-xs">{k} {(v*100|0)}%</span>
            ))}
          </div>
          {(enriched.owns.length>0 || enriched.nogos.length>0) && (
            <div className="text-xs opacity-80">
              {enriched.owns.length>0 && <div>Detected owns: {enriched.owns.join(', ')}</div>}
              {enriched.nogos.length>0 && <div>Auto no-gos: {enriched.nogos.join(', ')}</div>}
            </div>
          )}
        </div>
      )}

      {recs.length>0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Curated recommendations</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recs.map(x => (
              <a key={x.id} href={x.url} target="_blank" rel="noreferrer" className="bg-slate-900/60 rounded-2xl p-4 hover:shadow-lg hover:bg-slate-900 transition block">
                <div className="flex gap-4">
                  <img src={x.image || '/placeholder.png'} className="w-20 h-20 rounded-xl object-cover bg-slate-800" />
                  <div>
                    <div className="font-medium">{x.title}</div>
                    <div className="text-xs opacity-70 mt-1">{x.reason}</div>
                    <div className="text-xs opacity-60 mt-1">score {Math.round(x.score*100)/100}</div>
                    {x.priceHint && <div className="text-xs opacity-80 mt-1">{x.priceHint}</div>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {x.tags.map(t => <span key={t} className="px-2 py-1 rounded-full bg-slate-800 text-[10px]">{t}</span>)}
                    </div>
                    {x.evidence.length > 0 && (
                      <details className="mt-2 opacity-80">
                        <summary className="cursor-pointer text-xs">evidence</summary>
                        <ul className="text-[11px] list-disc ml-5 space-y-1">
                          {x.evidence.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
