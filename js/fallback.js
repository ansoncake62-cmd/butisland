import {coastline} from './coast.js';
import {BRIDGES} from './world.js';
export function createFallback(data,onSelect){
 const stage=document.querySelector('#stage'),positions=[[185,265],[295,265],[80,265],[132,360],[132,170],[285,140]];
 const byId=Object.fromEntries(data.islands.map((i,n)=>[i.id,positions[n]]));
 const bridges=BRIDGES.map(([a,b])=>`M${byId[a].join(' ')}L${byId[b].join(' ')}`).join('');
 const points=data.islands.map((i,n)=>{const pos=positions[n],r=n===5?39:52;const poly=coastline(r,n*.7,80,i.id).map(([x,z])=>`${pos[0]+x},${pos[1]+z}`).join(' ');return `<g role="button" tabindex="0" aria-label="探索${i.name}" data-island="${i.id}"><polygon points="${poly}" fill="${i.color}" stroke="#fbf4e8" stroke-width="5"/><text x="${pos[0]}" y="${pos[1]-3}" font-size="16">${i.number}</text><text x="${pos[0]}" y="${pos[1]+17}" font-size="11">${i.name}</text></g>`;});
 stage.innerHTML=`<svg class="fallback-map" viewBox="0 0 500 540" role="img" aria-label="But島 2D 地圖"><path d="${bridges}" stroke="#C89B6D" stroke-width="11" fill="none"/>${points.join('')}</svg>`;
 stage.querySelectorAll('[data-island]').forEach(b=>{b.onclick=()=>onSelect(b.dataset.island);b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(b.dataset.island);}};});
 document.querySelector('#map-hint').textContent='2D 地圖 · 點島探索';return {focus(){},overview(){},zoom(){}};
}
