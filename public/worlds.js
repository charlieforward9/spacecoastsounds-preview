import * as THREE from 'three';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { createPlaceBuilder } from './places.js?v=20261005-jupiter';
import { createMaterials } from './materials.js?v=20261005-jupiter';
import { SceneBlend, SCENES } from './blend.js?v=20261005-jupiter';

export class SceneTransition extends SceneBlend {
  constructor(worlds,mode='ceremony'){super(mode);this.worlds=worlds;Object.values(worlds).forEach(w=>{w.group.position.set(0,0,0);w.group.scale.setScalar(1);});this.syncVisibility();}
  syncVisibility(){if(!this.worlds)return;SCENES.forEach((name,i)=>this.worlds[name].group.visible=this.weights[i]>1e-5||name===this.mode);}
  select(mode,animate=true){const changed=super.select(mode,animate);if(changed)this.syncVisibility();return changed;}
  update(dt){super.update(dt);this.syncVisibility();}
  finish(){super.finish();this.syncVisibility();}
}

// Three independent, imagined venues. Shared geometry keeps the crowd inexpensive.
export async function createWorlds({yieldToMain=false}={}) {
  const yieldWork=async()=>{if(yieldToMain)await new Promise(resolve=>setTimeout(resolve,0));};
  let seed=428;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.55,...options});
  const palette=createMaterials();
  const places=createPlaceBuilder(palette);
  const geometries={box:new RoundedBoxGeometry(1,1,1,2,.025),cylinder:new THREE.CylinderGeometry(1,1,1,20),sphere:new THREE.SphereGeometry(1,16,12)};
  function mesh(parent,geometry,mat,position,scale=[1,1,1]){
    const object=new THREE.Mesh(geometry,mat);object.position.set(...position);object.scale.set(...scale);object.castShadow=!mat.isMeshBasicMaterial&&!mat.isShaderMaterial&&!mat.transparent;object.receiveShadow=true;parent.add(object);return object;
  }
  const box=(parent,mat,x,y,z,w,h,d)=>mesh(parent,geometries.box,mat,[x,y,z],[w,h,d]);
  const cylinder=(parent,mat,x,y,z,r,h)=>mesh(parent,geometries.cylinder,mat,[x,y,z],[r,h,r]);
  const sphere=(parent,mat,x,y,z,r)=>mesh(parent,geometries.sphere,mat,[x,y,z],[r,r,r]);
  function tube(parent,points,mat,radius=.025){
    return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),40,radius,6,false),mat,[0,0,0]);
  }
  const personGeometry={
    torso:new THREE.LatheGeometry([new THREE.Vector2(.17,-.40),new THREE.Vector2(.16,-.15),new THREE.Vector2(.205,.13),new THREE.Vector2(.23,.30),new THREE.Vector2(.11,.40)],16),head:new THREE.SphereGeometry(.135,16,12),
    limb:new THREE.CylinderGeometry(.054,.064,1,9),leg:new THREE.CylinderGeometry(.066,.081,1,9),
    hair:new THREE.SphereGeometry(.143,14,10,0,Math.PI*2,0,Math.PI*.48),shoe:new THREE.SphereGeometry(.09,10,8),
    dress:new THREE.LatheGeometry([new THREE.Vector2(.30,-.36),new THREE.Vector2(.25,-.15),new THREE.Vector2(.16,.22),new THREE.Vector2(.18,.36)],20),neck:new THREE.CylinderGeometry(.06,.065,.14,12),eye:new THREE.SphereGeometry(.02,8,6),nose:new THREE.SphereGeometry(.030,8,6),ear:new THREE.SphereGeometry(.023,8,6),shirt:new THREE.BoxGeometry(1,1,1)
  };
  const clothes=[0x293244,0xb7a994,0x546674,0xe0bdad,0x70585d,0x9a9c7b,0xd1dad1];
  const skins=[0xe5bfa2,0xc49273,0x95654d,0x654431,0xdab494];
  const dummy=new THREE.Object3D(),start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  function people(parent,guests,kind){
    const count=guests.length;
    const parts={torso:[personGeometry.torso,count],head:[personGeometry.head,count],hair:[personGeometry.hair,count],arms:[personGeometry.limb,count*4],hands:[personGeometry.head,count*2],legs:[personGeometry.leg,count*4],shoes:[personGeometry.shoe,count*2],dress:[personGeometry.dress,count],neck:[personGeometry.neck,count],eyes:[personGeometry.eye,count*2],pupils:[personGeometry.eye,count*2],nose:[personGeometry.nose,count],ears:[personGeometry.ear,count*2],shirt:[personGeometry.shirt,count],tie:[personGeometry.shirt,count]};
    const shadowSize=32,shadowPixels=new Uint8Array(shadowSize*shadowSize*4);
    for(let sy=0;sy<shadowSize;sy++)for(let sx=0;sx<shadowSize;sx++){
      const offset=(sy*shadowSize+sx)*4,r=Math.hypot((sx+.5)/shadowSize*2-1,(sy+.5)/shadowSize*2-1);
      shadowPixels[offset+3]=Math.round(Math.max(0,1-r)**2*92);
    }
    const shadowTexture=new THREE.DataTexture(shadowPixels,shadowSize,shadowSize);shadowTexture.needsUpdate=true;
    const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,color:0x151c22}),count);
    shadows.rotation.x=-Math.PI/2;shadows.position.y=.052;parent.add(shadows);
    guests.forEach((guest,i)=>{dummy.position.set(guest.x,-guest.z,0);dummy.rotation.set(0,0,0);dummy.scale.set(.65,.9,1);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);});
    const instances={};
    for(const [name,[geometry,size]]of Object.entries(parts)){
      const skinPart=['head','hands','neck','nose','ears'].includes(name);const mat=skinPart?palette.skin:['eyes','pupils','tie'].includes(name)?material(name==='eyes'?0xe3d9c9:0x232524,{roughness:.5}):palette.cloth;const object=new THREE.InstancedMesh(geometry,mat,size);object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);object.frustumCulled=false;object.castShadow=name!=='hair';object.receiveShadow=true;parent.add(object);instances[name]=object;
    }
    guests.forEach((guest,i)=>{
      guest.phase=random()*Math.PI*2;guest.height=guest.height||(.92+random()*.13);
      const cloth=new THREE.Color(guest.color||clothes[i%clothes.length]),skin=new THREE.Color(skins[i%skins.length]);
      for(const key of ['torso','dress'])instances[key].setColorAt(i,cloth);
      for(const key of ['head','neck','nose'])instances[key].setColorAt(i,skin);instances.shirt.setColorAt(i,new THREE.Color(0xf0efe9));instances.hair.setColorAt(i,new THREE.Color(i%3?0x352b28:0x72604d));
      for(let side=0;side<2;side++){
        instances.hands.setColorAt(i*2+side,skin);instances.ears.setColorAt(i*2+side,skin);instances.legs.setColorAt(i*4+side*2,new THREE.Color(0x242b36));instances.legs.setColorAt(i*4+side*2+1,new THREE.Color(0x242b36));instances.shoes.setColorAt(i*2+side,new THREE.Color(0x151b24));
        instances.arms.setColorAt(i*4+side*2,cloth);instances.arms.setColorAt(i*4+side*2+1,skin);
      }
    });
    function set(part,index,x,y,z,sx=1,sy=1,sz=1,ry=0,rz=0){
      dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,rz);dummy.updateMatrix();instances[part].setMatrixAt(index,dummy.matrix);
    }
    function bone(part,index,a,b,radiusScale=1){
      start.set(...a);end.set(...b);direction.subVectors(end,start);dummy.position.copy(start).add(end).multiplyScalar(.5);
      const length=direction.length();dummy.quaternion.setFromUnitVectors(up,direction.normalize());dummy.scale.set(radiusScale,length,radiusScale);dummy.updateMatrix();instances[part].setMatrixAt(index,dummy.matrix);
    }
    function update(time,beat=0){
      guests.forEach((g,i)=>{
        const h=g.height,phase=time*(kind==='party'?Math.PI*2:1.15)+g.phase;
        const dancing=kind==='party'&&!g.dj,energy=dancing?1:.11;
        const sway=Math.sin(phase)*.15*energy,bounce=(Math.sin(phase*2)+1)*.055*energy+beat*.035*energy;
        const seated=!!g.seated,base=seated?-.36:0,x=g.x+sway,y=base+bounce,z=g.z,turn=(g.turn||0)+Math.sin(phase*.5)*.18*energy;
        set('torso',i,x,y+1.03*h,z,.95,h,.66,turn,Math.sin(phase)*.12*energy);
        set('head',i,x+sway*.2,y+1.55*h,z,.90,1.12*h,.92,turn);set('neck',i,x,y+1.39*h,z,1,h,1,turn);
        set('hair',i,x+sway*.2,y+1.55*h,z-.011,.93,1.12*h,.97,turn);
        set('dress',i,x,y+.58*h,z,g.dress?1:.001,g.dress?h:.001,g.dress?1:.001,turn);
        const cos=Math.cos(turn),sin=Math.sin(turn);
        const local=(dx,dy,dz)=>[x+dx*cos+dz*sin,y+dy*h,z-dx*sin+dz*cos];
        set('nose',i,...local(0,1.56,.126),.63,.9,1.0,turn);
        set('shirt',i,...local(0,1.19,.137),g.dress?.001:.125,g.dress?.001:.34,.018,turn);
        set('tie',i,...local(0,1.30,.152),g.dress?.001:.063,g.dress?.001:.044,.026,turn);
        for(let side=0;side<2;side++){const sign=side?1:-1;set('eyes',i*2+side,...local(sign*.047,1.589,.109),.82,.59,.42,turn);set('pupils',i*2+side,...local(sign*.047,1.589,.119),.33,.42,.23,turn);set('ears',i*2+side,...local(sign*.122,1.55,-.008),.65,1.15,.6,turn);}
        for(let side=0;side<2;side++){
          const sign=side?1:-1,raised=dancing&&(i%3!==0),reach=raised?.29:.20;
          const shoulder=local(sign*.20,1.23,0);
          const elbow=local(sign*(raised?.40:.28),raised?1.45+Math.sin(phase+side)*.15:.95,seated?.12:.02);
          const hand=local(sign*reach,raised?1.93+Math.sin(phase+side)*.12:(g.dj?1.48:kind==='cocktail'&&side===1?1.2:.71),g.dj?.46:kind==='cocktail'&&side===1?.28:seated?.35:.09);
          bone('arms',i*4+side*2,shoulder,elbow);bone('arms',i*4+side*2+1,elbow,hand,.88);
          set('hands',i*2+side,...hand,.38,.48,.38,turn);
          const hip=local(sign*.105,.72,0),foot=local(sign*.13,.07,seated?.52:Math.sin(phase+side*Math.PI)*.17*energy);
          const knee=local(sign*.12,seated?.38:.39,seated?.44:.035+Math.sin(phase+side*Math.PI)*.08*energy);bone('legs',i*4+side*2,hip,knee,1.04);bone('legs',i*4+side*2+1,knee,foot,.82);
          set('shoes',i*2+side,...foot,.85,.55,1.65,turn);
        }
      });
      Object.values(instances).forEach(object=>object.instanceMatrix.needsUpdate=true);
    }
    update(0);return update;
  }
  function speaker(parent,x,z,small=false){
    const group=new THREE.Group();parent.add(group);group.position.set(x,0,z);const size=small?.7:1;
    box(group,palette.black,0,1.4*size,0,1.12*size,2.65*size,.85*size);
    box(group,palette.black,0,.16,0,1.3*size,.3,1.1*size);
    const cones=[];
    for(const [height,radius]of [[.75,.34],[1.67,.31],[2.34,.18]]){
      const ring=mesh(group,new THREE.TorusGeometry(radius*size,.022,8,36),palette.metal,[0,height*size,.435*size]);ring.castShadow=false;
      const cone=mesh(group,new THREE.SphereGeometry(radius*size-.025,16,10),palette.black,[0,height*size,.44*size],[1,1,.2]);cone.userData.dynamic=true;cones.push(cone);
    }
    const grille=mesh(group,new THREE.PlaneGeometry(.99*size,2.46*size),palette.grille,[0,1.4*size,.522*size]);grille.castShadow=false;
    for(const x of [-.46,.46])for(const y of [.30,2.48])sphere(group,palette.metal,x*size,y*size,.535*size,.018*size);
    box(group,palette.cyan,-.51*size,1.4*size,.435*size,.018,2.4*size,.018);return cones;
  }
  function chair(parent,x,z){
    const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);
    box(group,palette.ivory,0,.55,0,.58,.12,.62);box(group,palette.ivory,0,.89,.26,.57,.57,.075);
    for(const dx of [-.22,.22])for(const dz of [-.22,.22])box(group,palette.gold,dx,.25,dz,.03,.5,.03);
  }
  function foliage(parent,x,z,height=2.6){
    cylinder(parent,palette.cream,x,.22,z,.3,.44);cylinder(parent,palette.wood,x,height/2,z,.035,height);
    for(let i=0;i<7;i++){
      const angle=i*Math.PI*2/7;
      tube(parent,[[x,height,z],[x+Math.cos(angle)*.5,height+.27,z+Math.sin(angle)*.5],[x+Math.cos(angle)*1.05,height-.22,z+Math.sin(angle)*1.05]],palette.leaf,.045);
      const leaf=sphere(parent,palette.leaf,x+Math.cos(angle)*.65,height+.06,z+Math.sin(angle)*.65,.23);leaf.scale.set(.34,.09,1.0);leaf.rotation.y=angle+Math.PI/2;
    }
  }
  const ceremony=new THREE.Group();ceremony.name='Ceremony';
  const ceremonyPlace=places.ceremony(ceremony);
  box(ceremony,palette.ivory,0,.045,.15,2.05,.025,8.4);
  for(const x of [-1.8,1.8])cylinder(ceremony,palette.cream,x,.65,-3.2,.20,1.3);
  const flowerGeometry=new THREE.SphereGeometry(.12,10,8),flowers=new THREE.InstancedMesh(flowerGeometry,palette.ivory,82);ceremony.add(flowers);
  for(let i=0;i<82;i++){
    const side=i%2?1:-1,angle=random()*Math.PI*2,r=random()*.36;dummy.position.set(side*1.8+Math.cos(angle)*r,1.32+random()*.35,-3.2+Math.sin(angle)*r);dummy.rotation.set(random(),random(),random());dummy.scale.setScalar(.65+random()*.8);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new THREE.Color(i%3?0xffffff:0xc1cbb5));
  }
  const guests=[];
  for(let row=0;row<4;row++)for(const side of [-1,1])for(let col=0;col<3;col++){
    const x=side*(1.6+col*.92),z=-.65+row*1.30;chair(ceremony,x,z);guests.push({x,z,turn:Math.PI,seated:true,dress:col===1});
  }
  guests.push({x:-.56,z:-2.55,color:0xffffff,dress:true,height:1.02},{x:.56,z:-2.55,color:0x28313d,height:1.06},{x:0,z:-3.9,color:0x66765f});
  const ceremonyPeople=people(ceremony,guests,'ceremony');
  for(const x of [-1.22,1.22])for(let row=0;row<4;row++){
    cylinder(ceremony,palette.gold,x,.20,.35+row*1.28,.10,.40);sphere(ceremony,palette.peach,x,.40,.35+row*1.28,.065);
  }
  foliage(ceremony,-5.45,-4.25,3.5);foliage(ceremony,5.45,-4.25,3.25);
  speaker(ceremony,-4.6,-3.45,true);speaker(ceremony,4.6,-3.45,true);
  ceremony.userData.venue='Jupiter Inlet Lighthouse & Museum — venue-inspired ceremony';
  await yieldWork();
  const cocktail=new THREE.Group();cocktail.name='Cocktail';const cocktailPlace=places.beachHouse(cocktail,false);
  for(let i=0;i<9;i++){
    const x=-2.25+i*.56;cylinder(cocktail,i%2?palette.leaf:palette.pink,x,1.86,-5.45,.08,.37);cylinder(cocktail,palette.gold,x,2.09,-5.45,.034,.1);
  }
  const glassGeometry=new THREE.LatheGeometry([new THREE.Vector2(.001,0),new THREE.Vector2(.025,.015),new THREE.Vector2(.052,.045),new THREE.Vector2(.070,.11),new THREE.Vector2(.064,.18)],20);
  const tables=[[-3.9,-.7],[3.75,-.65],[-2.75,3.05],[2.95,2.85]],cocktailGuests=[];
  tables.forEach(([x,z],i)=>{
    cylinder(cocktail,palette.gold,x,.65,z,.055,1.3);cylinder(cocktail,palette.gold,x,.04,z,.44,.075);cylinder(cocktail,palette.cream,x,1.32,z,.68,.075);
    for(let glass=0;glass<3;glass++){
      const gx=x+Math.cos(glass*2.1)*.33,gz=z+Math.sin(glass*2.1)*.33;cylinder(cocktail,palette.gold,gx,1.41,gz,.015,.15);mesh(cocktail,glassGeometry,palette.glass,[gx,1.48,gz]);mesh(cocktail,new THREE.TorusGeometry(.064,.002,6,20),palette.metal,[gx,1.66,gz]).rotation.x=Math.PI/2;
    }
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2+i*.3;cocktailGuests.push({x:x+Math.cos(a)*1.1,z:z+Math.sin(a)*1.1,turn:-a-Math.PI/2,dress:j===1});
    }
  });
  for(const x of [-4.6,4.6]){
    box(cocktail,palette.pink,x,.36,-3.60,2.0,.6,1.1);box(cocktail,palette.pink,x,.79,-4.05,2.0,.6,.24);
    for(const dx of [-.85,.85])box(cocktail,palette.gold,x+dx,.14,-3.6,.06,.28,.75);
  }
  cocktailGuests.push({x:-.7,z:-2.65,color:0x30374a},{x:.55,z:-2.55,dress:true,color:0xb08c94});
  const cocktailPeople=people(cocktail,cocktailGuests,'cocktail');

  foliage(cocktail,-6.0,-4.1,3.4);foliage(cocktail,6.0,-4.1,3.4);
  cocktail.userData.venue='Taylor Beach House Cafe — sunset interpretation';
  await yieldWork();
  const party=new THREE.Group();party.name='Reception';const receptionPlace=places.beachHouse(party,true);
  const floorMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{time:{value:0},beat:{value:0},cursor:{value:new THREE.Vector2()}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv; uniform float time;uniform float beat;uniform vec2 cursor;
      void main(){float pulse=pow(.5+.5*sin(length(vUv-.5)*25.-time*4.),8.);float spot=exp(-length(vUv-cursor)*8.);
      vec3 a=vec3(.12,.38,.50),b=vec3(.58,.13,.38);vec3 c=mix(a,b,.5+.5*sin(vUv.x*6.+time*.4));
      gl_FragColor=vec4(c*(pulse*.016+spot*.10+beat*.012),1.);}`
  });
  const danceTiles=mesh(party,new THREE.PlaneGeometry(9.7,8.25),floorMaterial,[0,.037,.6]);danceTiles.rotation.x=-Math.PI/2;danceTiles.castShadow=false;
  const booth=new THREE.Group();booth.position.z=-3.75;party.add(booth);
  box(booth,palette.black,0,.81,0,3.75,1.55,1.1);box(booth,palette.metal,0,1.63,0,3.95,.13,1.25);
  box(booth,palette.rose,0,.20,.56,3.65,.028,.028);for(const x of [-1.82,1.82])box(booth,palette.cyan,x,.87,.56,.024,1.29,.028);
  const equalizer=[];for(let i=0;i<22;i++){const bar=box(booth,i%3?palette.cyan:palette.rose,-1.46+i*.14,.85,.563,.055,.35,.022);bar.userData.dynamic=true;equalizer.push(bar);}
  for(const x of [-1.05,1.05]){box(booth,palette.black,x,1.74,0,1,.075,.74);cylinder(booth,palette.metal,x,1.8,0,.26,.025);cylinder(booth,palette.black,x,1.822,0,.21,.025);}
  for(let i=0;i<6;i++)cylinder(booth,palette.metal,-.23+i*.09,1.8,0,.018,.08);
  const speakerCones=[...speaker(party,-5.75,.2),...speaker(party,5.75,.2)];
  const dancers=Array.from({length:32},(_,i)=>({x:-3.48+(i%7)*1.12+(random()-.5)*.35,z:-1.75+Math.floor(i/7)*1.23+(random()-.5)*.4,turn:(random()-.5)*1.25,dress:i%5===0}));
  dancers.push({x:0,z:-4.02,dj:true,color:0x293043,height:1.25});const partyPeople=people(party,dancers,'party');
  const disco=mesh(party,new THREE.IcosahedronGeometry(.56,3),material(0xa8c2dd,{metalness:1,roughness:.09,flatShading:false}),[0,3.48,.1]);
  disco.userData.dynamic=true;cylinder(party,palette.metal,0,3.97,.1,.013,.75);
  const lights=[],spotlights=[];
  for(let i=0;i<4;i++){
    const pivot=new THREE.Group();pivot.userData.dynamic=true;pivot.position.set(-4.5+i*3,4.17,-4.50);party.add(pivot);
    const mat=new THREE.MeshBasicMaterial({color:i%3===0?0xffb888:i%3===1?0x9cd9e5:0xffe4b8,transparent:true,opacity:.025,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const beam=mesh(pivot,new THREE.ConeGeometry(.80,7,16,1,true),mat,[0,-3.5,0]);beam.castShadow=false;
    box(pivot,palette.black,0,.06,0,.32,.25,.36);sphere(pivot,palette.metal,0,-.085,0,.10);lights.push(pivot);
    if(i===0||i===3){const spot=new THREE.SpotLight(i===0?0x9fcee4:0xffb888,100,25,.40,.78,1.8);spot.position.copy(pivot.position);spot.target.position.set(i===0?-2:2,0,1.8);spot.target.userData.dynamic=true;party.add(spot,spot.target);spotlights.push(spot);}
  }
  const rings=[];
  for(let i=0;i<3;i++){const ring=mesh(party,new THREE.RingGeometry(.99,1,80),new THREE.MeshBasicMaterial({color:0x91f2eb,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending}),[0,.046,.3]);ring.rotation.x=-Math.PI/2;ring.castShadow=false;rings.push(ring);}
  await yieldWork();
  const worlds={
    ceremony:{group:ceremony,guests:guests.length,title:'THE VOWS',number:'01',profile:{azimuth:.035,elevation:.11,radius:24,lookY:3.35},landmark:ceremonyPlace.tower,update(time,beat,pointer){ceremonyPeople(time);ceremonyPlace.update(time);flowers.rotation.z=Math.sin(time*.26)*.006;}},
    cocktail:{group:cocktail,guests:cocktailGuests.length,title:'THE TOASTS',number:'02',profile:{azimuth:-.055,elevation:.085,radius:16.5,lookY:2.05},pavilion:cocktailPlace,update(time,beat,pointer){cocktailPeople(time);}},
    party:{group:party,guests:dancers.length,title:'THE RECEPTION',number:'03',profile:{azimuth:-.055,elevation:.085,radius:16.5,lookY:2.05},pavilion:receptionPlace,update(time,beat,pointer,drop=0){
      partyPeople(time,beat);disco.rotation.y=time*.35;
      floorMaterial.uniforms.time.value=time;floorMaterial.uniforms.beat.value=beat;floorMaterial.uniforms.cursor.value.set(.5+pointer.x*.42,.5+pointer.y*.42);
      equalizer.forEach((bar,i)=>bar.scale.y=.35+Math.abs(Math.sin(time*3.4+i*.6))*1.7+beat*.45);
      lights.forEach((light,i)=>{light.rotation.z=Math.sin(time*.52+i)*.45+pointer.x*.28;light.rotation.x=.34+Math.cos(time*.35+i*.7)*.23+pointer.y*.13;});
      spotlights.forEach((spot,i)=>{spot.target.position.set((i?2:-2)+pointer.x*3+Math.sin(time*.4+i)*1.5,.2,1.8+pointer.y*2);spot.intensity=100+beat*45;});
      speakerCones.forEach(cone=>cone.scale.z=.2+beat*.028);
      rings.forEach((ring,i)=>{const phase=(time*.30+i/3)%1;ring.scale.setScalar(.2+phase*5);ring.material.opacity=(1-phase)*(.065+drop*.10);});
    }}
  };
  // Batch static architecture by material; retain separate moving objects.
  for(const world of Object.values(worlds)){
    await yieldWork();
    const batches=new Map(),originals=[];world.group.updateMatrixWorld(true);
    world.group.traverse(object=>{
      if(!object.isMesh||object.isInstancedMesh||object.material.isShaderMaterial||object.material.transparent)return;
      for(let ancestor=object;ancestor&&ancestor!==world.group;ancestor=ancestor.parent)if(ancestor.userData.dynamic)return;
      const key=object.material.uuid+':'+object.castShadow;
      if(!batches.has(key))batches.set(key,{material:object.material,shadow:object.castShadow,geometries:[]});
      const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);
      batches.get(key).geometries.push(geometry);originals.push(object);
    });
    for(const batch of batches.values()){
      await yieldWork();
      const geometry=mergeGeometries(batch.geometries,false);if(!geometry)throw new Error('Venue geometry could not be combined.');
      const object=new THREE.Mesh(geometry,batch.material);object.castShadow=batch.shadow;object.receiveShadow=true;world.group.add(object);batch.geometries.forEach(part=>part.dispose());
    }
    originals.forEach(object=>object.removeFromParent());world.group.userData.batchedParts=originals.length;
  }
  return worlds;
}
