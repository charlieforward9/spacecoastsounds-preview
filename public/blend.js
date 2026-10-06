export const SCENES=['ceremony','cocktail','party'];
export const TRANSITION_SECONDS=1.8;
export const smoothstep=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);};
export function equalPowerMix(from,index,progress){
  const t=smoothstep(progress),dot=Math.max(-1,Math.min(1,from[index])),angle=Math.acos(dot);
  if(angle<1e-5)return SCENES.map((_,i)=>i===index?1:0);
  const a=Math.sin((1-t)*angle)/Math.sin(angle),b=Math.sin(t*angle)/Math.sin(angle);
  return from.map((value,i)=>Math.max(0,a*value+(i===index?b:0)));
}
export class SceneBlend {
  constructor(mode='party',duration=TRANSITION_SECONDS){this.mode=mode;this.duration=duration;this.progress=1;this.weights=SCENES.map(name=>name===mode?1:0);this.from=[...this.weights];}
  select(mode,animate=true){if(!SCENES.includes(mode)||mode===this.mode)return false;this.previous=this.mode;this.from=[...this.weights];this.mode=mode;this.progress=0;if(!animate)this.finish();return true;}
  update(dt){if(this.progress===1)return;this.progress=Math.min(1,this.progress+Math.max(0,dt)/this.duration);this.weights=equalPowerMix(this.from,SCENES.indexOf(this.mode),this.progress);}
  finish(){this.progress=1;this.weights=SCENES.map(name=>name===this.mode?1:0);this.from=[...this.weights];}
  visualWeights(){return this.weights.map(value=>value*value);}
}
