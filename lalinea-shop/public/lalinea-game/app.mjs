import {Game,ZONES,money,reward,newProgress,normalizeProgress,recordCompletion} from './core.mjs';
import {Renderer} from './render.mjs';
import {AudioEngine} from './audio.mjs';
const $=id=>document.getElementById(id), STORE='lalinea-milano-run-v1';
function readStore(key){try{return localStorage.getItem(key);}catch{return null;}}
function writeStore(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
let progress;try{progress=normalizeProgress(JSON.parse(readStore(STORE)));}catch{progress=newProgress();}
const game=new Game(progress.unlocked), renderer=new Renderer($('game')), audio=new AudioEngine();
const input={left:false,right:false,jump:false};let playAction=()=>startLevel(),modalWasPlaying=false,toastTimer,lastStamp=0,clock=0,accumulator=0,hudStamp=0;
audio.enabled=readStore('lalinea-audio')!=='off';audio.volume=Number(readStore('lalinea-volume')??.28);if(!Number.isFinite(audio.volume))audio.volume=.28;
function clearInput(){for(const key of Object.keys(input))input[key]=false;document.querySelectorAll('.is-down').forEach(el=>el.classList.remove('is-down'));}
function save(){const ok=writeStore(STORE,JSON.stringify(progress));if(!ok)toast('Progressi conservati in questa sessione.');}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function bonusUI(){
  $('best-bonus').textContent=money(progress.highestBonus);$('bonus-btn').disabled=progress.highestBonus===0;
  const completed=Object.keys(progress.completed).length;$('bonus-status').textContent=completed?`${completed} ${completed===1?'livello completato':'livelli completati'} · bonus di prova.`:'Completa il primo livello e sblocca 2 €.';
  $('voucher-value').textContent=money(progress.highestBonus);$('voucher-level').textContent=completed?`${completed} livelli completati · Milano Run`:'Completa il primo livello';
  const recorded=progress.recordedBonus>=progress.highestBonus&&progress.highestBonus>0;$('save-bonus').disabled=recorded||progress.highestBonus===0;$('save-bonus').innerHTML=recorded?'Bonus segnato <span>✓</span>':'Segna bonus nella prova <span>✓</span>';
  $('voucher-status').textContent=recorded?'Bonus dimostrativo segnato nel tuo percorso.':'';
}
function hud(){
  const level=game.level;$('level-number').textContent=String(level.number).padStart(2,'0');$('district').textContent=level.zone.name;$('district-label').textContent=level.zone.label.toUpperCase();
  $('coins').textContent=money(game.coins*5);$('collect-progress').textContent=`${game.coins} / ${level.required} oggetti`;
  $('hearts').textContent='♥ '.repeat(game.hearts)+'♡ '.repeat(3-game.hearts);$('hearts').setAttribute('aria-label',`${game.hearts} vite`);
  const seconds=Math.ceil(game.remaining);$('timer').textContent=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  $('track-fill').style.width=Math.min(100,game.player.x/level.goal*100)+'%';$('pause').disabled=!['playing','paused'].includes(game.mode);
}
function overlay(kind='ready',reason=''){
  clearInput();const level=game.level;$('overlay').hidden=false;$('overlay-secondary').hidden=kind==='ready';$('control-hint').hidden=kind!=='ready';$('intro-logo').hidden=kind!=='ready';
  $('overlay-reward').innerHTML=`<span>BONUS LIVELLO ${level.number}</span><strong>${money(level.reward).replace(',00','')}</strong>`;
  if(kind==='ready'){
    $('overlay-overline').textContent=`LIVELLO ${String(level.number).padStart(2,'0')} · ${level.zone.name.toUpperCase()}`;
    $('overlay-title').textContent='LALINEA GAME';
    $('overlay-copy').innerHTML=`Raccogli <b>${level.required} oggetti LaLinea</b>.<br>Salta i poliziotti e raggiungi l’arrivo.`;
    $('play').innerHTML='GIOCA <span>▶</span>';playAction=()=>startLevel();
  }else if(kind==='paused'){
    $('overlay-overline').textContent='PAUSA';$('overlay-title').textContent='RIPRENDI LA CORSA';
    $('overlay-copy').innerHTML='La moto ti aspetta.<br>Riparti da dove ti sei fermato.';$('play').innerHTML='RIPRENDI <span>▶</span>';playAction=()=>resume();
  }else if(kind==='won'){
    $('overlay-overline').textContent=`LIVELLO ${String(level.number).padStart(2,'0')} COMPLETATO · ${'★'.repeat(game.hearts)}`;
    $('overlay-title').innerHTML=level.number===50?'COMPLETATO!<br><em>BONUS 200 €</em>':'LIVELLO COMPLETATO<br><em>BONUS SBLOCCATO</em>';
    $('overlay-copy').innerHTML=`Hai raccolto <b>${game.coins} oggetti · ${money(game.coins*5)}</b>.<br>${level.number===50?'Hai completato tutti e 50 i livelli.':'La prossima tappa ti aspetta.'}`;
    $('play').innerHTML=level.number===50?'Rigioca <span>↻</span>':`Livello ${String(level.number+1).padStart(2,'0')} <span>→</span>`;
    playAction=()=>{game.load(level.number===50?50:level.number+1);startLevel();};
  }else{
    $('overlay-overline').textContent=reason==='time'?'TEMPO TERMINATO':'VITE TERMINATE';$('overlay-title').textContent='GAME OVER';
    $('overlay-copy').innerHTML=reason==='time'?'Questa volta il tempo è scaduto.<br>Riprova e scegli la tua strada.':'Tre vite, una nuova partenza.<br>Ogni corsa ti porta più lontano.';
    $('play').innerHTML='Riprova <span>↻</span>';playAction=()=>{game.load(level.number);startLevel();};
  }
  $('overlay-secondary').textContent='Mappa livelli';hud();
}
async function startLevel(){clearInput();game.start();$('overlay').hidden=true;await audio.play();hud();}
async function resume(){clearInput();game.mode='playing';$('overlay').hidden=true;await audio.play();hud();}
function pause(){if(game.mode==='playing'){game.mode='paused';audio.pause();overlay('paused');}}
function openDialog(id){clearInput();modalWasPlaying=game.mode==='playing';if(modalWasPlaying)game.mode='paused';audio.pause();$(id).showModal();hud();}
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{if(modalWasPlaying){game.mode='playing';audio.play();}modalWasPlaying=false;clearInput();hud();});
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>$(button.dataset.close).close());
function buildMap(){
  $('level-map').innerHTML=ZONES.map((zone,index)=>`<div class="zone-row"><div class="zone-title">${zone.name}<span>${String(index*5+1).padStart(2,'0')}—${String(index*5+5).padStart(2,'0')}</span></div><div class="zone-levels">${Array.from({length:5},(_,i)=>{const n=index*5+i+1,done=progress.completed[n],locked=n>progress.unlocked;return`<button class="level-tile ${done?'done':n===game.level.number?'current':''}" data-level="${n}" ${locked?'disabled':''} aria-label="Livello ${n}, ${money(reward(n))}${locked?', da sbloccare':done?', completato':''}"><span>${String(n).padStart(2,'0')}${done?' ★':''}</span><small>${money(reward(n)).replace(',00','')}${locked?' ·':''}</small></button>`;}).join('')}</div></div>`).join('');
  for(const button of $('level-map').querySelectorAll('[data-level]'))button.addEventListener('click',()=>{modalWasPlaying=false;$('map-dialog').close();game.load(Number(button.dataset.level));overlay('ready');audio.pause();hud();});
}
function showMap(){buildMap();openDialog('map-dialog');}
$('map').addEventListener('click',showMap);$('overlay-secondary').addEventListener('click',showMap);$('play').addEventListener('click',()=>playAction());
$('pause').addEventListener('click',()=>game.mode==='paused'?resume():pause());
$('bonus-btn').addEventListener('click',()=>{bonusUI();openDialog('bonus-dialog');});
$('save-bonus').addEventListener('click',()=>{progress.recordedBonus=progress.highestBonus;save();bonusUI();});
function audioUI(){$('sound').setAttribute('aria-pressed',String(audio.enabled));$('audio-toggle').setAttribute('aria-pressed',String(audio.enabled));$('audio-toggle').textContent=audio.enabled?'ON':'OFF';$('volume').value=Math.round(audio.volume*100);$('volume-value').textContent=Math.round(audio.volume*100)+'%';}
$('sound').addEventListener('click',()=>{audioUI();openDialog('audio-dialog');});
$('audio-toggle').addEventListener('click',async()=>{await audio.toggle(!audio.enabled);writeStore('lalinea-audio',audio.enabled?'on':'off');audioUI();});
$('volume').addEventListener('input',event=>{audio.setVolume(Number(event.target.value)/100);writeStore('lalinea-volume',String(audio.volume));audioUI();});
$('audio-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>50*1024*1024){toast('Scegli un brano sotto i 50 MB.');event.target.value='';return;}if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|ogg|wav|aac|flac)$/i.test(file.name)){toast('Scegli un file audio.');return;}$('track-name').textContent=audio.useFile(file);audio.music.addEventListener('error',()=>toast('Formato audio non riproducibile. Prova un MP3.'),{once:true});await audio.toggle(true);writeStore('lalinea-audio','on');audioUI();});
const controls={left:'left',right:'right',jump:'jump'};
for(const[id,key]of Object.entries(controls)){
  const button=$(id);button.addEventListener('pointerdown',event=>{event.preventDefault();if(game.mode!=='playing')return;button.setPointerCapture(event.pointerId);input[key]=true;button.classList.add('is-down');});
  const release=event=>{event.preventDefault();input[key]=false;button.classList.remove('is-down');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
const keyActions={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump'};
window.addEventListener('keydown',event=>{if(document.querySelector('dialog[open]'))return;if(event.code==='KeyP'||event.code==='Escape'){if(game.mode==='playing'||game.mode==='paused'){event.preventDefault();game.mode==='paused'?resume():pause();}return;}const key=keyActions[event.code];if(!key||game.mode!=='playing')return;event.preventDefault();input[key]=true;});
window.addEventListener('keyup',event=>{const key=keyActions[event.code];if(key){input[key]=false;if(game.mode==='playing')event.preventDefault();}});
window.addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
function resize(){const r=$('screen').getBoundingClientRect();if(r.width>0&&r.height>0)renderer.resize(r.width,r.height,window.devicePixelRatio||1);}
new ResizeObserver(resize).observe($('screen'));window.addEventListener('orientationchange',resize);
function processEvents(){for(const event of game.drainEvents()){
  audio.effect(event.type);
  if(event.type==='collect')renderer.pickup(game.player);
  if(event.type==='won'){recordCompletion(progress,event.level,event.coins,event.hearts);save();bonusUI();audio.pause();overlay('won');}
  else if(event.type==='lost'){audio.pause();overlay('lost',event.reason);}
  else if(event.type==='checkpoint')toast('Checkpoint! Riparti da qui.');
  else if(event.type==='need-coins')toast(`Raccogli ancora ${event.missing} ${event.missing===1?'oggetto':'oggetti'} per completare il livello.`);
  else if(event.type==='hit'&&game.hearts>0)toast(`Ripartiamo! ${game.hearts} ${game.hearts===1?'vita rimasta':'vite rimaste'}.`);
}}
function frame(stamp){
  const delta=lastStamp?Math.min(.08,(stamp-lastStamp)/1000):0;lastStamp=stamp;clock+=delta;accumulator+=delta;
  while(accumulator>=1/120){game.step(1/120,input);accumulator-=1/120;}processEvents();renderer.draw(game,clock);
  if(stamp-hudStamp>100){hud();hudStamp=stamp;}requestAnimationFrame(frame);
}
audioUI();bonusUI();overlay('ready');resize();requestAnimationFrame(frame);
