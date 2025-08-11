export default function Loading({label="Loading..."}:{label?:string}){
  return (<div className="flex items-center gap-3 text-slate-300 animate-pulse">
    <div className="size-3 bg-slate-600 rounded-full"></div>
    <div className="size-3 bg-slate-600 rounded-full"></div>
    <div className="size-3 bg-slate-600 rounded-full"></div>
    <span className="ml-2">{label}</span>
  </div>)}
