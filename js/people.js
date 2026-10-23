import * as T from 'three';
import {CSS2DObject} from 'three/addons/CSS2DRenderer.js';
import {P} from './palette.js?v=20261023135513';
import {group,box,cyl,ball,mesh,mat} from './primitives.js?v=20261023135513';
import {shortest} from './world.js?v=20261023135513';
import {GLTFLoader} from 'three/addons/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/SkeletonUtils.js';
// 10/23 熊爸：人太粗糙 → 換成 Kenney Mini Characters（CC0，assets/people/License.txt），內建 idle／walk 動作。
// 模型載入前（或 ?oldpeople）先用下面程式拼的人，載好再換掉。
const loader=new GLTFLoader(),models={},MODEL_SCALE=2.8,useModels=!new URLSearchParams(location.search).has('oldpeople');
function loadModel(name){return models[name]??=loader.loadAsync(`assets/people/${name}.glb`);}
// 換色：Kenney 模型共用一張 512×512 色票（32 寬 × 128 高一格漸層）。規則＝[哪個 mesh, 來源格左上 x, y, 新顏色]，
// 可選第 5、6 個值＝頂點高度範圍（模型原始座標，身高約 0.78），用來分開同色的上衣跟褲子。
// 把符合的頂點 UV 搬到色票上方沒用到的黑色區，畫成新顏色（保留原本的明暗漸層）。
const RECOLOR={
 // 熊爸（10/23 熊爸 Google 相簿 3/13 自拍）：淺棕挑染側分、白 T，島上照舊穿咖啡色圍裙
 'bear-dad':[['head-mesh',352,384,'#B07E52'],['body-mesh',32,384,'#F3EFE7',.19,1],['body-mesh',32,384,'#4B5553',-1,.19],['body-mesh',288,384,'#6E4E36'],['body-mesh',288,256,'#6E4E36']],
 // 熊老闆（10/23 熊爸給的照片）：深咖啡長髮、淺色牛仔襯衫、膚色偏白
 'bear-boss':[['head-mesh',416,384,'#3A2B25'],['head-mesh',352,384,'#3A2B25'],['',480,384,'#F7D9C4'],['',448,384,'#F7D9C4'],['body-mesh',160,256,'#A7C3D9'],['body-mesh',32,384,'#93B1CA'],['body-mesh',96,384,'#86A4BE'],['body-mesh',224,384,'#93B1CA'],['body-mesh',352,256,'#4A5466'],['body-mesh',480,256,'#5B4636']]};
function recolor(model,rules){let map=null;model.traverse(o=>{if(o.isMesh&&!map)map=o.material.map;});if(!map?.image)return;
 const W=map.image.width,c=document.createElement('canvas');c.width=W;c.height=W;const x=c.getContext('2d');x.drawImage(map.image,0,0);const src=x.getImageData(0,0,W,W).data;
 const lum=i=>.3*src[i]+.59*src[i+1]+.11*src[i+2];const target=new T.Color();const slots=[];
 rules.forEach(([,bx,by,color],k)=>{const dx=64+32*(k%14),dy=128*Math.floor(k/14);slots.push([dx,dy]);target.set(color);const tc=target.clone().convertLinearToSRGB();
  let mean=0;for(let r=0;r<128;r++)mean+=lum(((by+r)*W+bx+16)*4);mean/=128;
  for(let r=0;r<128;r++){const k2=Math.min(1.25,lum(((by+r)*W+bx+16)*4)/mean);x.fillStyle=`rgb(${Math.min(255,tc.r*255*k2)},${Math.min(255,tc.g*255*k2)},${Math.min(255,tc.b*255*k2)})`;x.fillRect(dx,dy+r,32,1);}});
 const tex=new T.CanvasTexture(c);tex.flipY=false;tex.colorSpace=map.colorSpace;tex.magFilter=map.magFilter;tex.minFilter=map.minFilter;
 model.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();const uv=o.geometry.attributes.uv,pos=o.geometry.attributes.position;
  for(let i=0;i<uv.count;i++){const px=Math.floor(uv.getX(i)*W),py=Math.floor(uv.getY(i)*W);let done=false;rules.forEach(([mesh,bx,by,,y0=-1,y1=9],k)=>{if(done||(mesh&&mesh!==o.name)||px<bx||px>=bx+32||py<by||py>=by+128||pos.getY(i)<y0||pos.getY(i)>=y1)return;done=true;const [dx,dy]=slots[k];uv.setXY(i,(dx+px-bx+.5)/W,(dy+py-by+.5)/W);});}
  uv.needsUpdate=true;o.material=o.material.clone();o.material.map=tex;});}
export function dress(actor,name){if(!useModels||!name)return;loadModel(name).then(gltf=>{const m=cloneSkinned(gltf.scene);m.scale.setScalar(MODEL_SCALE);m.traverse(o=>{if(o.isMesh){o.castShadow=false;o.frustumCulled=false;}});if(RECOLOR[actor.id])recolor(m,RECOLOR[actor.id]);actor.body.visible=false;actor.g.add(m);
 const mixer=new T.AnimationMixer(m),action=n=>mixer.clipAction(T.AnimationClip.findByName(gltf.animations,n));actor.anim={mixer,idle:action('idle'),walk:action('walk'),w:0};actor.anim.idle.play();actor.anim.walk.play();actor.anim.walk.setEffectiveWeight(0);}).catch(e=>console.warn('人物模型載入失敗，沿用程式人物',e));}
const faceGeo=new T.SphereGeometry(.39,8,5),hairGeo=new T.SphereGeometry(.405,8,3,0,Math.PI*2,0,Math.PI*.62),eyeGeo=new T.CircleGeometry(.03,6);
export function human(parent,style){const g=group(parent),body=group(g),skin='#E4B68E';
 const shadow=new T.Mesh(new T.CircleGeometry(.43,12),new T.MeshBasicMaterial({color:P.coffee,transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;g.add(shadow);
 const head=mesh(body,faceGeo,skin,0,1.69,0);mesh(body,hairGeo,style.hair,0,1.74,-.025);box(body,.52,.15,.16,style.hair,0,1.94,.23);
 for(const x of [-.13,.13])mesh(body,eyeGeo,P.ink,x,1.73,.371);box(body,.08,.08,.09,skin,0,1.6,.393);
 box(body,.53,.67,.36,style.shirt,0,1.03,0);box(body,.46,.48,.04,style.apron||style.shirt,0,.96,.21);
 const legs=[],arms=[];for(const x of [-.15,.15]){const leg=group(body,x,.73,0);box(leg,.19,.58,.22,style.pants,0,-.3,0);box(leg,.22,.13,.36,P.cream,0,-.63,.07);legs.push(leg);
 const arm=group(body,Math.sign(x)*.38,1.31,0);box(arm,.15,.49,.17,style.shirt,0,-.23,0);box(arm,.14,.16,.15,skin,0,-.5,0);arms.push(arm);}
 if(style.long){box(body,.66,.78,.22,style.hair,0,1.5,-.2);for(const x of [-.31,.31])box(body,.12,.62,.3,style.hair,x,1.56,-.02);}
 if(style.hat){cyl(body,.27,.42,style.hat,0,2.2,0,10);ball(body,.33,style.hat,0,2.45,0,1,.55,1);}
 if(style.cap){box(body,.69,.14,.65,style.cap,0,2.07,0);box(body,.47,.15,.42,style.cap,0,2.2,-.04);}
 if(style.bag)box(arms[1],.38,.45,.17,P.pink,.04,-.78,.1);
 g.traverse(o=>{if(o.isMesh)o.castShadow=false;});return {g,body,legs,arms};
}
export function createPeople(scene,walkGraph,{onGuest,onHost,smallScreen,ferry}){
 const actors=[],root=group(scene),weighted=Object.fromEntries(Object.entries(walkGraph).map(([id,edges])=>[id,Object.fromEntries(edges.map(e=>[e.to,e.length]))]));
 const configs=[
 {id:'bear-dad',name:'熊爸',model:'character-male-d',logo:'assets/brand/AC-logo-black.png',home:'home',destinations:['kitchen','library','farm','market','home'],style:{shirt:P.cream,apron:P.coffee,pants:'#4B5553',hair:P.coffee}},
 {id:'bear-boss',name:'熊老闆',model:'character-female-f',logo:'assets/brand/01_狗頭.svg',home:'market',destinations:['home','farm','library','market','kitchen'],style:{shirt:P.sage,apron:P.darkWood,pants:P.coffee,hair:'#6B5843',long:true}},
 ...Array.from({length:6},(_,i)=>({id:`guest-${i+1}`,home:['market','library','kitchen','farm','market','home'][i],destinations:[['library','market','kitchen'],['market','help','market','home','library'],['market','farm','kitchen'],['home','market','farm'],['kitchen','library','market'],['farm','market','help','market','home']][i],guest:true,model:['character-female-b','character-male-f','character-female-d','character-male-a','character-female-e','character-male-e'][i],style:{shirt:[P.pink,P.sage,P.mustard,P.cream,P.terra,P.sage][i],pants:[P.coffee,'#4B5553'][i%2],hair:[P.coffee,'#6B5843','#91735B'][i%3],bag:i%2===0,cap:i===2?P.mustard:null}}))
 ];
 function route(from,to){const ids=shortest(weighted,from,to),legs=[];let points=[];const add=list=>{for(const p of list)if(!points.length||points.at(-1).distanceToSquared(p)>.0001)points.push(p.clone());};
 for(let i=1;i<ids.length;i++){const edge=walkGraph[ids[i-1]].find(e=>e.to===ids[i]);add(edge.points);if(edge.ferry){legs.push({walk:points},{ferry:edge.ferry});points=[];add(edge.land);}}if(points.length)legs.push({walk:points});return legs;}
 for(const [i,config] of configs.entries()){
 const actor={...human(root,config.style),...config,island:config.home,route:[],segment:0,progress:0,pause:2+i*.8,trip:0,speed:config.guest?1.1+(i%3)*.12:1.18,phase:i*.9};
 dress(actor,config.model);actor.g.position.copy(walkGraph[config.home][0].points[0]);actor.g.rotation.y=.4+i*.6;
 const anchor=document.createElement('div');anchor.className='npc-anchor';const b=document.createElement('button');b.type='button';b.dataset.npc=config.id;
 if(config.guest){b.className='guest-marker';b.setAttribute('aria-label','查看客人的分享');b.title='客人的分享';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>';b.onclick=e=>{e.stopPropagation();onGuest(config.id);};}
 else{b.className='host-marker';b.setAttribute('aria-label',`查看${config.name}的故事`);b.innerHTML=`<img src="${config.logo}" alt="${config.name==='熊爸'?'AC':'ButSoCool'} Logo"><span>${config.name}</span>`;b.onclick=e=>{e.stopPropagation();onHost(config.id);};}
 b.addEventListener('pointerenter',()=>{actor.pause=Math.max(actor.pause,2);});b.addEventListener('focus',()=>{actor.pause=Math.max(actor.pause,8);});b.addEventListener('pointerdown',()=>{actor.pause=Math.max(actor.pause,8);});
 anchor.append(b);const marker=new CSS2DObject(anchor);marker.position.set(0,config.style.cap?2.95:2.75,0);actor.g.add(marker);actor.marker=b;actor.label=marker;actor.anchor=anchor;
 // The hit body is generous enough for a tap without changing the model's silhouette.
 const hit=new T.Mesh(new T.SphereGeometry(.8,8,5),new T.MeshBasicMaterial({visible:false}));hit.position.y=1.1;hit.userData.npcId=config.id;actor.g.add(hit);actor.hit=hit;actors.push(actor);
 }
 let lastSmall=null;
 function update(dt,now,camera,selectedIsland){
 const small=smallScreen();if(small!==lastSmall){for(const [i,a] of actors.entries()){a.enabled=!a.guest||!small||i<5;a.g.visible=a.enabled;a.label.visible=a.enabled;a.marker.hidden=!a.enabled;a.anchor.style.display=a.enabled?'':'none';}lastSmall=small;}
 for(const a of actors){if(!a.enabled)continue;
 let walking=false;
 if(a.pause>0){a.pause-=dt;}else{
 if(!a.route.length&&!a.ride){if(!a.plan?.length){const target=a.destinations[a.trip++%a.destinations.length];a.plan=route(a.island,target);a.destination=target;}const leg=a.plan.shift();if(leg?.ferry)a.ride={...leg.ferry,aboard:false,offset:new T.Vector3((Math.random()-.5)*1.4,0,(Math.random()-.5)*2)};else if(leg)a.route=leg.walk;a.segment=0;a.progress=0;}
 if(a.ride&&ferry){const F=ferry.state;if(!a.ride.aboard){if(F.phase==='wait'&&F.from===a.ride.from&&F.t<3)a.ride.aboard=true;}else{const o=a.ride.offset.clone().applyAxisAngle(new T.Vector3(0,1,0),ferry.boat.rotation.y);a.g.position.copy(ferry.boat.position).add(o).setY(ferry.boat.position.y+1.35);if(F.phase==='wait'&&F.from===a.ride.to){a.ride=null;}}}
 let remaining=a.ride?0:dt*a.speed;
 while(remaining>0&&a.segment<a.route.length-1){const A=a.route[a.segment],B=a.route[a.segment+1],length=A.distanceTo(B),available=length-a.progress,step=Math.min(available,remaining);a.progress+=step;remaining-=step;
 a.g.position.lerpVectors(A,B,length?a.progress/length:1);const dir=B.clone().sub(A);if(dir.lengthSq()>.0001)a.g.rotation.y=Math.atan2(dir.x,dir.z);walking=true;
 if(a.progress>=length-.00001){a.segment++;a.progress=0;}}
 if(a.route.length&&a.segment>=a.route.length-1){a.route=[];if(!a.plan?.length){a.island=a.destination;a.pause=2.5+(a.trip%3);}}
 }
 if(a.anim){const A=a.anim;A.w+=((walking?1:0)-A.w)*Math.min(1,dt*8);A.walk.setEffectiveWeight(A.w);A.idle.setEffectiveWeight(1-A.w);A.walk.timeScale=a.speed*.9;A.mixer.update(dt);}
 const swing=walking?Math.sin(now*a.speed*6+a.phase)*.45:0;a.legs[0].rotation.x=swing;a.legs[1].rotation.x=-swing;a.arms[0].rotation.x=-swing*.65;a.arms[1].rotation.x=swing*.65;a.body.position.y=walking?Math.abs(Math.sin(now*a.speed*6+a.phase))*.045:0;
 // Keep the ordinary customer circles quiet in the panorama, readable when nearby.
 const distance=camera.position.distanceTo(a.g.position);a.anchor.style.visibility=(!a.guest||distance<230||selectedIsland===a.island)?'visible':'hidden';
 }
 }
 function layout(camera,occupied){
 for(const a of actors){if(!a.enabled||a.anchor.style.visibility==='hidden')continue;const b=a.marker,p=a.label.getWorldPosition(new T.Vector3()).project(camera),w=b.offsetWidth,h=b.offsetHeight,x=(p.x+1)*innerWidth/2,y=(-p.y+1)*innerHeight/2-5;let dx=T.MathUtils.clamp(x,w/2+8,innerWidth-w/2-8)-x,dy=0;
 const overlaps=()=>occupied.some(o=>Math.abs(x+dx-o.x)<(w+o.w)/2+5&&Math.abs(y+dy-o.y)<(h+o.h)/2+5);
 for(let i=0;i<10&&overlaps();i++)dy=-(i+1)*(h+5);
 dy=T.MathUtils.clamp(y+dy,85,innerHeight-80)-y;b.style.transform=`translate(${dx}px,${dy-5}px)`;occupied.push({x:x+dx,y:y+dy,w,h});
 }
 }
 function find(id){return actors.find(a=>a.id===id);}
 // 一道菜串聯：讓某個人依序走過幾座島（走完回到平常的行程）
 function walkPath(id,ids){const a=find(id);if(!a)return;let cur=a.island;const plan=[];for(const to of ids){if(to!==cur)plan.push(...route(cur,to));cur=to;}a.plan=plan;a.route=[];a.ride=null;a.pause=0;a.destination=ids.at(-1);}
 return {update,layout,find,walkPath,hits:actors.map(a=>a.hit),activate(id){const a=find(id);if(a?.guest)onGuest(id);else if(a)onHost(id);},pause(id,seconds=8){const a=find(id);if(a)a.pause=seconds;},actors};
}
