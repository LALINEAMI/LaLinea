export const ENGINE_VERSION='lalinea-rewards-3.0.0-hard';
export const WIDTH=960, HEIGHT=540, FLOOR=430;
export const ZONES=[
  {name:'Duomo',label:'Sotto la Madonnina',sky:'#87d4f4',light:'#e6f9fc',accent:'#ffab40',color:'#f9eac9',scene:'duomo'},
  {name:'Porta Venezia',label:'Tra tram e bastioni',sky:'#9ddcf7',light:'#fff0da',accent:'#f87545',color:'#f5c497',scene:'porta'},
  {name:'Navigli',label:'Un salto sui Navigli',sky:'#ffb57f',light:'#ffe9ab',accent:'#fc7450',color:'#e89981',scene:'navigli'},
  {name:'Gae Aulenti',label:'La città guarda in alto',sky:'#95dbe9',light:'#eaf6d7',accent:'#63c7a4',color:'#7fb4c2',scene:'skyline'},
  {name:'Arco della Pace',label:'La corsa continua',sky:'#b3daf2',light:'#ffe5ba',accent:'#fca853',color:'#f1d0a0',scene:'arco'},
  {name:'San Siro',label:'Un livello da campioni',sky:'#9bbfe8',light:'#d5edf8',accent:'#ff8756',color:'#a9b0c6',scene:'stadio'},
  {name:'Piazzale Loreto',label:'Incroci ad alta velocità',sky:'#db97d7',light:'#ffd6ba',accent:'#f97e9a',color:'#bd8a91',scene:'porta'},
  {name:'Corso Como',label:'Milano si accende',sky:'#44448b',light:'#e1add5',accent:'#fc7eac',color:'#6f6ba5',scene:'skyline'},
  {name:'Castello Sforzesco',label:'La sfida sotto le torri',sky:'#596caa',light:'#e5a5a6',accent:'#ffb86f',color:'#c57965',scene:'castello'},
  {name:'Bicocca',label:'La grande finale',sky:'#263e72',light:'#aebbe9',accent:'#48dbb0',color:'#748ca5',scene:'skyline'}
];
export const money=cents=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(cents/100);
export function reward(level){if(level===1)return 200;if(level===2)return 500;if(level===3)return 1000;return (10+Math.round((level-3)*190/47))*100;}
export function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function makeLevel(n,seed=0){
  n=Math.min(50,Math.max(1,Math.floor(n))); const rand=random(n*85127+seed), difficulty=(n-1)/49;
  const terrain=[], platforms=[], items=[], enemies=[], checkpoints=[];
  const sections=7+Math.min(n-1,2)+Math.floor(n/5);let x=0;
  function item(ix,iy,type){items.push({id:items.length,x:ix,y:iy,w:22,h:26,type,collected:false});}
  for(let s=0;s<sections;s++){
    const length=600+Math.floor(rand()*80), ground={x,y:FLOOR,w:length,h:HEIGHT-FLOOR+120,kind:'ground'};terrain.push(ground);
    const top={x:x+128,y:327-Math.floor(rand()*12),w:160,h:22,kind:'ledge'};platforms.push(top);
    if(s%2===1)platforms.push({x:x+328,y:251,w:140,h:22,kind:'ledge'});
    for(let i=0;i<7;i++)item(x+62+i*77,FLOOR-34, i%4===0?'seed':i%4===2?'gadget':'coin');
    for(let i=0;i<3;i++)item(top.x+19+i*49,top.y-35,i===1?'gadget':'coin');
    if(s%2===1)for(let i=0;i<2;i++)item(x+354+i*52,214,'seed');
    if(s>=0){
      enemies.push({x:x+390,y:FLOOR-58,w:36,h:58,base:x+390,range:66+36*difficulty,speed:110+n*2.8,phase:rand()*6.28,kind:'police',disabled:false});
      if(n>=3||(n===2&&s%2===0))enemies.push({x:x+240,y:FLOOR-58,w:36,h:58,base:x+240,range:44,speed:120+n*3,phase:rand()*6.28,kind:'police',disabled:false});
    }
    if(n>=16&&s%2===1)enemies.push({x:top.x+60,y:top.y-58,w:36,h:58,base:top.x+60,range:38,speed:105+n*2.1,phase:rand()*6.28,kind:'police',disabled:false});
    if(n<=10&&s>0&&s%5===0)checkpoints.push({x:x+56,y:FLOOR,active:false});
    if(s<sections-1){
      const gap=105+Math.floor(difficulty*40+rand()*12);
      for(let i=0;i<3;i++)item(x+length-13+i*(gap+26)/2,FLOOR-103-Math.sin(i*Math.PI/2)*20,'coin');
      x+=length+gap;
    }else x+=length;
  }
  return {number:n,zone:ZONES[Math.floor((n-1)/5)],width:x,terrain,platforms,items,enemies,checkpoints,goal:x-110,required:Math.ceil(items.length*(.80+.02*Math.min(n-1,2)+.06*difficulty)),time:Math.ceil(x/310*2.2+24),reward:reward(n)};
}
export function newProgress(){return{version:1,unlocked:1,completed:{},highestBonus:0,recordedBonus:0,allCoins:0};}
export function normalizeProgress(data){
  const p=newProgress();if(!data||data.version!==1)return p;
  const completed={};for(const [k,v]of Object.entries(data.completed||{})){const n=Number(k);if(Number.isInteger(n)&&n>=1&&n<=50&&v&&Number.isFinite(v.coins))completed[k]={coins:Math.max(0,Math.floor(v.coins)),stars:Math.max(1,Math.min(3,Math.floor(v.stars)||1))};}
  p.completed=completed;
  let contiguous=0;while(completed[contiguous+1]&&contiguous<50)contiguous++;
  p.unlocked=Math.min(50,contiguous+1);p.highestBonus=contiguous?reward(contiguous):0;
  p.recordedBonus=Math.min(p.highestBonus,Math.max(0,Number(data.recordedBonus)||0));
  p.allCoins=Object.values(completed).reduce((sum,v)=>sum+v.coins,0);return p;
}
export function recordCompletion(progress,level,coins,hearts){
  const old=progress.completed[level];progress.completed[level]={coins:Math.max(old?.coins||0,coins),stars:Math.max(old?.stars||0,hearts)};
  progress.unlocked=Math.max(progress.unlocked,Math.min(50,level+1));progress.highestBonus=Math.max(progress.highestBonus,reward(level));
  progress.allCoins=Object.values(progress.completed).reduce((sum,v)=>sum+v.coins,0);return progress;
}
export class Game{
  constructor(level=1,seed=0){this.load(level,seed);}
  load(level,seed=0){
    this.level=makeLevel(level,seed);this.player={x:56,y:FLOOR-64,w:72,h:64,vx:0,vy:0,grounded:true,facing:1,coyote:.12,invincible:0};
    this.spawn={x:56,y:FLOOR-64};this.elapsed=0;this.remaining=this.level.time;this.hearts=2;this.coins=0;this.camera=0;this.mode='ready';this.jumpBuffer=0;this.jumpHeld=false;this.particles=[];this.events=[];this.goalHint=0;
  }
  start(){if(this.mode==='ready')this.mode='playing';}
  emit(type,data={}){this.events.push({type,...data});}
  drainEvents(){const events=this.events;this.events=[];return events;}
  burst(x,y,color,count=10){for(let i=0;i<count;i++)this.particles.push({x,y,vx:Math.cos(i*2.399)*100,vy:-70-Math.sin(i*2.399)*100,t:.65,color});}
  hit(){
    if(this.player.invincible>0||this.mode!=='playing')return;
    this.hearts--;this.emit('hit');if(this.hearts===0){this.mode='lost';this.emit('lost',{reason:'hearts'});return;}
    this.respawn();
  }
  respawn(){Object.assign(this.player,{x:this.spawn.x,y:this.spawn.y,vx:0,vy:0,grounded:true,coyote:.12,invincible:.9});this.jumpBuffer=0;this.camera=Math.max(0,this.player.x-250);}
  step(dt,input={}){
    dt=Math.min(.025,Math.max(0,dt));
    for(const pt of this.particles){pt.t-=dt;pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vy+=350*dt;}this.particles=this.particles.filter(pt=>pt.t>0);
    if(this.mode!=='playing')return;
    this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);this.goalHint=Math.max(0,this.goalHint-dt);
    if(this.remaining===0){this.mode='lost';this.emit('lost',{reason:'time'});return;}
    const p=this.player;const jump=!!input.jump;
    if(jump&&!this.jumpHeld)this.jumpBuffer=.13;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    if(!jump&&this.jumpHeld&&p.vy<-300)p.vy*=.57;this.jumpHeld=jump;
    p.invincible=Math.max(0,p.invincible-dt);p.coyote=p.grounded?.12:Math.max(0,p.coyote-dt);
    const direction=(input.right?1:0)-(input.left?1:0);const target=direction*310;
    p.vx+=(target-p.vx)*Math.min(1,dt*(direction?18:23));if(direction)p.facing=direction;
    if(this.jumpBuffer>0&&p.coyote>0){p.vy=-715;p.grounded=false;p.coyote=0;this.jumpBuffer=0;this.emit('jump');}
    const solids=[...this.level.terrain,...this.level.platforms];
    p.x+=p.vx*dt;p.x=Math.max(0,Math.min(this.level.width-p.w,p.x));
    for(const s of solids)if(overlap(p,s)){if(p.vx>0)p.x=s.x-p.w;else if(p.vx<0)p.x=s.x+s.w;p.vx=0;}
    const previousBottom=p.y+p.h;p.vy+=1830*dt;p.y+=p.vy*dt;p.grounded=false;
    for(const s of solids){if(!overlap(p,s))continue;if(p.vy>=0&&previousBottom<=s.y+6){p.y=s.y-p.h;p.vy=0;p.grounded=true;}else if(p.vy<0){p.y=s.y+s.h;p.vy=25;}}
    for(const it of this.level.items)if(!it.collected&&overlap(p,it)){it.collected=true;this.coins++;this.burst(it.x+11,it.y+13,it.type==='seed'?'#55db85':it.type==='gadget'?'#ac8af5':'#ffd965',7);this.emit('collect',{kind:it.type});}
    for(const cp of this.level.checkpoints)if(!cp.active&&p.x>=cp.x){cp.active=true;this.spawn={x:cp.x+18,y:FLOOR-p.h};this.emit('checkpoint');}
    for(const e of this.level.enemies){if(e.disabled)continue;e.x=e.base+Math.sin(this.elapsed*e.speed/70+e.phase)*e.range;if(!overlap(p,e))continue;
      if(p.vy>0&&previousBottom<=e.y+14){e.disabled=true;p.vy=-440;this.burst(e.x+18,e.y+12,'#ffaf62');this.emit('bounce');}
      else if(p.invincible<=0){this.hit();return;}
    }
    if(p.y>HEIGHT+100){p.invincible=0;this.hit();return;}
    if(p.x+p.w>=this.level.goal){if(this.coins>=this.level.required){this.mode='won';this.emit('won',{coins:this.coins,level:this.level.number,hearts:this.hearts});this.burst(p.x,p.y,'#ffe476',32);}else if(this.goalHint===0){this.goalHint=3;this.emit('need-coins',{missing:this.level.required-this.coins});}}
    this.camera=Math.max(0,Math.min(this.level.width-WIDTH,p.x-WIDTH*.29));
  }
}
