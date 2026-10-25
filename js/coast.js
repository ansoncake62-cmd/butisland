import * as T from 'three';
import {P} from './palette.js?v=20261025165304';
import {group,mesh,ball,box,umbrella} from './primitives.js?v=20261025165304';
// Stylised geographic silhouettes, drawn here for this scene (not survey boundaries).
const outlines={
 home:[[-.96,.43],[-1.04,.13],[-.99,-.11],[-.88,-.34],[-.67,-.48],[-.45,-.52],[-.28,-.73],[-.04,-.81],[.15,-.74],[.21,-.47],[.32,-.45],[.47,-1.03],[.58,-.83],[.65,-.51],[.83,-.25],[.97,.07],[.91,.37],[.73,.63],[.53,.76],[.35,.69],[.23,.57],[.08,.62],[-.12,.45],[-.36,.43],[-.59,.61],[-.84,.65]],
 market:[[.28,-1.2],[.48,-1.18],[.67,-1.02],[.8,-.74],[.84,-.35],[.79,.07],[.65,.48],[.4,.87],[.14,1.13],[-.12,1.2],[-.35,1.1],[-.55,.88],[-.72,.53],[-.82,.14],[-.83,-.24],[-.7,-.58],[-.47,-.89],[-.12,-1.11]]
};
// Round both tips with a smooth closed curve while retaining Taiwan's northeast lean.
// 10/25 熊爸「島都是圓滑的」：熊爸家（澳洲）輪廓的折角也用閉合曲線修圓，保留形狀
outlines.home=new T.CatmullRomCurve3(outlines.home.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal').getPoints(200).slice(0,-1).map(v=>[v.x,v.z]);
outlines.market=new T.CatmullRomCurve3(outlines.market.map(([x,z])=>new T.Vector3(x*1.3,0,z)),true,'centripetal').getPoints(160).slice(0,-1).map(v=>[v.x,v.z]);
// 10/23 熊爸：電車下橋的地方島太窄 → 在指定角度把海岸往外推（scene.js 依外圈橋頭登記）。
export const bulges={};
const bulgeAt=(id,angle)=>{let k=1;for(const [a,amt] of bulges[id]||[]){const d=Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)));if(d<1.2)k=Math.max(k,1+amt*(1+Math.cos(d/1.2*Math.PI))/2);}return k;};
export function coastRadius(angle,r=10,seed=0,id=''){return baseRadius(angle,r,seed,id)*bulgeAt(id,angle);}
function baseRadius(angle,r,seed,id){
 if(outlines[id]){const dx=Math.sin(angle),dz=Math.cos(angle),poly=outlines[id];let nearest=Infinity;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ex=b[0]-a[0],ez=b[1]-a[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-8)continue;const t=(a[0]*ez-a[1]*ex)/den,u=(a[0]*dz-a[1]*dx)/den;if(t>0&&u>=0&&u<=1)nearest=Math.min(nearest,t);}
 return r*(Number.isFinite(nearest)?nearest:1);}
 const p=seed*.83;return r*(1.035+.105*Math.sin(2*angle+p)+.075*Math.cos(3*angle-p*.7)+.045*Math.sin(5*angle+p*1.7)+.023*Math.cos(9*angle-p));
}
export function coastline(r,seed,n=96,id=''){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,v=coastRadius(a,r,seed,id);return [Math.sin(a)*v,Math.cos(a)*v];});}
export function surface(points,y=.28){const vertices=[0,y,0],indices=[];for(const [x,z] of points)vertices.push(x,y,z);for(let i=0;i<points.length;i++)indices.push(0,i+1,(i+1)%points.length+1);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;}
export function coastBand(points,inner,outer,y1,y2,rough=0){return variableBand(points,()=>[inner,y1],()=>[outer,y2],()=>new T.Color('white'),rough);}
function variableBand(points,inner,outer,color,rough=0){const v=[],colors=[],indices=[],n=points.length;
 for(let j=0;j<2;j++)for(let i=0;i<n;i++){const [x,z]=points[i],angle=Math.atan2(x,z),[scale,y]=(j?outer:inner)(angle),c=color(angle,j);v.push(x*scale,y+Math.sin(i*.59)*rough,z*scale);colors.push(c.r,c.g,c.b);}
 for(let i=0;i<n;i++){const k=(i+1)%n;indices.push(i,k,n+i,k,n+k,n+i);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
const angleDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function beachAmount(angle,id,landings){let amount=0;
 const lobe=(center,width,strength=1)=>strength*(1-smooth(angleDistance(angle,center)/width));
 // 10/23 熊爸：全部島嶼都改成緩坡沙灘（不要懸崖、直角），只有熊爸家房子後面（北側）保留懸崖。
 amount=id==='home'?1-lobe(Math.PI,1.1):.9;
 // Keep high ground at bridgeheads and docks so the approach paths stay connected.
 for(const a of landings)amount*=smooth((angleDistance(angle,a)-.12)/.3);
 return amount;
}
// 10/25 圓滑地形：環狀網格（中心→頂面平台→剖面 t=0..1），所有環共用頂點後一次算法線，坡面跟頂面的交界自然是圓的
function smoothTerrain(points,core,prof,colorAt,M,extra=[]){const n=points.length,K=5,v=[],c=[],idx=[],ts=[...Array.from({length:M},(_,j)=>(j+1)/M),...extra];
 const push=(x,y,z,col)=>{v.push(x,y,z);c.push(col.r,col.g,col.b);};
 push(0,.28,0,colorAt(0,-1));
 const ang=points.map(([x,z])=>Math.atan2(x,z));
 for(let k=1;k<=K;k++)for(let i=0;i<n;i++){const s=core*k/K;push(points[i][0]*s,.28,points[i][1]*s,colorAt(ang[i],-1));}
 for(const t of ts){for(let i=0;i<n;i++){const [rr,y]=prof(ang[i],t);push(points[i][0]*rr,y,points[i][1]*rr,colorAt(ang[i],t));}}
 for(let i=0;i<n;i++)idx.push(0,1+i,1+(i+1)%n);
 const rings=K+ts.length;for(let j=0;j<rings-1;j++){const a0=1+j*n,b0=1+(j+1)*n;for(let i=0;i<n;i++){const k=(i+1)%n;idx.push(a0+i,b0+i,a0+k,a0+k,b0+i,b0+k);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;}
// 10/25 裝飾小島：圓頂草地＋圓滑沙肩一體成形（原本平面草地＋一圈斜帶，邊緣是折的）
export function islet(points,top=.55,bottom=.05,sandOut=1.2,grass='#9DBB5C',sand='#DDCEAC'){const G=new T.Color(grass),S=new T.Color(sand);
 const prof=(a,t)=>{const r=.75+(sandOut-.75)*t,y=top-(top-bottom)*(t<.3?Math.pow(t/.3,2)*.25:.25+.75*smooth((t-.3)/.7));return [r,y];};
 return smoothTerrain(points,.75,(a,t)=>prof(a,t),(a,t)=>t<0?G:G.clone().lerp(S,smooth((t-.15)/.3)),14);}
export function terrain(parent,r,color,seed,{id='',landings=[]}={}){const g=group(parent),points=coastline(r,seed,innerWidth<=600?144:220,id),core=.85;
 const beach=a=>beachAmount(a,id,landings);
 const flat=a=>landings.reduce((m,l)=>Math.max(m,1-smooth((angleDistance(a,l)-.14)/.28)),0);
 // 10/23 熊爸：島邊緣弧面處理不行 → 改成一條連續的剖面（不再一圈圈疊台階）：
 // 沙灘方向＝草地圓滑彎下去接一整片緩坡沙灘；懸崖方向＝草地邊圓角後直落；橋頭／碼頭＝平的一路到邊。
 // Break the last remaining concentric silhouette: sand reaches farther in
 // some coves while the waterline pulls back around neighbouring headlands.
 const coastWobble=a=>.022*Math.sin(a*5+seed*.7)+.012*Math.sin(a*11-seed);
 // 10/25 大巴接 Codex 建議②：海岸不要一圈等寬色帶 → 每座島沿著海岸有「草坡伸到水邊、沙灘窄」跟「寬沙灘」交替（lobe 0–1）
 const lobe=a=>smooth(.5+.62*Math.sin(a*3+seed*1.3)*Math.cos(a*2-seed*.6)+.18*Math.sin(a*7+seed*2.1));
 // 熊爸家前面放遮陽傘、沙灘巾那片（角度 .11 附近）保持寬沙灘
 const keepWide=a=>id==='home'?smooth((angleDistance(a,.11)-.35)/.5):1,grassReach=a=>.42*lobe(a)*keepWide(a),sandWidth=a=>1-.62*lobe(a)*keepWide(a);
 const shore=a=>[1.085+beach(a)*.29*sandWidth(a)+coastWobble(a),-3.75];
 const prof=(a,t)=>{const b=beach(a),f=flat(a),end=shore(a)[0];
  // beach: radius core→end, height eases from .28 down to -3.75 (convex top, gentle toe)
  const gr=grassReach(a),tt=t<gr?0:(t-gr)/(1-gr);   // 草坡先平平伸出去一段，再彎下去接沙灘
  const rb=core+(end-core)*t,yb=.28-4.03*(tt<.35?Math.pow(tt/.35,2)*.18:.18+.82*smooth((tt-.35)/.65));
  // cliff: flat to 1.0, round lip, then near-vertical face
  const rc=t<.45?core+(1-core)*t/.45:t<.6?1+.02*(t-.45)/.15:1.02+(end-1.02)*Math.pow((t-.6)/.4,2.2),yc=t<.45?.28:t<.6?.28-.55*Math.pow((t-.45)/.15,2):-.27-3.48*smooth((t-.6)/.25);
  let r=rc*(1-b)+rb*b,y=yc*(1-b)+yb*b;
  // bridgeheads stay flat to the very edge, then drop
  const rf=t<.6?core+(1.02-core)*t/.6:1.02+(end-1.02)*Math.pow((t-.6)/.4,2.2),yf=t<.6?.28:.28-4.03*smooth((t-.6)/.2);
  return [r*(1-f)+rf*f,y*(1-f)+yf*f];};
 // 10/25 熊爸：圓滑後全景沙坡太亮太平 → 沙坡往水線漸深、偏暖；背光那一側再暗一點（頂點色連續漸層，沒有分帶；沙灘／崖面用 b 連續混色，不再用 b>.5 一刀切）
 const SUN=Math.atan2(-40,35),sandTop=new T.Color('#E9CF9F'),sandLow=new T.Color('#B9986F'),cliffTop=new T.Color('#DCC096'),cliffLow=new T.Color('#B08E66');   /* 10/25 ③：橋頭旁粉紫崖面 → 改沙土色，跟沙坡同一家族 */   // 10/25 熊爸：方向對但太暗 → 取圓滑版跟加深版中間
 const colorAt=(a,t)=>{const[,y]=prof(a,t),b=smooth((beach(a)-.25)/.5);if(y>.1)return new T.Color(color);
  const d=Math.pow(smooth((.1-y)/3.85),.85),lit=.5+.5*Math.cos(a-SUN),shade=1-.1*(1-lit)*smooth((.1-y)/.8);
  const slope=sandTop.clone().lerp(sandLow,d).lerp(cliffTop.clone().lerp(cliffLow,d),1-b).multiplyScalar(shade);
  return y>-.3?new T.Color(color).lerp(slope,smooth((.1-y)/.4)):slope;};
 const band=(inner,outer,colors,rough=0)=>mesh(g,variableBand(points,inner,outer,colors,rough),'white',0,0,0,{side:T.DoubleSide,vertexColors:true});
 // 10/25 熊爸「島都是圓滑的」：頂面＋整圈坡面做成同一張網格、共用頂點、平滑法線（不再 10 條帶子各自算法線、也不用平塗），
 // 草地圓圓地彎下去接沙灘，看不到折線；建築、樹、橋仍是低多邊形。
 // 10/25 熊爸：入海處也要圓滑 → 同一張網格繼續往外長：沙灘水線→淺水→礁緣→往下沒入海面，顏色沿途漸層，不再另外疊兩條會折的淺水帶
 const W=innerWidth<=600?8:12,wet=Array.from({length:W},(_,j)=>1+(j+1)/W);
 const shallowR=a=>shore(a)[0]+.03+.09*(1-lobe(a))+.02*Math.sin(a*7+seed),reefR=a=>shallowR(a)+.05+.08*(1-lobe(a))+.025*Math.sin(a*4-seed);
 const profW=(a,t)=>{if(t<=1)return prof(a,t);const u=t-1,s0=shore(a)[0],s2=reefR(a)+.05;return [s0+(s2-s0)*u,-3.75-.23*smooth(u/.75)-1.7*Math.pow(smooth((u-.7)/.3),2)];};
 const WATER=[new T.Color('#79B9B8'),new T.Color('#5FA7B1'),new T.Color(P.deepSea||'#4C9FB0')];
 const colorW=(a,t)=>{if(t<0)return new T.Color(color);if(t<=1)return colorAt(a,t);const u=t-1,base=colorAt(a,1);
  return u<.3?base.lerp(WATER[0],smooth(u/.3)):u<.75?WATER[0].clone().lerp(WATER[1],smooth((u-.3)/.45)):WATER[1].clone().lerp(WATER[2],smooth((u-.75)/.25));};
 mesh(g,smoothTerrain(points,core,profW,colorW,innerWidth<=600?22:34,wet),'white',0,0,0,{side:T.DoubleSide,vertexColors:true,flatShading:false});
 // 淺水：寬窄跟著沙灘走（寬沙灘外面淺水也寬），顏色往加深後的海收，不再是兩圈等寬的亮環
 // Broken white surf, with a broad sand shelf only on beach-facing shores.
 // 10/25 浪花改成兩端收尖的圓滑弧（原本 3–7 點的帶子頭尾直接相連，會折成一片白板）
 const n0=points.length;for(let k=0;k<12;k++){const start=Math.floor((k*11/128+seed*.023)*n0)%n0,count=Math.round(n0*(.025+.012*(k%5))),v=[],idx=[];
  for(let i=0;i<=count;i++){const [x,z]=points[(start+i)%n0],a=Math.atan2(x,z),w=Math.sin(Math.PI*i/count),r0=shore(a)[0]+.004,r1=r0+(.012+.02*(.5+.5*Math.sin(a*6+seed)))*w;v.push(x*r0,-3.745,z*r0,x*r1,-3.75,z*r1);if(i<count){const b=i*2;idx.push(b,b+1,b+2,b+2,b+1,b+3);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,'#F4FAF4',0,0,0,{side:T.DoubleSide,transparent:true,opacity:.78,flatShading:false});}
 // 草坡伸到水邊的地方：水線上放幾顆礁石（每座島 4–7 顆，成小群）
 for(let k=0;k<9;k++){const a=seed*2.3+k*.7;if(lobe(a)*keepWide(a)<.55||beach(a)<.45)continue;const v=coastRadius(a,r,seed,id)*(shore(a)[0]+.02);for(let j=0;j<1+(k%2);j++){const aa=a+(j-.5)*.07,rock=ball(g,.38+((k+j)%3)*.16,(k+j)%2?'#A8987F':'#BFAF95',Math.sin(aa)*v,-3.72+j*.08,Math.cos(aa)*v,1.3,.75,1.05);rock.rotation.y=aa*3;}}
 for(let i=0;i<20;i++){const a=i*2.399+seed,v=coastRadius(a,r,seed,id),x=Math.sin(a)*v,z=Math.cos(a)*v,b=beach(a);
 if(i%3!==1&&b<.45){const rock=ball(g,.4+(i%4)*.14,i%2?'#C7AEC0':'#A88FA6',x*1.09,-2.85+(i%2)*.2,z*1.09,1.4,.9,1);rock.rotation.y=a;}
 else if(i%3===1){ball(g,.3,P.sage,x*.78,.4,z*.78,1.3,.65,.9);ball(g,.17,P.grassDark,x*.77,.48,z*.77);}}
 // Tasmania is a separate low island off the Australian southeast coast.
 if(id==='home'){const tas=group(g,6.6*r/10,-3.25,12.4*r/10);tas.scale.setScalar(r/10);ball(tas,1,'#E7D1AA',0,0,0,1,.35,1.2);ball(tas,.76,P.grass,0,.28,-.05,1,.22,1.1);
 // Beach towels and a parasol sit on the sandy slope, facing the water.
 const a=.11,v=coastRadius(a,r,seed,id)*1.29,b=group(g,Math.sin(a)*v,-3.43,Math.cos(a)*v);umbrella(b,-1.4,0,P.pink);for(let j=0;j<2;j++){const towel=box(b,.55,.035,1.2,j?P.sage:P.cream,j*.8,.13,.2);towel.rotation.y=.2;}}
 return {g,points};
}
