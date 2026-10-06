import * as THREE from 'three';
import { createWorlds, SceneTransition } from './worlds.js?v=20261005-compact';

export function renderRatio(width,height,dpr=1,coarse=false,quality=1){
  const pixels=coarse?300000:600000;
  return Math.min(dpr,coarse?1:1.25,Math.sqrt(pixels/Math.max(1,width*height)))*quality;
}

export function cameraPose(profile,aspect,pointer,drag,time,drop=0) {
  const framing=Math.max(1,1.12/Math.max(.55,aspect));
  const radius=(profile.radius-drop*2.4)*framing;
  const azimuth=THREE.MathUtils.clamp(profile.azimuth+pointer.x*.46+drag.x+Math.sin(time*.19)*.025,-1.05,1.05);
  const elevation=THREE.MathUtils.clamp(profile.elevation-pointer.y*.19+drag.y-drop*.08,.24,.76);
  return {x:Math.sin(azimuth)*Math.cos(elevation)*radius,y:Math.sin(elevation)*radius+profile.lookY,z:Math.cos(azimuth)*Math.cos(elevation)*radius,lookX:pointer.x*.9,lookY:profile.lookY-pointer.y*.28,lookZ:pointer.y*.45};
}

export async function createRoom(container,{reducedMotion=false,initialMode='ceremony'}={}) {
  const coarse=matchMedia('(pointer:coarse)').matches;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  // Limit only the WebGL buffer; text and controls retain full CSS resolution.
  renderer.setClearColor(0x081114,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=!coarse;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  container.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,120);
  const root=new THREE.Group();scene.add(root);
  const worlds=await createWorlds({yieldToMain:true});Object.values(worlds).forEach(world=>{root.add(world.group);world.group.visible=false;});
  let mode=worlds[initialMode]?initialMode:'ceremony';
  const transition=new SceneTransition(worlds,mode);
  const ambient=new THREE.HemisphereLight(0xf3f8ff,0x7c8878,2.4);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-7,12,8);key.castShadow=true;
  key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:35});key.shadow.bias=-.0002;key.shadow.normalBias=.025;scene.add(key);
  const rim=new THREE.DirectionalLight(0x68cfff,2.6);rim.position.set(7,7,-8);scene.add(rim);
  const fill=new THREE.PointLight(0xff6fb5,22,20,1.5);fill.position.set(0,4,-2);scene.add(fill);
  const targets={ceremony:{key:0xffffff,rim:0xdcece6,fill:0xfff2dc,intensity:3.0,sky:0xf3f8ff,ground:0x7c8878,ambient:2.4},cocktail:{key:0xffccab,rim:0xb895d6,fill:0xffab83,intensity:2.1,sky:0xdec5d9,ground:0x5b4441,ambient:1.5},party:{key:0xa9c7ef,rim:0x76e8ff,fill:0xff6ab5,intensity:1.35,sky:0x8695b8,ground:0x181a2b,ambient:.65}};
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
  let elapsed=0,last=performance.now(),audioBeat=0,dropStarted=-100,pointerInside=false,particleIndex=0,emission=0;
  let dragging=false,pointerId,lastX=0,lastY=0;
  const pointer=new THREE.Vector2(),smoothed=new THREE.Vector2(),drag=new THREE.Vector2(),dragTarget=new THREE.Vector2();
  const targetPosition=new THREE.Vector3(),lookTarget=new THREE.Vector3(),lookAt=new THREE.Vector3(0,1.15,0),raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.07),hit=new THREE.Vector3(),rayPointer=new THREE.Vector2();
  const color=new THREE.Color();
  let profile={...worlds[mode].profile};
  const lighting=targets[mode];key.color.setHex(lighting.key);rim.color.setHex(lighting.rim);fill.color.setHex(lighting.fill);key.intensity=lighting.intensity;
  const shell=container.closest('.stage-shell');
  let bounds;
  function invalidateBounds(){bounds=null;}
  function schedule(){if(initialized&&!disposed&&!contextLost&&visible&&!document.hidden&&(moving||needsRender)&&animationId===null){last=performance.now();animationId=requestAnimationFrame(animate);}}
  function stop(){if(animationId!==null)cancelAnimationFrame(animationId);animationId=null;}
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setPixelRatio(renderRatio(w,h,devicePixelRatio,coarse,quality));renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;invalidateBounds();needsRender=true;schedule();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
  const visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;needsRender=true;if(visible)schedule();else stop();},{rootMargin:'40px'});visibilityObserver.observe(container);
  function visibilityChange(){if(document.hidden)stop();else{needsRender=true;schedule();}}
  document.addEventListener('visibilitychange',visibilityChange);
  window.addEventListener('scroll',invalidateBounds,{passive:true});
  function point(event){
    if(!moving||event.pointerType==='touch')return;
    const rect=bounds??=container.getBoundingClientRect();pointer.set(THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1));
    if(dragging){dragTarget.x=THREE.MathUtils.clamp(dragTarget.x-(event.clientX-lastX)*.005,-.65,.65);dragTarget.y=THREE.MathUtils.clamp(dragTarget.y+(event.clientY-lastY)*.0035,-.16,.18);}
    lastX=event.clientX;lastY=event.clientY;pointerInside=true;
  }
  function leave(){if(!dragging){pointerInside=false;pointer.set(0,0);}}
  function down(event){if(!moving||event.pointerType==='touch'||event.button!==0)return;dragging=true;pointerId=event.pointerId;lastX=event.clientX;lastY=event.clientY;container.setPointerCapture(event.pointerId);shell.classList.add('is-orbiting');}
  function release(){if(pointerId!==undefined&&container.hasPointerCapture(pointerId))container.releasePointerCapture(pointerId);pointerId=undefined;dragging=false;shell.classList.remove('is-orbiting');const rect=container.getBoundingClientRect();if(lastX<rect.left||lastX>rect.right||lastY<rect.top||lastY>rect.bottom)leave();}
  container.addEventListener('pointermove',point);container.addEventListener('pointerleave',leave);container.addEventListener('pointerdown',down);container.addEventListener('pointerup',release);container.addEventListener('pointercancel',release);
  function animate(now){
    animationId=null;
    if(disposed||contextLost||!visible||document.hidden||(!moving&&!needsRender))return;
    const dt=Math.min((now-last)/1000,.04);last=now;
    needsRender=false;if(moving)elapsed+=dt;
    const damping=moving?1-Math.exp(-dt*7):1;
    smoothed.lerp(pointer,damping);drag.lerp(dragTarget,damping);
    const world=worlds[mode],lighting=targets[mode];
    if(moving)transition.update(dt);
    for(const property of ['azimuth','elevation','radius','lookY'])profile[property]=THREE.MathUtils.lerp(profile[property],world.profile[property],damping);
    const age=elapsed-dropStarted,drop=age>=0&&age<4.5?Math.sin(age/4.5*Math.PI):0;
    const pose=cameraPose(profile,camera.aspect,smoothed,drag,elapsed,mode==='party'?drop:0);
    targetPosition.set(pose.x,pose.y,pose.z);camera.position.lerp(targetPosition,damping);lookTarget.set(pose.lookX,pose.lookY,pose.lookZ);lookAt.lerp(lookTarget,damping);camera.lookAt(lookAt);camera.updateMatrixWorld();
    key.color.lerp(color.setHex(lighting.key),damping);rim.color.lerp(color.setHex(lighting.rim),damping);fill.color.lerp(color.setHex(lighting.fill),damping);
    key.intensity=THREE.MathUtils.lerp(key.intensity,lighting.intensity,damping);fill.intensity=mode==='party'?16+audioBeat*6+drop*8:8;
    ambient.color.lerp(color.setHex(lighting.sky),damping);ambient.groundColor.lerp(color.setHex(lighting.ground),damping);ambient.intensity=THREE.MathUtils.lerp(ambient.intensity,lighting.ambient,damping);
    crowdClock+=dt;
    // Quiet scenes update figures at 30Hz; camera and scene changes stay at display rate.
    if(mode==='party'||transition.progress<1||crowdClock>=1/30||!moving){world.update(elapsed,audioBeat,smoothed,drop);if(transition.previous&&transition.progress<1)worlds[transition.previous].update(elapsed,0,smoothed,0);crowdClock=0;}
    rayPointer.set(smoothed.x,-smoothed.y);raycaster.setFromCamera(rayPointer,camera);raycaster.ray.intersectPlane(ground,hit);
    hit.x=THREE.MathUtils.clamp(hit.x,-6.4,6.4);hit.z=THREE.MathUtils.clamp(hit.z,-4.8,5.1);
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
    // Reuse the shadow map between updates; phones use instanced contact shadows.
    if(!coarse&&(frameCount++%6===0||transition.progress<1||!moving))renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);audioBeat*=Math.exp(-dt*8);
    // Back off on slower devices after warmup instead of increasing render cost.
    if(moving&&transition.progress===1){frameBudget+=dt;budgetCount++;if(budgetCount===90){if(frameBudget/budgetCount>.026&&quality>.66){quality=Math.max(.65,quality*.86);resize();}frameBudget=0;budgetCount=0;}}
    if(moving)scheduleNext();
  }
  function scheduleNext(){if(!disposed&&!contextLost&&visible&&!document.hidden&&animationId===null)animationId=requestAnimationFrame(animate);}
  const initial=cameraPose(profile,camera.aspect,pointer,drag,0);camera.position.set(initial.x,initial.y,initial.z);camera.lookAt(0,profile.lookY,0);camera.updateMatrixWorld();
  function setMode(value){
    if(!transition.select(value,moving))return;
    mode=value;dropStarted=-100;dragTarget.set(0,0);drag.set(0,0);
    shell.dataset.scene=value;container.setAttribute('aria-label','Interactive imagined '+worlds[mode].group.name+' scene. Move your pointer or drag to orbit.');renderer.shadowMap.needsUpdate=true;needsRender=true;schedule();
  }
  function lost(event){event.preventDefault();contextLost=true;stop();shell.classList.remove('ready');const fallback=container.querySelector('.stage-fallback');fallback.src=fallback.dataset.src;document.getElementById('stage-loading').textContent='Concept artwork · 3D unavailable';}
  function restored(){contextLost=false;resize();shell.classList.add('ready');schedule();}
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  shell.dataset.scene=mode;
  // Compile every venue material before switching scenes can trigger shader compilation.
  Object.values(worlds).forEach(world=>world.group.visible=true);
  const compilation=renderer.compileAsync(scene,camera);
  Object.entries(worlds).forEach(([name,world])=>world.group.visible=name===mode);
  await compilation;initialized=true;needsRender=true;schedule();
  return {
    setMode,
    setMotion(value){moving=value;needsRender=true;pointer.set(0,0);pointerInside=false;release();if(!value){transition.finish();cursorMaterial.opacity=0;cursorRing.material.opacity=0;}renderer.shadowMap.needsUpdate=true;schedule();},
    setBeat(value){if(moving)audioBeat=value;},
    setScroll(){},
    drop(){if(moving){dropStarted=elapsed;dragTarget.set(0,0);needsRender=true;schedule();}},
    getStats(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,scene:mode,crowd:worlds[mode].guests,moving,renderPixels:renderer.domElement.width*renderer.domElement.height,quality,shadowMap:renderer.shadowMap.enabled,webgl:true};},
    dispose(){disposed=true;stop();resizeObserver.disconnect();visibilityObserver.disconnect();release();container.removeEventListener('pointermove',point);container.removeEventListener('pointerleave',leave);container.removeEventListener('pointerdown',down);container.removeEventListener('pointerup',release);container.removeEventListener('pointercancel',release);document.removeEventListener('visibilitychange',visibilityChange);window.removeEventListener('scroll',invalidateBounds);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);renderer.dispose();}
  };
}
