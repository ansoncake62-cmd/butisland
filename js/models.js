import * as T from 'three';
import {P} from './palette.js?v=20261024194217';
import {terrain} from './coast.js?v=20261024194217';
import {group,box,cyl,ball,line,roof,spire,path,tree,plant,bench,windowPane,fence,umbrella,board} from './primitives.js?v=20261024194217';
export function islandBase(parent,r,height,color,seed=0,options={}){return terrain(parent,r,color,seed,options);}

// 10/23 熊爸選 B：熊爸家改成參考影片那種小城堡——石牆主館＋魚鱗瓦階梯山牆、兩座圓塔尖頂、一座方塔城垛。
function merlons(parent,cx,cz,w,d,y,size=.32){const n=Math.max(2,Math.round(w/.7)),m=Math.max(2,Math.round(d/.7));for(let i=0;i<=n;i++)for(const z of [-d/2,d/2])if(i%2===0)box(parent,size,size*1.2,size,P.wallDark,cx-w/2+w*i/n,y,cz+z);for(let i=1;i<m;i++)for(const x of [-w/2,w/2])if(i%2===0)box(parent,size,size*1.2,size,P.wallDark,cx+x,y,cz-d/2+d*i/m);}
function roundTower(parent,x,z,r,h){const t=group(parent,x,0,z);cyl(t,r,h,P.wall,0,h/2+.3,0,12,r*1.08);cyl(t,r*1.12,.3,P.wallDark,0,.45,0,12);windowPane(t,0,h*.62,r*.98,.35,.55);spire(t,r*1.25,r*2.6,0,h+.3,0);return t;}
// 10/23 熊爸：城堡加成兩層樓（中間石腰線、二樓三窗＋陽台），大門改成拱石門框的氣派雙開門。
function grandDoor(h,z){const d=group(h,0,0,z),w=1.6,top=2.05,r=w/2;
 box(d,w+.3,top-.3+.1,.1,P.ink,0,(top+.3)/2,-.02);const back=cyl(d,r+.12,.1,P.ink,0,top,-.02,14);back.rotation.x=Math.PI/2;
 for(const s of [-1,1]){box(d,r-.03,top-.3,.14,P.coffee,s*r/2,(top+.3)/2,.04);
  for(const y of [.75,1.35,1.9])box(d,r-.12,.07,.05,P.ink,s*r/2,y,.13);
  ball(d,.07,P.mustard,s*.2,1.25,.15);}
 const arch=cyl(d,r-.03,.14,P.coffee,0,top,.04,14);arch.rotation.x=Math.PI/2;box(d,.04,top+r-.35,.16,P.ink,0,(top+r+.3)/2,.06);
 for(let i=0;i<=8;i++){const a=Math.PI*i/8,R=r+.22,v=box(d,i===4?.36:.28,i===4?.42:.3,.24,i===4?P.cream:P.wallDark,Math.cos(a)*R,top+Math.sin(a)*R,.06);v.rotation.z=a-Math.PI/2;}
 for(const s of [-1,1]){box(d,.28,top-.3,.24,P.wallDark,s*(r+.22),(top+.3)/2,.06);
  const l=group(d,s*(r+.58),2.05,.1);box(l,.08,.32,.18,P.ink,0,0,0);box(l,.06,.06,.3,P.ink,0,.12,.14);box(l,.3,.07,.3,P.ink,0,.12,.32);box(l,.22,.07,.22,P.ink,0,-.3,.32);cyl(l,.05,.12,P.ink,0,.2,.32,6);box(l,.17,.32,.17,P.lamp,0,-.09,.32);}}
// 10/23 熊爸：狗頭改成直接刻在山牆上的浮雕（熊爸：取消後面的石板）——圖的線條轉成石色，疊幾層往前推出厚度（後暗前亮）。
function stoneRelief(parent,url,x,y,z,size,sunken=false){const p=group(parent,x,y,z);

 const img=new Image();img.onload=()=>{const src=document.createElement('canvas');src.width=img.width;src.height=img.height;const sx=src.getContext('2d');sx.drawImage(img,0,0);
  // 熊爸：舌頭中線要做出來——粉紅填色不刻，只刻咖啡色線條，舌頭就剩外框＋中線。
  const px=sx.getImageData(0,0,src.width,src.height);for(let i=0;i<px.data.length;i+=4)if(px.data[i]>160)px.data[i+3]=0;sx.putImageData(px,0,0);
  // 熊爸選 A：做成家徽——盾形雙線外框包住狗頭，盾下一條飄帶刻 BUT SO COOL。
  const art=document.createElement('canvas');art.width=1000;art.height=1150;const g2=art.getContext('2d');g2.strokeStyle=g2.fillStyle='#000';g2.lineJoin='round';
  const shield=k=>{g2.beginPath();g2.moveTo(110+k,70+k);g2.lineTo(500,120+k*.6);g2.lineTo(890-k,70+k);g2.lineTo(890-k,520);g2.quadraticCurveTo(880-k*.9,800-k*.3,500,960-k*1.3);g2.quadraticCurveTo(120+k*.9,800-k*.3,110+k,520);g2.closePath();g2.stroke();};
  g2.lineWidth=24;shield(0);g2.lineWidth=11;shield(40);
  const dw=600,dh=dw*img.height/img.width;g2.drawImage(src,500-dw/2,480-dh/2,dw,dh);
  g2.lineWidth=16;g2.beginPath();g2.moveTo(120,905);g2.quadraticCurveTo(500,1010,880,905);g2.lineTo(880,1035);g2.quadraticCurveTo(500,1140,120,1035);g2.closePath();g2.stroke();
  for(const sd of [-1,1]){g2.beginPath();g2.moveTo(500+sd*380,935);g2.lineTo(500+sd*470,925);g2.lineTo(500+sd*430,990);g2.lineTo(500+sd*480,1065);g2.lineTo(500+sd*380,1045);g2.stroke();}
  g2.font='bold 78px Georgia, "Times New Roman", serif';g2.textAlign='center';g2.textBaseline='middle';g2.letterSpacing='10px';g2.fillText('BUT SO COOL',500,1022);
  const c=document.createElement('canvas');c.width=art.width;c.height=art.height;const x2=c.getContext('2d');
  for(const [dx,dy] of [[0,0],[3,0],[-3,0],[0,3],[0,-3],[2,2],[-2,-2],[2,-2],[-2,2]])x2.drawImage(art,dx,dy);
  x2.globalCompositeOperation='source-in';x2.fillStyle='#fff';x2.fillRect(0,0,c.width,c.height);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const geo=new T.PlaneGeometry(size,size*c.height/c.width),shades=['#8E8296','#A397AA','#B6AABC','#C9BECD','#DDD3DF'];
  // 熊爸：陰雕看看——線條往牆裡刻：右下緣受光、溝底與左上緣是陰影。
  const layers=sunken?[['#EFE7F0',.014,-.014],['#8A7E92',0,0],['#6E6378',-.008,.008]]:shades.map((col,k)=>[col,-.012*(4-k),-.012*(4-k)]);
  layers.forEach(([col,dx,dy],k)=>{const m=new T.Mesh(geo,new T.MeshLambertMaterial({map:tex,color:col,transparent:true,alphaTest:.4}));m.position.set(dx,dy,k*.004+(sunken?.005:k*.01));p.add(m);});};
 img.src=url;return p;}
function house(g,x,z,scale=1){const h=group(g,x,0,z);h.scale.setScalar(scale);const H=5.4;
 cyl(h,3.3,.3,P.wallDark,0,.3,0,10).scale.set(1.15,1,.85);
 box(h,4.6,H,3.4,P.wall,0,.3+H/2,0);for(let i=0;i<8;i++)if(i!==4)box(h,4.65,.05,3.45,P.wallDark,0,.9+i*.62,0);
 box(h,4.85,.22,3.65,P.wallDark,0,3.2,0);box(h,4.8,.18,3.6,P.wallDark,0,.3+H,0);
 roof(h,5.2,4,2.1,P.coffee,0,.3+H,0);
 grandDoor(h,1.72);
 for(const dx of [-1.9,1.9])windowPane(h,dx,1.85,1.72,.42,.8);
 for(const dx of [-1.55,0,1.55])windowPane(h,dx,4.35,1.72,.6,1);
 const bal=group(h,0,3.45,1.95);box(bal,1.4,.14,.6,P.wallDark,0,0,0);for(let i=0;i<6;i++)box(bal,.09,.42,.09,P.wall,-.6+i*.24,.28,.26);box(bal,1.4,.09,.12,P.wallDark,0,.52,.26);for(const s of [-1,1])box(bal,.09,.42,.5,P.wall,s*.66,.28,0);
 stoneRelief(h,'assets/brand/狗頭_折線.png',0,6.38,2.2,1.1,true);
 roundTower(h,-2.75,1.55,.85,5.8);roundTower(h,2.9,-1.6,.95,6.8);
 const sq=group(h,-2.5,0,-1.9);box(sq,1.7,6.8,1.7,P.wall,0,3.7,0);merlons(sq,0,0,1.7,1.7,7.25);windowPane(sq,0,5.4,.86,.35,.6);windowPane(sq,0,3,.86,.35,.6);
 box(h,.6,1.4,.7,P.terra,1.3,7.1,-.6);
 for(let i=0;i<3;i++)box(h,2.4-i*.2,.2,.6,P.cobbleDark,0,.15+i*.18,2.4-i*.35);return h;
}
export function home(g){house(g,.6,-4.8,2.15);tree(g,-4.6,2.8,1.1,true);tree(g,5.4,-2.7,.7,true);
 const deck=group(g,3.8,0,3);box(deck,2.1,.18,1.5,P.wood,0,1.35,0);for(const x of [-.7,.7])box(deck,.13,1.3,.8,P.darkWood,x,.7,0);bench(g,3.8,4.5);bench(g,3.8,1.5,Math.PI);
 cyl(g,.7,.8,P.coffee,5.8,.8,1.5,10);box(g,1.6,.12,1.2,P.ink,5.8,1.3,1.5);line(g,[5.8,.6,1.5],[5.8,1.2,1.5],P.darkWood);
 const clothes=group(g,11,0,1.5);cyl(clothes,.08,3,P.darkWood,0,1.5,0,8);for(let i=0;i<4;i++){const a=i*Math.PI/2;line(clothes,[0,2.7,0],[Math.sin(a)*1.5,2.7,Math.cos(a)*1.5],P.darkWood,.035);}line(clothes,[-1.5,2.7,0],[0,2.7,1.5],P.cream,.025);box(clothes,.7,.9,.04,P.pink,-.55,2.25,.8);
 cyl(g,2.3,.06,P.sea,15.5,.35,-4.5,28);cyl(g,2.55,.04,'#E3CDA6',15.5,.33,-4.5,28);for(let i=0;i<8;i++)ball(g,.24+(i%3)*.07,P.cliff,15.5+Math.cos(i*.8)*2.5,.4,-4.5+Math.sin(i*.8)*2.5);
 cyl(g,.35,.18,P.pink,1,.4,2,12);ball(g,.21,P.mustard,-2,.5,3.5);box(g,.5,.75,.45,P.terra,5,.65,5);cyl(g,.07,1,P.darkWood,5,.6,5,6);
 for(let i=0;i<4;i++)plant(g,-2.5+i*.7,1,P.pink);
 board(g,0,6.6);bench(g,-11.5,-4,1.2);return {};
}
function marketStall(g,x,z,color){const s=group(g,x,0,z);box(s,2.6,1.15,1.2,P.wood,0,.8,0);for(const a of [-1.25,1.25])box(s,.1,2.6,.1,P.darkWood,a,1.55,0);for(let i=0;i<8;i++){box(s,.36,.12,2,i%2?P.cream:color,-1.25+i*.36,2.9,0);box(s,.36,.45,.07,i%2?P.cream:color,-1.25+i*.36,2.62,1);}
 for(let i=0;i<3;i++){box(s,.6,.25,.55,i===1?P.pink:P.cream,-.8+i*.8,1.52,0);ball(s,.13,P.mustard,-.9+i*.85,2.45,.6);}return s;
}
function scooter(g,x,z){const s=group(g,x,0,z);for(const d of [-.55,.55]){const w=cyl(s,.26,.13,P.ink,0,.4,d,10);w.rotation.z=Math.PI/2;}box(s,.35,.45,.9,P.sage,0,.65,0);box(s,.4,.12,.55,P.coffee,0,.97,-.1);line(s,[0,.5,.55],[0,1.4,.65],P.sage,.07);line(s,[-.3,1.4,.65],[.3,1.4,.65],P.coffee,.045);}
export function market(g){
 for(let x=-6;x<=6;x+=2)for(let z=-6;z<=4;z+=2)if(Math.hypot(x,z)<7.5)box(g,1.9,.06,1.9,((x+z)/2)%2?P.cream:'#E2B393',x,.33,z);
 for(let k=0;k<3;k++){const h=group(g,-3.4+k*3.2,0,-3.1);box(h,3,4,2.8,P.terra,0,2.3,0);box(h,3.05,.18,2.95,P.wood,0,2.5,0);roof(h,3.4,3.2,1.1,P.coffee,0,4.3,0);box(h,2.3,1.5,.1,P.darkWood,0,1.45,1.47);for(const x of [-1.28,1.28])box(h,.22,2.25,.22,P.cream,x,1.3,2.2);box(h,3.3,.22,1.2,P.cream,0,2.55,1.85);windowPane(h,0,3.4,1.48,1.2,.8);for(let i=-2;i<=2;i++)box(h,.035,.75,.2,P.coffee,i*.2,3.4,1.6);box(h,2.2,.45,.16,P.coffee,0,2.13,1.6);}
 marketStall(g,-4,2.6,P.terra);marketStall(g,0,3.9,P.mustard);marketStall(g,4,2.4,P.sage);
 const gate=group(g,4.8,0,-.5);for(const x of [-1.4,1.4])cyl(gate,.19,3.1,P.terra,x,1.6,0,8);box(gate,3.5,.35,.7,P.terra,0,3,0);roof(gate,4.2,1.4,.6,P.coffee,0,3.2,0);for(const x of [-2,2])line(gate,[x*.5,3.4,0],[x,4,0],P.terra,.14);
 line(g,[-5.5,3.8,-1.2],[5.6,3.8,-1.2],P.darkWood,.035);for(let i=0;i<7;i++){const x=-5+i*1.65;ball(g,.27,P.terra,x,3.4,-1.2,.8,1.2,.8);cyl(g,.14,.08,P.mustard,x,3.08,-1.2,6);}
 scooter(g,-5.4,-.7);scooter(g,-4.6,-.7);board(g,1,0);
 for(let i=0;i<4;i++)box(g,1.1,.55,.75,P.cream,5.7,.6+(i%2)*.56,4.5-Math.floor(i/2)*.9);
 for(const x of [-6,6])plant(g,x,1,P.mustard);tree(g,-6,4.8,.55);return {sign:[1,2.2,.13]};
}
export function farm(g){
 cyl(g,2.7,.1,'#BDAD7E',-3,.34,2.2,18);fence(g,[-6,-5],[6,-5]);fence(g,[-6,-5],[-6,4]);fence(g,[6,-5],[6,4]);fence(g,[-6,4],[-2,4]);fence(g,[2,4],[6,4]);fence(g,[0,-5],[0,-1]);
 const shed=group(g,3,0,-2.6);box(shed,3,2.6,3,P.wall,0,1.65,0);box(shed,1.2,2.3,.12,P.coffee,0,1.5,1.55);windowPane(shed,0,2,1.64,.6,.4);box(shed,1,.7,.6,'#B7BCB1',2,1,.1);roof(shed,3.6,3.6,.55,P.coffee,0,3,0);
 const barn=group(g,-3,0,-2.7);box(barn,3,2.3,2.8,P.terra,0,1.4,0);roof(barn,3.7,3.4,1.2,P.coffee,0,2.55,0);box(barn,1.6,1.8,.1,P.cream,0,1.2,1.45);line(barn,[-.75,.4,1.52],[.75,2,1.52],P.wood,.06);line(barn,[.75,.4,1.52],[-.75,2,1.52],P.wood,.06);
 tree(g,5.3,1.8,.75);box(g,1.8,.4,.8,'#C1D2CF',2.5,.55,2.7);box(g,1.5,.4,.5,P.sea,2.5,.72,2.7);
 for(let i=0;i<3;i++){const h=cyl(g,.55,1.2,P.mustard,-5+i*.9,.9,0,10);h.rotation.z=Math.PI/2;}
 const coop=group(g,-2,0,5.7);box(coop,1.6,1.2,1.5,P.wood,0,1,0);roof(coop,2,1.9,.7,P.terra,0,1.6,0);box(coop,.5,.7,.1,P.coffee,0,.8,.8);
 board(g,0,5.5);for(let i=0;i<10;i++){const a=i*2.4;ball(g,.25,P.grassDark,Math.sin(a)*6,.4,Math.cos(a)*6,1,.4,1);}return {};
}
export function kitchen(g){
 for(let x=-6;x<=6;x+=1.32)for(let z=-3.3;z<=3.4;z+=1.32)box(g,1.24,.12,1.24,(Math.round(x/1.32)+Math.round(z/1.32))%2?P.cobble:P.cobbleDark,x,.35,z);
 const shed=group(g,0,0,-2);for(const x of [-3.2,3.2])for(const z of [-2,2])box(shed,.23,4.2,.23,P.darkWood,x,2.5,z);roof(shed,7.7,5.7,1.3,P.coffee,0,4.4,0);
 box(g,6,.95,1.8,P.cream,0,.88,1.5);box(g,6.4,.22,2.1,'#FFF9F0',0,1.45,1.5);for(let i=0;i<4;i++)box(g,1.2,.6,.08,P.wood,-2.2+i*1.45,.9,2.46);
 // BAMIX and sauce cup.
 cyl(g,.45,.7,'#C0D3CA',-1.8,1.95,1.5,14);cyl(g,.37,.08,P.mustard,-1.8,2.35,1.5,14);cyl(g,.12,1.4,P.cream,-1.8,2.85,1.5,10);cyl(g,.08,.45,'#AAB9B5',-1.8,2.3,1.5,10);
 box(g,.8,.85,.55,P.darkWood,.1,2,1.5);for(let i=0;i<4;i++){box(g,.08,.6,.2,P.coffee,-.16+i*.17,2.65,1.5);box(g,.05,.5,.23,'#B8C4C1',-.16+i*.17,2.25,1.5);}
 cyl(g,.73,.15,P.ink,1.9,1.7,1.5,16);box(g,.15,.13,1,P.ink,1.9,1.7,2.5);const steak=ball(g,.5,'#A65748',1.9,1.87,1.5,1,.22,.8);for(let i=0;i<3;i++)box(g,.5,.02,.045,P.cream,1.9,1.99,1.25+i*.2);
 box(g,4.5,1.25,.9,P.wood,0,1.1,-3.2);box(g,1.5,1,.95,P.coffee,1.2,1.2,-3.2);windowPane(g,1.2,1.2,-2.68,1,.6);
 line(g,[-2.6,3.4,-3], [2.6,3.4,-3],P.darkWood,.055);for(let i=0;i<4;i++){const pan=cyl(g,.35,.12,P.coffee,-1.8+i,2.9,-3,12);pan.rotation.x=Math.PI/2;line(g,[-1.8+i,3.1,-3],[-1.8+i,3.55,-3],P.ink,.04);}
 for(let i=0;i<5;i++)cyl(g,.15,.3,[P.terra,P.mustard,P.sage][i%3],-2+i*.4,1.9,-3.2,8);
 for(const x of [-5,-3.5,-2,2,3.5,5])plant(g,x,5.4,P.sage);bench(g,-4,2,.5);box(g,1.7,.55,1.7,P.terra,4.7,.65,4.6);for(let i=0;i<4;i++)ball(g,.3,P.sage,4.2+(i%2)*.8,1.1,4.2+Math.floor(i/2)*.8);return {};
}
export function library(g,posts=0){
 for(let i=0;i<5;i++)box(g,3,.12,1,i%2?P.cobble:P.cobbleDark,0,.39+i*.05,5.1-i*.9);
 // 10/23 熊爸：知識圖書館做得像參考影片裡的教堂——高石牆、陡魚鱗瓦屋頂、階梯山牆、尖拱長窗、玫瑰窗、扶壁、山牆頂小鐘樓。
 const h=group(g,-1,0,-2.2);box(h,4.2,4.6,5.6,P.wall,0,2.6,0);for(let i=0;i<6;i++)box(h,4.25,.05,5.65,P.wallDark,0,.9+i*.75,0);roof(h,4.9,6.2,3.1,P.coffee,0,4.9,0);
 box(h,1.2,2.3,.14,P.coffee,0,1.45,2.82);const door=cyl(h,.6,.14,P.coffee,0,2.6,2.82,10);door.rotation.x=Math.PI/2;box(h,1.7,.25,.3,P.wallDark,0,3.25,2.86);
 const rose=cyl(h,.62,.16,P.wallDark,0,4.15,2.82,12);rose.rotation.x=Math.PI/2;const roseGlass=cyl(h,.48,.18,P.glass,0,4.15,2.84,12);roseGlass.rotation.x=Math.PI/2;for(let i=0;i<4;i++){const spoke=box(h,.9,.05,.2,P.wallDark,0,4.15,2.9);spoke.rotation.z=i*Math.PI/4;}
 for(const sd of [-1,1]){for(const z of [-1.8,0,1.8]){const w=windowPane(h,sd*2.12,2.9,z,.55,1.5);w.parent.children.slice(-6).forEach(m=>{m.rotation.y=sd*Math.PI/2;});}for(const z of [-2.7,-.9,.9,2.7])box(h,.45,3.4,.5,P.wallDark,sd*2.25,1.9,z);}
 const bell=group(h,0,8.1,2.6);box(bell,.9,1.1,.7,P.wall,0,0,0);box(bell,.5,.6,.75,P.ink,0,0,0);spire(bell,.6,1.1,0,.55,0);

 const tower=group(g,3.6,0,-2);const levels=Math.max(3,Math.ceil(posts/5));for(let j=0;j<levels;j++){box(tower,2.3,.15,1.2,P.darkWood,0,.5+j*1.1,0);for(let i=0;i<7;i++){const book=box(tower,.21,.55+(i%3)*.12,.65,[P.pink,P.sage,P.mustard,P.cream,P.terra][i%5],-.9+i*.3,.85+j*1.1,0);book.rotation.z=(i%3-1)*.08;}}for(const x of [-1.13,1.13])box(tower,.13,levels*1.1,.95,P.darkWood,x,levels*.55+.4,0);
 spire(tower,1.35,2.2,0,levels*1.1+.45,0);bench(g,-4.5,3.6,.3);tree(g,-5.4,-2,.65);tree(g,5.7,2.5,.65);board(g,2.5,4.7);
 cyl(g,.08,3.6,P.coffee,-3,1.8,4,8);ball(g,.32,P.lamp,-3,3.6,4);for(let i=0;i<3;i++){const b=box(g,1,.12,.65,[P.pink,P.sage,P.mustard][i],-1+i,.5,3);b.rotation.y=i*.5;}
 for(let i=0;i<4;i++)plant(g,-4.5+i*.75,-5,P.pink);return {};
}
export function help(g){
 // The support island shares the organic terrain; its beach is part of the coast.
 const lighthouse=group(g,2,0,-1.5);cyl(lighthouse,1,4.7,P.cream,0,2.6,0,12,1.35);cyl(lighthouse,1.2,.35,P.terra,0,4.75,0,12);cyl(lighthouse,.84,.9,'#C0D3CA',0,5.35,0,12);for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(lighthouse,.05,1,P.coffee,Math.sin(a)*.85,5.35,Math.cos(a)*.85,6);}cyl(lighthouse,.05,.85,P.terra,0,6.15,0,12,1.35);cyl(lighthouse,1.38,.13,P.cream,0,5.83,0,12);
 const hut=group(g,-2,0,-.7);box(hut,2.7,2.2,2.6,P.wall,0,1.45,0);roof(hut,3.4,3.3,.85,P.coffee,0,2.6,0);box(hut,1.8,.7,.15,P.coffee,0,2.1,1.4);windowPane(hut,0,1.25,1.4,1.8,.7);
 umbrella(g,1.5,3.2,P.pink);bench(g,.2,4.3);for(let i=0;i<5;i++){const a=i*2.4;ball(g,.4,P.cliffDark,Math.sin(a)*5.7,.55,Math.cos(a)*5.7,1,.6,.8);}board(g,-3,3);plant(g,-3,-2,P.mustard);return {sign:[-2,2.1,.88]};
}
export const builders={home,market,farm,kitchen,library,help};
