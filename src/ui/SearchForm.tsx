import React, { useState } from 'react'

export function SearchForm({ onSubmit }: { onSubmit: (q: {name: string, location?: string, birthYear?: string, url?: string}) => void }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [url, setUrl] = useState('')

  return (
    <div className="bg-slate-900/60 rounded-2xl p-5 shadow">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm mb-1">Full name</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Alex Chen" className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Location (optional)</div>
          <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State or Country" className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Birth year (optional)</div>
          <input value={birthYear} onChange={e=>setBirthYear(e.target.value)} placeholder="1985" className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Direct profile URL (optional)</div>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.linkedin.com/in/..." className="w-full bg-slate-800 rounded px-3 py-2" />
        </label>
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={()=>onSubmit({ name, location, birthYear, url })} className="bg-sky-500 hover:bg-sky-600 transition px-4 py-2 rounded-lg font-medium">
          Search
        </button>
        <span className="text-sm opacity-70 self-center">We’ll show candidates to pick from (with images).</span>
      </div>
    </div>
  )
}
