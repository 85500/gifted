import { useMemo, useState } from 'react'
import IdentityForm, { IdentityQuery } from './components/IdentityForm'
import ProfilePicker from './components/ProfilePicker'
import OccasionForm, { OccasionInput } from './components/OccasionForm'
import Loading from './components/Loading'

export default function App(){
  const [stage, setStage] = useState<'identity'|'choose'|'occasion'|'results'>('identity')
  const [identity, setIdentity] = useState<IdentityQuery|null>(null)
  const [hits, setHits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<any|null>(null)
  const [items, setItems] = useState<any[]>([])

  const title = useMemo(() => ({
    identity: 'Who is the gift for?',
    choose: 'Confirm the correct person',
    occasion: 'Occasion, budget & deadline',
    results: 'Perfect gifts for them'
  }[stage]), [stage])

  async function searchIdentity(q:IdentityQuery){
    setIdentity(q); setLoading(true); setStage('choose')
    const res = await fetch('/api/search-profiles', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(q)})
    const data = await res.json(); setHits(data.hits || []); setLoading(false)
  }

  function pick(i:number){ const sel = hits[i]; setPicked(sel); setStage('occasion') }

  async function generate(o:OccasionInput){
    setStage('results'); setLoading(true)
    const res = await fetch('/api/recommend', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({identity, picked, occasion:o})})
    const data = await res.json(); setItems(data.items || []); setLoading(false)
  }

  return (<div className="max-w-5xl mx-auto p-6">
    <header className="flex items-center gap-3 mb-8">
      <img src="/logo.svg" className="w-10 h-10"/><h1 className="text-2xl font-extrabold">Gifted</h1>
    </header>
    <main className="grid gap-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {stage==='identity' && <IdentityForm onSearch={searchIdentity} />}
      {stage==='choose' && <ProfilePicker hits={hits} loading={loading} onPick={pick} />}
      {stage==='occasion' && picked && <OccasionForm onSubmit={generate} />}
      {stage==='results' && (loading ? <Loading label="Curating the perfect list"/> : (
        items?.length ? (<div className="space-y-6">
          <div className="text-slate-300">Curated for <span className="font-semibold">{picked?.title || identity?.fullName}</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((p,i)=> (<a key={i} href={p.url} target="_blank" rel="noopener" className="block rounded-2xl bg-slate-900 hover:bg-slate-800 p-4">
              <div className="flex gap-4">
                {p.image ? <img src={p.image} className="w-24 h-24 rounded-xl object-cover"/> : <div className="w-24 h-24 rounded-xl bg-slate-700"/>}
                <div className="flex-1">
                  <div className="font-semibold mb-1 line-clamp-2">{p.title}</div>
                  {p.priceText && <div className="text-sm text-slate-300">{p.priceText}</div>}
                  {p.why && <div className="text-xs text-slate-400 mt-1">Why: {p.why}</div>}
                  {p.snippet && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{p.snippet}</div>}
                </div>
              </div>
            </a>))}
          </div>
          <button onClick={()=>setStage('occasion')} className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2 font-semibold">Tweak inputs & refine</button>
        </div>) : (<div className="text-slate-400">No items found. Try widening budget or changing occasion.</div>)
      ))}
    </main>
    <footer className="mt-12 text-xs text-slate-500">© {new Date().getFullYear()} Gifted • All rights reserved</footer>
  </div>)}
