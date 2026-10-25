import * as T from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/CSS2DRenderer.js';
import {P} from './palette.js?v=20261025111804';
import {R,axial,BRIDGES} from './world.js?v=20261025111804';
import {group,box,cyl,ball,line,path,tree,umbrella,mat,roof} from './primitives.js?v=20261025111804';
import {islandBase,builders} from './models.js?v=20261025111804';
import {coastRadius,coastline,coastBand,surface,bulges} from './coast.js?v=20261025111804';
import {createPeople} from './people.js?v=20261025111804';
import {buildTrack,createCreatures} from './creatures.js?v=20261025111804';
import {batchScenery} from './static-scene.js?v=20261025111804';
import {createEnvironment} from './env.js?v=20261025111804';
export function createScene(data,onSelect,onGuest,onHost,onCreature){
 const stage=document.querySelector('#stage'),labelRoot=document.querySelector('#labels');
 const mobile=()=>innerWidth<=600;
 const scene=new T.Scene();scene.background=new T.Color('#EED8C6');scene.fog=new T.Fog('#E9D4C6',210,420);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.5:2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=!mobile();renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.setClearColor('#EED8C6');stage.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.setSize(innerWidth,innerHeight);labels.domElement.style.position='absolute';labels.domElement.style.inset='0';labels.domElement.style.pointerEvents='none';labelRoot.append(labels.domElement);
 const camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.1,1100);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.455;controls.minPolarAngle=.18;controls.minDistance=18;controls.maxDistance=850;controls.enablePan=true;controls.target.set(15,0,0);controls.mouseButtons={LEFT:T.MOUSE.ROTATE,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.PAN};controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_PAN};
 const hemi=new T.HemisphereLight('#FFF0DD','#B49BB4',2.4);scene.add(hemi);const sun=new T.DirectionalLight('#FFE4C4',3);sun.position.set(-40,75,35);sun.castShadow=!mobile();sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:100,top:60,bottom:-60,near:1,far:180});sun.shadow.bias=-.001;sun.shadow.normalBias=.15;sun.shadow.radius=4;scene.add(sun);scene.add(sun.target);
 const sea=new T.Mesh(new T.PlaneGeometry(1800,1800),new T.MeshStandardMaterial({color:P.deepSea,roughness:1}));sea.rotation.x=-Math.PI/2;sea.position.y=-4;sea.receiveShadow=true;scene.add(sea);
 // 10/23 熊爸：外圈四座橋往島的外側平移，橋頭落在外緣，電車軌道才順。
 const rOf=id=>id==='help'?9:id==='home'?R*1.95:id==='farm'||id==='library'?R*1.22:id==='kitchen'?R*1.1:R,seedOf=id=>Number(data.islands.find(v=>v.id===id).number)*1.37,posOf=id=>axial(data.islands.find(v=>v.id===id).axial);
 const edgeAlong=(id,sx,sz,dx,dz)=>{let t=0;for(;t<rOf(id)*1.6;t+=.05){const x=sx+dx*t,z=sz+dz*t;if(Math.hypot(x,z)>coastRadius(Math.atan2(x,z),rOf(id),seedOf(id),id)*.97)break;}return t;};
 function bridgeGeom(a,b){const A=posOf(a),B=posOf(b),dx=B.x-A.x,dz=B.z-A.z,d=Math.hypot(dx,dz),ux=dx/d,uz=dz/d,angle=Math.atan2(ux,uz),hub=posOf('home'),ring=a!=='home'&&b!=='home',lx=Math.cos(angle),lz=-Math.sin(angle),out=(lx*((A.x+B.x)/2-hub.x)+lz*((A.z+B.z)/2-hub.z))>=0?1:-1,s=ring?(R*.74-1.1)*out:0,ox=lx*s,oz=lz*s,edgeA=edgeAlong(a,ox,oz,ux,uz),edgeB=edgeAlong(b,ox,oz,-ux,-uz);return {d,ux,uz,angle,ring,out,ox,oz,edgeA,edgeB,length:d-edgeA-edgeB};}
 // The ferry docks face each other across open water.
 const dockAngle=id=>{if(id==='market')return Math.PI*.76;const other=id==='help'?'market':null;if(!other)return null;const a=axial(data.islands.find(v=>v.id===id).axial),b=axial(data.islands.find(v=>v.id===other).axial);return Math.atan2(b.x-a.x,b.z-a.z);};
 const map=new T.Group();scene.add(map);const islands=new Map(),clickables=[],labelItems=[],walkGraph={};
 const contact=(parent,w,d,x=0,z=0,opacity=.12)=>{const m=new T.Mesh(new T.CircleGeometry(1,28),new T.MeshBasicMaterial({color:'#4F3B4E',transparent:true,opacity,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.305,z);m.scale.set(w,d,1);parent.add(m);return m;};
 const texture=new T.TextureLoader().load('assets/brand/01_狗頭.png');texture.colorSpace=T.SRGBColorSpace;
 // 外圈橋頭（軌道下橋處）海岸往外推 22%，讓下橋後有足夠的草地
 for(const [a,b] of BRIDGES){if(a==='home'||b==='home')continue;const G=bridgeGeom(a,b);for(const [id,sx,sz] of [[a,G.ox+G.ux*G.edgeA,G.oz+G.uz*G.edgeA],[b,G.ox-G.ux*G.edgeB,G.oz-G.uz*G.edgeB]]){const out=G.out,lx=Math.cos(G.angle)*out*1.1,lz=-Math.sin(G.angle)*out*1.1;(bulges[id]||=[]).push([Math.atan2(sx+lx,sz+lz),.38]);}}
 for(const item of data.islands){const p=axial(item.axial),g=group(map,p.x,item.height,p.z);g.userData.islandId=item.id;const r=rOf(item.id);
 const seed=Number(item.number)*1.37;const landings=BRIDGES.filter(pair=>pair.includes(item.id)).map(([a,b])=>{const G=bridgeGeom(a,b);return a===item.id?Math.atan2(G.ox+G.ux*G.edgeA,G.oz+G.uz*G.edgeA):Math.atan2(G.ox-G.ux*G.edgeB,G.oz-G.uz*G.edgeB);});const ferry=dockAngle(item.id);if(ferry!==null)landings.push(ferry);const land=islandBase(g,r,item.height,item.color,seed,{id:item.id,landings});const content=group(g);if(item.id==='market')content.scale.set(.78,1,1);const result=builders[item.model](content,Object.keys(data.posts||{}).filter(k=>!k.startsWith('sample')).length);const pads={home:[7.5,5.2,.2,-1.2],market:[7.2,5.6,0,-1],farm:[7,5.5,0,-.5],kitchen:[7,5.2,0,-.8],library:[6.5,5.4,0,-1],help:[4.7,4.2,0,-.2]},pad=pads[item.id];if(pad)contact(g,...pad,.105);
 // A wider, invisible hit surface also makes grass edges easy to tap.
 const hit=new T.Mesh(surface(land.points,.31),new T.MeshBasicMaterial({visible:false}));hit.userData.islandId=item.id;g.add(hit);clickables.push(hit);
 const ring=new T.Mesh(coastBand(land.points,1.18,1.22,-3.7,-3.7),new T.MeshBasicMaterial({color:P.pink,side:T.DoubleSide,transparent:true,opacity:.9}));ring.visible=false;g.add(ring);
 const outer=document.createElement('div');outer.className='label-anchor';outer.style.width='0';outer.style.height='0';const b=document.createElement('button');b.className='island-label';b.dataset.island=item.id;b.setAttribute('aria-label',`探索${item.name}`);b.innerHTML=`<b>${item.number}</b><span>${item.name}</span><span class="arrow">↗</span>`;b.onclick=e=>{e.stopPropagation();onSelect(item.id);};outer.append(b);
 const label=new CSS2DObject(outer);label.position.set(0,.5,r*.7);g.add(label);labelItems.push({label,button:b,id:item.id});
 if(result.logo){const m=new T.Mesh(new T.PlaneGeometry(result.logoSize||.7,result.logoSize||.7),new T.MeshBasicMaterial({map:texture,transparent:true}));m.position.set(...result.logo);g.add(m);}
 if(result.sign){const div=document.createElement('div');div.className='model-sign'+(item.id==='market'?' market-sign':'');div.textContent=item.id==='help'?'熊小幫':'開團資料・待補';const sign=new CSS2DObject(div);sign.position.set(result.sign[0]*(item.id==='market'?.78:1),result.sign[1],result.sign[2]*(1));g.add(sign);}
 islands.set(item.id,{g,p,item,ring,r,seed,landings});walkGraph[item.id]=[];
 }
 const rails=[];
 // Bridges end at each independently shaped coast, with real water between islands.
 for(const [a,b] of BRIDGES){const A=islands.get(a),B=islands.get(b);const dx=B.p.x-A.p.x,dz=B.p.z-A.p.z,d=Math.hypot(dx,dz),ux=dx/d,uz=dz/d,angle=Math.atan2(ux,uz);
 const G=bridgeGeom(a,b),edgeA=G.edgeA,edgeB=G.edgeB,length=G.length;
 const bridge=group(map,A.p.x+G.ox+ux*(edgeA+length/2),0,A.p.z+G.oz+uz*(edgeA+length/2));bridge.rotation.y=angle;const count=Math.ceil(length/.4);
 const ring=G.ring,out=G.out,LANE=1.1*out,WALK=-out;
 const bow=0;
 const deckAt=t=>{const arc=bow*Math.sin(Math.PI*t);return {x:-ux*arc,z:(t-.5)*length+uz*arc,y:T.MathUtils.lerp(A.item.height,B.item.height,t)+.28+Math.sin(t*Math.PI)*.7,heading:Math.atan2(-ux*bow*Math.PI*Math.cos(Math.PI*t),length+uz*bow*Math.PI*Math.cos(Math.PI*t))};};
 const railAt=(t,side)=>{const p=deckAt(t);return [p.x+Math.cos(p.heading)*side,p.y+1,p.z-Math.sin(p.heading)*side];};
 // 10/23 熊爸：橋改成參考影片的石橋——灰紫石板橋面、兩側矮牆加城垛、粗石墩。
 for(let i=0;i<=count;i++){const t=i/count,p=deckAt(t),next=deckAt(Math.min(1,t+1/count)),len=Math.hypot(next.x-p.x,next.z-p.z)||length/count;const slab=box(bridge,4.4,.3,len*1.02,i%3?P.stone:P.stoneLight,p.x,p.y-.07,p.z);slab.rotation.y=p.heading;
 for(const side of [-2.15,2.15]){const at=railAt(t,side);const wall=box(bridge,.24,.5,len*1.04,P.stoneDark,at[0],p.y+.3,at[2]);wall.rotation.y=p.heading;if(i%3===0){const m=box(bridge,.3,.28,.34,P.stoneDark,at[0],p.y+.68,at[2]);m.rotation.y=p.heading;}}
 if(ring&&i<count){for(const s of [LANE-.36,LANE+.36]){const r0=railAt(t,s),r1=railAt((i+1)/count,s);line(bridge,[r0[0],p.y+.13,r0[2]],[r1[0],next.y+.13,r1[2]],'#7D8784',.045);}if(i%2===0){const c=railAt(t,LANE),sl=box(bridge,1.05,.06,.2,P.darkWood,c[0],p.y+.1,c[2]);sl.rotation.y=p.heading;}}
 if(ring&&i%9===4){const at=railAt(t,2.0*out);cyl(bridge,.06,2.8,'#5E6B67',at[0],p.y+1.5,at[2],6);const arm=railAt(t,LANE);line(bridge,[at[0],p.y+2.8,at[2]],[arm[0],p.y+2.8,arm[2]],'#5E6B67',.03);}}
 bridge.updateMatrixWorld(true);if(ring)rails.push({a,b,points:Array.from({length:count+1},(_,i)=>{const c=railAt(i/count,LANE),p=deckAt(i/count);return bridge.localToWorld(new T.Vector3(c[0],p.y+.15,c[2]));})});
 // 10/23 熊爸：橋墩改成半圓拱形石墩——每一跨是一面開半圓拱門的石牆。
 const spans=Math.max(3,Math.round(length/5.5));for(let i=0;i<spans;i++){const A0=deckAt(i/spans),A1=deckAt((i+1)/spans),dx=A1.x-A0.x,dz=A1.z-A0.z,Ls=Math.hypot(dx,dz),top=Math.min(A0.y,A1.y)-.2,r=Math.min(Ls/2-.45,top+2.6),yb=top-r-.35;
  const sh=new T.Shape();sh.moveTo(0,-4.3);sh.lineTo(Ls,-4.3);sh.lineTo(Ls,top);sh.lineTo(0,top);sh.closePath();const hole=new T.Path();hole.moveTo(Ls/2-r,-4.1);hole.lineTo(Ls/2-r,yb);hole.absarc(Ls/2,yb,r,Math.PI,0,true);hole.lineTo(Ls/2+r,-4.1);hole.closePath();sh.holes.push(hole);
  const geo=new T.ExtrudeGeometry(sh,{depth:4,bevelEnabled:false,curveSegments:10});geo.translate(0,0,-2);const arch=new T.Mesh(geo,mat(i%2?P.stoneDark:P.stone));arch.position.set(A0.x,0,A0.z);arch.rotation.y=Math.atan2(-dz,dx);arch.castShadow=arch.receiveShadow=true;bridge.add(arch);const shade=new T.Mesh(new T.CircleGeometry(1,20),new T.MeshBasicMaterial({color:'#40515B',transparent:true,opacity:.16,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.position.set((A0.x+A1.x)/2,-3.96,(A0.z+A1.z)/2);shade.scale.set(Math.max(1.2,Ls*.38),1.45,1);bridge.add(shade);}

 const approaches={};
 for(const I of [A,B]){const sign=I===A?1:-1,edge=I===A?edgeA:edgeB,ex=ux*edge*sign+G.ox+Math.cos(angle)*WALK*1.1,ez=uz*edge*sign+G.oz-Math.sin(angle)*WALK*1.1;const theta=Math.atan2(ex,ez),steps=Math.max(1,Math.ceil(Math.abs(theta)/.28));const roadRadius=a=>Math.min(I.item.id==='farm'?9.2:I.item.id==='home'?14.2:6.9,coastRadius(a,I.r,I.seed,I.item.id)*.77);let lastPoint=[0,roadRadius(0)];const route=[[0,3.6],lastPoint];path(I.g,[0,3.6],lastPoint,1.35);for(let j=1;j<=steps;j++){const a=theta*j/steps,next=[Math.sin(a)*roadRadius(a),Math.cos(a)*roadRadius(a)];path(I.g,lastPoint,next,1.35);route.push(next);lastPoint=next;}const pre=[ex-ux*sign*4.5,ez-uz*sign*4.5];path(I.g,lastPoint,pre,1.35);path(I.g,pre,[ex,ez],1.35);route.push(pre,[ex,ez]);approaches[I.item.id]=route.map(([x,z])=>new T.Vector3(I.p.x+x,I.item.height+.41,I.p.z+z));}
 const crossing=Array.from({length:count+1},(_,i)=>{const p=deckAt(i/count),w=railAt(i/count,WALK*1.1);return bridge.localToWorld(new T.Vector3(w[0],p.y+.11,w[2]));});
 const route=[...approaches[a],...crossing,...approaches[b].slice().reverse()];let routeLength=0;for(let i=1;i<route.length;i++)routeLength+=route[i-1].distanceTo(route[i]);walkGraph[a].push({to:b,points:route,length:routeLength});walkGraph[b].push({to:a,points:route.slice().reverse(),length:routeLength});
 }
 // Place a generous front path rather than cutting through the buildings.
 for(const {g} of islands.values())path(g,[-2,3.6],[2,3.6],1.6);
 function dock(id){const I=islands.get(id),a=dockAngle(id),e=coastRadius(a,I.r,I.seed,I.item.id)*.95,g=group(I.g,Math.sin(a)*e,-.15,Math.cos(a)*e);g.rotation.y=a;for(let i=0;i<10;i++)box(g,2.4,.14,.36,P.wood,0,0,-.6+i*.42);for(const x of [-1.05,1.05])for(const z of [.3,3])cyl(g,.12,4.5,P.darkWood,x,-1.2,z,8);box(g,1.6,.15,1.4,P.wood,1.9,0,2.6);docks[id]=g;}
 const docks={};dock('market');dock('help');
 // Bay shores remain distant and hazy; decoration is never clickable.
 const distance=group(scene,0,-4,0);
 for(let i=0;i<18;i++){const a=Math.PI*.96+i*Math.PI/18,r=300+(i%3)*25,x=Math.cos(a)*r,z=Math.sin(a)*r-35;ball(distance,30,P.grassDark,x,1,z,1.3,.22,1);for(let j=0;j<4;j++)tree(distance,x-12+j*7,z+Math.sin(j*3)*7,.8+(i%3)*.2,true);if(i%4===0){box(distance,2.7,2,2.7,P.cream,x,4,z+12);const top=cyl(distance,2.1,1.8,P.terra,x,5.8,z+12,4,0);top.rotation.y=Math.PI/4;}}
 // Small sand-and-grass islands, beach umbrellas, rock seals and distant windmill.
 const decorations=[[-55,31,4],[-43,-45,4.5],[71,35,4.5],[104,-28,3],[-72,-8,2.2],[55,-64,3.6]];
 for(const [x0,z0,r] of decorations){const x=x0*1.3,z=z0*1.3,g=group(scene,x,-3.5,z);const shore=coastline(r,x*.1);const ground=new T.Mesh(surface(shore,.55),new T.MeshStandardMaterial({color:P.grass}));g.add(ground);const sand=new T.Mesh(coastBand(shore,1,1.2,.55,.05),new T.MeshStandardMaterial({color:'#DDCEAC',side:T.DoubleSide}));g.add(sand);if(x===-55){for(let i=0;i<3;i++)umbrella(g,-1.6+i*1.6,0,[P.pink,P.mustard,P.sage][i]);}else if(x===-43&&z===-45){cyl(g,.55,3,P.cream,0,2,0,8,1);const rotor=group(g,0,3,-.7);for(let i=0;i<4;i++){const blade=box(rotor,.2,2.9,.08,P.wood,0,0,0);blade.rotation.z=i*Math.PI/2;}}else if(x===71){ball(g,1.5,P.cliffDark,0,1,0);for(let i=0;i<2;i++){ball(g,.5,P.coffee,-.5+i,2,0,1,.5,1.8);ball(g,.27,P.coffee,-.5+i,2.4,.6);}}else if(x===104){cyl(g,.55,2.3,P.cream,0,1.8,0,8);cyl(g,.7,.45,P.terra,0,3.05,0,8);}else tree(g,0,0,.8);}
 // A tiny sailboat and a buoy, still in section ①.
 const sail=group(scene,100,-3.5,-34);const hull=ball(sail,1,P.cream,0,.2,0,1.7,.35,.65);cyl(sail,.04,3,P.darkWood,0,1.6,0,6);const shape=new T.Shape();shape.moveTo(.08,.7);shape.lineTo(.08,2.9);shape.lineTo(1.4,.7);shape.closePath();const sm=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshStandardMaterial({color:P.pink,side:T.DoubleSide}));sail.add(sm);cyl(scene,.3,1,P.mustard,90,-3.3,28,10);
 // Broad clouds with no frame loop animation in this first section.
 for(const [x,y,z] of [[-50,28,-65],[25,32,-85],[90,27,-55]]){const c=group(scene,x,y,z);for(let i=0;i<4;i++)ball(c,3.5,P.cream,i*3.7,Math.sin(i)*1.2,0,1.2,.6,.7);}
 // Foreground grass is below the islands; its edge acts as a frame.
 const near=group(scene,-48,-4,58);ball(near,22,'#E2D4AE',0,-2,0,1,.14,1);tree(near,0,2,1.7,true);tree(near,12,1,1.3,true);
 const track=buildTrack(scene,islands,rails);
 // 10/23 熊爸：開團廣場牌樓 → 東北角碼頭的石板步道；跟鐵軌交叉處是平交道（電車讓人先過）。
 let crossing=null,marketWalk=null;{const M=islands.get('market');if(M){const a=dockAngle('market'),e=coastRadius(a,M.r,M.seed,'market')*.95,base=[Math.sin(a)*e*.86,Math.cos(a)*e*.86],gate=[4.6,-.5];path(M.g,gate,base,1.5);marketWalk={gate,base};
  if(track){M.g.updateMatrixWorld(true);const A=M.g.localToWorld(new T.Vector3(gate[0],0,gate[1])),B=M.g.localToWorld(new T.Vector3(base[0],0,base[1])),ab=new T.Vector3(B.x-A.x,0,B.z-A.z),L2=ab.lengthSq();let best=Infinity;
   for(let i=0;i<1200;i++){const u=i/1200,p=track.curve.getPointAt(u),t=T.MathUtils.clamp(((p.x-A.x)*ab.x+(p.z-A.z)*ab.z)/L2,0,1),d=Math.hypot(p.x-A.x-ab.x*t,p.z-A.z-ab.z*t);if(d<best){best=d;crossing={point:p.clone(),u,dir:ab.clone().normalize()};}}
   if(crossing&&best<1.5){const c=crossing.point,pl=box(scene,1.9,.07,1.9,P.wood,c.x,c.y-.03,c.z);pl.rotation.y=Math.atan2(crossing.dir.x,crossing.dir.z);}else crossing=null;}}}
 // 10/23 熊爸：每座島都要有高低分布的樹 → 在建築圈外、海岸內補樹，避開橋頭／碼頭方向、鐵軌與彼此。
 {const trackPts=track?track.curve.getSpacedPoints(600):[];for(const [id,I] of islands){let rnd=I.seed*9973;const rand=()=>(rnd=(rnd*16807)%2147483647)/2147483647;const inner=id==='home'?16:id==='help'?4.6:id==='farm'?10.4:6.8,placed=[];
  for(let k=0;k<160&&placed.length<(id==='home'?16:id==='help'?7:12);k++){const a=rand()*Math.PI*2,coast=coastRadius(a,I.r,I.seed,id)*.84;if(coast<inner+.8)continue;const rr=inner+rand()*(coast-inner),x=Math.sin(a)*rr,z=Math.cos(a)*rr,w=new T.Vector3(I.p.x+x,0,I.p.z+z);
   if(I.landings.some(l=>Math.abs(Math.atan2(Math.sin(a-l),Math.cos(a-l)))<.42))continue;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.35)continue;
   if(trackPts.some(t=>Math.hypot(t.x-w.x,t.z-w.z)<2.4))continue;if(id==='home'&&[[2.2,7.4],[-3.6,6.6],[2.3,1.1],[7,2.8],[15.5,-4.5],[17.5,-4.5],[13.5,-4.5],[-11.5,-4]].some(([dx,dz])=>Math.hypot(dx-x,dz-z)<3.6))continue;const sc=.55+rand()*1.05;if(placed.some(q=>Math.hypot(q[0]-x,q[1]-z)<1.6*(q[2]+sc)))continue;placed.push([x,z,sc]);tree(I.g,x,z,sc,rand()<.35);}}}
 batchScenery(scene);
 let tween=null,selected=null,dirty=true,overviewDist=150;
 // ③ 渡輪：開團廣場碼頭 ↔ 熊小幫碼頭，開 8 秒、靠岸 4 秒。
 const tip=id=>docks[id].localToWorld(new T.Vector3(4.4,0,2.2)).setY(-3.72);
 const ferry=group(scene);ball(ferry,1,P.cream,0,.25,0,.75,.32,1.7);box(ferry,1.2,.12,2.4,P.wood,0,.5,0);cyl(ferry,.05,3,P.darkWood,0,2,0,6);box(ferry,.9,.6,.8,P.wall,0,.85,-.6);
 {const sailTex=new T.TextureLoader().load('assets/brand/01_狗頭.png');sailTex.colorSpace=T.SRGBColorSpace;const sh=new T.Shape();sh.moveTo(0,.8);sh.lineTo(0,3.3);sh.lineTo(1.5,.8);sh.closePath();const sg=new T.ShapeGeometry(sh);const sail=new T.Mesh(sg,new T.MeshStandardMaterial({color:P.cream,side:T.DoubleSide,flatShading:true}));sail.rotation.y=Math.PI/2;sail.position.z=.05;ferry.add(sail);const logo=new T.Mesh(new T.PlaneGeometry(.75,.75),new T.MeshBasicMaterial({map:sailTex,transparent:true,side:T.DoubleSide}));logo.rotation.y=Math.PI/2;logo.position.set(.04,1.55,.45);ferry.add(logo);}
 box(ferry,1.1,.5,1,P.wall,0,1.4,-.6);box(ferry,1.35,.14,1.25,P.terra,0,1.72,-.6);for(const sd of [-.62,.62]){const ring=cyl(ferry,.2,.06,P.terra,sd,.75,.4,10);ring.rotation.z=Math.PI/2;}ferry.scale.setScalar(2.4);ferry.traverse(o=>{if(o.isMesh)o.castShadow=false;});const ferryState={from:'market',to:'help',phase:'wait',t:0,ride:null};ferry.position.copy(tip('market'));
 function updateFerry(dt){const F=ferryState,A=tip(F.from),B=tip(F.to);F.t+=dt;
  if(F.phase==='wait'){ferry.position.copy(A);if(F.t>(F.ride?.5:4)){F.phase='go';F.t=0;}}
  else{const k=Math.min(1,F.t/(F.ride?5.5:8)),e=k*k*(3-2*k);ferry.position.lerpVectors(A,B,e);ferry.position.y=-3.72+Math.sin(F.t*2.4)*.06;ferry.rotation.y=Math.atan2(B.x-A.x,B.z-A.z);ferry.rotation.z=Math.sin(F.t*1.7)*.04;
   if(k>=1){const done=F.ride;[F.from,F.to]=[F.to,F.from];F.phase='wait';F.t=0;F.ride=null;if(done)done();}}
  if(F.ride){const target=ferry.position.clone().setY(0);const offset=new T.Vector3(mobile()?10:14,mobile()?16:14,mobile()?20:18);controls.target.lerp(target,.08);camera.position.lerp(target.clone().add(offset),.06);}}
 function ride(done){tween=null;ferryState.from='market';ferryState.to='help';ferryState.phase='wait';ferryState.t=0;ferryState.ride=()=>{focus('help');done();};const t=tip('market').setY(0);move(t,t.clone().add(new T.Vector3(14,14,18)),900);}
 function skipRide(){if(!ferryState.ride)return;const done=ferryState.ride;ferryState.ride=null;ferryState.from='help';ferryState.to='market';ferryState.phase='wait';ferryState.t=0;done();}
 const helpIsland=islands.get('help');const env=createEnvironment(scene,{hemi,sun,renderer,sea,lighthouse:helpIsland?helpIsland.g.localToWorld(new T.Vector3(2,5.4,-1.5)):null});let hour=9.5;env.apply(hour);
 // 10/23 熊爸：讓人可以上船真的過去再回來 → 開團廣場 ↔ 客服島 加一條「渡輪」走法：走到碼頭、等船、上船、到岸下船。
 {const pier=id=>{const I=islands.get(id),a=dockAngle(id),e=coastRadius(a,I.r,I.seed,I.item.id)*.95;return [new T.Vector3(Math.sin(a)*e*.62,0,Math.cos(a)*e*.62),docks[id].localToWorld(new T.Vector3(0,.2,1.2)),docks[id].localToWorld(new T.Vector3(1.9,.2,2.6))];};
  const local=(id,x,z)=>islands.get(id).g.localToWorld(new T.Vector3(x,.41,z));
  const M=islands.get('market'),Hh=islands.get('help');if(M&&Hh){const ma=dockAngle('market'),side=[Math.sin(ma+.9)*R*.62,Math.cos(ma+.9)*R*.62];
  const toMarketPier=[local('market',0,3.6),local('market',...(marketWalk?.gate||side)),...(marketWalk?[local('market',...marketWalk.base)]:[local('market',pier('market')[0].x,pier('market')[0].z)]),...pier('market').slice(1)];
  const toHelpPier=[local('help',-1,5.5),local('help',pier('help')[0].x,pier('help')[0].z),...pier('help').slice(1)];
  walkGraph.market.push({to:'help',ferry:{from:'market',to:'help'},points:toMarketPier,land:toHelpPier.slice().reverse(),length:70});
  walkGraph.help=walkGraph.help||[];walkGraph.help.push({to:'market',ferry:{from:'help',to:'market'},points:toHelpPier,land:toMarketPier.slice().reverse(),length:70});}}
 const people=createPeople(scene,walkGraph,{ferry:{state:ferryState,boat:ferry},onGuest:id=>{people.pause(id);focusPerson(id);onGuest(id);},onHost:id=>{people.pause(id);focusPerson(id);onHost(id);},smallScreen:mobile});
 const creatures=createCreatures(scene,islands,track,{onCreature:id=>{focusCreature(id);onCreature(id);},smallScreen:mobile,crossing,peopleNear:(p,r)=>people.actors.some(a=>a.enabled&&a.g.visible&&Math.hypot(a.g.position.x-p.x,a.g.position.z-p.z)<r),ferry:{state:ferryState,pier:docks.market.localToWorld(new T.Vector3(.4,.3,2.2)),facing:dockAngle('market')}});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function move(target,position,duration=1200){tween={start:performance.now(),duration:reduced?0:duration,fromTarget:controls.target.clone(),toTarget:target.clone(),fromPosition:camera.position.clone(),toPosition:position.clone()};dirty=true;}
 const query=new URLSearchParams(location.search),fixedCam=query.get('cam')?.split(',').map(Number);
 function overview(animate=true){if(fixedCam?.length===6){camera.position.set(...fixedCam.slice(0,3));controls.target.set(...fixedCam.slice(3));controls.update();dirty=true;return;}selected=null;for(const I of islands.values())I.ring.visible=false;labelItems.forEach(l=>l.button.classList.remove('selected'));
 const xs=[...islands.values()].map(I=>I.p.x),zs=[...islands.values()].map(I=>I.p.z);const target=new T.Vector3((Math.min(...xs)+Math.max(...xs))/2,mobile()?9:0,(Math.min(...zs)+Math.max(...zs))/2),direction=new T.Vector3(mobile()?1.15:.28,mobile()?1.15:.42,mobile()?.8:1).normalize();
 const right=new T.Vector3(direction.z,0,-direction.x).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize();
 let halfW=0,halfH=0;for(const I of islands.values())for(let k=0;k<8;k++){const a=k*Math.PI/4,v=new T.Vector3(I.p.x+Math.sin(a)*I.r*1.4,0,I.p.z+Math.cos(a)*I.r*1.4).sub(target);halfW=Math.max(halfW,Math.abs(v.dot(right)));halfH=Math.max(halfH,Math.abs(v.dot(up)));}
 const tan=Math.tan(T.MathUtils.degToRad(camera.fov/2)),aspect=innerWidth/innerHeight,dist=Math.max(halfW/(tan*aspect)*1.2,halfH/tan*1.5,120);overviewDist=dist;const pos=target.clone().add(direction.multiplyScalar(dist));scene.fog.near=Math.max(260,dist*1.1);scene.fog.far=Math.max(700,dist*3);

 if(animate)move(target,pos);else{controls.target.copy(target);camera.position.copy(pos);controls.update();}dirty=true;}
 function focus(id){const I=islands.get(id);if(!I)return;selected=id;scene.fog.near=210;scene.fog.far=420;for(const v of islands.values())v.ring.visible=v===I;labelItems.forEach(l=>l.button.classList.toggle('selected',l.id===id));
 const target=new T.Vector3(I.p.x,I.item.height,I.p.z);const offset=new T.Vector3(mobile()?12:18,mobile()?28:28,mobile()?34:35);if(mobile()){if(id==='home'||id==='market')offset.set(7,45,28).multiplyScalar(1.65);else offset.multiplyScalar(1.3);}if(!mobile())target.x+=5;else{target.z+=5;target.x+=1.5;}move(target,target.clone().add(offset));}
 function focusPerson(id){const actor=people.find(id);if(!actor)return;selected=actor.island;for(const v of islands.values())v.ring.visible=false;const target=actor.g.position.clone();if(mobile())target.z+=2;else target.x+=3;const offset=new T.Vector3(mobile()?8:10,mobile()?17:18,mobile()?21:22);move(target,target.clone().add(offset));}
 function focusCreature(id){const c=creatures.find(id);if(!c)return;selected=null;for(const v of islands.values())v.ring.visible=false;const target=c.g.getWorldPosition(new T.Vector3());const offset=new T.Vector3(mobile()?8:10,mobile()?15:14,mobile()?19:18);move(target,target.clone().add(offset));}
 const pointer=new T.Vector2(),raycaster=new T.Raycaster();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};tween=null;});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(down.x-e.clientX,down.y-e.clientY)>7)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...people.hits.filter(h=>h.parent.visible),...creatures.hits,...clickables],false)[0];if(hit){if(hit.object.userData.npcId)people.activate(hit.object.userData.npcId);else if(hit.object.userData.creatureId)creatures.activate(hit.object.userData.creatureId);else onSelect(hit.object.userData.islandId);}down=null;});
 // 10/23 熊爸選 1：拉近到全景距離的 65% 以內，標籤縮成號碼／頭像小圓點；滑鼠移上去或手機點一下才展開名字（再點一下才進去）。
 function placeLabels(){document.body.classList.toggle('labels-compact',camera.position.distanceTo(controls.target)<overviewDist*.65);const occupied=[];for(const obj of labelItems){const world=obj.label.getWorldPosition(new T.Vector3()).project(camera);const b=obj.button;const visible=world.z>-1&&world.z<1&&Math.abs(world.x)<1.15&&Math.abs(world.y)<1.15&&(!selected||selected===obj.id);b.style.visibility=visible?'visible':'hidden';if(!visible)continue;const w=b.offsetWidth,h=b.offsetHeight;let x=(world.x+1)*innerWidth/2,y=(-world.y+1)*innerHeight/2;let dx=T.MathUtils.clamp(x,8+w/2,innerWidth-8-w/2)-x,dy=0;
 const collisions=(cx,cy)=>occupied.some(o=>Math.abs(cx-o.x)<(w+o.w)/2+5&&Math.abs(cy-o.y)<(h+o.h)/2+5);
 for(let j=0;j<12&&collisions(x+dx,y+dy);j++)dy=(j%2?1:-1)*Math.ceil((j+1)/2)*(h+6);
 dy=T.MathUtils.clamp(y+dy,95,innerHeight-95)-y;occupied.push({x:x+dx,y:y+dy,w,h});b.style.marginLeft=`${dx}px`;b.style.marginTop=`${dy}px`;}people.layout(camera,occupied);}
 let last=0,lastTime=0;
 function frame(now){requestAnimationFrame(frame);if(document.hidden)return;if(now-last<(mobile()?1000/30:1000/60)-1)return;last=now;const dt=lastTime?Math.min((now-lastTime)/1000,.3):0;lastTime=now;people.update(dt,now/1000,camera,selected);creatures.update(dt,now/1000,hour,camera,selected);updateFerry(dt);env.update(dt);
 if(tween){dirty=true;let t=tween.duration?Math.min(1,(now-tween.start)/tween.duration):1;t=t*t*(3-2*t);camera.position.lerpVectors(tween.fromPosition,tween.toPosition,t);controls.target.lerpVectors(tween.fromTarget,tween.toTarget,t);if(t>=1)tween=null;}
 const changed=controls.update();if(changed||tween||dirty||people.actors.length){renderer.render(scene,camera);labels.render(scene,camera);placeLabels();dirty=false;}}
 function resize(){renderer.shadowMap.enabled=!mobile();renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.5:2));camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);labels.setSize(innerWidth,innerHeight);if(!selected)overview(false);else focus(selected);}
 const touchOnly=matchMedia('(hover: none)');let peekTimer=0;
 labelRoot.addEventListener('click',e=>{const b=e.target.closest('.island-label,.host-marker,.dog-tag');if(!b||!touchOnly.matches||!document.body.classList.contains('labels-compact')||b.classList.contains('peek')||b.classList.contains('selected'))return;e.preventDefault();e.stopPropagation();labelRoot.querySelectorAll('.peek').forEach(x=>x.classList.remove('peek'));b.classList.add('peek');clearTimeout(peekTimer);peekTimer=setTimeout(()=>b.classList.remove('peek'),3500);dirty=true;},true);
 addEventListener('resize',resize);controls.addEventListener('start',()=>{tween=null;});overview(false);requestAnimationFrame(frame);if(query.has('pos'))document.title=[...islands.entries()].map(([k,I])=>`${k}:${I.p.x.toFixed(1)},${I.p.z.toFixed(1)}`).join(' ');if(query.has('lineup')){const ids=query.get('lineup');(ids?people.actors.filter(a=>ids.split(',').includes(a.id)):people.actors.slice(0,5)).forEach((a,k)=>{a.pause=1e9;a.g.position.set(-5+k*2.5,1.41,11);a.g.rotation.y=.3;});}
 // Screenshot helpers: ?cam=x,y,z,tx,ty,tz fixes the camera; ?grid=1 draws a 1-unit grid on every island.
 if(query.get('grid'))for(const I of islands.values()){const g=new T.GridHelper(24,24,P.terra,P.coffee);g.position.set(I.p.x,I.item.height+.5,I.p.z);scene.add(g);}

 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.dispatchEvent(new CustomEvent('map-context-lost'));});
 // 開場：鏡頭從高空轉下來停在全景（島已合併繪製，不能一座座升起，改用鏡頭飛入）
 function intro(){if(fixedCam)return;overview(false);const to=camera.position.clone(),tg=controls.target.clone();camera.position.copy(tg.clone().add(new T.Vector3(-90,300,60)));controls.update();move(tg,to,reduced?0:3000);}
 return {focus,overview,ride,skipRide,intro,walk(ids){people.walkPath('bear-dad',ids);},highlight(ids){for(const [id,I] of islands)I.ring.visible=ids.includes(id);dirty=true;},setHour(h){hour=((h%24)+24)%24;env.apply(hour);dirty=true;},getHour:()=>hour,showCreature:focusCreature,zoom(amount){const delta=camera.position.clone().sub(controls.target);delta.multiplyScalar(amount);delta.clampLength(controls.minDistance,controls.maxDistance);move(controls.target,camera.position.clone().copy(controls.target).add(delta),300);},stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,islands:islands.size}),renderer};
}
