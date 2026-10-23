export const timeValue=v=>{const [h,m]=v.split(':').map(Number);return h+m/60;};
export function cycleAt(cycles,hour){const t=((hour%24)+24)%24;return cycles.find(c=>{const a=timeValue(c.from),b=timeValue(c.to);return a>b?t>=a||t<b:t>=a&&t<b;})||cycles[0];}
export function filterFaq(faqs,category,query){const q=query.trim().toLocaleLowerCase();return faqs.filter(f=>(category==='全部'||f.category===category)&&`${f.q} ${f.a}`.toLocaleLowerCase().includes(q));}
export function validLink(url){try{return new URL(url).protocol==='https:';}catch{return false;}}
export const display=v=>!v||v.includes('TODO')?'待補':v;
export const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
