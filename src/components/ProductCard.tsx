export default function ProductCard({p}:{p:{title:string,url:string,snippet?:string,image?:string,why?:string,priceText?:string}}){
  return (<a href={p.url} target="_blank" rel="noopener" className="block rounded-2xl bg-slate-900 hover:bg-slate-800 p-4">
    <div className="flex gap-4">
      {p.image ? <img src={p.image} className="w-24 h-24 rounded-xl object-cover"/> : <div className="w-24 h-24 rounded-xl bg-slate-700"/>}
      <div className="flex-1">
        <div className="font-semibold mb-1 line-clamp-2">{p.title}</div>
        {p.priceText && <div className="text-sm text-slate-300">{p.priceText}</div>}
        {p.why && <div className="text-xs text-slate-400 mt-1">Why: {p.why}</div>}
        {p.snippet && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{p.snippet}</div>}
      </div>
    </div>
  </a>)}
