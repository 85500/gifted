import React from 'react'
import type { CandidateProfile } from '../types'

export function CandidateList({ candidates, onPick, onBack }: {
  candidates: CandidateProfile[],
  onPick: (p: CandidateProfile)=>void,
  onBack: ()=>void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pick the right person</h2>
        <button onClick={onBack} className="text-sm opacity-80 hover:opacity-100">← back</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {candidates.map(c => (
          <button key={c.id} onClick={()=>onPick(c)} className="bg-slate-900/60 rounded-2xl p-4 text-left shadow hover:shadow-lg hover:bg-slate-900 transition">
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
  )
}
