import { useState } from 'react'
export type OccasionInput={ occasion:'wedding'|'anniversary'|'birthday'|'new_baby'|'housewarming'|'other'; relationship?:string; budgetMin?:number; budgetMax?:number; needBy?:string }
export default function OccasionForm({onSubmit}:{onSubmit:(o:OccasionInput)=>void}){
  const [o,setO]=useState<OccasionInput>({occasion:'birthday'})
  const submit=(e:React.FormEvent)=>{ e.preventDefault(); onSubmit(o) }
  return (<form onSubmit={submit} className="grid gap-3">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div><label className="block text-sm text-slate-300">Occasion</label>
        <select value={o.occasion} onChange={e=>setO({...o,occasion:e.target.value as any})} className="w-full rounded-xl bg-slate-800 px-4 py-2">
          <option value="birthday">Birthday</option><option value="anniversary">Anniversary</option><option value="wedding">Wedding</option>
          <option value="new_baby">New Baby</option><option value="housewarming">Housewarming</option><option value="other">Other</option>
        </select></div>
      <div><label className="block text-sm text-slate-300">Relationship</label>
        <input onChange={e=>setO({...o,relationship:e.target.value})} className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="sister, spouse, best friend..."/></div>
      <div><label className="block text-sm text-slate-300">Need by (date)</label>
        <input type="date" onChange={e=>setO({...o,needBy:e.target.value})} className="w-full rounded-xl bg-slate-800 px-4 py-2"/></div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="block text-sm text-slate-300">Budget min</label>
        <input type="number" onChange={e=>setO({...o,budgetMin:Number(e.target.value)})} className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="0"/></div>
      <div><label className="block text-sm text-slate-300">Budget max</label>
        <input type="number" onChange={e=>setO({...o,budgetMax:Number(e.target.value)})} className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="100"/></div>
    </div>
    <button className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2 font-semibold">Next: personalize</button>
  </form>)}
