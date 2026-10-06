import * as THREE from 'three';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

export class SceneTransition {
  constructor(worlds,mode='ceremony'){
    this.worlds=worlds;this.mode=mode;this.progress=1;
    this.start=new THREE.Vector3();this.end=new THREE.Vector3();
    Object.entries(worlds).forEach(([name,world])=>world.group.visible=name===mode);
  }
  select(value,animate=true){
    if(!this.worlds[value]||value===this.mode)return false;
    const order=['ceremony','cocktail','party'];this.direction=order.indexOf(value)>order.indexOf(this.mode)?1:-1;
    Object.entries(this.worlds).forEach(([name,world])=>world.group.visible=name===this.mode||name===value);
    this.previous=this.mode;const previous=this.worlds[this.previous].group;
    this.start.copy(previous.position);this.startScale=previous.scale.x;this.end.set(-this.direction*22,-1.3,0);
    this.mode=value;this.progress=0;
    const next=this.worlds[value].group;next.position.set(this.direction*22,-1.3,0);next.scale.setScalar(.9);
    if(!animate)this.finish();return true;
  }
  update(dt){
    if(this.progress===1)return;
    this.progress=Math.min(1,this.progress+dt/1.05);const ease=1-(1-this.progress)**4;
    const next=this.worlds[this.mode].group;next.position.set(this.direction*22*(1-ease),-1.3*(1-ease),0);next.scale.setScalar(.9+ease*.1);
    const previous=this.worlds[this.previous].group;previous.position.lerpVectors(this.start,this.end,ease);previous.scale.setScalar(THREE.MathUtils.lerp(this.startScale,.9,ease));
    if(this.progress===1)previous.visible=false;
  }
  finish(){
    this.progress=1;const next=this.worlds[this.mode].group;next.position.set(0,0,0);next.scale.setScalar(1);
    Object.entries(this.worlds).forEach(([name,world])=>world.group.visible=name===this.mode);
  }
}

// Three independent, imagined venues. Shared geometry keeps the crowd inexpensive.
export async function createWorlds({yieldToMain=false}={}) {
  const yieldWork=async()=>{if(yieldToMain)await new Promise(resolve=>setTimeout(resolve,0));};
  let seed=428;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.55,...options});
  const glow=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
  const palette={
    ivory:material(0xf8f8f3),sand:material(0xb8a98c),gold:material(0xc5a26b,{metalness:.8,roughness:.28}),
    wood:material(0x624536),black:material(0x101522,{roughness:.3}),metal:material(0x647085,{metalness:.8,roughness:.25}),
    leaf:material(0x456348),pink:material(0xcb887d),cream:material(0xf4f4ed),
    peach:glow(0xffc896),lime:glow(0xcafa63),cyan:glow(0x72ebff),rose:glow(0xff66ad)
  };
  const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,20),sphere:new THREE.SphereGeometry(1,16,12)};
  function mesh(parent,geometry,mat,position,scale=[1,1,1]){
    const object=new THREE.Mesh(geometry,mat);object.position.set(...position);object.scale.set(...scale);object.castShadow=!mat.isMeshBasicMaterial&&!mat.isShaderMaterial&&!mat.transparent;object.receiveShadow=true;parent.add(object);return object;
  }
  const box=(parent,mat,x,y,z,w,h,d)=>mesh(parent,geometries.box,mat,[x,y,z],[w,h,d]);
  const cylinder=(parent,mat,x,y,z,r,h)=>mesh(parent,geometries.cylinder,mat,[x,y,z],[r,h,r]);
  const sphere=(parent,mat,x,y,z,r)=>mesh(parent,geometries.sphere,mat,[x,y,z],[r,r,r]);
  function tube(parent,points,mat,radius=.025){
    return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),40,radius,6,false),mat,[0,0,0]);
  }
  function floor(parent,top,edge){
    box(parent,edge,0,-.24,0,14,.45,11.5);box(parent,top,0,.005,0,13.9,.04,11.4);
    box(parent,palette.gold,0,-.08,5.76,14,.022,.025);
    for(const x of [-7,7])box(parent,palette.gold,x,-.08,0,.025,.022,11.5);
  }
  const personGeometry={
    torso:new THREE.CapsuleGeometry(.19,.42,5,12),head:new THREE.SphereGeometry(.135,16,12),
    limb:new THREE.CylinderGeometry(.054,.064,1,9),leg:new THREE.CylinderGeometry(.066,.081,1,9),
    hair:new THREE.SphereGeometry(.144,14,10),shoe:new THREE.SphereGeometry(.09,10,8),
    dress:new THREE.ConeGeometry(.33,.72,16)
  };
  const clothes=[0x293244,0xb7a994,0x546674,0xe0bdad,0x70585d,0x9a9c7b,0xd1dad1];
  const skins=[0xe5bfa2,0xc49273,0x95654d,0x654431,0xdab494];
  const dummy=new THREE.Object3D(),start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  function people(parent,guests,kind){
    const count=guests.length,white=material(0xffffff,{roughness:.65});
    const parts={torso:[personGeometry.torso,count],head:[personGeometry.head,count],hair:[personGeometry.hair,count],arms:[personGeometry.limb,count*4],hands:[personGeometry.head,count*2],legs:[personGeometry.leg,count*2],shoes:[personGeometry.shoe,count*2],dress:[personGeometry.dress,count]};
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
      const object=new THREE.InstancedMesh(geometry,white,size);object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);object.frustumCulled=false;object.castShadow=name!=='hair';object.receiveShadow=true;parent.add(object);instances[name]=object;
    }
    guests.forEach((guest,i)=>{
      guest.phase=random()*Math.PI*2;guest.height=guest.height||(.92+random()*.13);
      const cloth=new THREE.Color(guest.color||clothes[i%clothes.length]),skin=new THREE.Color(skins[i%skins.length]);
      for(const key of ['torso','dress'])instances[key].setColorAt(i,cloth);
      instances.head.setColorAt(i,skin);instances.hair.setColorAt(i,new THREE.Color(i%3?0x352b28:0x72604d));
      for(let side=0;side<2;side++){
        instances.hands.setColorAt(i*2+side,skin);instances.legs.setColorAt(i*2+side,new THREE.Color(0x242b36));instances.shoes.setColorAt(i*2+side,new THREE.Color(0x151b24));
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
        set('torso',i,x,y+1.03*h,z,.95,h,1,turn,Math.sin(phase)*.12*energy);
        set('head',i,x+sway*.2,y+1.55*h,z,1,h,1,turn);
        set('hair',i,x+sway*.2,y+1.60*h,z-.026,1,.67*h,1,turn);
        set('dress',i,x,y+.58*h,z,g.dress?1:.001,g.dress?h:.001,g.dress?1:.001,turn);
        const cos=Math.cos(turn),sin=Math.sin(turn);
        const local=(dx,dy,dz)=>[x+dx*cos+dz*sin,y+dy*h,z-dx*sin+dz*cos];
        for(let side=0;side<2;side++){
          const sign=side?1:-1,raised=dancing&&(i%3!==0),reach=raised?.29:.20;
          const shoulder=local(sign*.20,1.23,0);
          const elbow=local(sign*(raised?.40:.28),raised?1.45+Math.sin(phase+side)*.15:.95,seated?.12:.02);
          const hand=local(sign*reach,raised?1.93+Math.sin(phase+side)*.12:(g.dj?1.48:kind==='cocktail'&&side===1?1.2:.71),g.dj?.46:kind==='cocktail'&&side===1?.28:seated?.35:.09);
          bone('arms',i*4+side*2,shoulder,elbow);bone('arms',i*4+side*2+1,elbow,hand,.88);
          set('hands',i*2+side,...hand,.38,.48,.38,turn);
          const hip=local(sign*.105,.72,0),foot=local(sign*.13,.07,seated?.52:Math.sin(phase+side*Math.PI)*.17*energy);
          bone('legs',i*2+side,hip,foot,.95);
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
  floor(ceremony,material(0xe8ebe3),palette.ivory);
  box(ceremony,palette.ivory,0,.045,.15,2.05,.025,8.4);
  mesh(ceremony,new THREE.TorusGeometry(2.15,.095,12,72,Math.PI),palette.gold,[0,2.35,-3.6]);
  for(const x of [-2.15,2.15])cylinder(ceremony,palette.gold,x,1.18,-3.6,.09,2.36);
  const flowerGeometry=new THREE.IcosahedronGeometry(.12,1),flowers=new THREE.InstancedMesh(flowerGeometry,palette.ivory,82);ceremony.add(flowers);
  for(let i=0;i<82;i++){
    const angle=random()*Math.PI,r=2.15+(random()-.5)*.3;dummy.position.set(Math.cos(angle)*r,2.35+Math.sin(angle)*r,-3.6+(random()-.5)*.32);dummy.rotation.set(random(),random(),random());dummy.scale.setScalar(.65+random()*.8);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new THREE.Color(i%3?0xffffff:0xc1cbb5));
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
  const sun=mesh(ceremony,new THREE.CircleGeometry(2.2,64),glow(0xffffff),[0,5.1,-7.1]);sun.castShadow=false;sun.userData.dynamic=true;
  const horizon=box(ceremony,material(0xc7dcd7,{roughness:1}),0,-.32,-6.8,22,.14,5);horizon.castShadow=false;
  await yieldWork();
  const cocktail=new THREE.Group();cocktail.name='Cocktail';floor(cocktail,material(0x98807c),palette.wood);
  for(const x of [-6.9,6.9]){box(cocktail,palette.gold,x,.65,.1,.045,1.3,11);box(cocktail,palette.gold,x,1.28,.1,.05,.035,11);}
  box(cocktail,palette.gold,0,1.15,-5.3,13.8,.045,.045);
  for(let x=-6.5;x<=6.5;x+=1)box(cocktail,palette.gold,x,.55,-5.3,.035,1.1,.035);
  box(cocktail,palette.pink,0,.77,-3.9,5.8,1.55,1.25);box(cocktail,palette.cream,0,1.58,-3.9,6.05,.15,1.4);
  for(let i=0;i<18;i++)box(cocktail,palette.gold,-2.62+i*.31,.73,-3.24,.022,1.30,.028);
  for(let i=0;i<9;i++){
    const x=-2.25+i*.56;cylinder(cocktail,i%2?palette.leaf:palette.pink,x,1.86,-4,.08,.37);cylinder(cocktail,palette.gold,x,2.09,-4,.034,.1);
  }
  const tables=[[-3.9,-.7],[3.75,-.65],[-2.75,3.05],[2.95,2.85]],cocktailGuests=[];
  tables.forEach(([x,z],i)=>{
    cylinder(cocktail,palette.gold,x,.65,z,.055,1.3);cylinder(cocktail,palette.gold,x,.04,z,.44,.075);cylinder(cocktail,palette.cream,x,1.32,z,.68,.075);
    for(let glass=0;glass<3;glass++){
      const gx=x+Math.cos(glass*2.1)*.33,gz=z+Math.sin(glass*2.1)*.33;cylinder(cocktail,palette.gold,gx,1.41,gz,.015,.15);sphere(cocktail,palette.peach,gx,1.53,gz,.06);
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
  for(const z of [-3,.5,3.6]){
    tube(cocktail,[[-6.6,4.65,z],[0,4.15,z],[6.6,4.65,z]],palette.wood,.012);
    for(let i=0;i<9;i++){const x=-5.8+i*1.45,y=4.17+(x/6.6)**2*.47;sphere(cocktail,palette.peach,x,y-.1,z,.065);}
  }
  for(const x of [-6.4,6.4])cylinder(cocktail,palette.gold,x,2.4,3.6,.025,4.8);
  foliage(cocktail,-6.0,-4.1,3.4);foliage(cocktail,6.0,-4.1,3.4);
  const moon=mesh(cocktail,new THREE.TorusGeometry(2.3,.012,8,64),palette.rose,[0,4.1,-6.5]);moon.castShadow=false;moon.userData.dynamic=true;
  await yieldWork();
  const party=new THREE.Group();party.name='Dance floor';floor(party,material(0x172034,{metalness:.65,roughness:.28}),palette.black);
  box(party,palette.black,0,2.45,-5.45,13.5,5,.22);
  for(const x of [-6.4,6.4]){box(party,palette.metal,x,2.55,-4.8,.16,5.1,.16);box(party,palette.metal,x,2.55,4.4,.14,5.1,.14);box(party,palette.cyan,x,5.1,-.2,.025,.025,9.4);}
  box(party,palette.metal,0,5.1,-4.8,12.9,.15,.15);
  const ledMaterial=new THREE.ShaderMaterial({
    uniforms:{time:{value:0},beat:{value:0},cursor:{value:new THREE.Vector2(.5,.5)}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv; uniform float time; uniform float beat; uniform vec2 cursor;
      void main(){vec2 p=vUv-.5;float r=length(p);float wave=.5+.5*sin(r*38.-time*3.);
      float grid=step(.89,fract(vUv.x*16.))+step(.90,fract(vUv.y*9.));
      float halo=exp(-abs(r-(.24+sin(time*.5)*.025))*110.);float trail=exp(-length(vUv-cursor)*7.);
      vec3 a=vec3(.28,.75,1.),b=vec3(1.,.12,.5);vec3 c=mix(a,b,.5+.5*sin(p.x*4.+time*.3));
      gl_FragColor=vec4(c*(.025+grid*.035+halo*(1.+beat*.5)+wave*.065+trail*.12),1.);}`
  });
  const led=mesh(party,new THREE.PlaneGeometry(9.5,3.55),ledMaterial,[0,2.77,-5.30]);led.castShadow=false;
  const floorMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{time:{value:0},beat:{value:0},cursor:{value:new THREE.Vector2()}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv; uniform float time;uniform float beat;uniform vec2 cursor;
      void main(){vec2 cells=vUv*8.;vec2 edge=abs(fract(cells)-.5);float line=smoothstep(.46,.485,max(edge.x,edge.y));
      float pulse=pow(.5+.5*sin(length(vUv-.5)*25.-time*4.),8.);float spot=exp(-length(vUv-cursor)*8.);
      vec3 a=vec3(.12,.38,.50),b=vec3(.58,.13,.38);vec3 c=mix(a,b,.5+.5*sin(vUv.x*6.+time*.4));
      gl_FragColor=vec4(c*(line*.45+pulse*.13+spot*.5+beat*.04),1.);}`
  });
  const danceTiles=mesh(party,new THREE.PlaneGeometry(9.7,8.25),floorMaterial,[0,.037,.6]);danceTiles.rotation.x=-Math.PI/2;danceTiles.castShadow=false;
  const booth=new THREE.Group();booth.position.z=-3.75;party.add(booth);
  box(booth,palette.black,0,.81,0,3.75,1.55,1.1);box(booth,palette.metal,0,1.63,0,3.95,.13,1.25);
  box(booth,palette.rose,0,.20,.56,3.65,.028,.028);for(const x of [-1.82,1.82])box(booth,palette.cyan,x,.87,.56,.024,1.29,.028);
  const equalizer=[];for(let i=0;i<22;i++){const bar=box(booth,i%3?palette.cyan:palette.rose,-1.46+i*.14,.85,.563,.055,.35,.022);bar.userData.dynamic=true;equalizer.push(bar);}
  for(const x of [-1.05,1.05]){box(booth,palette.black,x,1.74,0,1,.075,.74);cylinder(booth,palette.metal,x,1.8,0,.26,.025);cylinder(booth,palette.black,x,1.822,0,.21,.025);}
  for(let i=0;i<6;i++)cylinder(booth,palette.metal,-.23+i*.09,1.8,0,.018,.08);
  const speakerCones=[...speaker(party,-4.72,-3.65),...speaker(party,4.72,-3.65)];
  const dancers=Array.from({length:32},(_,i)=>({x:-3.48+(i%7)*1.12+(random()-.5)*.35,z:-1.75+Math.floor(i/7)*1.23+(random()-.5)*.4,turn:(random()-.5)*1.25,dress:i%5===0}));
  dancers.push({x:0,z:-4.02,dj:true,color:0x293043,height:1.25});const partyPeople=people(party,dancers,'party');
  const disco=mesh(party,new THREE.IcosahedronGeometry(.56,3),material(0xa8c2dd,{metalness:1,roughness:.09,flatShading:true}),[0,4.8,.1]);
  disco.userData.dynamic=true;cylinder(party,palette.metal,0,5.42,.1,.013,.67);
  const lights=[];
  for(let i=0;i<6;i++){
    const pivot=new THREE.Group();pivot.userData.dynamic=true;pivot.position.set(-5+i*2,4.82,-4.50);party.add(pivot);
    const mat=new THREE.MeshBasicMaterial({color:i%3===0?0xff5db1:i%3===1?0x79f1ff:0xd2f98a,transparent:true,opacity:.045,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const beam=mesh(pivot,new THREE.ConeGeometry(.80,7,16,1,true),mat,[0,-3.5,0]);beam.castShadow=false;
    box(pivot,palette.black,0,.06,0,.32,.25,.36);lights.push(pivot);
  }
  const rings=[];
  for(let i=0;i<3;i++){const ring=mesh(party,new THREE.RingGeometry(.99,1,80),new THREE.MeshBasicMaterial({color:0x91f2eb,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending}),[0,.046,.3]);ring.rotation.x=-Math.PI/2;ring.castShadow=false;rings.push(ring);}
  await yieldWork();
  const worlds={
    ceremony:{group:ceremony,guests:guests.length,title:'THE VOWS',number:'01',profile:{azimuth:.24,elevation:.48,radius:23.5,lookY:1.15},update(time,beat,pointer){ceremonyPeople(time);flowers.rotation.z=Math.sin(time*.26)*.008;sun.scale.setScalar(1+Math.sin(time*.2)*.012);}},
    cocktail:{group:cocktail,guests:cocktailGuests.length,title:'THE TOASTS',number:'02',profile:{azimuth:-.36,elevation:.48,radius:23,lookY:1.15},update(time,beat,pointer){cocktailPeople(time);moon.rotation.z=time*.065;}},
    party:{group:party,guests:dancers.length,title:'THE DROP',number:'03',profile:{azimuth:.40,elevation:.45,radius:23,lookY:1.15},update(time,beat,pointer,drop=0){
      partyPeople(time,beat);disco.rotation.y=time*.35;
      ledMaterial.uniforms.time.value=time;ledMaterial.uniforms.beat.value=beat;ledMaterial.uniforms.cursor.value.set(.5+pointer.x*.4,.5-pointer.y*.4);
      floorMaterial.uniforms.time.value=time;floorMaterial.uniforms.beat.value=beat;floorMaterial.uniforms.cursor.value.set(.5+pointer.x*.42,.5+pointer.y*.42);
      equalizer.forEach((bar,i)=>bar.scale.y=.35+Math.abs(Math.sin(time*3.4+i*.6))*1.7+beat*.45);
      lights.forEach((light,i)=>{light.rotation.z=Math.sin(time*.52+i)*.45+pointer.x*.28;light.rotation.x=.34+Math.cos(time*.35+i*.7)*.23+pointer.y*.13;});
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
