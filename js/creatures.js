import * as T from 'three';
import {P} from './palette.js?v=20261024115003';
import {group,box,cyl,ball,line} from './primitives.js?v=20261024115003';
import {coastRadius} from './coast.js?v=20261024115003';
import {human,dress,animate} from './people.js?v=20261024115003';
import {CSS2DObject} from 'three/addons/CSS2DRenderer.js';
// ② 動物、狗、廚師與墨爾本電車。座標都是各島的本地座標（島中心為原點，+z 朝南）。
const rand=(a,b)=>a+Math.random()*(b-a);
const blobGeo=new T.CircleGeometry(1,14),blobMat=new T.MeshBasicMaterial({color:P.coffee,transparent:true,opacity:.18,depthWrite:false});
function finish(g,id,r,y){g.traverse(o=>{if(o.isMesh)o.castShadow=false;});const s=new T.Mesh(blobGeo,blobMat);s.rotation.x=-Math.PI/2;s.position.y=.03;s.scale.setScalar(r*.8);g.add(s);
 const hit=new T.Mesh(new T.SphereGeometry(r,8,5),new T.MeshBasicMaterial({visible:false}));hit.position.y=y;hit.userData.creatureId=id;g.add(hit);return hit;}
export const CREATURES={
 peanut:{title:'屁那 Peanut',subtitle:'黃金貴賓｜4 歲',text:'愛跑來跑去，但很怕熱：早上、傍晚到處跑，中午躲到尤加利樹下吐舌頭。'},
 butter:{title:'霸特 Butter',subtitle:'拉布拉多貴賓｜11 歲',text:'最愛曬太陽，太陽移到哪就睡到哪；晚上回屋簷下。'},
 chef:{title:'主廚',subtitle:'廚房實驗室',text:'TODO'},
 tram:{title:'墨爾本電車',subtitle:'熊爸住的城市',text:'TODO'},
 kangaroo:{title:'袋鼠',subtitle:'熊爸家的澳洲鄰居',text:'TODO'},koala:{title:'無尾熊',subtitle:'熊爸家的澳洲鄰居',text:'TODO'},platypus:{title:'鴨嘴獸',subtitle:'熊爸家的澳洲鄰居',text:'TODO'},wombat:{title:'袋熊',subtitle:'熊爸家的澳洲鄰居',text:'TODO'},
 cow:{title:'牛',subtitle:'熟成牧場',text:'TODO'},sheep:{title:'羊',subtitle:'熟成牧場',text:'TODO'},pig:{title:'豬',subtitle:'熟成牧場',text:'TODO'},chicken:{title:'雞',subtitle:'熟成牧場',text:'TODO'}
};

// ---------- 模型 ----------
// 10/24 熊爸：狗看起來偏綠——背光面只吃到偏黃的環境光，白毛暗下來變橄欖色。毛色材質加一點自發光把背光面撐亮；屁那的嘴巴、耳朵照本尊改焦糖杏色。
const PEANUT={fur:'#F6DDBC',ear:'#D9975E',muzzle:'#E3A56E',nose:P.ink},BUTTER={fur:'#FFFAF5',ear:'#F4E6DA',nose:P.nose,earLong:true,sleepy:true};
function dog(parent,{fur,ear,nose,earLong,sleepy,muzzle}){
 const g=group(parent),body=group(g);ball(body,.42,fur,0,.62,0,.85,.8,1.3);
 for(let i=0;i<7;i++)ball(body,.17,fur,Math.sin(i*2.1)*.22,.9+(i%2)*.04,-.35+i*.12);
 const legs=[];for(const [x,z] of [[-.2,.32],[.2,.32],[-.2,-.32],[.2,-.32]]){const l=group(body,x,.45,z);cyl(l,.09,.42,fur,0,-.2,0,6);ball(l,.11,fur,0,-.4,0);legs.push(l);}
 const head=group(body,0,1.02,.55);ball(head,.3,fur,0,0,0);ball(head,.15,muzzle||fur,0,-.07,.27,1,.85,1.1);ball(head,.065,nose,0,-.03,.42);
 for(const x of [-.11,.11])sleepy?box(head,.08,.025,.02,P.ink,x,.06,.28):ball(head,.04,P.ink,x,.06,.27);
 for(const x of [-.28,.28])ball(head,.15,ear,x,earLong?-.2:-.08,-.02,.6,earLong?1.8:1.3,.9);
 ball(head,.19,fur,0,.27,-.03);const collar=cyl(body,.25,.08,P.pink,0,.86,.42,10);collar.rotation.x=1;
 const tongue=box(head,.09,.02,.15,P.pink,0,-.17,.36);tongue.visible=false;
 const tail=group(body,0,.86,-.58);ball(tail,.13,fur,0,.06,-.04);
 const lift=new Map();body.traverse(o=>{if(!o.isMesh||o===tongue)return;const c=o.material.color;if(c.r+c.g+c.b<1.2)return;if(!lift.has(o.material)){const m=o.material.clone();m.emissive.copy(c).multiplyScalar(.28);lift.set(o.material,m);}o.material=lift.get(o.material);});
 return {g,body,head,legs,tail,tongue};
}
function cow(parent,color){const g=group(parent),body=group(g);box(body,.8,.7,1.4,color,0,.95,0);box(body,.82,.3,.5,P.cream,0,1.05,-.2);
 const head=group(body,0,1.15,.8);box(head,.5,.5,.55,color,0,0,0);box(head,.42,.28,.2,P.pink,0,-.15,.3);for(const x of [-.2,.2])box(head,.05,.05,.02,P.ink,x,.08,.28);for(const x of [-.3,.3])box(head,.18,.08,.08,P.cream,x,.25,-.05);
 const legs=[];for(const [x,z] of [[-.27,.5],[.27,.5],[-.27,-.5],[.27,-.5]]){const l=group(body,x,.6,z);box(l,.18,.6,.18,color,0,-.3,0);legs.push(l);}return {g,body,head,legs};}
function sheep(parent){const g=group(parent),body=group(g);for(let i=0;i<6;i++)ball(body,.3,P.butter,Math.sin(i*2.3)*.18,.78+(i%2)*.12,-.3+i*.12);
 const head=group(body,0,.9,.48);ball(head,.2,P.ink,0,0,0,.9,1,1.1);for(const x of [-.19,.19])ball(head,.08,P.ink,x,.02,-.04,1.4,.5,.8);ball(head,.15,P.butter,0,.15,-.05);
 const legs=[];for(const [x,z] of [[-.15,.25],[.15,.25],[-.15,-.25],[.15,-.25]]){const l=group(body,x,.5,z);box(l,.09,.45,.09,P.ink,0,-.23,0);legs.push(l);}return {g,body,head,legs};}
function pig(parent){const g=group(parent),body=group(g);ball(body,.45,P.pink,0,.62,0,.9,.85,1.25);
 const head=group(body,0,.72,.5);ball(head,.28,P.pink,0,0,0);const snout=cyl(head,.13,.12,'#E39AAE',0,-.03,.27,8);snout.rotation.x=Math.PI/2;for(const x of [-.17,.17])ball(head,.1,'#E39AAE',x,.22,0,.8,.9,.4);for(const x of [-.1,.1])ball(head,.035,P.ink,x,.1,.24);
 ball(body,.08,'#E39AAE',0,.75,-.58);const legs=[];for(const [x,z] of [[-.2,.3],[.2,.3],[-.2,-.3],[.2,-.3]]){const l=group(body,x,.35,z);cyl(l,.08,.3,P.pink,0,-.15,0,6);legs.push(l);}return {g,body,head,legs};}
function chicken(parent,color){const g=group(parent),body=group(g);g.scale.setScalar(.75);ball(body,.3,color,0,.5,0,.9,.9,1.1);ball(body,.17,color,0,.55,-.32,.6,1.1,.8);
 const head=group(body,0,.85,.22);ball(head,.17,color,0,0,0);box(head,.07,.06,.14,P.mustard,0,-.02,.18);box(head,.04,.14,.16,P.terra,0,.17,0);box(head,.04,.1,.06,P.terra,0,-.12,.13);for(const x of [-.09,.09])ball(head,.03,P.ink,x,.04,.12);
 const legs=[];for(const x of [-.1,.1]){const l=group(body,x,.25,0);line(l,[0,0,0],[0,-.24,0],P.mustard,.03);legs.push(l);}return {g,body,head,legs};}
function kangaroo(parent,big){const g=group(parent),body=group(g),c='#B98A5E';g.scale.setScalar(big?1:.7);
 const torso=ball(body,.38,c,0,1.0,0,.8,1.35,.85);torso.rotation.x=-.25;ball(body,.3,P.cream,0,.95,.18,.7,1.1,.5);
 const head=group(body,0,1.65,.2);ball(head,.22,c,0,0,0,.85,.9,1.2);ball(head,.11,c,0,-.06,.24,1,.8,1.2);ball(head,.04,P.ink,0,-.03,.36);for(const x of [-.09,.09])ball(head,.035,P.ink,x,.07,.18);for(const x of [-.1,.1]){const ear=ball(head,.1,c,x,.25,-.05,.55,1.7,.4);ear.rotation.z=x*2;}
 if(big){const joey=group(body,0,.9,.33);ball(joey,.11,c,0,0,0);for(const x of [-.05,.05])ball(joey,.03,P.ink,x,.03,.09);}
 for(const x of [-.17,.17]){ball(body,.18,c,x,.48,-.05,.7,1,1.2);box(body,.12,.08,.5,c,x,.05,.15);}for(const x of [-.14,.14])ball(body,.07,c,x,1.15,.33,.7,1.6,.7);
 const tail=line(body,[0,.6,-.25],[0,.08,-1.05],c,.09);return {g,body,head,legs:[],tail};}
function koala(parent){const g=group(parent),body=group(g),c='#9FA3A0';ball(body,.3,c,0,0,0,1,1.15,.9);ball(body,.2,P.cream,0,-.02,.17,.8,1,.4);
 const head=group(body,0,.38,.06);ball(head,.24,c,0,0,0);for(const x of [-.24,.24]){ball(head,.13,c,x,.12,-.02,1,1,.5);ball(head,.08,P.butter,x,.12,.02,1,1,.4);}ball(head,.07,P.ink,0,-.03,.22,.8,1.2,.7);for(const x of [-.09,.09])ball(head,.03,P.ink,x,.06,.2);
 for(const x of [-.22,.22])ball(body,.09,c,x,.1,.25,1,1.6,1);return {g,body,head,legs:[]};}
function platypus(parent){const g=group(parent),body=group(g),c='#7A5A42';ball(body,.28,c,0,0,0,.9,.45,1.4);box(body,.3,.06,.36,P.ink,0,-.02,.48);box(body,.36,.05,.32,c,0,-.02,-.5);for(const x of [-.09,.09])ball(body,.03,P.ink,x,.09,.28);
 return {g,body,head:body,legs:[]};}
function wombat(parent){const g=group(parent),body=group(g),c='#8B7158';ball(body,.42,c,0,.45,0,.95,.8,1.15);const head=group(body,0,.55,.45);ball(head,.26,c,0,0,0,1.05,.9,.9);ball(head,.1,P.ink,0,-.02,.24,1.2,.8,.6);for(const x of [-.17,.17])ball(head,.07,c,x,.2,-.02,.8,1.1,.5);for(const x of [-.1,.1])ball(head,.03,P.ink,x,.07,.21);
 const legs=[];for(const [x,z] of [[-.22,.25],[.22,.25],[-.22,-.25],[.22,-.25]]){const l=group(body,x,.2,z);cyl(l,.09,.2,c,0,-.08,0,6);legs.push(l);}return {g,body,head,legs};}

// ---------- 行為 ----------
// 在一個方框裡慢慢走、停下來吃草（頭上下）。
function wanderer(model,area,{speed=.5,pause=[2,6],hop=0,y=0}={}){
 const a={...model,area,speed,pause:rand(...pause),pauses:pause,hop,y,target:null,phase:Math.random()*9};
 a.g.position.set(rand(area[0],area[1]),y,rand(area[2],area[3]));a.g.rotation.y=rand(0,6.28);
 a.update=(dt,t)=>{let moving=false;
 if(a.pause>0){a.pause-=dt;if(a.head&&a.head!==a.body)a.head.rotation.x=Math.max(0,Math.sin(t*1.3+a.phase))*.5;}
 else{if(!a.target)a.target=new T.Vector3(rand(area[0],area[1]),y,rand(area[2],area[3]));const d=a.target.clone().sub(a.g.position);d.y=0;const len=d.length();
 if(len<.05){a.target=null;a.pause=rand(...a.pauses);}else{const step=Math.min(len,speed*dt);a.g.position.addScaledVector(d.normalize(),step);a.g.rotation.y=Math.atan2(d.x,d.z);moving=true;if(a.head&&a.head!==a.body)a.head.rotation.x*=.9;}}
 const k=t*(hop?6:9)+a.phase;a.legs.forEach((l,i)=>l.rotation.x=moving&&!hop?Math.sin(k+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.5:0);
 a.body.position.y=moving?(hop?Math.abs(Math.sin(k))*hop:Math.abs(Math.sin(k))*.04):0;if(hop)a.body.rotation.x=moving?.5:0;};
 return a;
}
// 依時段換位置的狗：spot(hour) 回傳 {at:[x,z],mode:'run'|'lie'|'pant'|'sleep'}，跑步時沿 loop 繞圈。
function dogActor(model,{spot,loop,speed}){
 const a={...model,mode:'lie',target:null,loopIndex:0,phase:Math.random()*9};let lastKey='';
 a.update=(dt,t,hour)=>{const s=spot(hour);a.g.visible=s.mode!=='away';if(s.mode==='away')return;const key=s.mode+s.at;if(key!==lastKey){lastKey=key;a.target=null;a.arrived=false;if(s.jump)a.g.position.set(s.at[0],a.g.position.y,s.at[1]);}
 let goal;if(s.mode==='run'){goal=loop[a.loopIndex];}else goal=s.at;
 const d=new T.Vector3(goal[0],0,goal[1]).sub(a.g.position);d.y=0;const len=d.length();let moving=false;
 if(len>.08){const v=s.mode==='run'?speed:speed*.4;a.g.position.addScaledVector(d.normalize(),Math.min(len,v*dt));a.g.rotation.y=Math.atan2(d.x,d.z);moving=true;}
 else if(s.mode==='run'){a.loopIndex=(a.loopIndex+1)%loop.length;moving=true;}
 const lying=!moving&&s.mode!=='run'&&s.mode!=='stand',k=t*(s.mode==='run'?13:6)+a.phase;
 a.legs.forEach((l,i)=>l.rotation.x=lying?(i<2?-1.35:1.35):moving?Math.sin(k+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.6:0);
 a.body.position.y=lying?-.32:moving?Math.abs(Math.sin(k))*.06:0;
 const breathe=lying?1+Math.sin(t*(s.mode==='pant'?7:1.6))*.035:1;a.body.scale.set(1,breathe,1);
 a.head.rotation.x=lying&&s.mode==='sleep'?.35:0;a.tongue.visible=s.mode==='pant'&&lying;a.tail.rotation.y=Math.sin(t*(moving||s.wag?16:3))*(s.mode==='sleep'?.05:s.wag?.8:.5);};
 return a;
}

// ---------- 電車軌道（靜態，會被合併繪製） ----------
// 10/23 熊爸：橋加寬、電車走橋的一側，「路線就是循環的在各島中一直繞」：
// 10/23 改：只繞外圈四島 牧場 → 廚房 → 開團廣場 → 圖書館 → 牧場；橋上走外側車道，島上走靠外海那一側的弧線。
const LOOP=['farm','kitchen','market','library'];
export function buildTrack(scene,islands,rails){
 if(!rails?.length)return null;const g=group(scene),pts=[];
 const railBetween=(x,y)=>{const r=rails.find(r=>r.a===x&&r.b===y);if(r)return r.points;const q=rails.find(r=>r.a===y&&r.b===x);return q?q.points.slice().reverse():null;};
 for(let k=0;k<LOOP.length;k++){const here=LOOP[k],next=LOOP[(k+1)%LOOP.length],prev=LOOP[(k+LOOP.length-1)%LOOP.length];
  const inRail=railBetween(prev,here),outRail=railBetween(here,next),I=islands.get(here);if(!inRail||!outRail||!I)return null;
  const E0=inRail.at(-1),E1=outRail[0],c=I.p,y=I.item.height+.45,ang=v=>Math.atan2(v.x-c.x,v.z-c.z);let a0=ang(E0),a1=ang(E1),d=Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0));
  const hub=islands.get('home').p,away=Math.atan2(c.x-hub.x,c.z-hub.z),mid=a0+d/2;if(Math.cos(mid-away)<0)d-=Math.sign(d)*Math.PI*2;
  // 10/23 熊爸：鐵軌不要轉直角、也不要切過島 → 橋的軌道線是外公切線，島上＝直線接到切點＋沿外緣的圓弧＋直線到下一座橋，全程相切。
  const flat=v=>v.setY(0).normalize(),dIn=flat(E0.clone().sub(inRail.at(-3))),dOut=flat(outRail[2].clone().sub(E1));
  const foot=(E,dir)=>{const t=(c.x-E.x)*dir.x+(c.z-E.z)*dir.z;return new T.Vector3(E.x+dir.x*t,y,E.z+dir.z*t);},T0=foot(E0,dIn),T1=foot(E1,dOut),arc=[];
  const straight=(A,B)=>{const L=Math.hypot(B.x-A.x,B.z-A.z),n=Math.max(1,Math.ceil(L/.5));for(let i=1;i<=n;i++)arc.push(new T.Vector3(A.x+(B.x-A.x)*i/n,y,A.z+(B.z-A.z)*i/n));};
  straight(E0,T0);{const t0=Math.atan2(T0.x-c.x,T0.z-c.z),t1=Math.atan2(T1.x-c.x,T1.z-c.z),rad=(Math.hypot(T0.x-c.x,T0.z-c.z)+Math.hypot(T1.x-c.x,T1.z-c.z))/2,hub=islands.get('home').p,away=Math.atan2(c.x-hub.x,c.z-hub.z);let dd=Math.atan2(Math.sin(t1-t0),Math.cos(t1-t0));if(Math.cos(t0+dd/2-away)<0)dd-=Math.sign(dd)*Math.PI*2;
   const n=Math.max(4,Math.ceil(Math.abs(dd)*rad/.4));for(let i=1;i<n;i++){const a=t0+dd*i/n;arc.push(new T.Vector3(c.x+Math.sin(a)*rad,y,c.z+Math.cos(a)*rad));}}
  arc.push(T1.clone());{const L=Math.hypot(E1.x-T1.x,E1.z-T1.z),n=Math.max(1,Math.ceil(L/.5));for(let i=1;i<n;i++)arc.push(new T.Vector3(T1.x+(E1.x-T1.x)*i/n,y,T1.z+(E1.z-T1.z)*i/n));}
  // 島上這一段自己畫軌道（橋上的已經在 scene.js 畫好）
  const seg=[E0,...arc,E1];for(let i=0;i<seg.length-1;i++){const A=seg[i],B=seg[i+1],dir=B.clone().sub(A);dir.y=0;if(dir.lengthSq()<1e-4)continue;dir.normalize();const side=new T.Vector3(dir.z,0,-dir.x);
   for(const o of [-.36,.36])line(g,A.clone().addScaledVector(side,o).setY(A.y-.02).toArray(),B.clone().addScaledVector(side,o).setY(B.y-.02).toArray(),'#7D8784',.045);
   const L=A.distanceTo(B);for(let t=0;t<L;t+=.55){const P0=A.clone().lerp(B,t/L),sl=box(g,1.05,.06,.2,P.darkWood,P0.x,P0.y-.06,P0.z);sl.rotation.y=Math.atan2(dir.x,dir.z);}}
  if(k===0)pts.push(...inRail.slice(Math.floor(inRail.length/2)));
  pts.push(...arc);pts.push(...(k===LOOP.length-1?outRail.slice(0,Math.floor(outRail.length/2)):outRail));}
 const clean=pts.filter((p,i)=>i===0||p.distanceTo(pts[i-1])>.3);const curve=new T.CatmullRomCurve3(clean,true,'centripetal');
 // 牧場的小車站（外圈最西邊）（Flinders Street 黃色圓頂的縮小版，掛時鐘）
 let stopU=0,best=Infinity;const home=islands.get('farm');if(home){const hub=islands.get('home').p;for(let i=0;i<400;i++){const p=curve.getPointAt(i/400),d=-Math.hypot(p.x-hub.x,p.z-hub.z);if(Math.hypot(p.x-home.p.x,p.z-home.p.z)<home.r*.8&&d<best&&Math.abs(p.y-home.item.height-.45)<.05){best=d;stopU=i/400;}}
  const sp=curve.getPointAt(stopU),q=curve.getPointAt((stopU+.002)%1),dir=new T.Vector3(q.x-sp.x,0,q.z-sp.z).normalize(),side=new T.Vector3(dir.z,0,-dir.x),toCenter=new T.Vector3(home.p.x-sp.x,0,home.p.z-sp.z);if(side.dot(toCenter)<0)side.negate();
  const st=group(scene,sp.x+side.x*1.5,home.item.height+.3,sp.z+side.z*1.5);st.rotation.y=Math.atan2(side.x,side.z)+Math.PI;box(st,2.6,.18,1,P.cliff,0,0,0);box(st,1.1,1.3,.8,P.mustard,0,.7,0);ball(st,.62,P.mustard,0,1.45,0,1,.75,1);cyl(st,.05,.4,P.coffee,0,2.05,0,6);
  const clock=cyl(st,.22,.05,P.cream,0,1.12,.43,14);clock.rotation.x=Math.PI/2;box(st,.02,.14,.02,P.ink,0,1.16,.47);box(st,.1,.02,.02,P.ink,.04,1.12,.47);box(st,.7,.6,.06,P.glass,0,.55,.41);}
 return {curve,stopU,length:curve.getLength()};
}
function tram(parent){const g=group(parent),body=group(g),green=P.tram;
 box(body,1.1,.95,3.2,green,0,.95,0);box(body,1.12,.2,3.22,P.cream,0,.72,0);box(body,1.0,.12,3.3,'#E8E0CC',0,1.48,0);const top=cyl(body,.5,3.25,'#E8E0CC',0,1.5,0,10);top.rotation.x=Math.PI/2;top.scale.set(1,1,.35);
 const winMat=new T.MeshStandardMaterial({color:'#B7D5CF',roughness:.6,emissive:'#FFD58A',emissiveIntensity:0});
 for(const s of [-.56,.56])for(let i=0;i<5;i++){const w=new T.Mesh(new T.BoxGeometry(.04,.36,.42),winMat);w.position.set(s,1.17,-1.1+i*.55);body.add(w);}
 for(const z of [-1.61,1.61]){const w=new T.Mesh(new T.BoxGeometry(.7,.36,.04),winMat);w.position.set(0,1.17,z);body.add(w);box(body,.5,.16,.04,P.ink,0,1.43,z*1.005);}
 for(const z of [-1.1,1.1])box(body,.9,.22,.6,P.ink,0,.36,z);line(body,[0,1.7,.4],[0,2.5,-.5],P.ink,.03);line(body,[-.25,2.5,-.5],[.25,2.5,-.5],P.ink,.03);
 return {g,body,winMat};}

// ---------- 全部角色 ----------
export function createCreatures(scene,islands,track,{onCreature,smallScreen,ferry,crossing,peopleNear}){
 const actors=[],hits=[];const at=id=>islands.get(id)?.g;
 function add(actor,id,r=.7,y=.5){actor.id=id;actor.hit=finish(actor.g,id,r,y);hits.push(actor.hit);actors.push(actor);
  if(id==='peanut'||id==='butter'){const el=document.createElement('button');el.type='button';el.className='dog-tag';el.textContent=id==='peanut'?'屁那':'霸特';el.onclick=e=>{e.stopPropagation();onCreature(id);};const wrap=document.createElement('div');wrap.className='npc-anchor';wrap.append(el);const tag=new CSS2DObject(wrap);tag.position.set(0,1.9,0);actor.g.add(tag);actor.tag=tag;}
  return actor;}
 const home=at('home'),farm=at('farm'),kitchen=at('kitchen');
 if(home){
 // 熊爸家：屁那在東邊草地跑圈、中午躲樹蔭；霸特在太陽下睡，晚上回屋簷。
 const peanut=dog(home,PEANUT);peanut.g.scale.setScalar(.82);peanut.g.position.set(6.6,.3,2.4);
 add(dogActor(peanut,{speed:3.2,loop:[[7.6,1.2],[8.2,2.6],[7.4,4.2],[5.9,4.4],[5.5,3],[6.2,1.3]],spot:h=>h>=14&&h<15.5?{mode:'away'}:h>=11&&h<14?{mode:'pant',at:[-3.4,3.9]}:(h>=22||h<5.5)?{mode:'sleep',at:[1.2,1.4]}:{mode:'run',at:'loop'}}),'peanut',.75,.6);
 const butter=dog(home,BUTTER);butter.g.position.set(2.2,.3,7.4);
 add(dogActor(butter,{speed:1.6,loop:[[2.4,2.3]],spot:h=>h>=13&&h<15.5?{mode:'away'}:(h>=19||h<6.5)?{mode:'sleep',at:[2.3,1.1]}:h<11?{mode:'lie',at:[2.2,7.4]}:h<15?{mode:'lie',at:[2.2,7.4]}:{mode:'lie',at:[-3.6,6.6]}}),'butter',.8,.6);
 const help=at('help');if(help){const bv=dog(help,BUTTER);bv.g.position.set(-1.8,.3,5.6);bv.g.rotation.y=2.4;
  add(dogActor(bv,{speed:1,loop:[[-1.8,5.6]],spot:h=>h>=13&&h<15.5?{mode:'lie',at:[-1.8,5.6],jump:true}:{mode:'away'}}),'butter',.8,.6);}
 if(ferry&&ferry.pier){const pv=dog(scene,PEANUT);pv.g.scale.setScalar(.82);const at=ferry.pier;pv.g.position.copy(at);pv.g.rotation.y=ferry.facing;
  add(dogActor(pv,{speed:2,loop:[[at.x,at.z]],spot:h=>h>=14&&h<15.5?{mode:'stand',at:[at.x,at.z],jump:true,wag:ferry.state.phase==='wait'&&ferry.state.from==='market'}:{mode:'away'}}),'peanut',.75,.6);}
 // 澳洲動物
 add(wanderer(kangaroo(home,true),[-8.4,-7.4,1.8,4],{speed:2.2,hop:.55,pause:[2.5,6],y:.3}),'kangaroo',.8,1);
 add(wanderer(kangaroo(home,false),[-8.4,-7.2,1.6,4.2],{speed:2.2,hop:.45,pause:[2,5],y:.3}),'kangaroo',.6,.8);
 const k=koala(home);k.g.position.set(-5.05,2.75,3.05);k.g.rotation.y=.6;add({...k,update:(dt,t)=>{k.head.rotation.z=Math.sin(t*.4)*.15;k.body.rotation.x=Math.sin(t*.25)*.05;}},'koala',.5,0);
 const pl=platypus(home);const plA={...pl,update:(dt,t)=>{const a=t*.45;pl.g.position.set(15.5+Math.sin(a)*1.3,.38-Math.max(0,Math.sin(t*.33))**8*.35,-4.5+Math.cos(a)*1.3);pl.g.rotation.y=a+Math.PI/2;}};add(plA,'platypus',.5,0);
 const wb=wombat(home);add(wanderer(wb,[5.2,7.6,-1.2,.6],{speed:.45,pause:[3,8],y:.3}),'wombat',.6,.5);
 }
 if(farm){
 // 熟成牧場：右邊圍欄牛羊、左邊圍欄豬雞（籬笆 x -6..6、z -5..4，中間隔板 x=0 只到 z=-1）
 for(const [i,c] of ['#2F2A28','#A0573E'].entries())add(wanderer(cow(farm,c),[1,5,-.3,3.2],{speed:.35,pause:[4,9],y:.3}),'cow',.9,.9);
 for(let i=0;i<2;i++)add(wanderer(sheep(farm),[.8,4.6,-.6,3.2],{speed:.4,pause:[3,7],y:.3}),'sheep',.6,.7);
 for(let i=0;i<2;i++)add(wanderer(pig(farm),[-4.4,-1.6,1,3.3],{speed:.35,pause:[4,10],y:.3}),'pig',.6,.6);
 for(let i=0;i<4;i++)add(wanderer(chicken(farm,i%2?P.butter:P.mustard),[-5.4,-.8,.4,3.5],{speed:1.4,pause:[.6,2.5],y:.3}),'chicken',.4,.4);
 }
 if(kitchen){
 // 廚房實驗室：主廚在中島後面左右走、翻鍋。
 const c=human(kitchen,{shirt:P.butter,apron:P.coffee,pants:'#4B5553',hair:P.coffee,hat:P.butter});c.g.position.set(0,.4,.1);
 // 10/23 換成跟島上其他人同款的模型（頭頂加白色廚師帽）
 c.id='chef';dress(c,'character-male-b',m=>{const head=m.getObjectByName('head');if(!head)return;const white=new T.MeshLambertMaterial({color:'#FFFFFF',flatShading:true});const band=new T.Mesh(new T.CylinderGeometry(.2,.2,.1,10),white);band.position.y=.38;head.add(band);const puff=new T.Mesh(new T.SphereGeometry(.24,10,6),white);puff.scale.set(1,.62,1);puff.position.y=.5;head.add(puff);});
 add({...c,update:(dt,t)=>{const x=Math.sin(t*.35)*2.1,dx=Math.cos(t*.35);c.g.position.x=x;const walking=Math.abs(dx)>.25;c.g.rotation.y=walking?(dx>0?Math.PI/2:-Math.PI/2):0;if(animate(c,walking,dt,.9))return;const s=walking?Math.sin(t*6)*.4:0;c.legs[0].rotation.x=s;c.legs[1].rotation.x=-s;c.arms[0].rotation.x=walking?-s*.6:-1.2+Math.sin(t*5)*.25;c.arms[1].rotation.x=walking?s*.6:-1.2;}},'chef',.8,1.1);
 }
 // 平交道：柵欄兩支（電車接近且沒人要過才放下）＋叉叉標誌
 const trams=[];let bars=null;if(crossing&&track){const c=crossing.point,side=new T.Vector3(crossing.dir.z,0,-crossing.dir.x),tan=track.curve.getTangentAt(crossing.u).setY(0).normalize();bars=[];
  for(const sd of [-1,1]){const at=c.clone().addScaledVector(crossing.dir,sd*1.8).addScaledVector(side,sd*1.05);const post=group(scene,at.x,c.y-.1,at.z);cyl(post,.07,1.5,P.butter,0,.75,0,6);box(post,.24,.3,.1,P.terra,0,1.35,0);const sign=group(post,0,1.75,0);for(const r of [.6,-.6]){const x=box(sign,.75,.12,.04,P.butter,0,0,0);x.rotation.z=r;}
   const arm=group(post,0,1.05,0);arm.rotation.y=Math.atan2(-side.x*sd,-side.z*sd);const bar=group(arm);for(let i=0;i<5;i++)box(bar,.08,.08,.36,i%2?P.terra:P.butter,0,0,.2+i*.36);bar.rotation.x=-Math.PI/2*.95;post.traverse(o=>{if(o.isMesh)o.castShadow=false;});bars.push(bar);}}
 const ahead=u=>track?((crossing.u-u)%1+1)%1*track.length:Infinity;
 if(track)for(const start of [0,.5]){const m=tram(scene);let u=(track.stopU+start+.02)%1,wait=0,lastStop=-9;const speed=3.6/track.length;trams.push(()=>u);
 add({...m,update:(dt,t,hour)=>{const yieldNow=crossing&&ahead(u)>0&&ahead(u)<4.5&&peopleNear?.(crossing.point,3);if(yieldNow){}else if(wait>0)wait-=dt;else{const prev=u;u=(u+speed*dt)%1;const crossed=prev<=track.stopU&&u>track.stopU||prev>u&&(track.stopU>prev||track.stopU<u);if(crossed&&t-lastStop>5){u=track.stopU;wait=3;lastStop=t;}}
 const p=track.curve.getPointAt(u),q=track.curve.getPointAt((u+.002)%1);m.g.position.copy(p);m.g.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);m.winMat.emissiveIntensity=(hour>=18.5||hour<6)?.9:0;}},'tram',1.6,1);}
 // 10/23 熊爸：天空要有鳥在飛，海裡隨機出現鯨魚、海豚（不可點）。
 const sky=[];for(let f=0;f<2;f++){const flock=group(scene),c=f?[-20,24,-10]:[25,20,-5],R=f?38:30;for(let i=0;i<5;i++){const bird=group(flock),wings=[];ball(bird,.32,P.butter,0,0,0,.7,.6,1.4);box(bird,.12,.1,.2,P.mustard,0,0,.48);for(const sd of [-1,1]){const w=group(bird,sd*.15,0,0);box(w,.9,.05,.4,P.butter,sd*.45,0,0);wings.push(w);}bird.position.set((i%3-1)*2.2,(i%2)*.8,-Math.floor(i/2)*1.6);sky.push({bird,wings,phase:i*1.3+f});}
  sky.push({flock,c,R,speed:f?.07:.09,phase:f*2});}
 sky.forEach(o=>o.bird?.traverse(m=>{if(m.isMesh)m.castShadow=false;}));
 const SPOTS=[[-62,8],[-30,-62],[60,-50],[80,10],[10,52],[-40,48],[45,40],[-75,-25]];
 function whale(){const g=group(scene),body=group(g),c='#5D6F93';ball(body,1.6,c,0,0,0,1,.7,2.6);ball(body,1.1,'#D9DDE8',0,-.35,.6,1,.5,2);const tail=group(body,0,.1,-4);box(tail,3,.15,.9,c,0,0,-.3);ball(body,.12,P.ink,.9,.25,2.6);ball(body,.12,P.ink,-.9,.25,2.6);
  const spout=new T.Mesh(new T.ConeGeometry(.5,3,8,1,true),new T.MeshBasicMaterial({color:'#F4FBFF',transparent:true,opacity:0,depthWrite:false}));spout.position.set(0,2.4,1.6);body.add(spout);g.traverse(m=>{if(m.isMesh)m.castShadow=false;});g.visible=false;return {g,body,tail,spout,t:0,life:0};}
 function dolphin(){const g=group(scene),c='#7E95B5';ball(g,.45,c,0,0,0,.6,.6,1.8);box(g,.08,.45,.4,c,0,.4,-.1);box(g,.9,.06,.35,c,0,0,-.85);ball(g,.15,c,0,-.05,.85,1,.8,1.6);g.traverse(m=>{if(m.isMesh)m.castShadow=false;});g.visible=false;return g;}
 const W=whale(),pod=[dolphin(),dolphin(),dolphin()],forced=new URLSearchParams(location.search).get('sea');let nextSea=forced?1:4,podState=null;
 function seaEvent(){const [x,z]=forced?[40,26]:SPOTS[Math.floor(Math.random()*SPOTS.length)],heading=Math.random()*Math.PI*2;
  if(forced?forced==='whale':Math.random()<.45){W.g.position.set(x,-6,z);W.g.rotation.y=heading;W.g.visible=true;W.t=forced?3.6:0;W.life=9;}
  else podState={x,z,heading,t:0,life:7};}
 function updateSea(dt,t){nextSea-=dt;if(nextSea<=0&&!W.g.visible&&!podState){seaEvent();nextSea=rand(10,22);}
  if(W.g.visible){W.t+=dt;const k=W.t/W.life,rise=Math.sin(Math.min(1,k)*Math.PI);W.g.position.y=-6+rise*2.7;W.g.position.addScaledVector(new T.Vector3(Math.sin(W.g.rotation.y),0,Math.cos(W.g.rotation.y)),dt*.9);W.tail.rotation.x=Math.sin(t*1.6)*.25;W.body.rotation.x=k>.75?(k-.75)*1.6:0;
   W.spout.material.opacity=k>.25&&k<.55?.75*Math.sin((k-.25)/.3*Math.PI):0;W.spout.scale.set(1,.6+Math.sin(t*9)*.15,1);if(k>=1)W.g.visible=false;}
  if(podState){podState.t+=dt;const S=podState,dir=new T.Vector3(Math.sin(S.heading),0,Math.cos(S.heading));pod.forEach((d,i)=>{const tt=S.t-i*.35;if(tt<0||tt>S.life){d.visible=false;return;}d.visible=true;const jump=(tt%1.6)/1.6,y=-4.6+Math.sin(jump*Math.PI)*2.4;d.position.set(S.x+dir.x*tt*4+i*1.2*dir.z,y,S.z+dir.z*tt*4-i*1.2*dir.x);d.rotation.set(-Math.cos(jump*Math.PI)*.9,S.heading,0,'YXZ');});if(S.t>S.life+1){pod.forEach(d=>d.visible=false);podState=null;}}}
 return {actors,hits,
 update(dt,t,hour){for(const a of actors){a.update(dt,t,hour);if(a.tag)a.tag.visible=a.g.visible;}
  if(bars){const near=trams.some(f=>{const d=ahead(f());return d<7||d>track.length-2.5;})&&!peopleNear?.(crossing.point,3);for(const b of bars){const goal=near?0:-Math.PI/2*.95;b.rotation.x+=(goal-b.rotation.x)*Math.min(1,dt*3);}}
  for(const o of sky){if(o.flock){const a=t*o.speed+o.phase;o.flock.position.set(o.c[0]+Math.cos(a)*o.R,o.c[1]+Math.sin(t*.3+o.phase)*1.5,o.c[2]+Math.sin(a)*o.R);o.flock.rotation.y=-a;}else o.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*Math.sin(t*7+o.phase)*.6);}
  updateSea(dt,t);},
 activate(id){onCreature(id);},
 find(id){return actors.find(a=>a.id===id);}};
}
