const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let room, motion = !reducedMotion.matches;
const rows = [
  ['Price', '$800', '$1,000', '$1,400'],
  ['Coverage', 'Up to 4 hours of DJ service', 'Up to 6 hours total', 'Up to 8 hours total'],
  ['Reception', 'DJ service', 'Full reception DJ & MC', 'Reception audio coverage'],
  ['Ceremony', 'Not listed', 'Ceremony audio', 'Ceremony coverage'],
  ['Cocktail hour', 'Not listed', 'Cocktail hour music', 'Cocktail hour coverage'],
  ['Sound setup', 'Professional sound system', 'Ceremony audio; other setups not listed', 'Multiple sound setups'],
  ['Microphones', 'Wireless mic for toasts', 'Wireless officiant mic', 'Additional microphones'],
  ['Music', 'Grand entrance, dinner & dancing', 'Custom music planning', 'Not listed separately'],
  ['MC services', 'Basic MC & announcements', 'Full reception MC', 'Not listed'],
  ['Planning', 'Pre-wedding consultation', 'Custom music planning', 'Not listed separately'],
  ['Coordination', 'Not listed', 'Timeline coordination', 'Event coordination support'],
  ['Setup & teardown', 'Included', 'Included', 'Included']
];
const tableBody = document.getElementById('matrix-body');
for (const [feature, ...values] of rows) {
  const tr = document.createElement('tr'), th = document.createElement('th'); th.scope = 'row'; th.textContent = feature; tr.append(th);
  values.forEach((value, index) => { const td = document.createElement('td'); if(index === 1)td.classList.add('selected-col'); if(value.startsWith('Not listed'))td.classList.add('not-listed');if(value === 'Included'){const check=document.createElement('span');check.className='table-check';check.textContent='✓ ';check.setAttribute('aria-hidden','true');td.append(check);}td.append(document.createTextNode(value));tr.append(td); }); tableBody.append(tr);
}
const observer = new IntersectionObserver(entries => { entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target);}}); },{threshold:.08});
if(motion)document.documentElement.classList.add('js-motion');
document.querySelectorAll('.reveal').forEach(element=>{if(element.getBoundingClientRect().top>innerHeight)element.classList.add('pending');observer.observe(element);});
const wave=document.querySelector('.waveform');for(let i=0;i<54;i++){const bar=document.createElement('i');bar.style.height=`${9+Math.abs(Math.sin(i*.9)*Math.cos(i*.36))*43}px`;bar.style.animationDelay=`${-i*.12}s`;wave.append(bar);}
const motionButton=document.getElementById('motion-toggle');
function setMotion(value){motion=value;room?.setMotion(value);document.documentElement.classList.toggle('motion-paused',!value);motionButton.setAttribute('aria-pressed',String(value));motionButton.setAttribute('aria-label',value?'Pause motion':'Resume motion');motionButton.innerHTML=value?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7Z"/></svg>';}
setMotion(motion);motionButton.addEventListener('click',()=>setMotion(!motion));reducedMotion.addEventListener('change',event=>setMotion(!event.matches));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));room?.setMode(button.dataset.mode);document.querySelector('.stage-wordmark span').textContent=button.dataset.mode==='party'?'01 — AFTER DARK':button.dataset.mode==='ceremony'?'02 — THE VOWS':'03 — COCKTAIL HOUR';}));
if(matchMedia('(pointer:coarse)').matches)document.getElementById('stage-hint').textContent='Choose a mood to change the room';
async function initRoom(){try{const {createRoom}=await import('./scene.js');room=createRoom(document.getElementById('stage'),{reducedMotion:reducedMotion.matches});document.querySelector('.stage-shell').classList.add('ready');window.scsScene={stats:()=>room.getStats()};}catch(error){console.warn('3D unavailable; displaying concept artwork.',error);document.getElementById('stage-loading').textContent='Concept artwork · 3D view unavailable';document.getElementById('stage-hint').textContent='Original venue concept artwork';document.querySelectorAll('[data-mode]').forEach(button=>button.disabled=true);}}
initRoom();
// An original, synthesized preview beat. No autoplay or copyrighted audio.
let audioContext, master, beatTimer, beat=0, sound=false;
const soundButton=document.getElementById('sound-toggle');
function scheduleBeat(){if(!audioContext||!sound)return;const time=audioContext.currentTime+.025;
  if(beat%2===0){const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.frequency.setValueAtTime(125,time);oscillator.frequency.exponentialRampToValueAtTime(42,time+.19);gain.gain.setValueAtTime(.65,time);gain.gain.exponentialRampToValueAtTime(.001,time+.25);oscillator.connect(gain).connect(master);oscillator.start(time);oscillator.stop(time+.26);room?.setBeat(1);}
  const noise=audioContext.createBuffer(1,audioContext.sampleRate*.04,audioContext.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);const hat=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),hatGain=audioContext.createGain();hat.buffer=noise;filter.type='highpass';filter.frequency.value=8500;hatGain.gain.setValueAtTime(beat%2?.13:.045,time);hatGain.gain.exponentialRampToValueAtTime(.001,time+.04);hat.connect(filter).connect(hatGain).connect(master);hat.start(time);
  if(beat%2===0){const note=[55,55,65.41,73.42][Math.floor(beat/4)%4],bass=audioContext.createOscillator(),bassGain=audioContext.createGain();bass.type='triangle';bass.frequency.value=note;bassGain.gain.setValueAtTime(.2,time+.025);bassGain.gain.exponentialRampToValueAtTime(.001,time+.22);bass.connect(bassGain).connect(master);bass.start(time+.025);bass.stop(time+.25);}
  beat++;room?.setBeat(0);
}
function stopSound(){sound=false;clearInterval(beatTimer);if(master)master.gain.setTargetAtTime(0,audioContext.currentTime,.02);soundButton.setAttribute('aria-pressed','false');soundButton.querySelector('span').textContent='Sound off';soundButton.querySelector('svg').innerHTML='<path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6"/>';}
soundButton.addEventListener('click',async()=>{if(sound){stopSound();return;}try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();master??=audioContext.createGain();master.connect(audioContext.destination);master.gain.setTargetAtTime(.11,audioContext.currentTime,.08);sound=true;soundButton.setAttribute('aria-pressed','true');soundButton.querySelector('span').textContent='Sound on';soundButton.querySelector('svg').innerHTML='<path d="M4 9h4l5-4v14l-5-4H4zM17 8q6 4 0 8M17 11q2 1 0 2"/>';scheduleBeat();beatTimer=setInterval(scheduleBeat,250);}catch{soundButton.querySelector('span').textContent='Audio unavailable';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
const descriptions={'Timeless & soulful':'Soulful favorites, familiar classics, and a warm, easy flow.','Throwback singalongs':'Nostalgic favorites, shared memories, and everyone singing along.','Dance-floor energy':'Feel-good hits, big choruses, and a high-energy finish.','A little of everything':'A mix of generations and genres, guided by your must-play list.'};
document.querySelectorAll('[data-vibe]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-vibe]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.getElementById('vibe-description').textContent=descriptions[button.dataset.vibe];document.getElementById('vibe-input').value=button.dataset.vibe;}));
document.querySelectorAll('[data-package]').forEach(link=>link.addEventListener('click',()=>{document.getElementById('package-select').value=link.dataset.package;}));
document.querySelector('input[name=date]').min=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let apiBase='';
try{const response=await fetch('./preview-config.json');if(response.ok){const config=await response.json();apiBase=['127.0.0.1','localhost','::1'].includes(location.hostname)?'':config.apiBase||'';}}catch{}
const form=document.getElementById('inquiry-form'),status=document.getElementById('form-status');
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Saving…';status.textContent='';status.classList.remove('error');
  try{const payload=Object.fromEntries(new FormData(form));const response=await fetch(`${apiBase||'.'}/api/inquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});let body;try{body=await response.json();}catch{}if(!response.ok||!body?.ok)throw new Error(body?.error||'This preview inbox is temporarily unavailable. Please try again while the preview server is running.');status.textContent='Preview inquiry saved. This is a test submission and has not been sent to Space Coast Sounds. No date is reserved.';form.reset();document.getElementById('vibe-input').value=document.querySelector('[data-vibe][aria-pressed=true]').dataset.vibe;
  }catch(error){status.classList.add('error');status.textContent=error.name==='TimeoutError'?'The preview inbox took too long to respond. Please try again.':error.message;}finally{submit.disabled=false;submit.innerHTML='Send a preview inquiry <span aria-hidden="true">+</span>';}});
