export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
export function tokensOf(s?:string){ return (s||'').toLowerCase().split(/[^a-z0-9@._-]+/).filter(Boolean) }
export function jw(a:string,b:string){ // tiny Jaro-Winkler-ish sim (not exact)
  if(a===b) return 1; const m=Math.max(a.length,b.length); let same=0; for(let i=0;i<Math.min(a.length,b.length);i++){ if(a[i]===b[i]) same++ } return same/m
}
export function stableShuffle<T>(arr:T[], seed:string){ const out=[...arr]; let x=0; for(const c of seed) x=(x*31 + c.charCodeAt(0))>>>0; for(let i=out.length-1;i>0;i--){ x=(1103515245*x+12345)>>>0; const j=x%(i+1); [out[i],out[j]]=[out[j],out[i]] } return out }
