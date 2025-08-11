import ProductCard from './ProductCard'
export default function Results({items,onRefine}:{items:any[],onRefine:()=>void}){
  if(!items?.length) return <div className="text-slate-400">No items yet.</div>
  return (<div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold">Top picks</h3>
      <button onClick={onRefine} className="text-sm text-indigo-300 hover:text-indigo-200">Regenerate</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map((p,i)=><ProductCard key={i} p={p}/> )}</div>
  </div>)}
