import * as T from 'three';
// Approved family chibi design. Shared by the local map and character preview.
const materials=new Map(),geometries=new Map();
function mat(color,soft=false){const k=color+soft;if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,roughness:.9,metalness:0,flatShading:!soft}));return materials.get(k);}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function oval(parent,radii,color,position=[0,0,0],soft=false,segments=10){const key=segments;let geo=geometries.get(key);if(!geo){geo=new T.SphereGeometry(1,segments,6);geometries.set(key,geo);}const m=new T.Mesh(geo,mat(color,soft));m.scale.set(...radii);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function smile(parent,color){const pts=[[-.065,-.145,.405],[0,-.161,.424],[.065,-.145,.405]].map(p=>new T.Vector3(...p));const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),8,.005,4,false),mat(color,true));parent.add(mesh);}
export function createDog(parent,{fur='#F6DDBC',ear='#DFAD7C',nose='#332C29',earLong=false,muzzle=fur}={}){
 const g=group(parent),body=group(g),legs=[];
 oval(body,[.265,.25,.365],fur,[0,.385,-.13]);
 oval(body,[.235,.235,.24],fur,[0,.40,.14]);
 for(const [x,z] of [[-.18,.16],[.18,.16],[-.18,-.36],[.18,-.36]]){const l=group(body,x,.30,z);oval(l,[.10,.16,.105],fur,[0,-.10,0]);oval(l,[.12,.085,.145],fur,[0,-.22,.055]);legs.push(l);}
 const head=group(body,0,.81,.26);
 oval(head,[.385,.345,.32],fur,[0,0,0],true,12);
 // A few large silhouette tufts replace the previous thin surface locks.
 for(const [x,y,z,s] of [[-.20,.265,0,.13],[.02,.315,-.005,.15],[.20,.255,-.015,.12]]){const m=oval(head,[s,s*.78,s*.9],fur,[x,y,z]);m.rotation.z=-.25;}
 for(const side of [-1,1]){
  const e=group(head,side*.355,.08,-.015);e.rotation.z=side*.13;
  oval(e,[.115,earLong?.265:.215,.135],ear,[0,earLong?-.16:-.11,0]);
  // Two broad rounded tips imply a soft doodle ear without dense fur.
  oval(e,[.075,.085,.11],ear,[-.035,earLong?-.36:-.27,.015]);
  oval(e,[.07,.085,.10],ear,[.04,earLong?-.34:-.25,.01]);
 }
 const face=new T.Color(muzzle).lerp(new T.Color(fur),.58).getStyle();
 for(const x of [-.08,.08])oval(head,[.125,.105,.11],face,[x,-.105,.305],true);
 oval(head,[.068,.052,.047],nose,[0,-.06,.417],true,8);
 for(const x of [-.147,.147]){oval(head,[.034,.042,.023],'#332C29',[x,.035,.298],true,8);oval(head,[.006,.007,.004],'#FFFDF5',[x-.009,.048,.320],true,6);}
 smile(head,'#795941');
 if(!earLong){const collar=new T.Mesh(new T.TorusGeometry(.18,.019,5,14),mat('#D6A4B2'));collar.rotation.x=Math.PI/2;collar.position.set(0,.57,.17);body.add(collar);}
 const tail=group(body,0,.49,-.48);tail.rotation.x=-.18;
 for(const [y,z,r] of [[.06,-.06,.09],[.18,-.10,.095],[.27,-.06,.07]])oval(tail,[r,r*1.2,r],fur,[0,y,z]);
 const tongue=oval(head,[.032,.06,.018],'#D79DA6',[0,-.18,.405],true,8);tongue.visible=false;
 g.userData.dogDesign='chibi-approved-v2';
 return {g,body,head,legs,tail,tongue,restOffset:-.08,tagHeight:1.45};
}
