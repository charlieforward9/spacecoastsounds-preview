import { mountComparison } from './comparison.js?v=20261005-minimal';
import { createSceneAudio } from './audio.js?v=20261005-minimal';
import { createMotionSystem } from './motion.js?v=20261005-minimal';
import { phaseAvailable, resolvePhase } from './packages.js?v=20261005-minimal';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let room, audio, motion = !reducedMotion.matches, motionSystem, currentMode = 'ceremony';
const comparison = mountComparison();
const motionButton=document.getElementById('motion-toggle');
function setMotion(value){motion=value;comparison.setMotion(value);audio?.setMeterEnabled(value);room?.setMotion(value);motionSystem?.setEnabled(value);document.documentElement.classList.toggle('motion-paused',!value);motionButton.setAttribute('aria-pressed',String(value));motionButton.setAttribute('aria-label',value?'Pause motion':'Resume motion');motionButton.title=value?'Pause motion':'Resume motion';motionButton.innerHTML=value?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7Z"/></svg>';}
setMotion(motion);motionButton.addEventListener('click',()=>setMotion(!motion));reducedMotion.addEventListener('change',event=>setMotion(!event.matches));
function changeMode(mode){
  if(!phaseAvailable(comparison.getSelectedIndex(),mode))return false;
  currentMode=mode;
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
  room?.setMode(mode);audio?.setMode(mode);
  const shell=document.querySelector('.stage-shell');shell.dataset.scene=mode;document.documentElement.dataset.scene=mode;document.querySelector('meta[name=theme-color]').content={ceremony:'#f5f5f0',cocktail:'#dcc4a3',party:'#080d18'}[mode];
  document.getElementById('drop-button').hidden=mode!=='party';
  motionSystem?.sceneChange();
  return true;
}
function updatePhaseControls(){document.querySelectorAll('[data-mode]').forEach(button=>{const available=phaseAvailable(comparison.getSelectedIndex(),button.dataset.mode),label=button.getAttribute('aria-label');button.disabled=!available;button.setAttribute('aria-disabled',String(!available));button.title=available?label:`${label} is not included in the Reception package`;button.querySelector('.phase-lock').hidden=available;});}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
async function initRoom(){try{const {createRoom}=await import('./scene.js?v=20261005-minimal');room=await createRoom(document.getElementById('stage'),{reducedMotion:!motion,initialMode:currentMode,initialTier:comparison.getSelectedIndex(),intro:scrollY<150});room.setTier(comparison.getSelectedIndex());changeMode(resolvePhase(comparison.getSelectedIndex(),currentMode));room.setMotion(motion);document.querySelector('.stage-shell').classList.add('ready');window.scsScene={stats:()=>room.getStats()};}catch(error){console.warn('3D unavailable.',error);document.querySelector('.stage-shell').classList.add('unavailable');document.getElementById('stage-loading').textContent='Scene unavailable';}}
document.getElementById('comparison-board').addEventListener('tierchange',event=>{room?.setTier(event.detail.index);updatePhaseControls();const next=resolvePhase(event.detail.index,currentMode);if(next!==currentMode)changeMode(next);});
updatePhaseControls();
initRoom();
motionSystem=createMotionSystem({getRoom:()=>room,isEnabled:()=>motion});
audio=createSceneAudio({button:document.getElementById('sound-toggle'),stage:document.getElementById('stage'),initialMode:currentMode,onEnergy:value=>room?.setBeat(value)});
audio.setMeterEnabled(motion);
document.getElementById('drop-button').addEventListener('click',()=>{changeMode('party');audio.enable();room?.drop();motionSystem?.drop();});

document.querySelector('input[name=date]').min=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let apiBase='';
try{const response=await fetch('./preview-config.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(response.ok){const config=await response.json();apiBase=['127.0.0.1','localhost','::1'].includes(location.hostname)?'':config.apiBase||'';}}catch{}
const form=document.getElementById('inquiry-form'),status=document.getElementById('form-status');
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Saving…';status.textContent='';status.classList.remove('error');
  try{const payload=Object.fromEntries(new FormData(form));const response=await fetch(`${apiBase||'.'}/api/inquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});let body;try{body=await response.json();}catch{}if(!response.ok||!body?.ok)throw new Error(body?.error||'This preview inbox is temporarily unavailable. Please try again while the preview server is running.');status.textContent='Test inquiry saved. Not sent to Space Coast Sounds.';form.reset();document.getElementById('package-select').value=comparison.getSelected().name;
  }catch(error){status.classList.add('error');status.textContent=error.name==='TimeoutError'?'The preview inbox took too long to respond. Please try again.':error.message;}finally{submit.disabled=false;submit.innerHTML='Send test inquiry <span aria-hidden="true">+</span>';}});
