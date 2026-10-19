// LaLinea: user-supplied Super Mario Ground Theme as the default soundtrack.
export class AudioEngine{
  constructor(){this.enabled=false;this.volume=.28;this.ctx=null;this.running=false;this.music=new Audio(new URL('./assets/super-mario-ground-theme.mp3',import.meta.url).href);this.music.loop=true;this.music.preload='metadata';this.music.volume=this.volume;this.tick=0;this.next=0;this.interval=null;}
  unlock(){if(!this.enabled)return;this.ensure().catch(()=>{});const music=this.music;if(!music||this.running)return;music.muted=true;try{const playback=music.play();playback?.then(()=>{if(!this.running)music.pause();music.muted=false;}).catch(()=>{music.muted=false;});}catch{music.muted=false;}}
  async ensure(){if(!this.ctx){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return;this.ctx=new Context();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?this.volume*.3:0;this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')await this.ctx.resume();}
  async toggle(enabled){this.enabled=enabled;await this.ensure();this.setVolume(this.volume);if(!enabled)this.music?.pause();else if(this.running){if(this.music)this.music.play().catch(()=>{});else this.startMusic();}}
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume*.3:0,this.ctx.currentTime,.03);if(this.music)this.music.volume=this.volume;}
  tone(freq,at,duration=.12,type='square',gain=.3){if(!this.ctx||!this.enabled)return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(gain,at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(g);g.connect(this.master);osc.start(at);osc.stop(at+duration);}
  effect(kind){if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime;
    if(kind==='collect'){this.tone(880,t,.06,'triangle',.6);this.tone(1318,t+.045,.12,'triangle',.5);}
    else if(kind==='jump'){this.tone(330,t,.06,'square',.13);this.tone(494,t+.05,.07,'square',.13);}
    else if(kind==='hit'){this.tone(165,t,.12,'sawtooth',.35);this.tone(110,t+.1,.16,'sawtooth',.25);}
    else if(kind==='won'){[523,659,784,1046].forEach((f,i)=>this.tone(f,t+i*.13,.25,'triangle',.65));}
    else if(kind==='checkpoint')this.tone(698,t,.25,'triangle',.6);
    else if(kind==='bounce')this.tone(440,t,.12,'triangle',.4);
  }
  startMusic(){if(!this.ctx||!this.enabled||this.music)return;if(this.interval)return;this.next=this.ctx.currentTime+.03;this.tick=0;
    const melody=[60,67,72,69,65,72,76,74,67,71,74,79,76,72,69,65,62,69,74,72,67,74,77,76,65,69,72,77,74,71,67,62];
    this.interval=setInterval(()=>{if(!this.enabled||!this.running)return;while(this.next<this.ctx.currentTime+.16){const step=this.tick%32,note=melody[step];this.tone(440*2**((note-69)/12),this.next,.14,'square',.14);if(step%4===0)this.tone(440*2**((48+Math.floor(step/8)*2-69)/12),this.next,.2,'triangle',.5);this.tick++;this.next+=.16;}},70);
  }
  async play(){this.running=true;if(this.enabled&&this.music){this.music.muted=false;this.music.play().catch(()=>{});}await this.ensure();if(this.enabled&&!this.music)this.startMusic();}
  pause(){this.running=false;this.music?.pause();if(this.interval){clearInterval(this.interval);this.interval=null;}}
  useFile(file){this.pause();if(this.music){URL.revokeObjectURL(this.music.src);this.music.src='';}this.music=new Audio(URL.createObjectURL(file));this.music.loop=true;this.music.volume=this.volume;return file.name;}
}
