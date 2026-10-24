import * as T from 'three';
import {P} from './palette.js?v=20261024194217';
import {group,mesh,ball,box,umbrella} from './primitives.js?v=20261024194217';
// Stylised geographic silhouettes, drawn here for this scene (not survey boundaries).
const outlines={
 home:[[-.96,.43],[-1.04,.13],[-.99,-.11],[-.88,-.34],[-.67,-.48],[-.45,-.52],[-.28,-.73],[-.04,-.81],[.15,-.74],[.21,-.47],[.32,-.45],[.47,-1.03],[.58,-.83],[.65,-.51],[.83,-.25],[.97,.07],[.91,.37],[.73,.63],[.53,.76],[.35,.69],[.23,.57],[.08,.62],[-.12,.45],[-.36,.43],[-.59,.61],[-.84,.65]],
 market:[[.28,-1.2],[.48,-1.18],[.67,-1.02],[.8,-.74],[.84,-.35],[.79,.07],[.65,.48],[.4,.87],[.14,1.13],[-.12,1.2],[-.35,1.1],[-.55,.88],[-.72,.53],[-.82,.14],[-.83,-.24],[-.7,-.58],[-.47,-.89],[-.12,-1.11]]
};
// Round both tips with a smooth closed curve while retaining Taiwan's northeast lean.
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
export function terrain(parent,r,color,seed,{id='',landings=[]}={}){const g=group(parent),points=coastline(r,seed,128,id),core=.85;
 mesh(g,surface(points.map(([x,z])=>[x*core,z*core])),color);
 const beach=a=>beachAmount(a,id,landings);
 const flat=a=>landings.reduce((m,l)=>Math.max(m,1-smooth((angleDistance(a,l)-.14)/.28)),0);
 // 10/23 熊爸：島邊緣弧面處理不行 → 改成一條連續的剖面（不再一圈圈疊台階）：
 // 沙灘方向＝草地圓滑彎下去接一整片緩坡沙灘；懸崖方向＝草地邊圓角後直落；橋頭／碼頭＝平的一路到邊。
 const shore=a=>[1.1+beach(a)*.26,-3.75];
 const prof=(a,t)=>{const b=beach(a),f=flat(a),end=shore(a)[0];
  // beach: radius core→end, height eases from .28 down to -3.75 (convex top, gentle toe)
  const rb=core+(end-core)*t,yb=.28-4.03*(t<.35?Math.pow(t/.35,2)*.18:.18+.82*smooth((t-.35)/.65));
  // cliff: flat to 1.0, round lip, then near-vertical face
  const rc=t<.45?core+(1-core)*t/.45:t<.6?1+.02*(t-.45)/.15:1.02+(end-1.02)*Math.pow((t-.6)/.4,2.2),yc=t<.45?.28:t<.6?.28-.55*Math.pow((t-.45)/.15,2):-.27-3.48*smooth((t-.6)/.25);
  let r=rc*(1-b)+rb*b,y=yc*(1-b)+yb*b;
  // bridgeheads stay flat to the very edge, then drop
  const rf=t<.6?core+(1.02-core)*t/.6:1.02+(end-1.02)*Math.pow((t-.6)/.4,2.2),yf=t<.6?.28:.28-4.03*smooth((t-.6)/.2);
  return [r*(1-f)+rf*f,y*(1-f)+yf*f];};
 const colorAt=(a,t)=>{const[,y]=prof(a,t),b=beach(a);if(y>.1)return new T.Color(color);if(y>-.25)return new T.Color(color).lerp(new T.Color(b>.5?'#E7D2A6':P.cliff),Math.min(1,(.1-y)/.35));return b>.5?new T.Color('#F0DAB2').lerp(new T.Color('#E6CC9E'),Math.min(1,-y/3.75)):new T.Color(P.cliff).lerp(new T.Color('#B59CAE'),Math.min(1,-y/3));};
 const band=(inner,outer,colors,rough=0)=>mesh(g,variableBand(points,inner,outer,colors,rough),'white',0,0,0,{side:T.DoubleSide,vertexColors:true});
 const N=14;for(let k=0;k<N;k++){const t0=k/N,t1=(k+1)/N;band(a=>prof(a,t0),a=>prof(a,t1),(a,j)=>colorAt(a,j?t1:t0));}
 band(shore,a=>[shore(a)[0]+.12,-3.9],()=>new T.Color('#A8DDD8'));
 band(a=>[shore(a)[0]+.12,-3.9],a=>[shore(a)[0]+.25,-3.98],()=>new T.Color('#7FC3C6'));
 // Broken white surf, with a broad sand shelf only on beach-facing shores.
 for(let k=0;k<8;k++){const start=k*15,arc=Array.from({length:7},(_,i)=>points[(start+i)%points.length]);const foam=variableBand(arc,a=>[shore(a)[0]+.018,-3.77],a=>[shore(a)[0]+.032,-3.78],()=>new T.Color('white'));mesh(g,foam,'#D9E9D9',0,0,0,{side:T.DoubleSide,transparent:true,opacity:.65});}
 for(let i=0;i<20;i++){const a=i*2.399+seed,v=coastRadius(a,r,seed,id),x=Math.sin(a)*v,z=Math.cos(a)*v,b=beach(a);
 if(i%3!==1&&b<.45){const rock=ball(g,.4+(i%4)*.14,i%2?'#C7AEC0':'#A88FA6',x*1.09,-2.85+(i%2)*.2,z*1.09,1.4,.9,1);rock.rotation.y=a;}
 else if(i%3===1){ball(g,.3,P.sage,x*.78,.4,z*.78,1.3,.65,.9);ball(g,.17,P.grassDark,x*.77,.48,z*.77);}}
 // Tasmania is a separate low island off the Australian southeast coast.
 if(id==='home'){const tas=group(g,6.6*r/10,-3.25,12.4*r/10);tas.scale.setScalar(r/10);ball(tas,1,'#E7D1AA',0,0,0,1,.35,1.2);ball(tas,.76,P.grass,0,.28,-.05,1,.22,1.1);
 // Beach towels and a parasol sit on the sandy slope, facing the water.
 const a=.11,v=coastRadius(a,r,seed,id)*1.29,b=group(g,Math.sin(a)*v,-3.43,Math.cos(a)*v);umbrella(b,-1.4,0,P.pink);for(let j=0;j<2;j++){const towel=box(b,.55,.035,1.2,j?P.sage:P.cream,j*.8,.13,.2);towel.rotation.y=.2;}}
 return {g,points};
}
