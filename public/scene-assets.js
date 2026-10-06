import * as THREE from 'three';
import {HDRLoader} from './vendor/HDRLoader.js';

const families={wood:'brown_planks_03',bark:'bark_brown_02',brick:'red_brick_03'};
const skyFiles={ceremony:'kloppenheim_06_puresky',cocktail:'venice_sunset',party:'dikhololo_night'};
async function fetchBounded(url){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('Scene asset unavailable: '+url.pathname);return await response.arrayBuffer();}
  finally{clearTimeout(timeout);}
}
async function imageTexture(bytes){
  const blob=new Blob([bytes],{type:'image/jpeg'});
  if(typeof createImageBitmap==='function'){
    const bitmap=await createImageBitmap(blob,{imageOrientation:'flipY',premultiplyAlpha:'none',colorSpaceConversion:'none'});
    const texture=new THREE.Texture(bitmap);texture.flipY=false;texture.needsUpdate=true;return texture;
  }
  const url=URL.createObjectURL(blob);
  try{return await new THREE.TextureLoader().loadAsync(url);}finally{URL.revokeObjectURL(url);}
}
export async function loadSceneAssets({coarse=false,fetchBytes=fetchBounded,decodeImage=imageTexture}={}){
  const materialMaps={},environments={},textures=[],errors=[],decoder=new HDRLoader().setDataType(THREE.HalfFloatType);
  const jobs=[];let downloadedBytes=0;
  for(const [family,asset]of Object.entries(families))for(const [slot,kind]of Object.entries({map:'Diffuse',normalMap:'nor_gl',roughnessMap:'Rough'}))jobs.push({family,slot,file:asset+'-'+kind+'.jpg'});
  for(const [phase,asset]of Object.entries(skyFiles))jobs.push({phase,file:asset+'-hdri.hdr'});
  await Promise.all(jobs.map(async job=>{
    try{
      const bytes=await fetchBytes(new URL('./assets/scene/'+job.file,import.meta.url));downloadedBytes+=bytes.byteLength;
      let texture;
      if(job.phase){
        const data=decoder.parse(bytes);texture=new THREE.DataTexture(data.data,data.width,data.height,THREE.RGBAFormat,data.type);
        texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;texture.flipY=true;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
        environments[job.phase]=texture;
      }else{
        texture=await decodeImage(bytes);texture.colorSpace=job.slot==='map'?THREE.SRGBColorSpace:THREE.NoColorSpace;
        texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.anisotropy=coarse?1:2;
        (materialMaps[job.family]??={})[job.slot]=texture;
      }
      texture.name=job.file;textures.push(texture);
    }catch(error){errors.push(job.file);console.warn('Using a procedural fallback for',job.file,error);}
  }));
  return {materialMaps,environments,stats:{photographicTextures:textures.filter(t=>!t.isDataTexture).length,capturedEnvironments:Object.keys(environments).length,downloadedBytes,failedAssets:errors.length},dispose(){textures.forEach(texture=>{texture.dispose();texture.image?.close?.();});}};
}
