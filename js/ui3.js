import {escapeHTML as esc,display,validLink} from './content.js?v=20261023135513';
import {PERIODS,periodOf} from './env.js?v=20261023135513';
import {CREATURES} from './creatures.js?v=20261023135513';
// ③ 介面：入口頁、24 小時時間軸、開團時間軸、清單搜尋。
const $=s=>document.querySelector(s);
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};

// ---------- 入口頁 ----------
export function createEntry({onEnter,onList}){
 const el=$('#entry'),btn=$('#entry-go'),paws=[...el.querySelectorAll('.paws i')];let ready=false,pct=0;
 const q=new URLSearchParams(location.search),skip=q.has('skip')||store.get('butisland-visited')==='1'&&!q.has('entry');
 function progress(p){pct=Math.max(pct,Math.round(p));paws.forEach((paw,i)=>paw.classList.toggle('on',pct>=(i+1)*100/paws.length));if(!ready)btn.textContent=`上島中… ${pct}%`;}
 function done(){ready=true;progress(100);btn.disabled=false;btn.textContent='上島 →';if(skip)enter(true);}
 function enter(instant){store.set('butisland-visited','1');el.classList.add(instant?'gone':'leaving');document.body.classList.remove('entry-open');setTimeout(()=>el.classList.add('gone'),instant?0:600);onEnter();}
 btn.onclick=()=>ready&&enter(false);$('#entry-list').onclick=()=>{store.set('butisland-visited','1');el.classList.add('gone');document.body.classList.remove('entry-open');onList();};
 for(const dog of el.querySelectorAll('.entry-dog'))dog.onclick=()=>{dog.classList.remove('wag');void dog.offsetWidth;dog.classList.add('wag');};
 function open(){el.classList.remove('gone','leaving');document.body.classList.add('entry-open');}
 if(!skip)document.body.classList.add('entry-open');else el.classList.add('gone');
 return {progress,done,open};
}

// ---------- 24 小時時間軸 ----------
export function createClock(map){
 const range=$('#hour'),label=$('#hour-label'),play=$('#hour-play');let playing=false,last=0;
 $('#periods').innerHTML=PERIODS.map(([n,h])=>`<button type="button" data-h="${h+.5}" style="left:${(h/24*100).toFixed(2)}%">${n}</button>`).join('');
 const fmt=h=>`${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')}`;
 let hour=9.5;function set(h){h=((h%24)+24)%24;hour=h;range.value=h;label.textContent=`${fmt(h)}・${periodOf(h)}`;map.setHour(h);document.body.dataset.night=(h>=19||h<5.5)?'1':'0';}
 range.oninput=()=>set(Number(range.value));
 for(const b of document.querySelectorAll('#periods button'))b.onclick=()=>set(Number(b.dataset.h));
 function tick(now){if(!playing)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;set(hour+dt*(24/240));requestAnimationFrame(tick);}
 play.onclick=()=>{playing=!playing;play.classList.toggle('on',playing);play.setAttribute('aria-label',playing?'暫停時間':'播放一天');last=0;if(playing)requestAnimationFrame(tick);};
 // 10/23 熊爸：時刻表平常收起來，點 ⇆ 左右展開
 const dock=$('#dock'),toggle=$('#dock-toggle');const open=on=>{dock.classList.toggle('collapsed',!on);toggle.setAttribute('aria-expanded',String(on));toggle.setAttribute('aria-label',on?'收起時間軸':'展開時間軸');};toggle.onclick=()=>open(dock.classList.contains('collapsed'));$('#hour-label').onclick=()=>open(true);if(new URLSearchParams(location.search).has('dock'))open(true);
 const q=new URLSearchParams(location.search).get('t');set(q?Number(q):9.5);
 {const q=new URLSearchParams(location.search);if(!q.has('t')||q.has('play'))play.click();}
 return {set};
}

// ---------- 開團時間軸 ----------
const STEPS=[{id:'teaser',name:'預告',note:'下一團的預告・待補',islands:['home','library']},{id:'open',name:'開團',note:'正在開團・待補',islands:['market','kitchen']},{id:'close',name:'截單',note:'截單時間・待補',islands:['market']},{id:'arrive',name:'到貨',note:'到貨與取貨・待補',islands:['market','help']}];
export function createSaleline(map,status){
 const root=$('#saleline');root.innerHTML=STEPS.map(s=>`<button type="button" data-step="${s.id}">${s.name}</button>`).join('<i></i>');
 for(const b of root.querySelectorAll('button'))b.onclick=()=>{const s=STEPS.find(x=>x.id===b.dataset.step),on=!b.classList.contains('on');root.querySelectorAll('button').forEach(x=>x.classList.toggle('on',on&&x===b));map.highlight(on?s.islands:[]);const sign=document.querySelector('.model-sign.market-sign');if(sign)sign.textContent=on?`${s.name}・待補`:'開團資料・待補';if(on)status(`${s.name}：${s.note}`);};
}

// ---------- 清單＋搜尋 ----------
export function createList({data,profiles,onIsland,onHost,onCreature,onFlow}){
 const panel=$('#list-panel'),input=$('#list-search'),out=$('#list-results');
 const entries=[];
 for(const i of data.islands){entries.push({kind:'island',id:i.id,title:`${i.number} ${i.name}`,sub:i.subtitle,text:`${i.name} ${i.subtitle} ${i.region}`});
  for(const it of i.items)entries.push({kind:'item',id:i.id,title:it.name,sub:i.name,text:`${it.name} ${i.name}`});}
 const names=Object.fromEntries(data.islands.map(i=>[i.id,i.name]));for(const f of data.flows||[])entries.push({kind:'flow',id:f.id,title:f.dish,sub:f.path.map(id=>names[id]).join(' → '),text:`${f.dish} ${f.path.map(id=>names[id]).join(' ')}`});
 for(const [id,p] of Object.entries(profiles))entries.push({kind:'host',id,title:p.name,sub:'島上的主人',text:p.name});
 for(const [id,c] of Object.entries(CREATURES))entries.push({kind:'creature',id,title:c.title,sub:c.subtitle,text:`${c.title} ${c.subtitle}`});
 function render(){const q=input.value.trim().toLocaleLowerCase();const hit=entries.filter(e=>!q||e.text.toLocaleLowerCase().includes(q));
  const groups=[['island','小島'],['flow','一道菜串聯（熊爸走一趟）'],['item','島上的內容'],['host','人物'],['creature','動物與電車']];
  out.innerHTML=groups.map(([k,name])=>{const list=hit.filter(e=>e.kind===k);if(!list.length)return '';return `<h3>${name}</h3>`+list.map(e=>`<button type="button" data-kind="${e.kind}" data-id="${esc(e.id)}"><b>${esc(e.title)}</b><small>${esc(e.sub)}</small></button>`).join('');}).join('')||'<p class="empty">找不到「'+esc(input.value)+'」</p>';}
 out.onclick=e=>{const b=e.target.closest('button');if(!b)return;close();const {kind,id}=b.dataset;if(kind==='island'||kind==='item')onIsland(id);else if(kind==='host')onHost(id);else if(kind==='flow')onFlow(id);else onCreature(id);};
 input.oninput=render;render();
 function open(){panel.hidden=false;document.body.classList.add('list-open');$('#list-toggle').setAttribute('aria-expanded','true');setTimeout(()=>input.focus({preventScroll:true}),50);}
 function close(){panel.hidden=true;document.body.classList.remove('list-open');$('#list-toggle').setAttribute('aria-expanded','false');}
 $('#list-toggle').onclick=()=>panel.hidden?open():close();$('#list-close').onclick=close;
 return {open,close};
}
