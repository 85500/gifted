import { useState } from 'react'
const CATS=['tech','gamer','outdoors','homechef','maker','fitness','bookworm','music','fashion','cozyhome','parent','pet']
export type Prefs={ likes:string[]; dislikes:string[]; tags?:string }
export default function PersonalizeForm({onSubmit}:{onSubmit:(p:Prefs)=>void}){
  const [likes,setLikes]=useState<string[]>([])
  const [dislikes,setDislikes]=useState<string[]>([])
  const [tags,setTags]=useState('')
  const toggle=(arr:string[],set:(v:string[])=>void,val:string)=>{ set(arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]) }
  return (<form onSubmit={e=>{e.preventDefault(); onSubmit({likes,dislikes,tags})}} className="grid gap-4">
    <div>
      <div className="text-sm text-slate-300 mb-2">What do they like? (pick a few)</div>
      <div className="flex flex-wrap gap-2">{CATS.map(c=>(
        <button type="button" key={c} onClick={()=>toggle(likes,setLikes,c)}
          className={"px-3 py-1 rounded-full border "+(likes.includes(c)?'bg-indigo-600 border-indigo-600':'border-slate-600')}>
          {c}
        </button>
      ))}</div>
    </div>
    <div>
      <div className="text-sm text-slate-300 mb-2">Hard no-gos</div>
      <div className="flex flex-wrap gap-2">{CATS.map(c=>(
        <button type="button" key={c} onClick={()=>toggle(dislikes,setDislikes,c)}
          className={"px-3 py-1 rounded-full border "+(dislikes.includes(c)?'bg-rose-600 border-rose-600':'border-slate-600')}>
          {c}
        </button>
      ))}</div>
    </div>
    <div>
      <label className="block text-sm text-slate-300 mb-1">Optional tags (brands, fandoms, teams, hobbies)</label>
      <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="e.g., espresso, Zelda, Taylor Swift, houseplants"/>
    </div>
    <button className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2 font-semibold">Generate perfect gift list</button>
  </form>)}
