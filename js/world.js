export const R=13, GAP=36, STEP=Math.sqrt(3)*R+GAP;
export const BRIDGES=[['home','library'],['home','farm'],['home','kitchen'],['home','market'],['farm','library'],['farm','kitchen'],['kitchen','market'],['library','market']];
export function axial([q,r]){return {x:STEP*(q+r/2),z:STEP*Math.sqrt(3)/2*r};}
export function shortest(graph,start,end){
 if(!graph[start]||!graph[end]) return [];
 const cost={[start]:0},prev={},todo=new Set(Object.keys(graph));
 while(todo.size){const u=[...todo].reduce((a,b)=>(cost[a]??Infinity)<(cost[b]??Infinity)?a:b); if(!Number.isFinite(cost[u])) break; todo.delete(u);if(u===end)break;
 for(const [v,w] of Object.entries(graph[u])) if(cost[u]+w<(cost[v]??Infinity)){cost[v]=cost[u]+w;prev[v]=u;}}
 if(!Number.isFinite(cost[end]))return [];
 const path=[end];while(path[0]!==start)path.unshift(prev[path[0]]);return path;
}
export function buildGraph(islands){const graph=Object.fromEntries(islands.map(i=>[i.id,{}])); for(const [a,b] of BRIDGES){const A=axial(islands.find(i=>i.id===a).axial),B=axial(islands.find(i=>i.id===b).axial); graph[a][b]=graph[b][a]=Math.hypot(A.x-B.x,A.z-B.z);}return graph;}
export function resolveRoute(graph,ids){let route=[];for(let i=1;i<ids.length;i++){const part=shortest(graph,ids[i-1],ids[i]);if(!part.length)return [];route.push(...part.slice(i===1?0:1));}return route;}
