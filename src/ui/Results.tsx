import React from 'react'
import type { Recommendation } from '../types'

export function Results({ items, onBack }: { items: Recommendation[], onBack: ()=>void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Curated recommendations</h2>
        <button onClick={onBack} className="text-sm opacity-80 hover:opacity-100">← tweak</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(x => (
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
  )
}
