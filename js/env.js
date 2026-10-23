import * as T from 'three';
import {P} from './palette.js?v=20261023135513';
import {mat} from './primitives.js?v=20261023135513';
// ③ 24 小時光線（DESIGN.md §1.2）：關鍵時刻的天色、光色，中間線性內插。
const KEYS=[
 // hour, sky/fog, hemi sky, hemi ground, hemi, sun color, sun, night(0–1)
 [0,'#2B3150','#6B73A6','#4A4462',1.05,'#9FB4E8',.5,1],
 [5,'#3A3B5C','#7676A6','#4F4866',1.05,'#B9B8E0',.5,1],
 [6,'#F2C6C4','#FFD9CF','#B49BB4',1.6,'#FFB78F',1.6,.35],
 [7.5,'#CFE7EE','#FFF0DD','#B49BB4',2.2,'#FFE4C4',2.6,0],
 [12,'#C4E3F0','#FFF8EA','#B9A6BC',2.5,'#FFF2DC',3.2,0],
 [15.5,'#F4DCC0','#FFE8C8','#B9A0B0',2.3,'#FFD49A',3,0],
 [18,'#EDB8A6','#FFC9B0','#A88AA8',1.7,'#FF9C6E',2,.25],
 [19.5,'#6E5F86','#9C8AB8','#5E5274',1.1,'#C7A6D8',.7,.85],
 [22,'#2E3456','#6F76A8','#4C4664',1.05,'#A4B6E6',.5,1],
 [24,'#2B3150','#6B73A6','#4A4462',1.05,'#9FB4E8',.5,1]];
// 天頂顏色（跟 KEYS 同一組時刻）
const TOPS=[[0,'#0E1636'],[5,'#1B2350'],[6,'#7FA6D8'],[7.5,'#7EC3EA'],[12,'#5DB4EA'],[15.5,'#79B6E0'],[18,'#5E6FB8'],[19.5,'#2B2F6A'],[22,'#121A40'],[24,'#0E1636']];
const c1=new T.Color(),c2=new T.Color();
function lerpColor(a,b,t){return c1.set(a).clone().lerp(c2.set(b),t);}
export function sample(hour){const h=((hour%24)+24)%24;let i=0;while(KEYS[i+1][0]<h)i++;const A=KEYS[i],B=KEYS[i+1],t=(h-A[0])/(B[0]-A[0]);
 let j=0;while(TOPS[j+1][0]<h)j++;const U=TOPS[j],V=TOPS[j+1],u=(h-U[0])/(V[0]-U[0]);
 return {top:lerpColor(U[1],V[1],u),sky:lerpColor(A[1],B[1],t),hemiSky:lerpColor(A[2],B[2],t),hemiGround:lerpColor(A[3],B[3],t),hemi:A[4]+(B[4]-A[4])*t,sunColor:lerpColor(A[5],B[5],t),sun:A[6]+(B[6]-A[6])*t,night:A[7]+(B[7]-A[7])*t};}
// 時段名稱（時間軸上的 7 段）
export const PERIODS=[['清晨',5.5],['上午',7],['中午',11],['下午',14],['黃昏',17.5],['晚上',19],['深夜',22]];
export function periodOf(hour){const h=((hour%24)+24)%24;let name='深夜';for(const [n,s] of PERIODS)if(h>=s)name=n;return h<5.5?'深夜':name;}
export function createEnvironment(scene,{hemi,sun,renderer,sea,lighthouse}){
 // 夜裡會亮的材質：窗戶、路燈、電車（電車自己管）。
 const glow=[mat(P.glass),mat(P.lamp)];
 let beam=null;if(lighthouse){beam=new T.Mesh(new T.ConeGeometry(2.2,14,16,1,true),new T.MeshBasicMaterial({color:'#FFF1B8',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));beam.geometry.translate(0,-7,0);beam.rotation.z=Math.PI/2;const pivot=new T.Group();pivot.position.copy(lighthouse);pivot.add(beam);scene.add(pivot);beam.userData.pivot=pivot;}
 const dome=new T.Mesh(new T.SphereGeometry(950,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color()},horizon:{value:new T.Color()}},
  vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying float h;void main(){float k=smoothstep(-.01,.16,h);gl_FragColor=vec4(mix(horizon,top,k),1.);}'}));dome.renderOrder=-1;scene.add(dome);
 const starGeo=new T.BufferGeometry(),sp=[];for(let i=0;i<500;i++){const a=Math.random()*Math.PI*2,e=.08+Math.random()*1.4,r=900;sp.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}starGeo.setAttribute('position',new T.Float32BufferAttribute(sp,3));
 const stars=new T.Points(starGeo,new T.PointsMaterial({color:'#FFF6DA',size:2.2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(stars);
 let current=null;
 function apply(hour){const s=sample(hour);current={hour,...s};
 scene.background.copy(s.sky);scene.fog.color.copy(s.sky);renderer.setClearColor(s.sky);dome.material.uniforms.top.value.copy(s.top);dome.material.uniforms.horizon.value.copy(s.sky);stars.material.opacity=Math.max(0,s.night-.3)/.7;
 hemi.color.copy(s.hemiSky);hemi.groundColor.copy(s.hemiGround);hemi.intensity=s.hemi;
 // 太陽：06:00 從東邊（+x）升起，12:00 最高，18:00 西邊落下；晚上換成月光（固定在高處、冷色）。
 const a=(hour-6)/12*Math.PI,day=hour>5.5&&hour<19;const el=day?Math.max(.12,Math.sin(a)):.75;
 sun.position.set(day?Math.cos(a)*80:-30,el*85+8,day?25+Math.sin(a)*10:40);sun.color.copy(s.sunColor);sun.intensity=s.sun;
 renderer.shadowMap.needsUpdate=true;
 for(const m of glow){m.emissive.set(P.lamp);m.emissiveIntensity=s.night*.9;}
 sea.material.color.copy(new T.Color(P.deepSea).lerp(new T.Color('#2D4D6E'),s.night*.75));
 if(beam)beam.material.opacity=s.night*.28;
 return s;}
 return {apply,update(dt){if(beam&&current?.night>.2)beam.userData.pivot.rotation.y+=dt*1.2;},get:()=>current};
}
