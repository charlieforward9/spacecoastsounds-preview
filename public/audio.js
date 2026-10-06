import {SCENES,TRANSITION_SECONDS,equalPowerMix} from './blend.js?v=20261005-refine';
const files=['ceremony','cocktail','dance-floor'];
export function createSceneAudio({button,onEnergy=()=>{},initialMode='ceremony',stage}){
  let mode=initialMode,requested=true,context,master,analyser,gains,sources,ready,error=false,loaded=false,unlocked=false,meterTimer,stageVisible=true,meterEnabled=true,lastPulse=0,previousEnergy=0;
  let mix={from:SCENES.map(name=>name===mode?1:0),index:SCENES.indexOf(mode),start:0,duration:0};
  const level=.33;
  function state(){
    const playing=requested&&loaded&&context?.state==='running'&&!document.hidden;
    const status=error?'error':!requested?'muted':playing?'playing':context?.state==='running'?'loading':'armed';
    button.dataset.sound=status;button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',status==='playing'?'Mute scene audio':status==='muted'?'Enable scene audio':status==='error'?'Retry scene audio':'Start scene audio');
    button.querySelector('span').textContent={playing:'Sound on',muted:'Sound off',armed:'Tap for sound',loading:'Loading audio',error:'Retry sound'}[status];
    button.querySelector('svg').innerHTML=status==='playing'?'<path d="M4 9h4l5-4v14l-5-4H4zM17 8q6 4 0 8M17 11q2 1 0 2"/>':'<path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6"/>';
    if(playing&&stageVisible&&meterEnabled)startMeter();else stopMeter();
  }
  function ensure(){
    if(context)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){error=true;state();return;}
    try{context=new Audio();}catch{error=true;state();return;}master=context.createGain();master.gain.value=0;
    const limiter=context.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=8;limiter.ratio.value=6;limiter.attack.value=.008;limiter.release.value=.16;
    analyser=context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.55;
    master.connect(limiter).connect(analyser).connect(context.destination);
    gains=SCENES.map(name=>{const gain=context.createGain();gain.gain.value=name===mode?1:0;gain.connect(master);return gain;});
    context.addEventListener('statechange',()=>{if(context.state==='running')unlocked=true;state();});
  }
  function load(){
    if(ready)return ready;
    ready=Promise.all(files.map(async file=>{const response=await fetch(`./assets/audio/${file}.mp3`,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Audio asset unavailable');return context.decodeAudioData(await response.arrayBuffer());})).then(buffers=>{
      sources=buffers.map((buffer,i)=>{const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.loopEnd=Math.min(16,buffer.duration);source.connect(gains[i]);return source;});
      const now=context.currentTime,at=now+.035;mix={from:SCENES.map(name=>name===mode?1:0),index:SCENES.indexOf(mode),start:now,duration:0};
      gains.forEach((gain,i)=>{gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(mix.from[i],now);sources[i].start(at);});
      loaded=true;fadeMaster();state();
    }).catch(()=>{ready=undefined;error=true;state();});return ready;
  }
  function fadeMaster(){if(!master)return;const now=context.currentTime;master.gain.cancelScheduledValues(now);master.gain.setTargetAtTime(requested&&!document.hidden?level:0,now,.10);}
  function enable(){requested=true;error=false;ensure();if(!context)return;
    // Resume is called synchronously inside the trusted gesture, before any fetch.
    context.resume().then(()=>{if(context.state==='running')unlocked=true;fadeMaster();state();}).catch(()=>state());load();state();
  }
  function weightsNow(){if(!context||!mix.duration)return [...mix.from];return equalPowerMix(mix.from,mix.index,Math.min(1,(context.currentTime-mix.start)/mix.duration));}
  function setMode(value){if(!SCENES.includes(value)||value===mode)return;mode=value;if(!context||!gains)return;
    const from=weightsNow(),now=context.currentTime,index=SCENES.indexOf(mode),count=64;
    mix={from,index,start:now,duration:TRANSITION_SECONDS};
    gains.forEach((gain,i)=>{const curve=Float32Array.from({length:count},(_,n)=>equalPowerMix(from,index,n/(count-1))[i]);if(gain.gain.cancelAndHoldAtTime)gain.gain.cancelAndHoldAtTime(now);else gain.gain.cancelScheduledValues(0);gain.gain.setValueAtTime(from[i],now);gain.gain.setValueCurveAtTime(curve,now,TRANSITION_SECONDS);});
  }
  const spectrum=new Uint8Array(512);
  function stopMeter(){clearTimeout(meterTimer);meterTimer=undefined;previousEnergy=0;onEnergy(0);}
  function startMeter(){if(meterTimer!==undefined)return;
    function tick(){meterTimer=undefined;if(!requested||!loaded||context.state!=='running'||document.hidden||!stageVisible||!meterEnabled)return;
      analyser.getByteFrequencyData(spectrum);const energy=(spectrum[1]+spectrum[2]+spectrum[3]+spectrum[4])/(4*255);onEnergy(Math.max(0,Math.min(1,(energy-.12)*1.4)));
      const now=context.currentTime;if(mode==='party'&&energy>previousEnergy+.05&&energy>.30&&now-lastPulse>.32){lastPulse=now;window.dispatchEvent(new Event('scs:beat'));}previousEnergy=energy;
      meterTimer=setTimeout(tick,33);
    }meterTimer=setTimeout(tick,33);
  }
  function toggle(){if(requested&&loaded&&context?.state==='running'){requested=false;fadeMaster();state();}else enable();}
  function activate(event){if(event.target.closest?.('#sound-toggle'))return;if(requested&&context?.state!=='running')enable();}
  button.addEventListener('click',toggle);document.addEventListener('pointerdown',activate,{passive:true});document.addEventListener('keydown',activate);
  function visibility(){if(document.hidden){stopMeter();context?.suspend().catch(()=>{});}else if(requested&&unlocked){context.resume().then(()=>{fadeMaster();state();}).catch(()=>state());}state();}
  document.addEventListener('visibilitychange',visibility);
  const observer=new IntersectionObserver(([entry])=>{stageVisible=entry.isIntersecting;state();});observer.observe(stage);
  // Sound is requested on arrival; suspended contexts remain visibly armed.
  enable();
  return {setMode,enable,setMeterEnabled(value){meterEnabled=value;state();},dispose(){stopMeter();observer.disconnect();button.removeEventListener('click',toggle);document.removeEventListener('pointerdown',activate);document.removeEventListener('keydown',activate);document.removeEventListener('visibilitychange',visibility);sources?.forEach(source=>source.stop());context?.close();}};
}
