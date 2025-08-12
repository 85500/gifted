import React, { useMemo, useState } from 'react'
import { CandidateProfile, EnrichedProfile, PersonalizeOptions, Recommendation } from '../types'
import { SearchForm } from './SearchForm'
import { CandidateList } from './CandidateList'
import { Personalize } from './Personalize'
import { Results } from './Results'

type Phase = 'search' | 'pick' | 'personalize' | 'results'

export default function App() {
  const [phase, setPhase] = useState<Phase>('search')
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [selected, setSelected] = useState<CandidateProfile | null>(null)
  const [enriched, setEnriched] = useState<EnrichedProfile | null>(null)
  const [prefs, setPrefs] = useState<PersonalizeOptions>({ minPrice: 25, maxPrice: 200 })

  const canProceed = useMemo(() => {
    if (phase === 'search') return candidates.length > 0
    if (phase === 'pick') return !!selected
    if (phase === 'personalize') return !!enriched
    return true
  }, [phase, candidates, selected, enriched])

  async function doSearch(q: { name: string, location?: string, birthYear?: string, url?: string }) {
    const res = await fetch(`/api/search-profiles?` + new URLSearchParams(q as any))
    const list = await res.json() as CandidateProfile[]
    setCandidates(list)
    setPhase('pick')
  }

  async function enrich(p: CandidateProfile) {
    setSelected(p)
    const res = await fetch(`/api/enrich?` + new URLSearchParams({ url: p.url }))
    const data = await res.json() as EnrichedProfile
    setEnriched(data)
    setPhase('personalize')
  }

  async function recommend() {
    const res = await fetch(`/api/recs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profile: enriched, prefs })
    })
    const items = await res.json() as Recommendation[]
    setPhase('results')
    setRecs(items)
  }

  const [recs, setRecs] = useState<Recommendation[]>([])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎁 Gifted <span className="text-sky-400">v2</span></h1>
        <div className="text-sm opacity-80">Evidence-driven gift ideas (no more generic lists)</div>
      </header>

      {phase === 'search' && (
        <SearchForm onSubmit={doSearch} />
      )}

      {phase === 'pick' && (
        <CandidateList
          candidates={candidates}
          onBack={() => setPhase('search')}
          onPick={enrich}
        />
      )}

      {phase === 'personalize' && enriched && (
        <Personalize
          enriched={enriched}
          prefs={prefs}
          onPrefs={setPrefs}
          onBack={() => setPhase('pick')}
          onRecommend={recommend}
        />
      )}

      {phase === 'results' && (
        <Results items={recs} onBack={() => setPhase('personalize')} />
      )}

      <footer className="pt-6 text-xs opacity-70">
        Pro tip: paste a direct profile URL if your person is hard to find.
      </footer>
    </div>
  )
}
