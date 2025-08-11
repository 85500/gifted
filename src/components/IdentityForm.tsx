import { useState } from 'react'
export type IdentityQuery={ fullName:string; location?:string; birthYear?:string; employer?:string; school?:string; hints?:string; profileUrl?:string }
export default function IdentityForm({onSearch}:{onSearch:(q:IdentityQuery)=>void}){
  const [form,setForm]=useState<IdentityQuery>({fullName:'',location:'',birthYear:'',employer:'',school:'',hints:'',profileUrl:''})
  const submit=(e:React.FormEvent)=>{ e.preventDefault(); if(form.fullName.trim()) onSearch(form) }
  return (<form onSubmit={submit} className="space-y-3">
    <div><label className="block text-sm text-slate-300">Full name *</label>
      <input required value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}
        className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="e.g., Jane Alexandra Doe"/></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div><label className="block text-sm text-slate-300">Location (city/state)</label>
        <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}
          className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="optional"/></div>
      <div><label className="block text-sm text-slate-300">Birth year</label>
        <input value={form.birthYear} onChange={e=>setForm({...form,birthYear:e.target.value})}
          className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="optional"/></div>
      <div><label className="block text-sm text-slate-300">Employer or School</label>
        <input value={form.employer} onChange={e=>setForm({...form,employer:e.target.value})}
          className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="optional"/></div>
    </div>
    <div><label className="block text-sm text-slate-300">Other hints (usernames, favorite things)</label>
      <input value={form.hints} onChange={e=>setForm({...form,hints:e.target.value})}
        className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="optional"/></div>
    <div><label className="block text-sm text-slate-300">Direct profile URL (optional)</label>
      <input value={form.profileUrl} onChange={e=>setForm({...form,profileUrl:e.target.value})}
        className="w-full rounded-xl bg-slate-800 px-4 py-2" placeholder="https://linkedin.com/in/..."/></div>
    <button type="submit" className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2 font-semibold">Find the right person</button>
  </form>)}
