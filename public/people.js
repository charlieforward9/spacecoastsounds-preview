import * as THREE from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createArmGeometry,attachArmDeformation,ARM_UPPER,ARM_FOREARM,ARM_MAX_BEND} from './arms.js?v=20261006-matrix';

// Authored anatomy and clothing. Shared geometry, materials and textures for every guest.
export const skinTones=[0xf0d1b9,0xe8c3a9,0xe3b89b,0xd8a787,0xc89675,0xa57556,0x78523d];
const tonePlan=[0,2,1,3,2,0,4,1,6,2,0,3,1,4,5,2,0,3,1,2,4,0,3,6,1,2,0,4,1,3,2,5,0];
const clothes=[0x293244,0xb9a894,0x62717b,0xd4a697,0x78545d,0x90967c,0xc8d0c4];
const hairColors=[0x352923,0x796044,0xab8b5c,0x493329,0x785548,0x928b80];
const clamp=THREE.MathUtils.clamp;

function combine(parts){
  const originals=parts.map(g=>g.index?g.toNonIndexed():g.clone());
  const merged=mergeGeometries(originals,false);
  if(!merged)throw Error('Guest geometry could not be combined.');
  originals.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());return merged;
}
function colored(geometry,color=[1,1,1]){
  const data=new Float32Array(geometry.attributes.position.count*3);
  for(let i=0;i<data.length;i+=3)data.set(color,i);
  geometry.setAttribute('color',new THREE.BufferAttribute(data,3));return geometry;
}
function surface(vertices,triangles){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap(v=>[v[0]+.5,v[1]+.5]),2));
  geometry.setIndex(triangles.flat());geometry.computeVertexNormals();return geometry;
}
function ellipsoid(x,y,z,sx,sy,sz,width=12,height=8){
  const geometry=new THREE.SphereGeometry(1,width,height);geometry.scale(sx,sy,sz);geometry.translate(x,y,z);return geometry;
}
function morph(geometry,transform){
  const target=geometry.clone(),position=target.attributes.position;
  for(let i=0;i<position.count;i++)position.setXYZ(i,...transform(position.getX(i),position.getY(i),position.getZ(i),i));
  target.computeVertexNormals();geometry.morphAttributes.position??=[];geometry.morphAttributes.normal??=[];
  geometry.morphAttributes.position.push(position.clone());geometry.morphAttributes.normal.push(target.attributes.normal.clone());target.dispose();
}
function grain(kind,size=64){
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const n=Math.sin(x*127.1+y*311.7)*43758.5453%1;
    const value=kind==='hair'?155+Math.sin(x*1.7+Math.sin(y*.07)*.7)*30+n*9:180+n*22;
    const offset=(y*size+x)*4;data[offset]=data[offset+1]=data[offset+2]=Math.round(value);data[offset+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

function headGeometry(coarse){
  const skull=new THREE.SphereGeometry(1,coarse?16:24,coarse?12:16),p=skull.attributes.position;
  for(let i=0;i<p.count;i++){
    const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i),jaw=1-.20*Math.max(0,-ny);
    const x=nx*.088*jaw,y=ny*(ny>0?.119:.112),front=Math.max(0,nz);
    let z=nz*.098;
    if(nz>0){
      const sockets=Math.exp(-((Math.abs(x)-.032)**2/.00013+(y-.027)**2/.00012));
      const cheeks=Math.exp(-((Math.abs(x)-.047)**2/.00025+(y+.010)**2/.00018));
      const brow=Math.exp(-((Math.abs(x)-.033)**2/.00020+(y-.046)**2/.000045));
      z+=front*(-.009*sockets+.004*cheeks+.003*brow);
    }
    p.setXYZ(i,x,y,z-(ny<-.4?.006:0));
  }
  skull.computeVertexNormals();
  const nose=surface([
    [0,.043,.093],[-.005,.027,.098],[.005,.027,.098],[-.006,-.009,.111],[.006,-.009,.111],
    [0,-.012,.125],[-.012,-.017,.106],[.012,-.017,.106],[0,-.024,.107],[0,-.020,.116]
  ],[[0,1,2],[1,3,5],[1,5,2],[2,5,4],[3,6,9],[3,9,5],[5,9,4],[4,9,7],[6,8,9],[9,8,7]]);
  const parts=[skull,nose,ellipsoid(-.085,-.008,-.005,.014,.023,.014,coarse?8:12,coarse?6:8),ellipsoid(.085,-.008,-.005,.014,.023,.014,coarse?8:12,coarse?6:8)];
  for(const sign of [-1,1]){
    const points=[[-.014,0,0],[-.008,.004,.001],[0,.005,.001],[.008,.004,0],[.014,0,-.002]].map(([x,y,z])=>new THREE.Vector3(x+sign*.033,y+.027,z+.088));
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),coarse?8:12,.0018,4,false));
  }
  return combine(parts);
}
function torsoGeometry(coarse){
  const rings=[[.16,.86,.103],[.17,.93,.105],[.149,1.025,.099],[.175,1.14,.111],[.204,1.25,.117],[.215,1.345,.097],[.124,1.38,.074],[.054,1.414,.049]];
  const vertices=[],triangles=[],segments=coarse?14:20;
  rings.forEach(([width,y,depth])=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push([Math.sin(a)*width,y,Math.cos(a)*depth]);}});
  for(let ring=0;ring<rings.length-1;ring++)for(let i=0;i<segments;i++){const a=ring*(segments+1)+i,b=a+segments+1;triangles.push([a,a+1,b],[a+1,b+1,b]);}
  const body=colored(surface(vertices,triangles));
  const lapels=[];for(const sign of [-1,1])lapels.push(colored(surface([
    [sign*.038,1.383,.087],[sign*.135,1.30,.113],[sign*.061,1.263,.141],[sign*.091,1.225,.137],[sign*.017,1.143,.118]
  ],sign===1?[[0,2,1],[2,3,1],[2,4,3]]:[[0,1,2],[2,1,3],[2,3,4]]),[.86,.87,.88]));
  const geometry=combine([body,...lapels]),bodyVertexCount=body.index?.count??body.attributes.position.count;
  morph(geometry,(x,y,z,i)=>i>=bodyVertexCount?[x*.35,1.28,.054]:[x,y>1.30?1.30+(y-1.30)*.045:y,z]);
  return geometry;
}
function tailoringGeometry(){
  const shirt=colored(surface([[-.050,1.354,.121],[.050,1.354,.121],[0,1.143,.127]],[[0,2,1]]));
  const pieces=[shirt];for(const sign of [-1,1])pieces.push(colored(surface([[sign*.010,1.387,.079],[sign*.059,1.354,.113],[sign*.027,1.315,.137]],sign===1?[[0,2,1]]:[[0,1,2]]),[.97,.97,.95]));
  pieces.push(colored(surface([[-.012,1.345,.136],[.012,1.345,.136],[.017,1.22,.141],[0,1.20,.141],[-.017,1.22,.141]],[[0,2,1],[0,4,2],[4,3,2]]),[.065,.068,.076]));
  return combine(pieces);
}
function hairGeometry(coarse){
  const cap=new THREE.SphereGeometry(1,coarse?14:20,coarse?9:12,0,Math.PI*2,0,Math.PI*.68),p=cap.attributes.position;
  for(let i=0;i<p.count;i++){
    const phi=Math.atan2(p.getX(i),p.getZ(i)),theta=Math.acos(clamp(p.getY(i),-1,1))/(Math.PI*.68)*(2.05-Math.max(0,Math.cos(phi))*.94);
    p.setXYZ(i,Math.sin(theta)*Math.sin(phi)*.092,Math.cos(theta)*.127+.004,Math.sin(theta)*Math.cos(phi)*.102-.006);
  }
  cap.computeVertexNormals();const geometry=combine([cap,ellipsoid(0,-.013,-.094,.001,.001,.001)]);
  const capCount=cap.index?.count??cap.attributes.position.count;
  morph(geometry,(x,y,z,i)=>{
    if(i>=capCount||y>.032)return [x,y,z];
    const back=clamp((.046-z)/.07,0,1),length=clamp((.032-y)/.09,0,1)*back;
    return [x*(1+.16*length),y-.28*length,z-.025*length];
  });
  morph(geometry,(x,y,z,i)=>i<capCount?[x,y,z]:[x*38,y*38+.013*37,z*38+.094*38-.128]);
  morph(geometry,(x,y,z,i)=>i>=capCount?[x,y,z]:[x,y+.023*Math.exp(-((x+.030)**2/.002+(y-.095)**2/.003)),z]);
  return geometry;
}
function handGeometry(coarse){
  const parts=[ellipsoid(0,-.032,0,.029,.049,.014,coarse?8:10,coarse?5:6)];
  for(let i=0;i<4;i++){
    const finger=new THREE.CapsuleGeometry(.0047,.027-(i===0||i===3?.006:0),coarse?1:2,coarse?5:6);
    finger.rotateZ((i-1.5)*.025);finger.translate((i-1.5)*.012,-.077,0);parts.push(finger);
  }
  const thumbStart=parts.reduce((total,g)=>total+(g.index?.count??g.attributes.position.count),0);
  const thumb=new THREE.CapsuleGeometry(.006,.018,coarse?1:2,coarse?5:6);thumb.rotateZ(-.67);thumb.translate(.030,-.039,.005);parts.push(thumb);
  const geometry=combine(parts);morph(geometry,(x,y,z)=>{
    const t=clamp((-.042-y)/.047,0,1);return [x,y+t*t*.022,z+t*.026];
  });
  // Mirror the thumb geometry while preserving the palm's facing direction.
  // A whole-hand half turn makes the right palm face the opposite way.
  morph(geometry,(x,y,z,i)=>i>=thumbStart?[-x,y,-z]:[x,y,z]);return geometry;
}
function skirtGeometry(coarse){
  const profile=[[.285,.13],[.272,.26],[.23,.44],[.20,.63],[.186,.77],[.151,.88]].map(([r,y])=>new THREE.Vector2(r,y));
  const geometry=new THREE.LatheGeometry(profile,coarse?16:24),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),pleat=1+.025*Math.cos(Math.atan2(x,z)*12)*(1-(y-.13)/.75);p.setXYZ(i,x*pleat,y,z*pleat*.78);}
  geometry.computeVertexNormals();morph(geometry,(x,y,z)=>{
    const t=clamp((.88-y)/.45,0,1),drop=clamp((.43-y)/.30,0,1);return [x,y>.43?.88-.12*t:.76-.40*drop,z*.56+.34*t+.025*drop];
  });return geometry;
}
function eyeGeometry(){
  const shape=new THREE.Shape();shape.moveTo(-.013,0);shape.bezierCurveTo(-.007,.0055,.008,.0055,.013,0);shape.bezierCurveTo(.007,-.004,-.007,-.004,-.013,0);
  return new THREE.ShapeGeometry(shape,10);
}
function irisGeometry(){
  const iris=colored(new THREE.CircleGeometry(.0045,16));
  const pupil=colored(new THREE.CircleGeometry(.0022,12),[.015,.018,.018]);pupil.translate(0,0,.0003);return combine([iris,pupil]);
}
function facialGeometry(){
  const pieces=[];for(const sign of [-1,1])pieces.push(colored(surface([
    [sign*.048,.044,.087],[sign*.039,.048,.090],[sign*.020,.045,.094],[sign*.019,.043,.094],[sign*.038,.046,.091],[sign*.048,.042,.087]
  ],[[0,1,5],[1,4,5],[1,2,4],[2,3,4]].map(t=>sign<0?[t[0],t[2],t[1]]:t)),[.22,.16,.11]));
  pieces.push(colored(surface([[-.021,-.039,.096],[-.008,-.036,.098],[0,-.037,.099],[.008,-.036,.098],[.021,-.039,.096],[0,-.040,.100]],[[0,5,1],[1,5,2],[2,5,3],[3,5,4]]),[.87,.55,.49]));
  pieces.push(colored(surface([[-.021,-.040,.096],[0,-.040,.100],[.021,-.040,.096],[.010,-.043,.098],[-.010,-.043,.098]],[[0,4,1],[1,4,3],[1,3,2]]),[1,.68,.61]));return combine(pieces);
}
function limbGeometry(radius,wide,coarse){
  return new THREE.LatheGeometry([[.001,-.5],[radius*.73,-.49],[radius*.80,-.33],[radius,.15],[radius*wide,.41],[radius*.80,.49],[.001,.5]].map(p=>new THREE.Vector2(...p)),coarse?8:10);
}

export function createCrowdModels(parent,guests,palette,random,{coarse=false}={}){
  const count=guests.length,skinGrain=grain('skin'),hairGrain=grain('hair'),ownedMaterials=[];
  const material=(options)=>{const mat=new THREE.MeshStandardMaterial(options);ownedMaterials.push(mat);return mat;};
  const skin=material({color:0xffffff,roughness:.61,bumpMap:skinGrain,bumpScale:.00065});
  const hair=material({color:0xffffff,roughness:.56,bumpMap:hairGrain,bumpScale:.0012,envMapIntensity:.65});
  const cloth=palette.cloth.clone();cloth.vertexColors=true;ownedMaterials.push(cloth);
  const limb=material({color:0xffffff,roughness:.72,bumpMap:skinGrain,bumpScale:.00055});
  const armMaterial=attachArmDeformation(material({color:0xffffff,vertexColors:true,roughness:.67,bumpMap:skinGrain,bumpScale:.00055}));
  const armDepth=attachArmDeformation(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),{color:false});
  const armDistance=attachArmDeformation(new THREE.MeshDistanceMaterial(),{color:false});ownedMaterials.push(armDepth,armDistance);
  const face=material({color:0xffffff,vertexColors:true,roughness:.61});
  const eyes=material({color:0xc9c3b3,roughness:.31}),iris=material({color:0xffffff,vertexColors:true,roughness:.28});
  const shirt=material({color:0xf2f0e8,vertexColors:true,roughness:.84}),shoes=material({color:0xffffff,roughness:.38,envMapIntensity:.8});
  const shoeGeometry=combine([ellipsoid(0,-.049,.050,.049,.041,.118,coarse?8:12,coarse?6:8),new THREE.BoxGeometry(.087,.014,.219).translate(0,-.086,.047)]);
  const geometries={torso:torsoGeometry(coarse),head:headGeometry(coarse),neck:new THREE.CylinderGeometry(.043,.049,.095,coarse?8:12),hair:hairGeometry(coarse),arms:createArmGeometry(coarse),hands:handGeometry(coarse),legs:limbGeometry(.069,1.12,coarse),shoes:shoeGeometry,dress:skirtGeometry(coarse),eyes:eyeGeometry(),iris:irisGeometry(),features:facialGeometry(),tailoring:tailoringGeometry()};
  const materials={torso:cloth,head:skin,neck:skin,hair,arms:armMaterial,hands:skin,legs:limb,shoes,dress:palette.cloth,eyes,iris,features:face,tailoring:shirt};
  const sizes={arms:count*2,hands:count*2,legs:count*4,shoes:count*2,eyes:count*2,iris:count*2},instances={};
  for(const [name,geometry]of Object.entries(geometries)){
    const object=new THREE.InstancedMesh(geometry,materials[name],sizes[name]??count);object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    object.frustumCulled=false;object.castShadow=!['eyes','iris','features','tailoring'].includes(name);object.receiveShadow=true;
    object.name='Persistent guest '+name;object.userData.actorIds=guests.map(g=>g.id);parent.add(object);instances[name]=object;
  }
  instances.arms.customDepthMaterial=armDepth;instances.arms.customDistanceMaterial=armDistance;
  const armAttributes={joint:new THREE.InstancedBufferAttribute(new Float32Array(count*8),4).setUsage(THREE.DynamicDrawUsage),body:new THREE.InstancedBufferAttribute(new Float32Array(count*4),2),skin:new THREE.InstancedBufferAttribute(new Float32Array(count*6),3),cloth:new THREE.InstancedBufferAttribute(new Float32Array(count*6),3)};
  for(const [key,name]of Object.entries({joint:'armJoint',body:'armBody',skin:'armSkin',cloth:'armCloth'}))geometries.arms.setAttribute(name,armAttributes[key]);
  const morphState={morphTargetInfluences:[]};
  function setMorph(name,index,values){morphState.morphTargetInfluences=values;instances[name].setMorphAt(index,morphState);}
  guests.forEach((guest,i)=>{
    guest.phase=random()*Math.PI*2;guest.height=guest.height||(.95+random()*.105);guest.build=.94+random()*.13;
    guest.skinTone=skinTones[tonePlan[i%tonePlan.length]];guest.hairStyle=guest.dress?(i===24?'bun':['bob','waves','bun'][Math.floor(i/3)%3]):['crop','part','crop'][Math.floor(i/2)%3];
    guest.headWidth=.96+random()*.08;guest.motionStyle=i%6;guest.blinkPeriod=3.3+random()*2.1;guest.blinkOffset=random()*guest.blinkPeriod;
    const color=new THREE.Color(guest.color??clothes[i%clothes.length]),skinColor=new THREE.Color(guest.skinTone),hairColor=new THREE.Color(hairColors[(i*3+Math.floor(i/5))%hairColors.length]);
    for(const name of ['torso','dress'])instances[name].setColorAt(i,color);for(const name of ['head','neck','features'])instances[name].setColorAt(i,skinColor);instances.hair.setColorAt(i,hairColor);
    setMorph('torso',i,[guest.dress?1:0]);setMorph('hair',i,[guest.hairStyle==='waves'?1:guest.hairStyle==='bob'?.6:0,guest.hairStyle==='bun'?1:0,guest.hairStyle==='part'?1:0]);
    for(let side=0;side<2;side++){
      instances.hands.setColorAt(i*2+side,skinColor);instances.iris.setColorAt(i*2+side,new THREE.Color([0x667b76,0x76603d,0x556b85,0x493e32][i%4]));
      instances.shoes.setColorAt(i*2+side,new THREE.Color(guest.dress?0x8e7964:0x1f2228));
      armAttributes.body.setXY(i*2+side,guest.dress?0:1,guest.build);armAttributes.skin.setXYZ(i*2+side,skinColor.r,skinColor.g,skinColor.b);armAttributes.cloth.setXYZ(i*2+side,color.r,color.g,color.b);
      for(let segment=0;segment<2;segment++)instances.legs.setColorAt(i*4+side*2+segment,guest.dress?skinColor:new THREE.Color(i%3?0x303745:0x554d42));
      setMorph('hands',i*2+side,[0,side]);
    }
    setMorph('dress',i,[0]);
  });
  for(const object of Object.values(instances))if(object.morphTexture)object.morphTexture.needsUpdate=true;

  const shadowPixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++)shadowPixels[(y*32+x)*4+3]=Math.round(Math.max(0,1-Math.hypot((x+.5)/16-1,(y+.5)/16-1))**2*110);
  const shadowTexture=new THREE.DataTexture(shadowPixels,32,32);shadowTexture.needsUpdate=true;
  const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,color:0x19201e});
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),shadowMaterial,count);shadows.rotation.x=-Math.PI/2;shadows.position.y=.006;shadows.frustumCulled=false;shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(shadows);

  const dummy=new THREE.Object3D(),localMatrix=new THREE.Matrix4(),result=new THREE.Matrix4(),root=new THREE.Matrix4(),torso=new THREE.Matrix4(),head=new THREE.Matrix4(),headAngles=new THREE.Euler(),holdTarget=new THREE.Vector3();
  const pivot=new THREE.Matrix4(),unpivot=new THREE.Matrix4().makeTranslation(0,-.86,0),rotation=new THREE.Matrix4(),headRotation=new THREE.Matrix4();
  const shoulder=new THREE.Vector3(),wrist=new THREE.Vector3(),hip=new THREE.Vector3(),ankle=new THREE.Vector3(),bend=new THREE.Vector3(),axis=new THREE.Vector3(),normal=new THREE.Vector3(),joint=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const bodyTurn=new THREE.Quaternion(),bodyInverse=new THREE.Quaternion(),bodyRollTurn=new THREE.Quaternion(),forward=new THREE.Vector3(0,0,1),upperLocal=new THREE.Vector3();
  const down=new THREE.Vector3(0,-1,0),upperTurn=new THREE.Quaternion(),inverseUpper=new THREE.Quaternion(),elbowTurn=new THREE.Quaternion(),elbowAxis=new THREE.Vector3(),forearm=new THREE.Vector3();
  const elbowPoles=new Float64Array(count*6),previousPole=new THREE.Vector3(),poleTurn=new THREE.Quaternion(),poleBlend=new THREE.Quaternion();
  const armTargets=new Float64Array(count*6),armTargetReady=new Uint8Array(count*2),desiredAim=new THREE.Vector3(),previousAim=new THREE.Vector3();
  const aimTurn=new THREE.Quaternion(),aimBlend=new THREE.Quaternion();
  const appearance=new Float64Array(count*4),joints=new Float64Array(count*24),previous=guests.map(g=>({x:g.x,z:g.z,walk:0,stride:g.phase}));
  const lastSeated=new Float64Array(count).fill(-1),lastGrip=new Float64Array(count*2).fill(-1),oneMorph=[0],handMorph=[0,0];
  let clock=0,danceClock=0;
  function place(name,index,frame,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();result.multiplyMatrices(frame,dummy.matrix);instances[name].setMatrixAt(index,result);
  }
  function bone(name,index,a,b,radiusScale){direction.subVectors(b,a);const length=direction.length();dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.normalize());dummy.scale.set(radiusScale,length,radiusScale);dummy.updateMatrix();instances[name].setMatrixAt(index,dummy.matrix);}
  function solve(a,b,bendDirection,l1,l2,maxBend=Math.PI,poleIndex=-1,dt=0){
    const minimum=Math.sqrt(l1*l1+l2*l2+2*l1*l2*Math.cos(maxBend));
    axis.subVectors(b,a);const distance=clamp(axis.length(),Math.max(minimum,Math.abs(l1-l2)+.002),l1+l2-.002);axis.normalize();end.copy(a).addScaledVector(axis,distance);
    normal.copy(bendDirection).addScaledVector(axis,-bendDirection.dot(axis));if(normal.lengthSq()<1e-8)normal.set(0,0,1).addScaledVector(axis,-axis.z);normal.normalize();
    if(poleIndex>=0){
      previousPole.fromArray(elbowPoles,poleIndex*3).applyQuaternion(bodyTurn);previousPole.addScaledVector(axis,-previousPole.dot(axis));
      if(dt>0&&previousPole.lengthSq()>1e-8){
        previousPole.normalize();const turn=Math.acos(clamp(previousPole.dot(normal),-1,1));
        poleTurn.setFromUnitVectors(previousPole,normal);poleBlend.identity().slerp(poleTurn,turn>1e-6?Math.min(1,dt*3/turn):1);
        normal.copy(previousPole).applyQuaternion(poleBlend);
      }
      previousPole.copy(normal).applyQuaternion(bodyInverse).toArray(elbowPoles,poleIndex*3);
    }
    const along=(l1*l1-l2*l2+distance*distance)/(2*distance),away=Math.sqrt(Math.max(0,l1*l1-along*along));joint.copy(a).addScaledVector(axis,along).addScaledVector(normal,away);
    b.copy(end);return joint;
  }
  function point(vector,frame,x,y,z){return vector.set(x,y,z).applyMatrix4(frame);}
  function update(time,beat=0,weights=[1,0,0],dt=1/30){
    const step=clamp(dt,0,.08),cocktail=weights[1],dance=weights[2];clock+=step;danceClock+=step*(.78+dance*3.2);let skirtChanged=false,gripChanged=false;
    guests.forEach((g,i)=>{
      const h=g.height,seated=g.seated||0,prior=previous[i],speed=step>0?clamp(Math.hypot(g.x-prior.x,g.z-prior.z)/step,0,1.8):prior.walk;
      if(step>0){prior.walk+=(speed-prior.walk)*(1-Math.exp(-step*9));prior.stride+=step*prior.walk*5.2;}prior.x=g.x;prior.z=g.z;
      const travel=clamp(prior.walk,0,1),phase=danceClock+g.phase,energy=dance*(g.dj?0:.55+.075*g.motionStyle),bodyRoll=Math.sin(phase)*(.008+energy*.050);
      const lift=(1-seated)*(.013*energy*(Math.sin(phase*2)+1)+beat*.014*energy),ground=.012+lift-.30*h*seated;
      dummy.position.set(g.x,ground,g.z);dummy.scale.set(h*g.build,h,h*.97);dummy.rotation.set(0,(g.turn||0)+Math.sin(clock*.48+g.phase)*.035*(1-seated),0);dummy.updateMatrix();root.copy(dummy.matrix);
      bodyTurn.copy(dummy.quaternion).multiply(bodyRollTurn.setFromAxisAngle(forward,bodyRoll));bodyInverse.copy(bodyTurn).invert();
      pivot.makeTranslation(0,.86,0);rotation.makeRotationZ(bodyRoll);torso.copy(root).multiply(pivot).multiply(rotation).multiply(unpivot);
      place('torso',i,torso);place('tailoring',i,torso,0,0,0,g.dress?.00001:1,g.dress?.00001:1,g.dress?.00001:1);place('neck',i,torso,0,1.435,0);
      headRotation.makeRotationFromEuler(headAngles.set(Math.sin(clock*.75+g.phase)*.025,Math.sin(clock*.43+g.phase)*.105,Math.sin(phase)*energy*.025));
      head.copy(torso).multiply(localMatrix.makeTranslation(0,1.595,0)).multiply(headRotation).multiply(localMatrix.makeScale(g.headWidth/g.build,1,1));
      place('head',i,head);place('hair',i,head);place('features',i,head);
      const blinkAt=(clock+g.blinkOffset)%g.blinkPeriod,blink=blinkAt<.15?Math.sin(blinkAt/.15*Math.PI)**2:0,opening=1-.94*blink;
      for(let side=0;side<2;side++){const sign=side?1:-1;place('eyes',i*2+side,head,sign*.033,.027,.088,1,opening,1);place('iris',i*2+side,head,sign*.033,.027,.089,1,opening,1);}
      place('dress',i,root,0,0,0,g.dress?1:.00001,g.dress?1:.00001,g.dress?1:.00001);if(lastSeated[i]!==seated){oneMorph[0]=seated;setMorph('dress',i,oneMorph);lastSeated[i]=seated;skirtChanged=true;}
      appearance.set([blink,bodyRoll,travel,energy],i*4);
      for(let side=0;side<2;side++){
        const sign=side?1:-1,style=g.motionStyle,armIndex=i*2+side,legIndex=i*4+side*2;
        let wx=sign*(.225-.055*seated),wy=.815+.090*seated,wz=.075+.20*seated;
        const walkSwing=Math.sin(prior.stride+side*Math.PI)*travel*(1-seated);wz+=walkSwing*.10;
        const holding=side===1&&!g.dj?cocktail:0;wy+=holding*.265;wz+=holding*.20;
        let px=sign*.28,py=1.02,pz=.16;
        if(style===1||style===4){px=sign*.31;py=side===style%2?1.73:1.06;pz=.11;}
        if(style===2){px=sign*.17;py=1.18+Math.sin(phase+side)*.045;pz=.29;}
        if(style===3){px=sign*.18;py=1.28;pz=.31;}
        if(style===5){px=sign*.25;py=1.10+Math.sin(phase+side)*.075;pz=.19;}
        wx=THREE.MathUtils.lerp(wx,px,energy);wy=THREE.MathUtils.lerp(wy,py,energy);wz=THREE.MathUtils.lerp(wz,pz,energy);
        if(g.dj){const playing=cocktail+dance;wx=THREE.MathUtils.lerp(wx,sign*.26,playing);wy=wy*(1-playing)+(1.32*cocktail+1.82*dance)/h;wz=THREE.MathUtils.lerp(wz,.45,playing);}
        point(shoulder,torso,sign*.174,1.315,0);point(wrist,root,wx,wy,wz);
        if((i===24&&side===1)||(i===25&&side===0)){
          const a=guests[24],b=guests[25],t=weights[0];wrist.lerp(holdTarget.set((a.x+b.x)/2,1.03*(a.height+b.height)/2,(a.z+b.z)/2+.10),t);
        }
        desiredAim.subVectors(wrist,shoulder);previousAim.fromArray(armTargets,armIndex*3);
        if(armTargetReady[armIndex]&&step>0){
          const alpha=1-Math.exp(-step*8),length=THREE.MathUtils.lerp(previousAim.length(),desiredAim.length(),alpha);
          previousAim.normalize();desiredAim.normalize();const turn=Math.acos(clamp(previousAim.dot(desiredAim),-1,1));
          aimTurn.setFromUnitVectors(previousAim,desiredAim);aimBlend.identity().slerp(aimTurn,turn>1e-6?Math.min(alpha,step*2.2/turn):1);
          previousAim.applyQuaternion(aimBlend).multiplyScalar(length);
        }else previousAim.copy(desiredAim);
        previousAim.toArray(armTargets,armIndex*3);armTargetReady[armIndex]=1;wrist.copy(shoulder).add(previousAim);
        bend.set(sign*.12,-.45,-.8).transformDirection(root);solve(shoulder,wrist,bend,ARM_UPPER*h,ARM_FOREARM*h,ARM_MAX_BEND,armIndex,step);
        upperLocal.subVectors(joint,shoulder).normalize().applyQuaternion(bodyInverse);upperTurn.setFromUnitVectors(down,upperLocal).premultiply(bodyTurn);inverseUpper.copy(upperTurn).invert();
        forearm.subVectors(wrist,joint).normalize().applyQuaternion(inverseUpper);elbowTurn.setFromUnitVectors(down,forearm);
        const angle=2*Math.acos(clamp(elbowTurn.w,-1,1));elbowAxis.set(elbowTurn.x,elbowTurn.y,elbowTurn.z);if(elbowAxis.lengthSq()<1e-8)elbowAxis.set(1,0,0);else elbowAxis.normalize();
        armAttributes.joint.setXYZW(armIndex,elbowAxis.x,elbowAxis.y,elbowAxis.z,angle);
        dummy.position.copy(shoulder);dummy.quaternion.copy(upperTurn);dummy.scale.setScalar(h);dummy.updateMatrix();instances.arms.setMatrixAt(armIndex,dummy.matrix);
        dummy.position.copy(wrist);dummy.quaternion.copy(upperTurn).multiply(elbowTurn);dummy.scale.set(h,h,h);dummy.updateMatrix();instances.hands.setMatrixAt(armIndex,dummy.matrix);
        const grip=holding*.8;if(lastGrip[armIndex]!==grip){handMorph[0]=grip;handMorph[1]=side;setMorph('hands',armIndex,handMorph);lastGrip[armIndex]=grip;gripChanged=true;}
        const offset=i*24+side*12;joints.set([shoulder.x,shoulder.y,shoulder.z,joint.x,joint.y,joint.z,wrist.x,wrist.y,wrist.z,ARM_UPPER*h,ARM_FOREARM*h,angle],offset);
        point(hip,root,sign*.098,.865,0);
        const footShift=Math.sin(prior.stride+side*Math.PI)*travel*.115+Math.sin(phase+side*Math.PI)*energy*.042;
        point(ankle,root,sign*(.12+.010*energy),0,.44*seated+footShift);ankle.y=.086*h+.012+Math.max(0,Math.sin(prior.stride+side*Math.PI))*travel*.04*(1-seated);
        bend.set(0,.06,1).transformDirection(root);solve(hip,ankle,bend,.405*h,.391*h);bone('legs',legIndex,hip,joint,h*g.build);bone('legs',legIndex+1,joint,ankle,h*g.build*.84);
        dummy.position.copy(ankle);dummy.rotation.set(0,g.turn||0,0);dummy.scale.set(h*(g.dress?.88:1),h,h);dummy.updateMatrix();instances.shoes.setMatrixAt(i*2+side,dummy.matrix);
      }
      dummy.position.set(g.x,-g.z,0);dummy.rotation.set(0,0,0);dummy.scale.set(.56,.78,1);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);
    });
    shadows.instanceMatrix.needsUpdate=true;
    armAttributes.joint.needsUpdate=true;
    for(const object of Object.values(instances))object.instanceMatrix.needsUpdate=true;
    if(skirtChanged)instances.dress.morphTexture.needsUpdate=true;if(gripChanged)instances.hands.morphTexture.needsUpdate=true;
  }
  update(0,0,[1,0,0],0);
  const stats={batches:Object.keys(instances).length+1,triangles:Math.round(Object.values(instances).reduce((sum,o)=>sum+(o.geometry.index?.count??o.geometry.attributes.position.count)/3*o.count,0))};
  return {update,instances,joints,appearance,stats,contactShadows:shadows,dispose(){Object.values(instances).forEach(object=>{object.dispose();object.removeFromParent();});Object.values(geometries).forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());skinGrain.dispose();hairGrain.dispose();shadows.dispose();shadows.geometry.dispose();shadowMaterial.dispose();shadowTexture.dispose();shadows.removeFromParent();}};
}
