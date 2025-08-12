import React, { useMemo, useState } from 'react'
import type { EnrichedProfile, PersonalizeOptions } from '../types'

const DEFAULT_NOGOS = ['gag gifts','scented candles','random tech']

export function Personalize({ enriched, prefs, onPrefs, onBack, onRecommend } : {
  enriched: EnrichedProfile,
  prefs: PersonalizeOptions,
  onPrefs: (p: PersonalizeOptions)=>void,
  onBack: ()=>void,
  onRecommend: ()=>void
}) {
  const [local, setLocal] = useState<PersonalizeOptions>(prefs)

  const tags = useMemo(() => Object.entries(enriched.signals).filter(([,v])=>v>0.5).map(([k])=>k).slice(0,12), [enriched])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Personalize</h2>
        <button onClick={onBack} className="text-sm opacity-80 hover:opacity-100">← back</button>
      </div>

      <div className="bg-slate-900/60 rounded-2xl p-4 space-y-3">
        <div className="text-sm opacity-80">Detected signals</div>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <div className="text-xs opacity-70">No strong signals detected (yet)</div>}
          {tags.map(t => <span key={t} className="px-2 py-1 rounded-full bg-slate-800 text-xs">{t}</span>)}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="block bg-slate-900/60 rounded-2xl p-4">
          <div className="text-sm mb-1">Budget min ($)</div>
          <input type="number" value={local.minPrice ?? ''} onChange={e=>setLocal(p=>({...p, minPrice: +e.target.value }))} className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="block bg-slate-900/60 rounded-2xl p-4">
          <div className="text-sm mb-1">Budget max ($)</div>
          <input type="number" value={local.maxPrice ?? ''} onChange={e=>setLocal(p=>({...p, maxPrice: +e.target.value }))} className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="block bg-slate-900/60 rounded-2xl p-4">
          <div className="text-sm mb-1">No-gos (comma separated)</div>
          <input value={local.knownNoGos?.join(', ') ?? DEFAULT_NOGOS.join(', ')} onChange={e=>setLocal(p=>({...p, knownNoGos: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block bg-slate-900/60 rounded-2xl p-4">
          <div className="text-sm mb-1">Things they already own (optional)</div>
          <input placeholder="e.g., playstation5, iphone 15 pro" value={local.knownOwns?.join(', ') ?? ''} onChange={e=>setLocal(p=>({...p, knownOwns: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="block bg-slate-900/60 rounded-2xl p-4">
          <div className="text-sm mb-1">Extra likes / tags (optional)</div>
          <input placeholder="e.g., trail running, sci-fi books" value={local.extraLikes?.join(', ') ?? ''} onChange={e=>setLocal(p=>({...p, extraLikes: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={()=>onPrefs(local)} className="bg-slate-800 px-4 py-2 rounded-lg">Save</button>
        <button onClick={onRecommend} className="bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 rounded-lg font-semibold">Generate recommendations</button>
      </div>
    </div>
  )
}
