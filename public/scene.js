import * as THREE from 'three';
import { Reflector } from './vendor/Reflector.js';
import { SCENES, smoothstep } from './blend.js?v=20261005-jupiter';
import { createWorlds, SceneTransition } from './worlds.js?v=20261005-jupiter';

export function renderRatio(width,height,dpr=1,coarse=false,quality=1){
  const pixels=coarse?300000:600000;
  return Math.min(dpr,coarse?1:1.25,Math.sqrt(pixels/Math.max(1,width*height)))*quality;
}

export function cameraPose(profile,aspect,pointer,drag,time,drop=0,intro=1) {
  const framing=Math.max(.86,.95/Math.max(.70,aspect));
  const reveal=1-smoothstep(intro);
  const radius=(profile.radius-drop*2.4+reveal*3.4)*framing;
  const azimuth=THREE.MathUtils.clamp(profile.azimuth-reveal*.065+pointer.x*.22+drag.x+Math.sin(time*.19)*.025,-.62,.62);
  const elevation=THREE.MathUtils.clamp(profile.elevation+reveal*.025-pointer.y*.11+drag.y-drop*.025,.02,.32);
  return {x:Math.sin(azimuth)*Math.cos(elevation)*radius,y:Math.sin(elevation)*radius+profile.lookY,z:Math.cos(azimuth)*Math.cos(elevation)*radius,lookX:pointer.x*.55,lookY:profile.lookY+reveal*.70-pointer.y*.15,lookZ:-.8-reveal*.85+pointer.y*.3};
}

export async function createRoom(container,{reducedMotion=false,initialMode='ceremony',intro=true}={}) {
  const coarse=matchMedia('(pointer:coarse)').matches;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  // Limit only the WebGL buffer; text and controls retain full CSS resolution.
  renderer.setClearColor(0x081114,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.info.autoReset=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=!coarse;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  container.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(46,1,.1,300);scene.fog=new THREE.FogExp2(0x111827,.021);
  const root=new THREE.Group();scene.add(root);
  const worlds=await createWorlds({yieldToMain:true});Object.values(worlds).forEach(world=>{root.add(world.group);world.group.visible=false;});
  let mode=worlds[initialMode]?initialMode:'ceremony';
  const transition=new SceneTransition(worlds,mode);
  function environment(){
    const generator=new THREE.PMREMGenerator(renderer),captures={};
    try{
      for(const name of SCENES){
        const skyScene=new THREE.Scene(),dome=worlds[name].group.getObjectByName('Procedural sky').clone();
        dome.visible=true;skyScene.add(dome);
        captures[name]=generator.fromScene(skyScene,.03,.1,200,{size:128});
      }
      return captures;
    }catch(error){Object.values(captures).forEach(target=>target.dispose());throw error;}
    finally{generator.dispose();}
  }
  let environmentTargets=environment();
  const ambient=new THREE.HemisphereLight(0xf3f8ff,0x7c8878,2.4);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-12,20,10);key.castShadow=true;
  key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.5,far:100});key.shadow.bias=-.0002;key.shadow.normalBias=.025;scene.add(key);
  const rim=new THREE.DirectionalLight(0x68cfff,2.6);rim.position.set(7,7,-8);scene.add(rim);
  const fill=new THREE.PointLight(0xff6fb5,22,20,1.5);fill.position.set(0,4,-2);scene.add(fill);
  const targets={ceremony:{key:0xfff5e6,rim:0xd0e7e8,fill:0xfff2dc,intensity:3.1,sky:0xe3f1f5,ground:0x879478,ambient:1.20,background:0xcde5e8,fog:.003,environment:.90},cocktail:{key:0xffbd78,rim:0xb2a3cd,fill:0xffcb92,intensity:2.0,sky:0xe7c3a4,ground:0x665a43,ambient:.80,background:0xffce92,fog:.004,environment:.80},party:{key:0xa3b8d6,rim:0xacd4dd,fill:0xffbc8d,intensity:.50,sky:0x475774,ground:0x1c2329,ambient:.36,background:0x101b2b,fog:.006,environment:.65}};
  const shadowCache={},blendTargets=SCENES.map(()=>new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true}));
  const dissolveScene=new THREE.Scene(),dissolveCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const dissolveMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{a:{value:blendTargets[0].texture},b:{value:blendTargets[1].texture},c:{value:blendTargets[2].texture},weights:{value:new THREE.Vector3(0,0,1)},progress:{value:1},origin:{value:new THREE.Vector2(.5,.5)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 vUv;uniform sampler2D a;uniform sampler2D b;uniform sampler2D c;uniform vec3 weights;uniform float progress;uniform vec2 origin;
    void main(){vec3 radiance=texture2D(a,vUv).rgb*weights.x+texture2D(b,vUv).rgb*weights.y+texture2D(c,vUv).rgb*weights.z;
    float flare=exp(-abs(length(vUv-origin)-progress*1.6)*22.)*sin(progress*3.14159265)*.035;
    gl_FragColor=vec4(radiance+vec3(.58,.70,.95)*flare,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  dissolveScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),dissolveMaterial));
  let allowReflection=true,floorReflector,reflectionReady=false;
  if(!coarse){
    const reflector=floorReflector=new Reflector(new THREE.PlaneGeometry(17,13),{textureWidth:384,textureHeight:256,multisample:0,color:0x808080,clipBias:.005});
    reflector.rotation.x=-Math.PI/2;reflector.position.set(0,.028,-.5);reflector.material.transparent=true;reflector.material.depthWrite=false;
    reflector.material.fragmentShader=reflector.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 base = texture2DProj(tDiffuse,vUv)*.4;
      base+=texture2DProj(tDiffuse,vUv+vec4(.004*vUv.w,0.,0.,0.))*.15;
      base+=texture2DProj(tDiffuse,vUv-vec4(.004*vUv.w,0.,0.,0.))*.15;
      base+=texture2DProj(tDiffuse,vUv+vec4(0.,.006*vUv.w,0.,0.))*.15;
      base+=texture2DProj(tDiffuse,vUv-vec4(0.,.006*vUv.w,0.,0.))*.15;`).replace('blendOverlay( base.rgb, color ), 1.0','blendOverlay( base.rgb, color ), .12');
    const capture=reflector.onBeforeRender;reflector.onBeforeRender=function(...args){if(allowReflection){capture.apply(this,args);reflectionReady=true;}};worlds.party.group.add(reflector);
  }
  // Project the mouse onto the floor, rather than moving a flat overlay.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
  const context=glowCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,1,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.3,'rgba(255,255,255,.28)');gradient.addColorStop(1,'rgba(255,255,255,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
  const cursorMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowCanvas),color:0x81f1eb,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const cursorLight=new THREE.Mesh(new THREE.PlaneGeometry(3.2,3.2),cursorMaterial);cursorLight.rotation.x=-Math.PI/2;cursorLight.position.y=.065;scene.add(cursorLight);
  const cursorRing=new THREE.Mesh(new THREE.RingGeometry(.51,.525,64),new THREE.MeshBasicMaterial({color:0xcaf5b3,transparent:true,opacity:0,depthWrite:false}));cursorRing.rotation.x=-Math.PI/2;cursorRing.position.y=.068;scene.add(cursorRing);
  const points=new Float32Array(100*3),particleVelocity=new Float32Array(100*3),particleLife=new Float32Array(100);
  const particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const sparkle=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xd7f7e3,size:.032,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));sparkle.frustumCulled=false;scene.add(sparkle);
  for(let i=0;i<100;i++)points[i*3+1]=-100;
  let moving=!reducedMotion,visible=true,needsRender=true,disposed=false,initialized=false,contextLost=false,animationId=null;
  let quality=1,frameCount=0,frameBudget=0,budgetCount=0,crowdClock=0;
  let introProgress=intro&&!reducedMotion&&mode==='ceremony'?0:1,introAge=0;
  let elapsed=0,last=performance.now(),audioBeat=0,dropStarted=-100,pointerInside=false,particleIndex=0,emission=0;
  let dragging=false,pointerId,lastX=0,lastY=0;
  const pointer=new THREE.Vector2(),smoothed=new THREE.Vector2(),drag=new THREE.Vector2(),dragTarget=new THREE.Vector2();
  const targetPosition=new THREE.Vector3(),lookTarget=new THREE.Vector3(),lookAt=new THREE.Vector3(0,1.65,-.8),raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.07),hit=new THREE.Vector3(),rayPointer=new THREE.Vector2();
  const backgroundColors=Object.fromEntries(SCENES.map(name=>[name,new THREE.Color(targets[name].background)]));
  let profile={...worlds[mode].profile};
  const lighting=targets[mode];key.color.setHex(lighting.key);rim.color.setHex(lighting.rim);fill.color.setHex(lighting.fill);key.intensity=lighting.intensity;
  const shell=container.closest('.stage-shell');
  let bounds;
  function invalidateBounds(){bounds=null;}
  function schedule(){if(initialized&&!disposed&&!contextLost&&visible&&!document.hidden&&(moving||needsRender)&&animationId===null){last=performance.now();animationId=requestAnimationFrame(animate);}}
  function stop(){if(animationId!==null)cancelAnimationFrame(animationId);animationId=null;}
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setPixelRatio(renderRatio(w,h,devicePixelRatio,coarse,quality));renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const ratio=renderRatio(w,h,devicePixelRatio,coarse,quality)*(coarse?.72:.82);blendTargets.forEach(target=>target.setSize(Math.max(1,Math.round(w*ratio)),Math.max(1,Math.round(h*ratio))));renderer.shadowMap.needsUpdate=true;invalidateBounds();needsRender=true;schedule();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
  const visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;needsRender=true;if(visible)schedule();else stop();},{rootMargin:'40px'});visibilityObserver.observe(container);
  function visibilityChange(){if(document.hidden)stop();else{needsRender=true;schedule();}}
  document.addEventListener('visibilitychange',visibilityChange);
  window.addEventListener('scroll',invalidateBounds,{passive:true});
  function cancelIntro(){introProgress=1;shell.classList.add('intro-dismissed');}
  function point(event){
    if(!moving||event.pointerType==='touch')return;
    if(introProgress<1)cancelIntro();
    const rect=bounds??=container.getBoundingClientRect();pointer.set(THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1));
    if(dragging){dragTarget.x=THREE.MathUtils.clamp(dragTarget.x-(event.clientX-lastX)*.005,-.38,.38);dragTarget.y=THREE.MathUtils.clamp(dragTarget.y+(event.clientY-lastY)*.0035,-.055,.08);}
    lastX=event.clientX;lastY=event.clientY;pointerInside=true;
  }
  function leave(){if(!dragging){pointerInside=false;pointer.set(0,0);}}
  function down(event){cancelIntro();if(!moving||event.pointerType==='touch'||event.button!==0)return;dragging=true;pointerId=event.pointerId;lastX=event.clientX;lastY=event.clientY;container.setPointerCapture(event.pointerId);shell.classList.add('is-orbiting');}
  function release(){if(pointerId!==undefined&&container.hasPointerCapture(pointerId))container.releasePointerCapture(pointerId);pointerId=undefined;dragging=false;shell.classList.remove('is-orbiting');const rect=container.getBoundingClientRect();if(lastX<rect.left||lastX>rect.right||lastY<rect.top||lastY>rect.bottom)leave();}
  container.addEventListener('pointermove',point);container.addEventListener('pointerleave',leave);container.addEventListener('pointerdown',down);container.addEventListener('pointerup',release);container.addEventListener('pointercancel',release);
  function animate(now){
    animationId=null;
    if(disposed||contextLost||!visible||document.hidden||(!moving&&!needsRender))return;
    const realDt=Math.max(0,(now-last)/1000),dt=Math.min(realDt,.04);last=now;
    needsRender=false;if(moving){elapsed+=dt;if(introProgress<1){introAge+=realDt;introProgress=Math.min(1,introAge/3.8);}}
    const damping=moving?1-Math.exp(-dt*7):1;
    smoothed.lerp(pointer,damping);drag.lerp(dragTarget,damping);
    if(moving)transition.update(realDt);
    const weights=transition.visualWeights();
    for(const property of ['azimuth','elevation','radius','lookY']){const target=SCENES.reduce((sum,name,i)=>sum+worlds[name].profile[property]*weights[i],0);profile[property]=THREE.MathUtils.lerp(profile[property],target,damping);}
    const age=elapsed-dropStarted,drop=age>=0&&age<4.5?Math.sin(age/4.5*Math.PI):0;
    const glide=transition.progress<1?Math.sin(transition.progress*Math.PI)*.35:0;const pose=cameraPose(profile,camera.aspect,smoothed,drag,elapsed,(mode==='party'?drop:0)+glide,introProgress);
    targetPosition.set(pose.x,pose.y,pose.z);camera.position.lerp(targetPosition,damping);lookTarget.set(pose.lookX,pose.lookY,pose.lookZ);lookAt.lerp(lookTarget,damping);camera.lookAt(lookAt);camera.updateMatrixWorld();
    crowdClock+=dt;
    if(crowdClock>=1/30||!moving){SCENES.forEach((name,i)=>{if(weights[i]>.0001)worlds[name].update(elapsed,audioBeat*transition.weights[i],smoothed,name==='party'?drop:0);});crowdClock=0;}
    rayPointer.set(smoothed.x,-smoothed.y);raycaster.setFromCamera(rayPointer,camera);raycaster.ray.intersectPlane(ground,hit);
    hit.x=THREE.MathUtils.clamp(hit.x,-10,10);hit.z=THREE.MathUtils.clamp(hit.z,-7,18);
    cursorLight.position.x=THREE.MathUtils.lerp(cursorLight.position.x,hit.x,damping);cursorLight.position.z=THREE.MathUtils.lerp(cursorLight.position.z,hit.z,damping);
    cursorRing.position.x=cursorLight.position.x;cursorRing.position.z=cursorLight.position.z;cursorRing.scale.setScalar(1+Math.sin(elapsed*3)*.06);
    cursorMaterial.opacity=THREE.MathUtils.lerp(cursorMaterial.opacity,pointerInside&&moving?.45:0,damping);cursorRing.material.opacity=cursorMaterial.opacity*.65;
    cursorMaterial.color.setHex(mode==='party'?0x72e9ff:mode==='cocktail'?0xffb795:0xffdcad);
    if(moving){
      emission+=dt;
      if(pointerInside&&emission>.018){emission=0;const i=particleIndex++%100;particleLife[i]=.7+Math.random()*.8;points[i*3]=cursorLight.position.x+(Math.random()-.5)*.45;points[i*3+1]=.12;points[i*3+2]=cursorLight.position.z+(Math.random()-.5)*.45;particleVelocity[i*3]=(Math.random()-.5)*.3;particleVelocity[i*3+1]=.5+Math.random()*.5;particleVelocity[i*3+2]=(Math.random()-.5)*.3;}
      for(let i=0;i<100;i++){if(particleLife[i]<=0)continue;particleLife[i]-=dt;for(let axis=0;axis<3;axis++)points[i*3+axis]+=particleVelocity[i*3+axis]*dt;if(particleLife[i]<=0)points[i*3+1]=-100;}
      particleGeometry.attributes.position.needsUpdate=true;
    }
    frameCount++;renderer.info.reset();allowReflection=transition.progress===1&&(!reflectionReady||frameCount%6===0);
    if(transition.progress<1){
      SCENES.forEach((name,i)=>{if(weights[i]<1e-6)return;Object.entries(worlds).forEach(([key,w])=>w.group.visible=key===name);applyLighting(name);renderer.setRenderTarget(blendTargets[i]);renderer.render(scene,camera);if(!coarse)shadowCache[name]=key.shadow.map;});
      renderer.setRenderTarget(null);dissolveMaterial.uniforms.weights.value.fromArray(weights);dissolveMaterial.uniforms.progress.value=transition.progress;dissolveMaterial.uniforms.origin.value.set(.5+smoothed.x*.35,.5-smoothed.y*.35);renderer.render(dissolveScene,dissolveCamera);transition.syncVisibility();
    }else{applyLighting(mode);renderer.setRenderTarget(null);renderer.render(scene,camera);if(!coarse)shadowCache[mode]=key.shadow.map;}
    audioBeat*=Math.exp(-dt*8);
    // Back off on slower devices after warmup instead of increasing render cost.
    if(moving&&transition.progress===1){frameBudget+=dt;budgetCount++;if(budgetCount===90){if(frameBudget/budgetCount>.026&&quality>.66){quality=Math.max(.65,quality*.86);resize();}frameBudget=0;budgetCount=0;}}
    if(moving)scheduleNext();
  }
  function applyLighting(name){
    const light=targets[name];key.color.setHex(light.key);key.intensity=light.intensity;rim.color.setHex(light.rim);rim.intensity=name==='party'?.65:1.1;fill.color.setHex(light.fill);fill.intensity=name==='party'?8+audioBeat*8:8;
    ambient.color.setHex(light.sky);ambient.groundColor.setHex(light.ground);ambient.intensity=light.ambient;scene.background=backgroundColors[name];scene.fog.color.setHex(light.background);scene.fog.density=light.fog;scene.environmentIntensity=light.environment;scene.environment=environmentTargets[name].texture;
    if(!coarse){key.shadow.map=shadowCache[name]??null;renderer.shadowMap.needsUpdate=!shadowCache[name]||frameCount%6===0||!moving;}
  }
  function scheduleNext(){if(!disposed&&!contextLost&&visible&&!document.hidden&&animationId===null)animationId=requestAnimationFrame(animate);}
  const initial=cameraPose(profile,camera.aspect,pointer,drag,0,0,introProgress);camera.position.set(initial.x,initial.y,initial.z);lookAt.set(initial.lookX,initial.lookY,initial.lookZ);camera.lookAt(lookAt);camera.updateMatrixWorld();
  function setMode(value){
    if(!transition.select(value,moving))return;
    cancelIntro();mode=value;dropStarted=-100;dragTarget.set(0,0);drag.set(0,0);
    shell.dataset.scene=value;container.setAttribute('aria-label','Interactive imagined '+worlds[mode].group.name+' scene. Move your pointer or drag to orbit.');renderer.shadowMap.needsUpdate=true;needsRender=true;schedule();
  }
  function lost(event){event.preventDefault();contextLost=true;stop();shell.classList.remove('ready');shell.classList.add('unavailable');document.getElementById('stage-loading').textContent='3D view temporarily unavailable';}
  function restored(){contextLost=false;Object.values(environmentTargets).forEach(target=>target.dispose());environmentTargets=environment();scene.environment=environmentTargets[mode].texture;Object.keys(shadowCache).forEach(name=>{shadowCache[name]?.dispose();delete shadowCache[name];});key.shadow.map=null;reflectionReady=false;resize();shell.classList.remove('unavailable');shell.classList.add('ready');schedule();}
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  shell.dataset.scene=mode;
  // Precompile the direct and offscreen variants for each real 3D world.
  for(const name of SCENES){Object.entries(worlds).forEach(([key,w])=>w.group.visible=key===name);applyLighting(name);renderer.setRenderTarget(null);await renderer.compileAsync(scene,camera);renderer.setRenderTarget(blendTargets[0]);await renderer.compileAsync(scene,camera);}
  renderer.setRenderTarget(null);await renderer.compileAsync(dissolveScene,dissolveCamera);transition.syncVisibility();initialized=true;needsRender=true;schedule();
  return {
    setMode,
    setMotion(value){moving=value;needsRender=true;pointer.set(0,0);pointerInside=false;release();if(!value){cancelIntro();transition.finish();cursorMaterial.opacity=0;cursorRing.material.opacity=0;}renderer.shadowMap.needsUpdate=true;schedule();},
    setBeat(value){if(moving)audioBeat=value;},
    setScroll(){},
    drop(){if(moving){dropStarted=elapsed;dragTarget.set(0,0);needsRender=true;schedule();}},
    getStats(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,scene:mode,crowd:worlds[mode].guests,moving,renderPixels:renderer.domElement.width*renderer.domElement.height,quality,shadowMap:renderer.shadowMap.enabled,webgl:true};},
    dispose(){disposed=true;stop();resizeObserver.disconnect();visibilityObserver.disconnect();release();container.removeEventListener('pointermove',point);container.removeEventListener('pointerleave',leave);container.removeEventListener('pointerdown',down);container.removeEventListener('pointerup',release);container.removeEventListener('pointercancel',release);document.removeEventListener('visibilitychange',visibilityChange);window.removeEventListener('scroll',invalidateBounds);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);blendTargets.forEach(target=>target.dispose());Object.values(shadowCache).forEach(map=>map?.dispose());floorReflector?.dispose();Object.values(environmentTargets).forEach(target=>target.dispose());renderer.dispose();}
  };
}
