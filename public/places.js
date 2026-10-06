import * as THREE from 'three';
// Authored venue geometry. Reference photos inform proportions; no images are rendered.
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const leafGeometry=new THREE.BufferGeometry();
leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.45,.02,.3,-.30,.035,.78,0,.07,1.1,.30,.035,.78,.45,.02,.3],3));
leafGeometry.setIndex([0,1,2,0,2,3,0,3,4,0,4,5]);leafGeometry.computeVertexNormals();
const roofGeometry=new THREE.BufferGeometry();
const roofPositions=[],roofUvs=[];
const roofFaces=[[[ -8.5,4.55,6],[8.5,4.55,6],[4,7.25,-.5],[-4,7.25,-.5]],[[8.5,4.55,-7],[-8.5,4.55,-7],[-4,7.25,-.5],[4,7.25,-.5]],[[-8.5,4.55,-7],[-8.5,4.55,6],[-4,7.25,-.5]],[[8.5,4.55,6],[8.5,4.55,-7],[4,7.25,-.5]]];
for(const face of roofFaces){const uv=face.length===4?[[0,0],[1,0],[1,1],[0,1]]:[[0,0],[1,0],[.5,1]];for(let i=1;i<face.length-1;i++){roofPositions.push(...face[0],...face[i],...face[i+1]);roofUvs.push(...uv[0],...uv[i],...uv[i+1]);}}
roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofPositions,3));roofGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(roofUvs,2));roofGeometry.computeVertexNormals();
function seeded(value){let seed=value;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function createPlaceBuilder(palette){
 const boxGeometry=new THREE.BoxGeometry(1,1,1),sphereGeometry=new THREE.SphereGeometry(1,14,9),cylinderGeometry=new THREE.CylinderGeometry(1,1,1,12);
 function mesh(parent,geometry,material,x=0,y=0,z=0,scale=[1,1,1]){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=!material.transparent&&!material.isShaderMaterial&&!material.isMeshBasicMaterial;m.receiveShadow=true;parent.add(m);return m;}
 const box=(p,m,x,y,z,w,h,d)=>mesh(p,boxGeometry,m,x,y,z,[w,h,d]);
 const ball=(p,m,x,y,z,rx,ry=rx,rz=rx)=>mesh(p,sphereGeometry,m,x,y,z,[rx,ry,rz]);
 const column=(p,m,x,y,z,r,h)=>mesh(p,cylinderGeometry,m,x,y,z,[r,h,r]);
 function branch(p,points,radius=.1,mat=palette.bark){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>V(...a))),18,radius,6,false),mat);}
 function rod(p,a,b,radius=.045,mat=palette.bark){const start=V(...a),end=V(...b),direction=end.clone().sub(start);const m=mesh(p,cylinderGeometry,mat);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),direction.clone().normalize());m.scale.set(radius,direction.length(),radius);return m;}
 function sky(parent,kind){
  const colors={ceremony:[0xcde5e8,0x78afcb],cocktail:[0xffce92,0x867eb0],party:[0x39404e,0x060e20]}[kind];
  const direction=kind==='ceremony'?V(-.45,.42,-1).normalize():V(-.62,.035,-1).normalize();
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{horizon:{value:new THREE.Color(colors[0])},zenith:{value:new THREE.Color(colors[1])},sunDirection:{value:direction},night:{value:kind==='party'?1:0}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDirection;uniform vec3 horizon;uniform vec3 zenith;uniform vec3 sunDirection;uniform float night;
   void main(){vec3 d=normalize(vDirection);float height=smoothstep(-.08,.75,d.y);vec3 c=mix(horizon,zenith,height);float s=max(0.,dot(d,sunDirection));c+=vec3(1.,.64,.32)*pow(s,170.)*.22*(1.-night);c+=vec3(1.,.85,.57)*pow(s,3600.)*3.*(1.-night);gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
  const dome=mesh(parent,new THREE.SphereGeometry(100,32,16),material,0,0,0);dome.name='Procedural sky';dome.frustumCulled=false;dome.renderOrder=-5;dome.castShadow=false;
  if(kind==='party'){const random=seeded(922),points=[];for(let i=0;i<110;i++){const angle=random()*Math.PI*2,y=.12+random()*.80,r=Math.sqrt(1-y*y);points.push(Math.sin(angle)*r*92,y*92,Math.cos(angle)*r*92);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));parent.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xc2d3e4,size:.11,transparent:true,opacity:.60,depthWrite:false})));}
 }
 function water(parent){
  const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},shallow:{value:new THREE.Color(0x62c5bc)},deep:{value:new THREE.Color(0x1c858f)}},vertexShader:'varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}',fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;uniform vec3 shallow;uniform vec3 deep;
  void main(){float wave=sin(vWorld.x*.82+vWorld.z*.51+time*.70)*sin(vWorld.z*1.1-time*.40);float ribbon=pow(.5+.5*sin(vWorld.z*5.4+wave*1.5+time),18.);float glint=exp(-abs(vWorld.x+vWorld.z*.31+8.)*.10)*ribbon*.24;vec3 c=mix(shallow,deep,smoothstep(.1,.9,vUv.y))+wave*.025+glint;gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const surface=mesh(parent,new THREE.PlaneGeometry(180,140),material,0,-.16,-83);surface.rotation.x=-Math.PI/2;surface.name='Jupiter inlet water';surface.castShadow=false;
  const random=seeded(812);for(let i=0;i<15;i++){const x=-65+i*9.2;ball(parent,palette.leaf,x,.2+random(),-92,6.0,1.6,2.8);}
  return time=>material.uniforms.time.value=time;
 }
 function lighthouse(parent){
  const group=new THREE.Group();group.name='Jupiter Inlet Lighthouse';group.position.set(-8.3,.25,-8.7);parent.add(group);
  mesh(group,new THREE.CylinderGeometry(1.6,5.7,1.5,36),palette.grass,0,-.75,0);
  const profile=[[1.48,0],[1.48,.25],[1.40,.32],[1.23,3],[1.05,7],[.91,10.85],[.93,11.3]].map(([r,y])=>new THREE.Vector2(r,y));
  mesh(group,new THREE.LatheGeometry(profile,40),palette.brick);
  column(group,palette.ivory,0,.15,0,1.52,.28);column(group,palette.ivory,0,11.25,0,1.01,.16);
  column(group,palette.black,0,11.42,0,1.30,.16);column(group,palette.metal,0,11.64,0,.85,.28);
  column(group,palette.glass,0,12.04,0,.81,.85);column(group,palette.ivory,0,12.65,0,.88,.11);
  for(let i=0;i<14;i++){const a=i*Math.PI*2/14;column(group,palette.black,Math.cos(a)*1.24,11.77,Math.sin(a)*1.24,.018,.62);}
  for(const y of [11.53,12.05]){const rail=mesh(group,new THREE.TorusGeometry(1.24,.025,6,48),palette.black,0,y,0);rail.rotation.x=Math.PI/2;}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;column(group,palette.black,Math.cos(a)*.80,12.07,Math.sin(a)*.80,.028,.86);}
  mesh(group,new THREE.ConeGeometry(.96,.52,24),palette.black,0,12.97,0);column(group,palette.black,0,13.31,0,.038,.28);
  const lantern=new THREE.MeshBasicMaterial({color:0xffe2aa,toneMapped:false});ball(group,lantern,0,12.09,0,.16,.29,.16);
  for(const y of [2.0,5.3,8.6]){const radius=1.45-y*.047;box(group,palette.ivory,0,y,radius,.48,.90,.10);box(group,palette.black,0,y+.015,radius+.06,.32,.71,.04);}
  for(let i=0;i<9;i++)box(group,palette.stone,0,-.03+i*.05,1.55+i*.25,1.15,.12,.31);
  group.userData.height=13.45;return group;
 }
 function banyan(parent){
  const group=new THREE.Group();group.name='Banyan canopy and aerial roots';group.position.set(3.35,0,-5.4);parent.add(group);const random=seeded(1328);
  for(let i=0;i<7;i++){const a=i*.89,r=.3+random()*.5;branch(group,[[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(a)*.44,1.9,Math.sin(a)*.42],[Math.cos(a)*.65,3.6,Math.sin(a)*.7]],.25+random()*.13);}
  for(let i=0;i<13;i++){
   const a=i*Math.PI*2/13,reach=4.5+random()*2.6;
   branch(group,[[0,2.4,0],[Math.cos(a)*2.0,4.2,Math.sin(a)*1.6],[Math.cos(a)*reach,5.45+random()*.7,Math.sin(a)*reach*.65]],.15+random()*.09);
   branch(group,[[Math.cos(a)*.6,.45,Math.sin(a)*.5],[Math.cos(a)*1.4,.13,Math.sin(a)*1.2],[Math.cos(a)*2.6,.05,Math.sin(a)*2.3]],.14);
   if(i%2===0){const x=Math.cos(a)*reach*.74,z=Math.sin(a)*reach*.55;branch(group,[[x,5.1,z],[x+.10,2.7,z+.12],[x-.06,.02,z+.05]],.055);}
  }
  for(let i=0;i<30;i++){const a=random()*Math.PI*2,r=2+random()*4.6,x=Math.cos(a)*r,z=Math.sin(a)*r*.66;branch(group,[[x,5.6,z],[x+.03,3.7,z+.03],[x+.07,1.8+random()*1.8,z+.02]],.014);}
  const canopy=new THREE.Group();canopy.userData.dynamic=true;group.add(canopy);
  const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),palette.leaf,95),leaves=new THREE.InstancedMesh(leafGeometry,palette.foliage,2400);canopy.add(crowns,leaves);crowns.castShadow=true;crowns.receiveShadow=true;leaves.receiveShadow=true;
  const dummy=new THREE.Object3D();
  function foliagePoint(){const a=random()*Math.PI*2,r=Math.sqrt(random())*7.0;return [Math.cos(a)*r,5.7+Math.sin(r/7*Math.PI)*.90+(random()-.5)*.75,Math.sin(a)*r*.68];}
  for(let i=0;i<95;i++){const [x,y,z]=foliagePoint();dummy.position.set(x,y,z);dummy.rotation.set(random(),random(),random());dummy.scale.set(.6+random()*.8,.35+random()*.45,.6+random()*.8);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color().setHSL(.25+random()*.07,.26+random()*.10,.13+random()*.11));}
  for(let i=0;i<2400;i++){const [x,y,z]=foliagePoint();dummy.position.set(x,y+.12,z);dummy.rotation.set(random()*Math.PI,random()*Math.PI*2,random()*Math.PI);dummy.scale.setScalar(.17+random()*.20);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.23+random()*.07,.3,.22+random()*.15));}
  return time=>{canopy.rotation.z=Math.sin(time*.36)*.008;canopy.rotation.y=Math.sin(time*.22)*.008;};
 }
 function palm(parent,x,z,height=7){
  const group=new THREE.Group();parent.add(group);const sway=.55;branch(group,[[x,0,z],[x+sway*.45,height*.55,z+.1],[x+sway,height,z]],.16,palette.bark);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const points=[];for(let n=0;n<=8;n++){const t=n/8;points.push(V(x+sway+Math.cos(a)*t*3.3,height+Math.sin(t*Math.PI)*.5-t*1.1,z+Math.sin(a)*t*3.3));}
   const pos=[],uv=[];for(let n=0;n<8;n++){const p=points[n],q=points[n+1],w=.19*Math.sin((n+.5)/8*Math.PI),dx=Math.sin(a)*w,dz=-Math.cos(a)*w;pos.push(p.x-dx,p.y,p.z-dz,p.x+dx,p.y,p.z+dz,q.x+dx,q.y,q.z+dz,p.x-dx,p.y,p.z-dz,q.x+dx,q.y,q.z+dz,q.x-dx,q.y,q.z-dz);uv.push(0,n/8,1,n/8,1,(n+1)/8,0,n/8,1,(n+1)/8,0,(n+1)/8);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();mesh(group,g,palette.foliage);
  }
 }
 function string(parent,points,night){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p)));mesh(parent,new THREE.TubeGeometry(curve,32,.009,4,false),palette.black);
  for(let i=0;i<=24;i++){const p=curve.getPoint(i/24);column(parent,palette.black,p.x,p.y-.035,p.z,.015,.045);ball(parent,palette.peach,p.x,p.y-.082,p.z,.038,.060,.038);}
 }
 function pavilion(parent,night=false){
  const group=new THREE.Group();group.name='Taylor Beach House thatched pavilion';parent.add(group);const random=seeded(523);
  const roof=mesh(group,roofGeometry,palette.thatch);roof.name='Shared hip roof';
  for(const x of [-7.7,7.7])for(const z of [-6.0,-.5,5.0]){column(group,palette.bark,x,2.25,z,.19,4.5);box(group,palette.wood,x,4.40,z,.46,.24,.50);}
  for(const x of [-7.7,7.7])rod(group,[x,4.30,-6.0],[x,4.30,5.0],.13);
  for(const z of [-6.0,5.0])rod(group,[-7.7,4.3,z],[7.7,4.3,z],.15);
  rod(group,[-4,7.1,-.5],[4,7.1,-.5],.15);
  for(let x=-7;x<=7;x+=1.2){rod(group,[x,4.48,5.65],[Math.max(-4,Math.min(4,x*.6)),7.15,-.5],.055);rod(group,[x,4.48,-6.65],[Math.max(-4,Math.min(4,x*.6)),7.15,-.5],.055);}
  const fringe=new THREE.InstancedMesh(new THREE.CylinderGeometry(.005,.013,1,3),palette.thatch,380);group.add(fringe);const dummy=new THREE.Object3D();
  for(let i=0;i<380;i++){const side=i%4,t=random(),x=side<2?-8.5+t*17:side===2?-8.5:8.5,z=side<2?(side?6:-7):-7+t*13;dummy.position.set(x,4.48,z);dummy.scale.set(1,.14+random()*.29,1);dummy.rotation.set((random()-.5)*.5,0,(random()-.5)*.4);dummy.updateMatrix();fringe.setMatrixAt(i,dummy.matrix);}
  // The same deck, bar, railings, and planting layout in both times of day.
  box(group,palette.wood,0,-.04,-.5,17,.08,13);
  for(const x of [-8.7,8.7]){box(group,palette.wood,x,.73,-.5,.075,1.46,14);for(let z=-7;z<=6;z+=.42)box(group,palette.ivory,x,.60,z,.08,1.20,.06);}
  box(group,palette.cream,0,.75,-5.45,5.9,1.5,1.2);box(group,palette.wood,0,1.55,-5.45,6.12,.13,1.4);
  for(let i=0;i<19;i++)box(group,palette.bark,-2.72+i*.302,.73,-4.82,.035,1.30,.04);
  // Garden-facing beach house wall behind the open-air pavilion.
  box(group,palette.ivory,0,2.4,-10.7,15,4.8,.22);
  for(const x of [-4.4,0,4.4]){box(group,palette.wood,x,2.15,-10.54,2.65,3.72,.11);box(group,palette.glass,x,2.15,-10.46,2.4,3.5,.08);for(const dx of [-.82,0,.82])box(group,palette.ivory,x+dx,2.15,-10.38,.045,3.50,.07);for(const y of [1.05,2.15,3.25])box(group,palette.ivory,x,y,-10.36,2.45,.045,.07);}
  for(const z of [-4.8,.0,4.3])string(group,[[-7.6,4.16,z],[0,3.76,z],[7.6,4.16,z]],night);
  for(const [x,z,h]of [[-11,0,7.4],[11,-1,8.3],[-10,-9,9.2],[9.7,-9,8.1],[-12,8,7.0],[13,6,9.0]])palm(parent,x,z,h);
  for(const x of [-11,11])for(let z=-8;z<=9;z+=3.2){ball(parent,palette.leaf,x,.48,z,1.25,.67,1.15);column(parent,palette.cream,x,.12,z,.40,.24);}
  for(const x of [-7.7,7.7])for(const z of [-6,5]){
   const random=seeded(Math.round((x+20)*100+z)),bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.017,6,4),palette.peach,52);group.add(bulbs);const d=new THREE.Object3D();for(let i=0;i<52;i++){const a=i*.79;d.position.set(x+Math.cos(a)*.205,.20+i*.069,z+Math.sin(a)*.205);d.updateMatrix();bulbs.setMatrixAt(i,d.matrix);}
  }
  // Curved garden bench and a low fire bowl are part of the cafe reference.
  const bench=mesh(parent,new THREE.TorusGeometry(2,.25,6,36,Math.PI*1.45),palette.wood,-11,.45,3.5);bench.rotation.x=-Math.PI/2;
  column(parent,palette.black,-11,.25,3.5,.70,.5);column(parent,palette.stone,-11,.54,3.5,.64,.06);
  if(night){const ember=new THREE.MeshBasicMaterial({color:0xffa24b,toneMapped:false});ball(parent,ember,-11,.60,3.5,.40,.06,.40);const glow=new THREE.PointLight(0xffb86f,15,6,1.8);glow.position.set(-11,.95,3.5);parent.add(glow);}
  for(const x of [-5.5,5.5]){const light=new THREE.PointLight(0xffd39a,night?48:8,17,1.8);light.position.set(x,3.75,.2);parent.add(light);}
  group.userData.plan='Shared hip roof, bar, deck, planting, and courtyard geometry';
  return {group,roof};
 }
 function ceremony(parent){sky(parent,'ceremony');const updateWater=water(parent);box(parent,palette.grass,0,-.20,8,68,.12,43);box(parent,palette.wood,0,-.035,.75,15,.07,13);const tower=lighthouse(parent),updateTree=banyan(parent);
  for(const x of [-7.2,7.2]){box(parent,palette.ivory,x,.48,.8,.08,.05,12.6);for(let z=-5;z<=7;z+=1.1)box(parent,palette.ivory,x,.26,z,.045,.52,.045);}
  return {tower,update(time){updateWater(time);updateTree(time);}};
 }
 function beachHouse(parent,night){sky(parent,night?'party':'cocktail');box(parent,palette.gravel,0,-.19,4.0,70,.22,50);const structure=pavilion(parent,night);return structure;}
 return {ceremony,beachHouse};
}
