import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/postprocessing/OutputPass.js';

// One instanced draw per body component keeps the crowd inexpensive.
// Assets and geometry are local; the scene needs no external service.
export function createRoom(container, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.5));
  renderer.setClearColor(0x081114, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b171b, .022);
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 100);
  camera.position.set(12, 13, 22);
  const lookAt = new THREE.Vector3(0, .3, -.35);
  const pointer = new THREE.Vector2();
  let moving = !reducedMotion, visible = true, elapsed = 0, last = performance.now(), mode = 'party', audioBeat = 0;
  let disposed = false, animationId;
  const root = new THREE.Group(); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xb9edff, 0x303c33, 1.4));
  const key = new THREE.DirectionalLight(0xd2edff, 2); key.position.set(5, 12, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x93edf6, 2); rim.position.set(-5, 7, -7); scene.add(rim);
  const fill = new THREE.PointLight(0xc7fb63, 16, 14, 1.5); fill.position.set(0, 4, -3); scene.add(fill);
  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0x1b292b, metalness: .64, roughness: .28 }),
    side: new THREE.MeshStandardMaterial({ color: 0x223033, metalness: .58, roughness: .34 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141b1d, metalness: .4, roughness: .37 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x60787c, metalness: .8, roughness: .3 }),
    cone: new THREE.MeshStandardMaterial({ color: 0x2a3e42, metalness: .7, roughness: .3 }),
    lime: new THREE.MeshBasicMaterial({ color: 0xcefa69, toneMapped: false }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x78efff, toneMapped: false }),
    white: new THREE.MeshStandardMaterial({ color: 0xe0e9e4, metalness: .24, roughness: .37 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x638d91, transparent: true, opacity: .18, roughness: .1, metalness: .3, side: THREE.DoubleSide })
  };
  function box(w, h, d, material, x = 0, y = 0, z = 0, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function cylinder(r1, r2, h, material, x, y, z, parent = root) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 28), material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  // A floating architectural room, with a cutaway front and sides.
  box(13.4, .48, 11.4, materials.side, 0, -.34, 0);
  box(13.2, .08, 11.2, materials.floor, 0, -.055, 0);
  box(13.45, .026, .03, materials.lime, 0, -.12, 5.72);
  box(.03, .026, 11.45, materials.cyan, -6.73, -.12, 0);
  box(.03, .026, 11.45, materials.cyan, 6.73, -.12, 0);
  box(12.9, 4.8, .25, materials.black, 0, 2.25, -5.45);
  box(13.4, .27, .45, materials.steel, 0, 4.82, -5.4);
  for (const x of [-6.4, -4.55, 4.55, 6.4]) {
    box(.22, 4.8, .3, materials.side, x, 2.3, -5.2);
    box(.035, 4.05, .04, materials.cyan, x, 2.35, -4.98);
  }
  for (const x of [-6.5, 6.5]) {
    box(.16, 3.9, .2, materials.steel, x, 1.93, 3.85);
    box(.035, 3.25, .04, materials.lime, x, 1.93, 3.68);
    box(.1, .1, 9.5, materials.side, x, 3.93, -.65);
    box(.035, .035, 9.5, materials.cyan, x, 3.84, -.65);
    box(.015, 1.1, 6.7, materials.glass, x, .55, 1.1);
  }
  // Inlaid LED floor guides; fine and restrained rather than flashing.
  const grid = new THREE.GridHelper(9.4, 12, 0x5a8374, 0x344f4f); grid.position.y = .006; root.add(grid);
  box(9.3, .04, .035, materials.lime, 0, .015, 4.7);
  box(.035, .04, 9.35, materials.cyan, -4.65, .015, 0);
  box(.035, .04, 9.35, materials.cyan, 4.65, .015, 0);
  box(9.7, .3, 2.3, materials.side, 0, .1, -3.92);
  box(9.72, .035, .035, materials.lime, 0, .27, -2.77);
  const booth = new THREE.Group(); booth.position.set(0, 0, -3.7); root.add(booth);
  box(3.9, 1.12, .92, materials.black, 0, .83, 0, booth);
  box(4.03, .12, 1.06, materials.steel, 0, 1.45, 0, booth);
  for (const x of [-1.82, 1.82]) box(.035, 1.05, .03, materials.lime, x, .85, .47, booth);
  box(3.62, .028, .025, materials.lime, 0, .32, .47, booth);
  for (const x of [-1.1, 1.1]) {
    box(1, .05, .67, materials.black, x, 1.54, 0, booth);
    cylinder(.28, .28, .027, materials.steel, x, 1.58, 0, booth);
    cylinder(.21, .21, .031, materials.black, x, 1.595, 0, booth);
    box(.2, .02, .09, materials.cyan, x+.28, 1.582, -.17, booth);
  }
  box(.6, .06, .68, materials.black, 0, 1.55, 0, booth);
  for(let i=0;i<6;i++) cylinder(.018,.018,.065,materials.steel,-.22+i*.086,1.62,0,booth);
  const speakerCones = [];
  for (const x of [-4.02, 4.02]) {
    const speaker = new THREE.Group(); speaker.position.set(x, .28, -3.8); root.add(speaker);
    box(1.32, 2.95, .91, materials.black, 0, 1.5, 0, speaker);
    box(1.4, .17, 1.06, materials.side, 0, .04, 0, speaker);
    for (const [y,radius] of [[.7,.39],[1.65,.37],[2.47,.23]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .04, 8, 40), materials.steel); ring.position.set(0,y,.48); speaker.add(ring);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius-.03,.13,40),materials.cone); cone.rotation.x=Math.PI/2; cone.position.set(0,y,.48);speaker.add(cone);speakerCones.push(cone);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(radius*.35,16,8),materials.black);cap.scale.z=.3;cap.position.set(0,y,.54);speaker.add(cap);
    }
    box(.04,2.9,.03,materials.cyan,-.61,1.5,.47,speaker);
    box(1.36,.6,1.2,materials.black,0,.06,1.7,speaker);
    const subRing = new THREE.Mesh(new THREE.TorusGeometry(.23,.03,8,28),materials.steel);subRing.position.set(0,.04,2.32);speaker.add(subRing);
  }
  // The booth's LED wall is a procedural shader, not a downloaded video.
  const ledMaterial = new THREE.ShaderMaterial({
    uniforms: { time:{value:0}, tint:{value:new THREE.Color(0x91e6f5)} },
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv; uniform float time; uniform vec3 tint;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=(vUv-.5)*vec2(1.35,1.);float r=length(p);float ring=exp(-abs(r-.345)*175.);
      float planet=smoothstep(.342,.335,r);float glow=exp(-abs(r-.34)*12.)*.16;
      float cloud=sin(p.x*32.+sin(p.y*28.+time*.11)*2.)*sin(p.y*45.-time*.1);
      float lit=clamp(.25+p.x*.7+cloud*.15,0.,1.);float stars=step(.994,hash(floor(vUv*180.)))*(1.-planet);
      vec3 c=vec3(.011,.023,.033)+tint*(ring*.8+glow+planet*lit*.23+stars*.5);
      float scan=.96+.04*sin(vUv.y*600.);gl_FragColor=vec4(c*scan,1.);}`
  });
  const led = new THREE.Mesh(new THREE.PlaneGeometry(7.9, 3.65),ledMaterial);led.position.set(0,2.49,-5.29);root.add(led);
  // A compact animated crowd, dressed as abstract evening silhouettes.
  let seed=427;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const count=34, palette=[0x9badb6,0x596975,0xb3b4a1,0x758f8a,0x808b9c,0xd0d9d0];
  const crowdMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45,metalness:.3});
  const skinMaterial=new THREE.MeshStandardMaterial({color:0x8fa3a6,roughness:.54,metalness:.25});
  const bodies=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.17,.37,3,8),crowdMaterial,count);
  const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.126,12,8),skinMaterial,count);
  const arms=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.055,.3,3,7),crowdMaterial,count*2);
  const legs=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.065,.36,3,7),crowdMaterial,count*2);
  [bodies,heads,arms,legs].forEach(mesh=>{mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;root.add(mesh);});
  const dancers=Array.from({length:count},(_,i)=>{
    const col=new THREE.Color(palette[i%palette.length]);bodies.setColorAt(i,col);arms.setColorAt(i*2,col);arms.setColorAt(i*2+1,col);legs.setColorAt(i*2,new THREE.Color(0x263d43));legs.setColorAt(i*2+1,new THREE.Color(0x263d43));
    return {x:-3.35+(i%7)*1.07+(random()-.5)*.32,z:-1.7+Math.floor(i/7)*1.3+(random()-.5)*.45,phase:random()*Math.PI*2,height:.9+random()*.21,pose:random(),turn:(random()-.5)*.75};
  });
  const dummy=new THREE.Object3D();
  function setInstance(mesh,i,x,y,z,sx,sy,sz,rz=0,ry=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
  function updateCrowd(t) {
    const energy=mode==='party'?1:mode==='cocktail'?.3:.1;
    dancers.forEach((d,i)=>{
      const phase=t*(mode==='party'?3.4:1.2)+d.phase;
      const sway=Math.sin(phase)*.045*energy,bob=(Math.sin(phase*2)+1)*.025*energy,h=d.height;
      setInstance(bodies,i,d.x+sway,.82*h+bob,d.z,.91,h,1,Math.sin(phase)*.08*energy,d.turn);
      setInstance(heads,i,d.x+sway*1.5,1.25*h+bob,d.z,1,h,1,0,d.turn);
      for(let side=0;side<2;side++){
        const sign=side?1:-1,raised=d.pose>.48&&mode==='party',lift=raised?.19:.0;
        const angle=sign*(raised?.62:.16)+Math.cos(phase+side)*.2*energy;
        setInstance(arms,i*2+side,d.x+sign*.25+sway,.85*h+bob+lift,d.z,.94,h,.94,angle,d.turn);
        setInstance(legs,i*2+side,d.x+sign*.103+sway*.4,.29*h,d.z+Math.sin(phase+side*Math.PI)*.035*energy,1,h,1,sign*.05+Math.sin(phase)*.06*energy,d.turn);
      }
    });[bodies,heads,arms,legs].forEach(mesh=>mesh.instanceMatrix.needsUpdate=true);
  }
  // The DJ behind the deck: a simple lit silhouette.
  const djBody=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.49,4,8),materials.black);djBody.position.set(0,1.3,-4.13);root.add(djBody);
  const djHead=new THREE.Mesh(new THREE.SphereGeometry(.16,16,10),materials.white);djHead.position.set(0,1.95,-4.13);root.add(djHead);
  const headphones=new THREE.Mesh(new THREE.TorusGeometry(.175,.025,7,20,Math.PI),materials.cyan);headphones.position.set(0,1.96,-4.14);root.add(headphones);
  const beams=[];
  const beamMaterial=new THREE.MeshBasicMaterial({color:0xb5fc84,transparent:true,opacity:.075,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  for (let i=0;i<4;i++) {
    const pivot=new THREE.Group();pivot.position.set(i<2?-5.25:5.25,4.55,-4.5);root.add(pivot);
    const beam=new THREE.Mesh(new THREE.ConeGeometry(.85,9.6,12,1,true),beamMaterial);beam.position.y=-4.8;pivot.add(beam);
    const core=new THREE.Mesh(new THREE.CylinderGeometry(.006,.016,9.6,5),i%2?materials.cyan:materials.lime);core.position.y=-4.8;pivot.add(core);
    box(.24,.19,.3,materials.black,0,0,0,pivot);beams.push(pivot);
  }
  // Light pools on the floor give depth without expensive real-time shadows.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
  const ctx=glowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(165,250,190,.5)');gradient.addColorStop(.4,'rgba(100,225,225,.2)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const glowTex=new THREE.CanvasTexture(glowCanvas);
  for(const x of [-3.8,3.8]){const glow=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.set(x,.02,-2);root.add(glow);}
  const positions=new Float32Array(260*3);
  for(let i=0;i<260;i++){positions[i*3]=(random()-.5)*36;positions[i*3+1]=random()*16+1;positions[i*3+2]=-random()*18-6;}
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xafdce7,size:.028,transparent:true,opacity:.7,depthWrite:false})));
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(800,600),.38,.55,.78);composer.addPass(bloom);composer.addPass(new OutputPass());
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();
  const visibilityObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=performance.now();},{rootMargin:'100px'});visibilityObserver.observe(container);
  function onPointer(event){if(event.pointerType==='touch')return;const rect=container.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width-.5)*2,((event.clientY-rect.top)/rect.height-.5)*2);}
  container.addEventListener('pointermove',onPointer);container.addEventListener('pointerleave',()=>pointer.set(0,0));
  function animate(now){
    if(disposed)return;animationId=requestAnimationFrame(animate);
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!visible||document.hidden)return;
    if(moving)elapsed+=dt;
    const mobile=camera.aspect<.95, baseDistance=mobile?24:22;
    const targetX=(mobile?11:12)+pointer.x*1.5,targetY=13+pointer.y*.65;
    camera.position.lerp(new THREE.Vector3(targetX,targetY,baseDistance-pointer.x*.4),moving?.04:1);camera.lookAt(lookAt);
    ledMaterial.uniforms.time.value=elapsed;
    updateCrowd(elapsed);
    const pulse=Math.pow(Math.max(0,Math.sin(elapsed*7.1)),8)*.2+audioBeat*.15;
    for(const cone of speakerCones)cone.scale.setScalar(1+(moving?pulse*.045:0));
    beams.forEach((beam,i)=>{const energy=mode==='party'?1:.2;beam.rotation.z=(i<2?-1:1)*(.35+Math.sin(elapsed*.35+i*1.5)*.2*energy);beam.rotation.x=.2+Math.sin(elapsed*.27+i)*.22*energy;});
    fill.intensity=(mode==='party'?16:12)+(moving?pulse*4:0);
    composer.render();
  }
  updateCrowd(0);animate(performance.now());
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();container.closest('.stage-shell').classList.remove('ready');document.getElementById('stage-loading').textContent='Concept artwork · 3D view unavailable';});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{resize();container.closest('.stage-shell').classList.add('ready');});
  return {
    setMode(value){mode=value;const tint=value==='ceremony'?0xffd89b:value==='cocktail'?0x87e1ef:0xcefa69;materials.lime.color.setHex(tint);beamMaterial.color.setHex(tint);fill.color.setHex(tint);ledMaterial.uniforms.tint.value.setHex(value==='ceremony'?0xf3d7a4:0x91e6f5);},
    setMotion(value){moving=value;pointer.set(0,0);},
    setBeat(value){audioBeat=value;},
    getStats(){return {triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,crowd:count,webgl:true,mode,moving};},
    dispose(){disposed=true;cancelAnimationFrame(animationId);resizeObserver.disconnect();visibilityObserver.disconnect();renderer.dispose();composer.dispose();}
  };
}
