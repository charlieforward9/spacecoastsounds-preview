import { mountComparison } from './comparison.js?v=20261005-compact';
import { createMotionSystem } from './motion.js?v=20261005-compact';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let room, motion = !reducedMotion.matches, motionSystem, currentMode = 'ceremony';
const comparison = mountComparison();
const motionButton=document.getElementById('motion-toggle');
function setMotion(value){motion=value;room?.setMotion(value);motionSystem?.setEnabled(value);document.documentElement.classList.toggle('motion-paused',!value);motionButton.setAttribute('aria-pressed',String(value));motionButton.setAttribute('aria-label',value?'Pause motion':'Resume motion');motionButton.innerHTML=value?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7Z"/></svg>';}
setMotion(motion);motionButton.addEventListener('click',()=>setMotion(!motion));reducedMotion.addEventListener('change',event=>setMotion(!event.matches));
function changeMode(mode){
  currentMode=mode;
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
  room?.setMode(mode);
  const shell=document.querySelector('.stage-shell');shell.dataset.scene=mode;document.documentElement.dataset.scene=mode;document.querySelector('meta[name=theme-color]').content={ceremony:'#f5f5f0',cocktail:'#c7b0a4',party:'#080d18'}[mode];
  const labels={ceremony:['01','CEREMONY','Ceremony'],cocktail:['02','COCKTAIL HOUR','Cocktail hour'],party:['03','DANCE FLOOR','Dance floor']};
  const [number,title,name]=labels[mode];document.getElementById('scene-number').textContent=number;document.getElementById('scene-name').textContent=title;
  document.querySelector('.stage-wordmark span').textContent=name;document.getElementById('drop-button').hidden=mode!=='party';document.getElementById('sound-toggle').hidden=mode!=='party';
  if(mode!=='party'&&sound)stopSound();
  motionSystem?.sceneChange();
}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
document.getElementById('comparison-board').addEventListener('tierchange',event=>changeMode(event.detail.index===1?'ceremony':'party'));
if(matchMedia('(pointer:coarse)').matches)document.getElementById('stage-hint').textContent='Tap a scene to explore';
async function initRoom(){try{const {createRoom}=await import('./scene.js?v=20261005-compact');room=await createRoom(document.getElementById('stage'),{reducedMotion:!motion,initialMode:currentMode});room.setMode(currentMode);room.setMotion(motion);document.querySelector('.stage-shell').classList.add('ready');window.scsScene={stats:()=>room.getStats()};}catch(error){console.warn('3D unavailable; displaying concept artwork.',error);const fallback=document.querySelector('.stage-fallback');fallback.src=fallback.dataset.src;document.getElementById('stage-loading').textContent='Concept artwork · 3D view unavailable';document.getElementById('stage-hint').textContent='Original venue concept artwork';document.querySelectorAll('[data-mode]').forEach(button=>button.disabled=true);}}
initRoom();
motionSystem=createMotionSystem({getRoom:()=>room,isEnabled:()=>motion});
// An original, synthesized preview beat. No autoplay or copyrighted audio.
let audioContext, master, hatNoise, beatTimer, beat=0, sound=false, soundStarting=false;
const soundButton=document.getElementById('sound-toggle');
function scheduleBeat(){if(!audioContext||!sound)return;const time=audioContext.currentTime+.025;
  if(beat%2===0){const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.frequency.setValueAtTime(125,time);oscillator.frequency.exponentialRampToValueAtTime(42,time+.19);gain.gain.setValueAtTime(.65,time);gain.gain.exponentialRampToValueAtTime(.001,time+.25);oscillator.connect(gain).connect(master);oscillator.start(time);oscillator.stop(time+.26);room?.setBeat(1);window.dispatchEvent(new Event('scs:beat'));}
  if(!hatNoise){hatNoise=audioContext.createBuffer(1,audioContext.sampleRate*.04,audioContext.sampleRate);const data=hatNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}const hat=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),hatGain=audioContext.createGain();hat.buffer=hatNoise;filter.type='highpass';filter.frequency.value=8500;hatGain.gain.setValueAtTime(beat%2?.13:.045,time);hatGain.gain.exponentialRampToValueAtTime(.001,time+.04);hat.connect(filter).connect(hatGain).connect(master);hat.start(time);
  if(beat%2===0){const note=[55,55,65.41,73.42][Math.floor(beat/4)%4],bass=audioContext.createOscillator(),bassGain=audioContext.createGain();bass.type='triangle';bass.frequency.value=note;bassGain.gain.setValueAtTime(.2,time+.025);bassGain.gain.exponentialRampToValueAtTime(.001,time+.22);bass.connect(bassGain).connect(master);bass.start(time+.025);bass.stop(time+.25);}
  beat++;
}
function stopSound(){sound=false;clearInterval(beatTimer);if(master)master.gain.setTargetAtTime(0,audioContext.currentTime,.02);soundButton.setAttribute('aria-pressed','false');soundButton.setAttribute('aria-label','Play preview beat');soundButton.querySelector('span').textContent='Sound off';soundButton.querySelector('svg').innerHTML='<path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6"/>';}
soundButton.addEventListener('click',async()=>{if(soundStarting)return;if(sound){stopSound();return;}soundStarting=true;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();if(document.hidden)return;if(!master){master=audioContext.createGain();master.connect(audioContext.destination);}master.gain.setTargetAtTime(.11,audioContext.currentTime,.08);sound=true;soundButton.setAttribute('aria-pressed','true');soundButton.setAttribute('aria-label','Mute preview beat');soundButton.querySelector('span').textContent='Sound on';soundButton.querySelector('svg').innerHTML='<path d="M4 9h4l5-4v14l-5-4H4zM17 8q6 4 0 8M17 11q2 1 0 2"/>';scheduleBeat();beatTimer=setInterval(scheduleBeat,250);}catch{soundButton.querySelector('span').textContent='Audio unavailable';}finally{soundStarting=false;}});
document.getElementById('drop-button').addEventListener('click',()=>{if(!sound)soundButton.click();changeMode('party');room?.drop();motionSystem?.drop();document.querySelector('#drop-button > span:nth-child(2)').textContent='ONE MORE TIME';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});

document.querySelectorAll('[data-package]').forEach(link=>link.addEventListener('click',()=>{document.getElementById('package-select').value=link.dataset.package;}));
document.querySelector('input[name=date]').min=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let apiBase='';
try{const response=await fetch('./preview-config.json',{cache:'no-store'});if(response.ok){const config=await response.json();apiBase=['127.0.0.1','localhost','::1'].includes(location.hostname)?'':config.apiBase||'';}}catch{}
const form=document.getElementById('inquiry-form'),status=document.getElementById('form-status');
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Saving…';status.textContent='';status.classList.remove('error');
  try{const payload=Object.fromEntries(new FormData(form));const response=await fetch(`${apiBase||'.'}/api/inquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});let body;try{body=await response.json();}catch{}if(!response.ok||!body?.ok)throw new Error(body?.error||'This preview inbox is temporarily unavailable. Please try again while the preview server is running.');status.textContent='Test inquiry saved. Not sent to Space Coast Sounds.';form.reset();document.getElementById('package-select').value=comparison.getSelected().name;
  }catch(error){status.classList.add('error');status.textContent=error.name==='TimeoutError'?'The preview inbox took too long to respond. Please try again.':error.message;}finally{submit.disabled=false;submit.innerHTML='Send test inquiry <span aria-hidden="true">+</span>';}});
