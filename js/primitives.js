import * as T from 'three';
import {P} from './palette.js?v=20261024091636';
const materials=new Map(), geometries=new Map();
export function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.88,flatShading:true,...extra}));return materials.get(key);}
export function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
export function mesh(parent,geo,color,x=0,y=0,z=0,extra={}){const m=new T.Mesh(geo,mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function box(parent,w,h,d,color,x=0,y=0,z=0){const k=`b${w},${h},${d}`;if(!geometries.has(k))geometries.set(k,new T.BoxGeometry(w,h,d));return mesh(parent,geometries.get(k),color,x,y,z);}
export function cyl(parent,r,h,color,x=0,y=0,z=0,n=12,r2=r){const k=`c${r},${r2},${h},${n}`;if(!geometries.has(k))geometries.set(k,new T.CylinderGeometry(r,r2,h,n));return mesh(parent,geometries.get(k),color,x,y,z);}
export function ball(parent,r,color,x=0,y=0,z=0,sx=1,sy=1,sz=1){const k='s'+r;if(!geometries.has(k))geometries.set(k,new T.IcosahedronGeometry(r,1));const m=mesh(parent,geometries.get(k),color,x,y,z);m.scale.set(sx,sy,sz);return m;}
export function line(parent,a,b,color=P.darkWood,r=.055){const A=new T.Vector3(...a),B=new T.Vector3(...b);const m=cyl(parent,r,A.distanceTo(B),color,...A.clone().add(B).multiplyScalar(.5).toArray(),6);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return m;}
// 10/23 熊爸：房子照參考影片——魚鱗瓦一排排疊、山牆做成階梯石牆。
export function roof(parent,w,d,h,color,x,y,z){const g=group(parent,x,y,z),half=w/2,len=Math.hypot(half,h),ang=Math.atan2(h,half);
 const s=new T.Shape();s.moveTo(-half,0);s.lineTo(0,h);s.lineTo(half,0);s.closePath();mesh(g,new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),P.tileDark,0,0,-d/2);
 const rows=Math.max(2,Math.round(len/.42)),cols=Math.max(2,Math.round((d+.3)/.55)),tw=(d+.3)/cols;
 for(const side of [-1,1])for(let r=0;r<rows;r++){const t=(r+.5)/rows,px=side*half*t,py=h*(1-t)+.07;for(let c=0;c<cols+(r%2);c++){const tz=-((d+.3)/2)+(c+(r%2?0:.5))*tw;if(Math.abs(tz)>(d+.3)/2)continue;const tile=box(g,len/rows*1.3,.1,tw*.9,(r+c)%3?P.tile:P.tileLight,px,py,tz);tile.rotation.z=-side*ang;}}
 box(g,.3,.2,d+.4,P.tileDark,0,h+.05,0);
 if(w>=3)for(const ze of [-d/2-.08,d/2+.08]){const gs=new T.Shape();gs.moveTo(-half*.92,0);gs.lineTo(0,h*.92);gs.lineTo(half*.92,0);gs.closePath();mesh(g,new T.ExtrudeGeometry(gs,{depth:.2,bevelEnabled:false}),P.wall,0,0,ze-.1);
  const steps=Math.max(3,Math.round(half/.5));for(let k=0;k<steps;k++){const sx=half*.92*(1-k/steps),sy=h*.92*k/steps;for(const side of [-1,1])box(g,.38,.34,.32,P.wallDark,side*sx,sy+.2,ze);}box(g,.42,.5,.32,P.wallDark,0,h*.92+.15,ze);}
 return g;}
// 尖塔屋頂：一圈圈的魚鱗瓦往上收。
export function spire(parent,r,h,x,y,z){const g=group(parent,x,y,z),n=4;for(let i=0;i<n;i++){const r0=r*(1-i/n)+.12,r1=r*(1-(i+1)/n)+.12;cyl(g,r1,h/n*1.15,i%2?P.tileLight:P.tile,0,h/n*(i+.5),0,12,r0);}cyl(g,.03,.7,P.coffee,0,h+.3,0,5);const flag=box(g,.4,.22,.03,P.glass,.22,h+.52,0);return g;}
// 10/23 熊爸：草地上的路改成石板拼接，石板之間露出草縫。
export function path(parent,a,b,width=1.6,color=P.cobble){const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.01)return null;const ux=dx/L,uz=dz/L,rows=Math.max(1,Math.round(L/.62)),cols=Math.max(2,Math.round(width/.62));
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const h=Math.sin((a[0]+i*1.7+j*3.1)*12.9898+(a[1]+i)*78.233)*43758.5453%1,t=(i+.5)/rows*L+(j%2?.15:-.15),o=((j+.5)/cols-.5)*width+h*.06;
  const stone=cyl(parent,.27+Math.abs(h)*.06,.1,Math.abs(h)>.5?P.cobble:P.cobbleDark,a[0]+ux*t-uz*o,.35,a[1]+uz*t+ux*o,6);stone.rotation.y=h*3;}
 return null;}
// 10/23 熊老闆指定的樹形：多面切角的球疊成樹冠，分岔彎曲的粉紫樹幹。
export function tree(parent,x,z,scale=1,eucalyptus=false){const g=group(parent,x,0,z);g.scale.setScalar(scale);g.rotation.y=(x*7.3+z*3.1)%6.28;const bark=P.bark,leaves=eucalyptus?[P.sage,P.leafLight]:[P.leaf,P.leafLight];
 line(g,[0,0,0],[.18,1.35,0],bark,.2);line(g,[.18,1.35,0],[-.05,2.4,.08],bark,.16);line(g,[.12,1.75,0],[-.85,2.75,.2],bark,.1);line(g,[.08,2,0],[.9,2.95,-.2],bark,.1);
 for(const [bx,by,bz,r,k] of [[-.9,3.15,.2,.95,0],[.95,3.3,-.2,1,1],[0,3.85,0,1.15,0],[.25,3.05,.75,.75,1],[-.3,3.3,-.75,.72,1]])ball(g,r,leaves[k],bx,by,bz);return g;}
export function plant(parent,x,z,color=P.pink){const g=group(parent,x,0,z);cyl(g,.25,.5,P.terra,0,.25,0,8,.32);for(let i=0;i<3;i++){line(g,[0,.4,0],[Math.sin(i*2)*.2,.9,Math.cos(i*2)*.2],P.grassDark,.035);ball(g,.16,color,Math.sin(i*2)*.2,.92,Math.cos(i*2)*.2);}return g;}
export function bench(parent,x,z,rotation=0){const g=group(parent,x,0,z);g.rotation.y=rotation;box(g,1.8,.15,.65,P.wood,0,.65,0);box(g,1.8,.65,.12,P.darkWood,0,1.05,-.3);for(const dx of [-.65,.65])box(g,.12,.65,.5,P.darkWood,dx,.3,0);return g;}
export function windowPane(parent,x,y,z,w=.65,h=.85){box(parent,w+.15,h+.15,.11,P.wallDark,x,y,z);const win=box(parent,w,h,.13,P.glass,x,y,z+.04);
 const arch=new T.Mesh(new T.CylinderGeometry(w/2+.07,w/2+.07,.11,10,1,false,-Math.PI/2,Math.PI),mat(P.wallDark));arch.rotation.x=-Math.PI/2;arch.position.set(x,y+h/2+.07,z);parent.add(arch);
 const top=new T.Mesh(new T.CylinderGeometry(w/2,w/2,.13,10,1,false,-Math.PI/2,Math.PI),win.material);top.rotation.x=-Math.PI/2;top.position.set(x,y+h/2,z+.04);parent.add(top);
 box(parent,.05,h,.17,P.wallDark,x,y,z+.08);for(const k of [-.25,.25])box(parent,w,.04,.17,P.wallDark,x,y+k*h,z+.08);return win;}
export function fence(parent,a,b){line(parent,[a[0],.65,a[1]],[b[0],.65,b[1]],P.darkWood,.07);line(parent,[a[0],1.2,a[1]],[b[0],1.2,b[1]],P.darkWood,.07);const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.5);for(let i=0;i<=n;i++){const t=i/n;box(parent,.16,1.45,.16,P.darkWood,a[0]+(b[0]-a[0])*t,.72,a[1]+(b[1]-a[1])*t);}}
export function umbrella(parent,x,z,color){const g=group(parent,x,0,z);cyl(g,.06,2.7,P.wood,0,1.35,0,6);cyl(g,.03,.6,color,0,2.85,0,8,1.35);return g;}
export function board(parent,x,z){const g=group(parent,x,0,z);for(const d of [-.8,.8])box(g,.13,2.6,.13,P.darkWood,d,1.3,0);box(g,2.1,1.15,.18,P.coffee,0,2.05,0);return g;}
