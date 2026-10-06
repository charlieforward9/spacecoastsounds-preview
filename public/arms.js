import * as THREE from 'three';

export const ARM_UPPER=.284,ARM_FOREARM=.258,ARM_MAX_BEND=130*Math.PI/180;
// One continuous surface from the shoulder cap to the wrist. The elbow band
// shares vertices, so bending cannot open the pointed seams of separate rods.
export function createArmGeometry(coarse=false){
  const rings=[
    [.040,.001,.001],[.028,.033,.041],[0,.046,.065],[-.025,.055,.073],
    [-.080,.050,.066],[-.160,.046,.058],[-.225,.042,.052],[-.266,.041,.049],
    [-ARM_UPPER,.040,.048],[-.305,.041,.050],[-.350,.044,.052],
    [-.425,.036,.047],[-.489,.026,.037],[-.510,.024,.028],[-ARM_UPPER-ARM_FOREARM,.023,.023]
  ].reverse();
  const make=(column)=>{
    const geometry=new THREE.LatheGeometry(rings.map(([y,...r])=>new THREE.Vector2(r[column],y)),coarse?8:10);
    geometry.scale(1,1,.82);geometry.computeVertexNormals();return geometry;
  };
  const geometry=make(0),sleeve=make(1);
  geometry.setAttribute('sleevePosition',sleeve.attributes.position.clone());
  geometry.setAttribute('sleeveNormal',sleeve.attributes.normal.clone());sleeve.dispose();
  geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(1),3));
  return geometry;
}

const deformation=`
attribute vec4 armJoint;
attribute vec2 armBody;
attribute vec3 sleevePosition;
attribute vec3 sleeveNormal;
attribute vec3 armSkin;
attribute vec3 armCloth;
vec3 armRotate(vec3 v, vec3 axis, float angle){
  float c=cos(angle),s=sin(angle);
  return v*c+cross(axis,v)*s+axis*dot(axis,v)*(1.0-c);
}
float armWeight(float y){return 1.0-smoothstep(-.404,-.164,y);}
vec3 armPosition(){
  vec3 p=mix(position,sleevePosition,armBody.x);
  p.xz*=armBody.y;
  vec3 hinge=vec3(0.0,-.284,0.0);
  return hinge+armRotate(p-hinge,armJoint.xyz,armJoint.w*armWeight(p.y));
}
vec3 armNormal(){
  vec3 p=mix(position,sleevePosition,armBody.x);
  vec3 n=mix(normal,sleeveNormal,armBody.x);
  p.xz*=armBody.y;n.xz/=armBody.y;
  float t=clamp((-.164-p.y)/.24,0.0,1.0);
  float derivative=-armJoint.w*6.0*t*(1.0-t)/.24;
  vec3 velocity=cross(armJoint.xyz,p-vec3(0.0,-.284,0.0));
  n.y-=derivative*dot(velocity,n)/max(.15,1.0+derivative*velocity.y);
  return normalize(armRotate(n,armJoint.xyz,armJoint.w*armWeight(p.y)));
}`;

// Share the same deformation with the lit, depth and point-shadow shaders.
// Instance matrices place the upper arm; one axis/angle bends the forearm.
export function attachArmDeformation(material,{color=true}={}){
  material.customProgramCacheKey=()=>`continuous-arm-v1-${color}`;
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\n'+deformation)
      .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=armNormal();')
      .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=armPosition();');
    if(color)shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>
      float cuff=smoothstep(-.540,-.529,position.y)*(1.0-smoothstep(-.507,-.497,position.y));
      float covered=armBody.x*smoothstep(-.540,-.529,position.y);
      vColor.rgb=mix(armSkin,mix(armCloth,vec3(.94,.93,.90),cuff),covered);`);
  };
  return material;
}
