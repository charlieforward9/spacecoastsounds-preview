import * as THREE from 'three';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { createPlaceBuilder } from './places.js?v=20261005-minimal';
import { createMaterials } from './materials.js?v=20261005-minimal';
import { CrowdSolver } from './crowd.js?v=20261005-minimal';
import { tiers, audioProfile } from './packages.js?v=20261005-minimal';
import { SceneBlend, SCENES } from './blend.js?v=20261005-minimal';

export class SceneTransition extends SceneBlend {
  constructor(worlds,mode='ceremony'){super(mode);this.worlds=worlds;Object.values(worlds).forEach(w=>{w.group.position.set(0,0,0);w.group.scale.setScalar(1);});this.syncVisibility();}
  syncVisibility(){if(!this.worlds)return;if(this.worlds.rig){this.worlds.rig.syncVisibility(this.weights);return;}SCENES.forEach((name,i)=>this.worlds[name].group.visible=this.weights[i]>1e-5||name===this.mode);}
  select(mode,animate=true){const changed=super.select(mode,animate);if(changed)this.syncVisibility();return changed;}
  update(dt){super.update(dt);this.syncVisibility();}
  finish(){super.finish();this.syncVisibility();}
}

// Two authored places, one persistent crowd and equipment rig, three lighting/layout states.
export async function createWorlds({yieldToMain=false}={}) {
  const yieldWork=async()=>{if(yieldToMain)await new Promise(resolve=>setTimeout(resolve,0));};
  let seed=428;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.55,...options});
  const palette=createMaterials();
  const places=createPlaceBuilder(palette);
  const geometries={box:new RoundedBoxGeometry(1,1,1,1,.025),cylinder:new THREE.CylinderGeometry(1,1,1,20),sphere:new THREE.SphereGeometry(1,16,12)};
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
      const skinPart=['head','hands','neck','nose','ears'].includes(name);const mat=skinPart?palette.skin:['eyes','pupils','tie'].includes(name)?material(name==='eyes'?0xe3d9c9:0x232524,{roughness:.5}):palette.cloth;const object=new THREE.InstancedMesh(geometry,mat,size);object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);object.frustumCulled=false;object.castShadow=name!=='hair';object.receiveShadow=true;parent.add(object);object.name='Persistent guest '+name;object.userData.actorIds=guests.map(g=>g.id);instances[name]=object;
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
    let lastTime=0,phaseClock=0;
    function update(time,beat=0,weights=[1,0,0]){
      const cocktailMix=weights[1],danceMix=weights[2];phaseClock+=Math.max(0,Math.min(.08,time-lastTime))*(1.15+(Math.PI*2-1.15)*danceMix);lastTime=time;
      guests.forEach((g,i)=>{
        const h=g.height,phase=phaseClock+g.phase;
        const dancing=danceMix*(g.dj?0:1),energy=.11+.89*dancing;
        const sway=Math.sin(phase)*.15*energy,bounce=(Math.sin(phase*2)+1)*.055*energy+beat*.035*energy;
        const seated=g.seated||0,base=-.18*seated,x=g.x,y=base+bounce,z=g.z,turn=(g.turn||0)+Math.sin(phase*.5)*.18*energy;
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
          const sign=side?1:-1,raised=dancing*(i%3!==0?1:0),reach=.20+.09*raised;
          const shoulder=local(sign*.20,1.23,0);
          const elbow=local(sign*(.28+.12*raised),.95+raised*(.50+Math.sin(phase+side)*.15),.02+seated*.10);
          const hand=local(sign*reach,.71+raised*(1.22+Math.sin(phase+side)*.12)+(g.dj?.77*(cocktailMix+danceMix):side===1?.49*cocktailMix:0),g.dj?.46*(cocktailMix+danceMix):.09+.26*seated+(side===1?.19*cocktailMix:0));
          bone('arms',i*4+side*2,shoulder,elbow);bone('arms',i*4+side*2+1,elbow,hand,.88);
          set('hands',i*2+side,...hand,.38,.48,.38,turn);
          const hip=local(sign*.105,.72,0),foot=local(sign*.13,.07+.18*seated,.52*seated+(1-seated)*Math.sin(phase+side*Math.PI)*.17*energy);
          const knee=local(sign*.12,.39+.27*seated,.44*seated+(1-seated)*(.035+Math.sin(phase+side*Math.PI)*.08*energy));bone('legs',i*4+side*2,hip,knee,1.04);bone('legs',i*4+side*2+1,knee,foot,.82);
          set('shoes',i*2+side,...foot,.85,.55,1.65,turn);
        }
      });
      guests.forEach((guest,i)=>{dummy.position.set(guest.x,-guest.z,0);dummy.rotation.set(0,0,0);dummy.scale.set(.65,.9,1);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);});shadows.instanceMatrix.needsUpdate=true;
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
    for(const dx of [-.22,.22])for(const dz of [-.22,.22])box(group,palette.gold,dx,.25,dz,.03,.5,.03);return group;
  }
  function foliage(parent,x,z,height=2.6){
    cylinder(parent,palette.cream,x,.22,z,.3,.44);cylinder(parent,palette.wood,x,height/2,z,.035,height);
    for(let i=0;i<7;i++){
      const angle=i*Math.PI*2/7;
      tube(parent,[[x,height,z],[x+Math.cos(angle)*.5,height+.27,z+Math.sin(angle)*.5],[x+Math.cos(angle)*1.05,height-.22,z+Math.sin(angle)*1.05]],palette.leaf,.045);
      const leaf=sphere(parent,palette.leaf,x+Math.cos(angle)*.65,height+.06,z+Math.sin(angle)*.65,.23);leaf.scale.set(.34,.09,1.0);leaf.rotation.y=angle+Math.PI/2;
    }
  }
  const ceremony=new THREE.Group();ceremony.name='Ceremony';const ceremonyPlace=places.ceremony(ceremony);
  const pavilion=new THREE.Group();pavilion.name='Taylor Beach House';const beach=places.beachHouse(pavilion,true);
  const shared=new THREE.Group();shared.name='Persistent guests, furniture and audio';shared.userData.dynamic=true;
  const weighted=(values,weights)=>values.reduce((sum,value,i)=>sum+value*weights[i],0);
  const move=(object,layouts,weights)=>{object.position.set(...['x','y','z'].map(key=>weighted(layouts.map(p=>p[key]??0),weights)));object.rotation.y=weighted(layouts.map(p=>p.turn??0),weights);};
  const layouts={ceremony:[],cocktail:[],party:[]};
  for(let i=0;i<33;i++){
    const side=i%6<3?-1:1,col=i%3,row=Math.floor(i/6);
    layouts.ceremony.push(i<24?{x:side*(1.6+col*.92),z:-.65+row*1.30,turn:Math.PI,seated:1}:i===24?{x:-.56,z:-2.55}:i===25?{x:.56,z:-2.55}:i===26?{x:0,z:-3.9}:i===27?{x:6.3,z:3.6}:{x:-5.7+(i-28)*2.8,z:6.1,turn:Math.PI});
    // Keep seating groups on their side of the aisle, instead of crossing the full crowd.
    const table=[[-4,-1.0],[4,-1.0],[-3.2,2.2],[3.2,2.2]][(row<2?0:2)+(side>0?1:0)],angle=((row%2)*3+col)*Math.PI/3;
    layouts.cocktail.push(i<24?{x:table[0]+Math.cos(angle)*1.12,z:table[1]+Math.sin(angle)*1.12,turn:-angle-Math.PI/2}:i===27?{x:0,z:-4.35}:i===24?{x:-.9,z:-1.1}:i===25?{x:.9,z:-1.1}:{x:-5.0+(i-26)*1.35,z:-3.05,turn:.2});
    const dx=i<24?side*(1.3+col*1.4)+(random()-.5)*.16:-4.3+(i%7)*1.40+(random()-.5)*.25,dz=i<24?-1.9+row*1.20:-2.2+Math.floor(i/7)*1.18;
    layouts.party.push(i===27?{x:0,z:-4.25}:i===24?{x:-.7,z:-.8}:i===25?{x:.7,z:-.8}:{x:Math.abs(dx)<1.15&&dz>1.4?dx+(dx<0?-1.6:1.6):dx,z:dz,turn:(random()-.5)*1.3});
  }
  const actors=Array.from({length:33},(_,i)=>({id:`guest-${i}`,x:0,z:0,turn:0,seated:0,dj:i===27,dress:i===24||(i<24&&i%3===1),color:i===24?0xffffff:i===25?0x28313d:undefined,height:i===27?1.1:undefined,layouts:SCENES.map(name=>({...layouts[name][i]}))}));
  actors.forEach(g=>{const base=g.layouts[0].turn??0;g.layouts.forEach(p=>p.turn=base+Math.atan2(Math.sin((p.turn??0)-base),Math.cos((p.turn??0)-base)));});
  const crowdUpdate=people(shared,actors,'shared'),solver=new CrowdSolver(actors),targets=actors.map(()=>({x:0,z:0}));
  const seats=actors.slice(0,24).map((g,i)=>{const object=chair(shared,g.layouts[0].x,g.layouts[0].z);object.userData.dynamic=true;object.name=`Persistent chair ${i}`;const side=g.layouts[0].x<0?-1:1,rank=Math.floor(i/6)*3+i%3;return {object,layouts:[{...g.layouts[0],turn:0},{x:side*6.45,z:-3.3+rank*.58,turn:side*Math.PI/2},{x:side*6.55,z:-3.3+rank*.58,turn:side*Math.PI/2}]};});
  const tables=[],glassGeometry=new THREE.LatheGeometry([new THREE.Vector2(.001,0),new THREE.Vector2(.025,.015),new THREE.Vector2(.052,.045),new THREE.Vector2(.070,.11),new THREE.Vector2(.064,.18)],16);
  for(let i=0;i<4;i++){
    const object=new THREE.Group();shared.add(object);object.name=`Persistent table ${i}`;const stem=cylinder(object,palette.gold,0,.65,0,.055,1.3),top=cylinder(object,palette.cream,0,1.32,0,.68,.075);cylinder(object,palette.gold,0,.04,0,.44,.075);
    const glasses=new THREE.Group();object.add(glasses);for(let j=0;j<4;j++){const x=Math.cos(j*1.57)*.32,z=Math.sin(j*1.57)*.32;cylinder(glasses,palette.gold,x,1.41,z,.015,.15);mesh(glasses,glassGeometry,palette.glass,[x,1.48,z]);}
    const decoration=new THREE.Group();object.add(decoration);const vase=cylinder(decoration,palette.cream,0,1.42,0,.085,.20);for(let j=0;j<7;j++){const a=j*2.4;sphere(decoration,j%3?palette.ivory:palette.leaf,Math.cos(a)*.09,1.58+Math.sin(a)*.04,Math.sin(a)*.09,.075);}
    const candle=sphere(decoration,palette.peach,.2,1.40,.1,.035);cylinder(decoration,palette.glass,.2,1.37,.1,.07,.10);
    tables.push({object,stem,top,glasses,vase,candle,decoration,layouts:[{x:i%2?5.45:-5.45,z:i<2?-3.2:4.7},{x:[-4,4,-3.2,3.2][i],z:[-1,-1,2.2,2.2][i]},{x:i%2?5.8:-5.8,z:i<2?-2.7:2.6}]});
  }
  const booth=new THREE.Group();booth.name='Persistent DJ console';shared.add(booth);
  box(booth,palette.darkWood,0,.81,0,3.40,1.55,1.1);box(booth,palette.metal,0,1.63,0,3.6,.13,1.25);
  for(const x of [-1.0,1.0]){box(booth,palette.black,x,1.74,0,1,.075,.74);cylinder(booth,palette.metal,x,1.8,0,.26,.025);cylinder(booth,palette.black,x,1.822,0,.21,.025);for(let j=0;j<6;j++)cylinder(booth,palette.black,x-.3+j*.12,1.81,.24,.018,.035);}
  for(let row=0;row<4;row++)for(let col=0;col<5;col++)cylinder(booth,palette.black,-.25+col*.12,1.8,-.24+row*.12,.018,.05);
  for(let i=0;i<4;i++){box(booth,palette.black,-.24+i*.16,1.785,.24,.020,.015,.19);box(booth,palette.metal,-.24+i*.16,1.80,.24,.035,.025,.045);}
  box(booth,palette.cyan,0,1.78,-.42,.45,.009,.15);tube(booth,[[1.5,1.8,-.4],[1.7,1.2,-.5],[1.7,.08,-.5],[2.0,.03,-1.2]],palette.black,.012);
  const equalizer=new THREE.InstancedMesh(geometries.box,palette.peach,16);equalizer.userData.dynamic=true;equalizer.frustumCulled=false;booth.add(equalizer);
  const speakerObjects=[];
  for(let i=0;i<4;i++){const holder=new THREE.Group();holder.name=i<2?'Main wireless audio system':'Additional sound setup';shared.add(holder);const cones=speaker(holder,0,0,i>=2);const side=i%2?1:-1;const position=i<2?[{x:side*4.7,z:-3.4},{x:side*5.6,z:-4.5},{x:side*5.6,z:-3.7}]:[{x:side*6.6,z:5.2},{x:side*6.8,z:3.8},{x:side*6.8,z:3.8}];speakerObjects.push({holder,cones,layouts:position,extra:i>=2,scale:0});}
  const microphones=[];
  for(let i=0;i<2;i++){const group=new THREE.Group();group.name=i?'Additional wireless microphone':'Wireless microphone';shared.add(group);cylinder(group,palette.black,0,.86,0,.025,1.72);cylinder(group,palette.metal,0,.015,0,.24,.035);const mic=new THREE.Group();mic.position.set(0,1.74,0);mic.rotation.z=-.45;group.add(mic);cylinder(mic,palette.black,0,0,0,.028,.21);sphere(mic,palette.metal,0,.15,0,.052);box(mic,palette.cyan,0,.012,.03,.012,.023,.004);microphones.push({group,scale:0,layouts:i?[{x:.95,z:-2.55},{x:2.9,z:-4.2},{x:1.85,z:-3.7}]:[{x:0,z:-3.38},{x:-2.9,z:-4.2},{x:-1.85,z:-3.7}]});}
  const receiver=box(booth,palette.black,1.15,1.84,-.32,.52,.11,.32);for(const x of [.95,1.36])cylinder(booth,palette.black,x,2.02,-.45,.006,.32);
  const disco=mesh(pavilion,new THREE.IcosahedronGeometry(.40,3),material(0xa8c2dd,{metalness:1,roughness:.09}),[0,3.62,-.4]);disco.userData.dynamic=true;cylinder(pavilion,palette.metal,0,4.15,-.4,.012,.68);
  const partyAccents=new THREE.Group();partyAccents.userData.dynamic=true;pavilion.add(partyAccents);const lights=[],spotlights=[];
  for(let i=0;i<4;i++){
   const pivot=new THREE.Group();pivot.position.set(-4.5+i*3,4.17,-4.50);partyAccents.add(pivot);
   const mat=new THREE.MeshBasicMaterial({color:i%2?0x9cd9e5:0xffe4b8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});const beam=mesh(pivot,new THREE.ConeGeometry(.65,6.5,12,1,true),mat,[0,-3.25,0]);beam.castShadow=false;box(pivot,palette.black,0,.06,0,.32,.25,.36);lights.push({pivot,mat});
   if(i===0||i===3){const spot=new THREE.SpotLight(i===0?0x9fcee4:0xffb888,0,20,.40,.78,1.8);spot.position.copy(pivot.position);spot.target.position.set(i===0?-2:2,0,1.8);partyAccents.add(spot,spot.target);spotlights.push(spot);}
  }
  const interiorLights=[];pavilion.traverse(object=>{if(object.isPointLight)interiorLights.push(object);});
  const stars=pavilion.children.find(object=>object.isPoints),sky=beach.dome.material.uniforms,dayHorizon=new THREE.Color(0xffce92),nightHorizon=new THREE.Color(0x39404e),dayZenith=new THREE.Color(0x867eb0),nightZenith=new THREE.Color(0x060e20);
  function propParts(group,includeGlass=false){
   group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),batches=new Map(),originals=[];
   group.traverse(object=>{if(!object.isMesh||object.isInstancedMesh||object.material.isShaderMaterial||(!includeGlass&&object.material.transparent))return;for(let ancestor=object;ancestor&&ancestor!==group;ancestor=ancestor.parent)if(ancestor.userData.dynamic)return;
    const key=object.material.uuid;if(!batches.has(key))batches.set(key,{material:object.material,geometries:[],shadow:object.castShadow});const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));batches.get(key).geometries.push(geometry);originals.push(object);});
   const parts=[...batches.values()].map(batch=>{const geometry=mergeGeometries(batch.geometries,false);if(!geometry)throw Error('Prop geometry could not be combined.');batch.geometries.forEach(g=>g.dispose());return {...batch,geometry};});originals.forEach(object=>object.removeFromParent());return parts;
  }
  function batchProp(group,includeGlass=false){propParts(group,includeGlass).forEach(part=>{const mesh=new THREE.Mesh(part.geometry,part.material);mesh.castShadow=part.shadow;mesh.receiveShadow=true;group.add(mesh);});}
  const chairParts=propParts(seats[0].object),chairInstances=chairParts.map(part=>{const object=new THREE.InstancedMesh(part.geometry,part.material,seats.length);object.name='Persistent chairs';object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);object.frustumCulled=false;object.castShadow=part.shadow;object.receiveShadow=true;shared.add(object);return object;});
  seats.slice(1).forEach(seat=>{const meshes=[];seat.object.traverse(o=>{if(o.isMesh)meshes.push(o);});meshes.forEach(o=>o.removeFromParent());});
  tables.forEach(table=>{table.stem.userData.dynamic=true;table.top.userData.dynamic=true;table.glasses.userData.dynamic=true;table.decoration.userData.dynamic=true;batchProp(table.glasses,true);batchProp(table.decoration,true);batchProp(table.object);});
  receiver.userData.dynamic=true;batchProp(booth);
  speakerObjects.forEach(s=>batchProp(s.holder));microphones.forEach(m=>batchProp(m.group));
  const obstacles=[],furnitureOffsets=new Map();
  let selectedTier=1;
  function setTier(index){selectedTier=tiers[index]?index:1;solver.invalidate();}
  function update(time,beat,pointer,drop,weights,dt=1/30,instant=false){
   const day=weights[1],night=weights[2],beachWeight=day+night,nightMix=beachWeight>1e-8?night/beachWeight:0;
   actors.forEach((g,i)=>{for(const key of ['x','z'])targets[i][key]=weighted(g.layouts.map(p=>p[key]??0),weights);for(const key of ['turn','seated'])g[key]=weighted(g.layouts.map(p=>p[key]??0),weights);});
   seats.forEach(seat=>move(seat.object,seat.layouts,weights));
   tables.forEach(table=>{move(table.object,table.layouts,weights);const height=weighted([1.32,1.32,.82],weights),ratio=height/1.32;table.stem.scale.y=1.3*ratio;table.stem.position.y=.65*ratio;table.top.position.y=height;table.glasses.position.y=height-1.32;table.glasses.scale.setScalar(Math.max(.001,beachWeight));table.decoration.position.y=height-1.32;});
   move(booth,[{x:6.3,z:4.2},{x:0,z:-3.5},{x:0,z:-3.25}],weights);
   const coverage=SCENES.reduce((sum,name,i)=>sum+(audioProfile(selectedTier,name).covered?weights[i]:0),0),damp=dt===0?1:1-Math.exp(-dt*8);booth.scale.setScalar(Math.max(.0001,weighted([.52,.72,1],weights)*coverage));booth.visible=coverage>.002;
   speakerObjects.forEach(s=>{move(s.holder,s.layouts,weights);const target=coverage*(s.extra&&selectedTier!==2?0:1);s.scale=THREE.MathUtils.lerp(s.scale,target,damp);s.holder.scale.setScalar(Math.max(.0001,s.scale*weighted([.76,.86,1],weights)));s.holder.visible=s.scale>.002;s.cones.forEach(c=>c.scale.z=.2+beat*night*.028);});
   microphones.forEach((m,i)=>{move(m.group,m.layouts,weights);m.scale=THREE.MathUtils.lerp(m.scale,coverage*(i&&selectedTier!==2?0:1),damp);m.group.scale.setScalar(Math.max(.0001,m.scale));m.group.visible=m.scale>.002;});

   obstacles.length=0;
   const furnitureMobility=instant?0:Math.sin(Math.PI*weights[0])**2*.75;
   const addFurniture=(object,shape)=>{let offset=furnitureOffsets.get(object);if(!offset){offset={x:0,z:0};furnitureOffsets.set(object,offset);}const decay=instant?0:Math.exp(-dt*5);offset.x*=decay;offset.z*=decay;const targetX=object.position.x,targetZ=object.position.z;obstacles.push({...shape,x:targetX+offset.x,z:targetZ+offset.z,weight:1,mobility:furnitureMobility,object,targetX,targetZ,offset});};
   const rectangle=(object,hx,hz,owner=-1,weight=1)=>{obstacles.push({kind:'box',x:object.position.x,z:object.position.z,hx:hx*object.scale.x,hz:hz*object.scale.z,cos:Math.cos(object.rotation.y),sin:Math.sin(object.rotation.y),owner,weight});};
   seats.forEach((seat,i)=>addFurniture(seat.object,{kind:'box',hx:.29,hz:.32,cos:Math.cos(seat.object.rotation.y),sin:Math.sin(seat.object.rotation.y),owner:i}));tables.forEach(table=>addFurniture(table.object,{kind:'circle',radius:.68}));
   if(booth.visible)rectangle(booth,1.70,.55);speakerObjects.forEach(s=>{if(s.holder.visible)rectangle(s.holder,.66,.55);});microphones.forEach(m=>{if(m.group.visible)obstacles.push({kind:'circle',x:m.group.position.x,z:m.group.position.z,radius:.13*m.scale,weight:1});});
   obstacles.push({kind:'box',x:0,z:-5.45,hx:2.95,hz:.60,cos:1,sin:0,weight:beachWeight},{kind:'circle',x:3.35,z:-5.4,radius:.72,weight:weights[0]});
   for(const x of [-7.7,7.7])for(const z of [-6,-.5,5])obstacles.push({kind:'circle',x,z,radius:.20,weight:beachWeight});
   solver.bounds.x=7.1+beachWeight*1.1;solver.bounds.maxZ=7.1-beachWeight*1.15;
   solver.step(targets,obstacles,dt,{instant,key:weights.join(',')+':'+selectedTier});
   obstacles.forEach(o=>{if(o.object){o.offset.x=o.x-o.targetX;o.offset.z=o.z-o.targetZ;o.object.position.x=o.x;o.object.position.z=o.z;}});
   seats.forEach((seat,i)=>{seat.object.updateMatrix();chairInstances.forEach(object=>object.setMatrixAt(i,seat.object.matrix));});chairInstances.forEach(object=>object.instanceMatrix.needsUpdate=true);
   actors.forEach((g,i)=>{g.x=solver.x[i];g.z=solver.z[i];});crowdUpdate(time,beat,weights);
   receiver.visible=coverage>.002;
   disco.rotation.y=time*.26;lights.forEach(({pivot,mat},i)=>{pivot.rotation.z=Math.sin(time*.52+i)*.38+pointer.x*.16;pivot.rotation.x=.34+Math.cos(time*.35+i*.7)*.18+pointer.y*.10;mat.opacity=.022*nightMix;});spotlights.forEach((spot,i)=>{spot.target.position.set((i?2:-2)+pointer.x*2+Math.sin(time*.4+i),.2,-.3+pointer.y);spot.intensity=nightMix*(80+beat*35);});
   for(let i=0;i<16;i++){dummy.position.set(-1.15+i*.15,.85,.563);dummy.rotation.set(0,0,0);dummy.scale.set(.035,.3*(.25+night*(Math.abs(Math.sin(time*3.4+i*.6))*1.5+beat*.4)),.016);dummy.updateMatrix();equalizer.setMatrixAt(i,dummy.matrix);}equalizer.instanceMatrix.needsUpdate=true;
   sky.horizon.value.copy(dayHorizon).lerp(nightHorizon,nightMix);sky.zenith.value.copy(dayZenith).lerp(nightZenith,nightMix);sky.night.value=nightMix;if(stars)stars.material.opacity=.60*nightMix;
   interiorLights.forEach(light=>light.intensity=(light.position.x===-11?15:42)*(.18+.82*nightMix));
   if(weights[0]>.0001)ceremonyPlace.update(time);
  }
  const interiorProfile={azimuth:-.045,elevation:.065,radius:5.4,lookY:1.45,lookZ:-2.1,fov:65,interior:1};
  const worlds={
   ceremony:{group:ceremony,guests:actors.length,profile:{azimuth:.025,elevation:.035,radius:13.2,lookY:2.45,lookZ:-2.4,fov:58,interior:.35},landmark:ceremonyPlace.tower,terrain:ceremonyPlace.terrain},
   cocktail:{group:pavilion,guests:actors.length,profile:{...interiorProfile},pavilion:beach},
   party:{group:pavilion,guests:actors.length,profile:{...interiorProfile},pavilion:beach}
  };
  const rig={group:shared,pavilion,actors,solver,obstacles,seats,chairInstances,tables,speakers:speakerObjects,microphones,update,setTier,getTier:()=>selectedTier,
   showEnvironment(name){ceremony.visible=name==='ceremony';pavilion.visible=name!=='ceremony';},
   syncVisibility(weights){ceremony.visible=weights[0]>1e-5;pavilion.visible=weights[1]+weights[2]>1e-5;},
   environmentDome(name){const dome=(name==='ceremony'?ceremonyPlace.dome:beach.dome).clone();dome.material=dome.material.clone();if(name!=='ceremony'){const night=name==='party';dome.material.uniforms.horizon.value.copy(night?nightHorizon:dayHorizon);dome.material.uniforms.zenith.value.copy(night?nightZenith:dayZenith);dome.material.uniforms.night.value=night?1:0;}return dome;}
  };
  Object.defineProperty(worlds,'rig',{value:rig});
  // Batch only static architecture. Persistent guests and furniture retain their identities.
  for(const group of [ceremony,pavilion]){
    await yieldWork();const batches=new Map(),originals=[];group.updateMatrixWorld(true);
    group.traverse(object=>{if(!object.isMesh||object.isInstancedMesh||object.material.isShaderMaterial||object.material.transparent)return;for(let ancestor=object;ancestor&&ancestor!==group;ancestor=ancestor.parent)if(ancestor.userData.dynamic)return;
     const key=object.material.uuid+':'+object.castShadow;if(!batches.has(key))batches.set(key,{material:object.material,shadow:object.castShadow,geometries:[]});const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);batches.get(key).geometries.push(geometry);originals.push(object);});
    for(const batch of batches.values()){await yieldWork();const geometry=mergeGeometries(batch.geometries,false);if(!geometry)throw Error('Venue geometry could not be combined.');const object=new THREE.Mesh(geometry,batch.material);object.castShadow=batch.shadow;object.receiveShadow=true;group.add(object);batch.geometries.forEach(part=>part.dispose());}originals.forEach(object=>object.removeFromParent());group.userData.batchedParts=originals.length;
  }
  update(0,0,new THREE.Vector2(),0,[1,0,0],0,true);
  return worlds;
}
