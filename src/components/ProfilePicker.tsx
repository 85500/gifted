import Loading from './Loading'

type ProfileHit = {
  title: string
  url: string
  site: string
  snippet?: string
  image?: string
  score: number
}

export default function ProfilePicker({hits,loading,onPick}:{hits:ProfileHit[],loading:boolean,onPick:(i:number)=>void}){
  if (loading) return <Loading label="Searching public profiles" />
  if (!hits?.length) return <div className="text-slate-400">No clear matches found. Try adding location, school, or employer.</div>
  return (
    <div className="grid gap-3">
      {hits.slice(0,6).map((h,i)=> (
        <button key={i} onClick={()=>onPick(i)} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-left">
          {h.image ? <img src={h.image} alt="" className="w-14 h-14 rounded-xl object-cover"/> : <div className="w-14 h-14 rounded-xl bg-slate-700"/>}
          <div className="flex-1">
            <div className="font-semibold">{h.title}</div>
            <div className="text-xs text-slate-400">{h.site}</div>
            <div className="text-sm text-slate-300 line-clamp-2">{h.snippet}</div>
          </div>
          <div className="text-xs text-slate-400">match {(h.score*100).toFixed(0)}%</div>
        </button>
      ))}
    </div>
  )
}
