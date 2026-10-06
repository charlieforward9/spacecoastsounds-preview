import * as THREE from 'three';
// Small deterministic PBR textures generated from geometry/material code, not AI images.
export function surfaceTexture(kind='stone',size=128){
  const data=new Uint8Array(size*size*4);
  const intRow=y=>Math.floor(y/16);
  const noise=(x,y)=>{const value=Math.sin(x*127.1+y*311.7)*43758.5453;return value-Math.floor(value);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const n=noise(x,y);let value;
    if(kind==='wood'){const grain=Math.sin(y*.37+Math.sin(x*.03)*2.4+Math.sin(x*.16)*.4);value=195+grain*22+(n-.5)*16;if(y%32<1||((y>>5)%2?x:x+size/2)%size<1)value*=.50;}
    else if(kind==='fabric')value=190+(((x+y)%2)?16:-16)+(n-.5)*17;
    else if(kind==='bark')value=130+Math.sin(x*.40+Math.sin(y*.05)*2)*40+(n-.5)*25;
    else if(kind==='thatch')value=150+Math.sin(x*1.8+Math.sin(y*.11)*.8)*35+(n-.5)*55;
    else if(kind==='brick'){value=200+(n-.5)*26;if(y%16<1||(x+(intRow(y)%2)*32)%64<2)value=130;}
    else if(kind==='metal')value=220+Math.sin(y*2.1)*12+(n-.5)*14;
    else value=220+Math.sin(x*.055+y*.018+Math.sin(y*.07)*1.7)*10+(n-.5)*20;
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,value));data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
export function grilleTexture(size=128){
  const pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=x%8-3.5+(Math.floor(y/8)%2?4:0),dy=y%8-3.5;const d=Math.min(Math.hypot(dx,dy),Math.hypot(dx-8,dy));const alpha=d<2.3?0:255;const i=(y*size+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=alpha;pixels[i+3]=255;}
  const texture=new THREE.DataTexture(pixels,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,4);texture.needsUpdate=true;return texture;
}
export function createMaterials(){
  const fabric=surfaceTexture('fabric'),stone=surfaceTexture('stone'),wood=surfaceTexture('wood'),metal=surfaceTexture('metal');
  wood.repeat.set(5,7);stone.repeat.set(4,5);fabric.repeat.set(3,3);metal.repeat.set(2,3);
  const bark=surfaceTexture('bark'),thatch=surfaceTexture('thatch'),brick=surfaceTexture('brick');bark.repeat.set(2,3);thatch.repeat.set(18,9);brick.repeat.set(3,8);
  const mat=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.65,...options});
  return {
    grass:mat(0x86966d,{map:stone,roughness:.94}),gravel:mat(0xc5bba7,{map:stone,bumpMap:stone,bumpScale:.020,roughness:.94}),
    bark:mat(0x8a7660,{map:bark,bumpMap:bark,bumpScale:.027,roughness:.92}),thatch:mat(0x9f8357,{map:thatch,bumpMap:thatch,bumpScale:.035,roughness:.98,side:THREE.DoubleSide}),brick:mat(0x943d30,{map:brick,bumpMap:brick,bumpScale:.018,roughness:.86}),
    foliage:mat(0x718754,{side:THREE.DoubleSide,roughness:.86}),
    ivory:mat(0xf8f8f2,{map:stone,bumpMap:stone,bumpScale:.004}),
    stone:mat(0xdce2da,{map:stone,bumpMap:stone,bumpScale:.008,roughness:.36}),
    wood:mat(0x634735,{map:wood,bumpMap:wood,bumpScale:.012,roughness:.40}),
    darkWood:mat(0x342c29,{map:wood,bumpMap:wood,bumpScale:.008,roughness:.24,metalness:.10}),
    black:mat(0x111318,{bumpMap:fabric,bumpScale:.007,roughness:.72}),
    metal:mat(0x819098,{map:metal,bumpMap:metal,bumpScale:.002,metalness:.9,roughness:.27}),
    gold:mat(0xbea279,{metalness:.86,roughness:.30}),
    leaf:mat(0x334e37,{roughness:.85}),pink:mat(0xae8074,{map:fabric,bumpMap:fabric,bumpScale:.003,roughness:.82}),
    cream:mat(0xf4efe5,{map:fabric,bumpMap:fabric,bumpScale:.004}),
    cloth:new THREE.MeshPhysicalMaterial({color:0xffffff,map:fabric,bumpMap:fabric,bumpScale:.002,roughness:.85,sheen:.5,sheenRoughness:.85}),
    skin:mat(0xffffff,{roughness:.72}),glass:new THREE.MeshPhysicalMaterial({color:0xe3f2ff,roughness:.06,metalness:.05,transparent:true,opacity:.24,depthWrite:false,clearcoat:1,envMapIntensity:2.2,side:THREE.DoubleSide}),
    grille:mat(0x13151a,{alphaMap:grilleTexture(),alphaTest:.5,roughness:.60,side:THREE.DoubleSide}),
    sand:mat(0xc3beb0),peach:new THREE.MeshBasicMaterial({color:0xffd9a8,toneMapped:false}),lime:new THREE.MeshBasicMaterial({color:0xcafa63,toneMapped:false}),cyan:new THREE.MeshBasicMaterial({color:0x83d8ff,toneMapped:false}),rose:new THREE.MeshBasicMaterial({color:0xfb7aaa,toneMapped:false})
  };
}
