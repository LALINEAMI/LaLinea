import {HEIGHT,FLOOR,WIDTH} from './core.mjs?v=20261019-hard3';
const P={black:'#08090c',gray:'#505967',white:'#f6f4dc',yellow:'#ffdb35',green:'#43df80'};
const snap=n=>Math.round(n);
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(snap(x),snap(y),snap(w),snap(h));}
function pix(c,x,y,rows,palette,scale=2){for(let yy=0;yy<rows.length;yy++)for(let xx=0;xx<rows[yy].length;xx++){const color=palette[rows[yy][xx]];if(color)box(c,x+xx*scale,y+yy*scale,scale,scale,color);}}
function label(c,t,x,y,size=12,color=P.white){c.fillStyle=color;c.font=`bold ${size}px monospace`;c.fillText(t,snap(x),snap(y));}
function cloud(c,x,y){box(c,x+16,y,42,10,'#eff7ff');box(c,x+6,y+10,74,10,'#eff7ff');box(c,x,y+20,88,10,'#eff7ff');box(c,x+8,y+30,68,8,'#ccdff1');}
function windows(c,x,y,w,h,color){for(let yy=y+14;yy<y+h-10;yy+=24)for(let xx=x+12;xx<x+w-10;xx+=21)box(c,xx,yy,7,11,color);}
function building(c,x,base,w,h,color,light='#b4c9d5'){box(c,x,base-h,w,h,color);box(c,x-4,base-h-6,w+8,6,P.gray);windows(c,x,base-h,w,h,light);}
function duomo(c,x,y){box(c,x-126,y-108,252,108,'#c8ccd1');box(c,x-98,y-138,196,30,'#d8d9d2');box(c,x-70,y-160,140,22,'#e0e1d8');box(c,x-38,y-186,76,26,'#ecebd8');box(c,x-14,y-212,28,26,'#ecebd8');for(let i=-4;i<=4;i++){const xx=x+i*28,h=108+(4-Math.abs(i))*20;box(c,xx-3,y-h-24,6,h+24,'#f4f0d9');box(c,xx-7,y-h-17,14,7,'#d9d9d0');box(c,xx-1,y-h-32,2,10,'#f4f0d9');}box(c,x-3,y-266,6,53,'#f5f0d9');box(c,x-2,y-278,4,12,P.yellow);box(c,x-5,y-275,10,3,P.yellow);for(const off of[-78,0,78]){box(c,x+off-15,y-60,30,60,'#747e8f');box(c,x+off-11,y-70,22,10,'#747e8f');box(c,x+off-3,y-65,6,65,'#cacdbf');}for(const off of[-46,46]){box(c,x+off-7,y-130,14,35,'#6fa8cf');box(c,x+off-4,y-138,8,8,'#6fa8cf');}box(c,x-13,y-161,26,26,'#989d91');box(c,x-9,y-157,18,18,'#dfdec3');box(c,x-1,y-157,2,18,'#838b86');box(c,x-9,y-149,18,2,'#838b86');box(c,x-142,y,284,8,'#626b77');}
function arco(c,x,y){box(c,x-106,y-148,212,148,'#c0c3c9');box(c,x-118,y-168,236,20,'#e2e2d2');box(c,x-89,y-196,178,28,'#d2d3c7');box(c,x-32,y-96,64,96,'#86aad0');box(c,x-24,y-110,48,14,'#86aad0');for(const s of[-1,1]){box(c,x+s*78-12,y-76,24,76,'#86aad0');box(c,x+s*51-3,y-143,6,143,'#e6e5d6');}for(let i=-2;i<=2;i++){box(c,x+i*21-8,y-217,16,8,'#448674');box(c,x+i*21-5,y-209,4,13,'#448674');}}
function skyline(c,x,y){building(c,x-64,y,82,245,'#486e95','#96b8cf');box(c,x+38,y-324,64,324,'#3a769c');box(c,x+49,y-344,42,20,'#3a769c');box(c,x+67,y-403,4,59,'#3a769c');windows(c,x+40,y-324,60,324,'#a0c3da');building(c,x+138,y,76,182,'#465a56','#97b89e');for(let i=0;i<6;i++)box(c,x+132,y-173+i*29,91,10,'#4d9459');}
function castello(c,x,y){box(c,x-145,y-112,290,112,'#955d50');box(c,x-31,y-212,62,212,'#ba7357');box(c,x-40,y-164,80,13,'#d6946f');for(let i=-3;i<=3;i++)box(c,x+i*11-4,y-224,8,17,'#b5765c');for(const s of[-1,1]){box(c,x+s*136-22,y-143,44,143,'#b5795c');for(let i=0;i<4;i++)box(c,x+s*136-22+i*13,y-155,7,19,'#b5795c');}box(c,x-18,y-56,36,56,'#3e3c4b');box(c,x-13,y-145,26,26,'#f2ddb5');box(c,x-1,y-145,2,14,'#6b534b');box(c,x-1,y-132,9,2,'#6b534b');}
function stadium(c,x,y){box(c,x-165,y-150,330,150,'#727c92');for(let i=0;i<6;i++)box(c,x-165,y-138+i*23,330,4,'#bbc1c8');for(const s of[-1,1]){box(c,x+s*136-14,y-183,28,183,'#8b98ac');for(let i=0;i<8;i++)box(c,x+s*136-19,y-172+i*23,38,6,'#c3ccd6');}box(c,x-190,y-198,380,16,'#c15d53');for(let i=-2;i<=2;i++)box(c,x+i*66-8,y-229,16,31,'#c15d53');label(c,'SAN SIRO',x-47,y-163,16,'#e3e8dc');}
function tram(c,x,y){box(c,x,y,156,45,'#f1c02c');box(c,x+8,y-5,138,5,'#ffe364');box(c,x,y+35,156,8,'#b27e22');for(let i=0;i<6;i++)box(c,x+9+i*23,y+7,17,23,'#243e56');for(const off of[29,128]){box(c,x+off-8,y+42,16,9,'#111723');box(c,x+off-4,y+44,8,5,'#727e85');}box(c,x+147,y+27,6,5,'#fff3a2');box(c,x+55,y-21,3,18,'#4c6174');box(c,x+55,y-21,30,3,'#4c6174');}

function rounded(c,x,y,w,h,r,fill,stroke=null,width=1){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function oval(c,x,y,rx,ry,fill,stroke=null,width=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function shape(c,points,fill,stroke=null,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function stroke(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function caption(c,value,x,y,size=12,color=P.white,align='left'){c.fillStyle=color;c.font=`800 ${size}px system-ui,sans-serif`;c.textAlign=align;c.fillText(value,x,y);c.textAlign='left';}
function badge(c,x,y,size=4){const points=[];for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?size*.43:size;points.push([x+Math.cos(angle)*r,y+Math.sin(angle)*r]);}shape(c,points,'#ffcf46');}
function wheel(c,x,y,time){oval(c,x,y,11,11,'#080b10','#778390',1.8);oval(c,x,y,7.5,7.5,'#48545e','#a8b5c0',1);oval(c,x,y,3,3,'#d7dde0');c.save();c.translate(x,y);c.rotate(time*9);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;stroke(c,[[Math.cos(a)*3,Math.sin(a)*3],[Math.cos(a)*7,Math.sin(a)*7]],'#b8c2c9',1.2);}c.restore();}
function bike(c,p,time,logo){
 if(p.invincible>0&&Math.floor(time*14)%2===0)return;
 c.save();c.translate(p.x+p.w/2,p.y+p.h);c.scale(p.facing,1);
 oval(c,0,2,38,4,'#12203635');
 wheel(c,-25,-10,Math.abs(p.vx)>25?time:0);wheel(c,26,-10,Math.abs(p.vx)>25?time:0);
 stroke(c,[[-26,-18],[-14,-10],[24,-12]],'#a4b1ba',3);
 shape(c,[[-37,-19],[-30,-29],[-12,-27],[2,-20],[17,-26],[23,-40],[31,-34],[36,-17],[29,-9],[-31,-10]],'#111721','#7b8792',1.3);
 shape(c,[[-31,-20],[-18,-25],[0,-22],[15,-16],[2,-11],[-31,-13]],'#2a333e');
 stroke(c,[[-30,-22],[-12,-24],[2,-19]],'#677481',1.5);
 rounded(c,-18,-12,41,5,2,'#777f89');rounded(c,-31,-32,28,6,3,'#080b10','#77818a',1);
 shape(c,[[20,-42],[24,-51],[29,-48],[31,-40],[24,-31]],'#77adcc','#24394c',1);
 rounded(c,29,-27,6,4,2,'#fff1b1');rounded(c,-37,-22,4,5,1,'#e87252');
 stroke(c,[[13,-38],[24,-36],[29,-39]],'#d0d9df',2);stroke(c,[[-23,-16],[-12,-17]],P.green,2.2);
 // Black jacket and helmet; the face stays behind the visor.
 rounded(c,-12,-45,23,21,7,'#151b25','#85909d',1.2);shape(c,[[-10,-42],[-17,-38],[-16,-27],[-10,-28]],'#202936','#75818c',.8);
 stroke(c,[[6,-40],[15,-32],[24,-35]],'#0c1119',7);stroke(c,[[7,-42],[15,-34],[23,-36]],'#697787',1.3);
 shape(c,[[-1,-27],[11,-25],[16,-17],[11,-14],[4,-21],[-7,-22]],'#202735','#626e7a',1);
 rounded(c,10,-17,12,5,2,'#c8d2d9','#273442',.8);
 oval(c,-2,-53,14,11,'#151c27','#a2acb5',1.3);shape(c,[[-13,-54],[-9,-61],[2,-63],[9,-58],[11,-53]],'#293546');
 rounded(c,-4,-55,19,7,3,'#80b7d2','#0a1622',1.3);stroke(c,[[1,-53],[8,-53]],'#d6f1f9',1);rounded(c,-10,-47,20,5,2,'#0b111c');
 if(logo)c.drawImage(logo,-9,-40,19,9);else stroke(c,[[-7,-36],[6,-36]],P.yellow,2);
 c.restore();
}
function police(c,e,time){
 if(e.disabled)return;
 c.save();c.translate(e.x+e.w/2,e.y+e.h);
 const walk=Math.sin(time*8+e.phase)*2.2;
 oval(c,0,1,17,3,'#18304a30');
 stroke(c,[[-6,-17],[-7-walk,-5]],'#19283b',9);stroke(c,[[6,-17],[7+walk,-5]],'#19283b',9);
 rounded(c,-13-walk,-6,12,5,2,'#101a27','#738ba0',.8);rounded(c,2+walk,-6,12,5,2,'#101a27','#738ba0',.8);
 rounded(c,-12,-36,24,23,5,'#2674b5','#143759',1.2);rounded(c,-12,-18,24,4,1,'#172739');rounded(c,-2,-18,4,4,1,'#ffd36a');
 stroke(c,[[-11,-31],[-15,-21+walk]],'#1d629c',6);stroke(c,[[11,-31],[15,-21-walk]],'#1d629c',6);
 oval(c,-15,-18+walk,3,3,'#ebbd98');oval(c,15,-18-walk,3,3,'#ebbd98');
 caption(c,'POLIZIA',0,-25,5.6,'#edf6fc','center');badge(c,-6,-32,3);
 oval(c,0,-43,10,10,'#e7b98f','#173552',1);oval(c,-10,-42,2,3,'#e7b98f');oval(c,10,-42,2,3,'#e7b98f');
 oval(c,-3,-43,1,1.2,'#20303d');oval(c,4,-43,1,1.2,'#20303d');stroke(c,[[-2,-37],[3,-37]],'#aa725e',1);
 rounded(c,-12,-56,24,10,4,'#2f79b3','#153b60',1.2);rounded(c,-14,-48,28,4,2,'#152b40');badge(c,0,-51,3.5);
 c.restore();
}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.view=WIDTH;this.scale=1;this.zoom=1.25;this.logo=null;this.popups=[];this.lastTime=0;
  if(typeof Image!=='undefined'){const image=new Image();image.onload=()=>{this.logo=image;};image.src='assets/lalinea-logo.png';}
 }
 setLogo(logo){this.logo=logo;}
 resize(w,h,dpr=1){this.view=HEIGHT*w/h;this.canvas.width=Math.round(w*Math.min(2,dpr));this.canvas.height=Math.round(h*Math.min(2,dpr));this.scale=this.canvas.height/HEIGHT;this.zoom=w<650?1.62:1.25;}
 logoAt(c,x,y,w,h){if(this.logo)c.drawImage(this.logo,x,y,w,h);else caption(c,'LaLinea',x+w/2,y+h*.8,10,P.yellow,'center');}
 pickup(p){const previous=this.popups.at(-1);if(previous&&this.lastTime-previous.t<.12){previous.count++;return;}this.popups.push({x:p.x+p.w/2,y:p.y-8,t:this.lastTime,count:1});}
 object(c,it,time){
  const x=it.x+it.w/2,y=it.y+it.h/2+Math.sin(time*3+it.id)*2;
  oval(c,x,y+3,24,23,'#ffffff16');
  if(it.type==='coin'){
   rounded(c,x-24,y-17,48,34,5,'#ffd94e','#986b1d',1.5);rounded(c,x-20,y-13,40,26,3,'#191e27');
   oval(c,x-24,y,3,3,'#adc2d1');oval(c,x+24,y,3,3,'#adc2d1');caption(c,'0,05 €',x,y+2,11,'#ffe574','center');caption(c,'BUONO',x,y+10,6.5,'#c9d3d9','center');
  }else if(it.type==='seed'){
   rounded(c,x-20,y-24,40,46,5,'#111722',P.green,1.3);rounded(c,x-18,y-22,36,4,2,'#77858f');this.logoAt(c,x-18,y-16,36,18);
   oval(c,x,y+6,5,6,'#d6b57f');stroke(c,[[x,y+5],[x+1,y]],'#5ddb8a',1.5);oval(c,x+4,y,3,1.5,'#61e593');caption(c,'SEMI',x,y+17,8.5,'#d7f7e2','center');
  }else{
   shape(c,[[x-10,y-22],[x-25,y-14],[x-20,y-3],[x-13,y-6],[x-13,y+20],[x+13,y+20],[x+13,y-6],[x+20,y-3],[x+25,y-14],[x+10,y-22],[x+4,y-18],[x-4,y-18]],'#121923','#c299ec',1.4);
   this.logoAt(c,x-13,y-9,26,13);stroke(c,[[x-12,y+17],[x+12,y+17]],'#64768a',1);caption(c,'GADGET',x,y+12,6.5,'#cab3ee','center');
  }
 }
 draw(game,time=0){
  this.lastTime=time;const c=this.ctx,view=this.view,zoom=this.zoom,z=game.level.zone,night=game.level.number>30,visible=view/zoom;
  const camera=Math.max(0,Math.min(Math.max(0,game.level.width-visible),game.player.x-visible*.28));
  c.setTransform(this.scale,0,0,this.scale,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const sky=c.createLinearGradient(0,0,0,390);sky.addColorStop(0,night?'#253855':'#477fd1');sky.addColorStop(1,night?'#768dad':'#d3e6f4');c.fillStyle=sky;c.fillRect(0,0,view,HEIGHT);
  for(let i=0;i<6;i++)cloud(c,((i*225+30-camera*.12)%(view+280)+view+280)%(view+280)-100,40+i%3*36);
  oval(c,view-116-camera*.025,80,29,29,night?'#fff4c7':'#ffe27b');
  c.save();c.globalAlpha=.78;
  for(let i=0;i<Math.ceil(view/100)+2;i++){const h=82+i%4*32,x=i*105-(camera*.2%105);building(c,x,342,89,h,night?'#29394b':'#54769e',night?'#d9c978':'#bdd0df');}
  const landmark=540-camera*.27%1500;
  for(let x=landmark;x<view+350;x+=1500){if(x<-350)continue;
   if(z.scene==='duomo')duomo(c,x,342);else if(z.scene==='arco')arco(c,x,342);else if(z.scene==='castello')castello(c,x,342);else if(z.scene==='stadio')stadium(c,x,342);else if(z.scene==='skyline')skyline(c,x-90,342);
   else if(z.scene==='navigli'){box(c,x-250,321,500,21,'#3c9aca');box(c,x-84,294,168,13,'#b6c3cc');box(c,x-103,307,19,36,'#b6c3cc');box(c,x+84,307,19,36,'#b6c3cc');}
   else{box(c,x-100,240,200,102,'#acb4be');box(c,x-34,266,68,76,'#547497');box(c,x-25,257,50,9,'#547497');}
  }
  c.restore();
  box(c,0,342,view,114,night?'#96a6b8':'#aebcc7');box(c,0,349,view,4,'#dce7ee');
  for(let i=0;i<Math.ceil(view/98)+1;i++)box(c,i*98-camera*.6%98,399,47,3,'#e0e7ed');
  tram(c,620-camera*.45%1300,295);
  c.save();c.translate(0,HEIGHT-84);c.scale(zoom,zoom);c.translate(-camera,-FLOOR);
  for(const s of game.level.terrain){if(s.x>camera+visible+40||s.x+s.w<camera-40)continue;
   rounded(c,s.x,s.y,s.w,s.h,3,'#171f2b');box(c,s.x,s.y,s.w,5,'#f2ecda');box(c,s.x,s.y+5,s.w,8,'#485565');
   for(let row=0;row<4;row++)for(let xx=0;xx<s.w;xx+=52){const x=s.x+xx+(row%2)*26,w=Math.min(50,s.x+s.w-x);if(w>1){rounded(c,x,s.y+17+row*33,w,30,2,'#303e4e');stroke(c,[[x+4,s.y+21+row*33],[x+w-4,s.y+21+row*33]],'#4d5d6d',1);}}
   box(c,s.x+s.w-3,s.y,3,18,'#f3ce62');
  }
  for(const s of game.level.platforms){if(s.x>camera+visible+40||s.x+s.w<camera-40)continue;
   rounded(c,s.x,s.y,s.w,s.h,4,'#111923','#919a82',1);box(c,s.x+3,s.y,s.w-6,3,P.yellow);
   for(let xx=40;xx<s.w;xx+=40)stroke(c,[[s.x+xx,s.y+4],[s.x+xx,s.y+s.h-2]],'#46505a',1);
   rounded(c,s.x+s.w/2-23,s.y+2,46,18,2,'#0c121a');this.logoAt(c,s.x+s.w/2-20,s.y+1,40,20);
  }
  for(const cp of game.level.checkpoints){rounded(c,cp.x,FLOOR-88,3,88,1,'#e0e9ec');rounded(c,cp.x+3,FLOOR-88,34,23,3,cp.active?P.green:'#798ea0');caption(c,'✓',cp.x+20,FLOOR-71,16,'#10232c','center');}
  for(const it of game.level.items)if(!it.collected&&it.x>camera-40&&it.x<camera+visible+40&&!(game.mode==='ready'&&it.x+it.w>game.player.x&&it.x<game.player.x+game.player.w))this.object(c,it,time);
  for(const e of game.level.enemies)if(e.x>camera-50&&e.x<camera+visible+50)police(c,e,time);
  const goal=game.level.goal;rounded(c,goal,FLOOR-152,4,152,2,'#ccdbe4');oval(c,goal+2,FLOOR-156,5,5,P.yellow);rounded(c,goal+4,FLOOR-152,94,47,4,'#111923',P.green,1);this.logoAt(c,goal+9,FLOOR-149,84,42);caption(c,'ARRIVO',goal+6,FLOOR-164,12,'#19293e');
  bike(c,game.player,time,this.logo);
  for(const pt of game.particles){c.globalAlpha=Math.max(0,pt.t/.65);oval(c,pt.x,pt.y,2,2,pt.color);}c.globalAlpha=1;
  this.popups=this.popups.filter(p=>time-p.t<.85);
  for(const p of this.popups){const age=time-p.t,value='+'+(p.count*.05).toFixed(2).replace('.',',')+' €';c.font='800 15px system-ui,sans-serif';c.textAlign='center';c.strokeStyle='#162234';c.lineWidth=3;c.strokeText(value,p.x,p.y-age*28);c.fillStyle='#fff6bf';c.fillText(value,p.x,p.y-age*28);c.textAlign='left';}
  if(game.mode==='ready')police(c,{x:camera+visible-62,y:FLOOR-58,w:36,h:58,phase:0},time);
  c.restore();
 }
}
