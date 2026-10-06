// Small deterministic capsule-footprint solver. No physics engine or per-frame assets.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export class CrowdSolver {
 constructor(actors){this.actors=actors;this.count=actors.length;this.x=new Float64Array(this.count);this.z=new Float64Array(this.count);this.vx=new Float64Array(this.count);this.vz=new Float64Array(this.count);this.radius=new Float64Array(this.count);this.bounds={x:7.1,minZ:-7.4,maxZ:7.1};this.ready=false;this.idle=false;this.lastKey='';}
 invalidate(){this.idle=false;this.lastKey='';}
 configure(){for(let i=0;i<this.count;i++)this.radius[i]=this.actors[i].seated>.5?.30:this.actors[i].dress?.32:.28;}
 project(obstacles,iterations){
  let maximum=0;
  for(let pass=0;pass<iterations;pass++){
   maximum=0;
   for(let i=0;i<this.count;i++)for(let j=i+1;j<this.count;j++){
    let dx=this.x[j]-this.x[i],dz=this.z[j]-this.z[i],distance=Math.hypot(dx,dz),minimum=this.radius[i]+this.radius[j]+.025;
    if(distance>=minimum)continue;
    if(distance<1e-7){const angle=(i*2.399963+j*.754878)%6.283185;dx=Math.cos(angle);dz=Math.sin(angle);distance=1;}
    const overlap=minimum-(Math.hypot(this.x[j]-this.x[i],this.z[j]-this.z[i]));maximum=Math.max(maximum,overlap);const push=overlap*.501,nx=dx/distance,nz=dz/distance;
    this.x[i]-=nx*push;this.z[i]-=nz*push;this.x[j]+=nx*push;this.z[j]+=nz*push;
    const closing=(this.vx[j]-this.vx[i])*nx+(this.vz[j]-this.vz[i])*nz;if(closing<0){this.vx[i]+=nx*closing*.5;this.vz[i]+=nz*closing*.5;this.vx[j]-=nx*closing*.5;this.vz[j]-=nz*closing*.5;}
   }
   for(let i=0;i<this.count;i++){
    const radius=this.radius[i];
    for(const o of obstacles){
     if(o.weight<.001||(o.owner===i&&this.actors[i].seated>.08))continue;
     let nx,nz,push;const dx=this.x[i]-o.x,dz=this.z[i]-o.z;
     if(o.kind==='circle'){
      const distance=Math.hypot(dx,dz),minimum=o.radius+radius+.035;if(distance>=minimum)continue;
      const angle=i*2.399963;nx=distance>1e-7?dx/distance:Math.cos(angle);nz=distance>1e-7?dz/distance:Math.sin(angle);push=minimum-distance;
     }else{
      const c=o.cos??1,s=o.sin??0,lx=dx*c-dz*s,lz=dx*s+dz*c,qx=clamp(lx,-o.hx,o.hx),qz=clamp(lz,-o.hz,o.hz),ax=lx-qx,az=lz-qz,distance=Math.hypot(ax,az);
      let localX,localZ;
      if(distance>1e-7){if(distance>=radius+.035)continue;localX=ax/distance;localZ=az/distance;push=radius+.035-distance;}
      else if(o.hx-Math.abs(lx)<o.hz-Math.abs(lz)){localX=lx<0?-1:1;localZ=0;push=o.hx-Math.abs(lx)+radius+.035;}
      else{localX=0;localZ=lz<0?-1:1;push=o.hz-Math.abs(lz)+radius+.035;}
      nx=localX*c+localZ*s;nz=-localX*s+localZ*c;
     }
     push*=o.weight;maximum=Math.max(maximum,push);
     const furnitureShare=o.mobility??0,personShare=1-furnitureShare;
     this.x[i]+=nx*push*personShare;this.z[i]+=nz*push*personShare;
     if(furnitureShare){o.x-=nx*push*furnitureShare;o.z-=nz*push*furnitureShare;}
     const inward=this.vx[i]*nx+this.vz[i]*nz;if(inward<0){this.vx[i]-=nx*inward;this.vz[i]-=nz*inward;}
    }
    this.x[i]=clamp(this.x[i],-this.bounds.x+radius,this.bounds.x-radius);this.z[i]=clamp(this.z[i],this.bounds.minZ+radius,this.bounds.maxZ-radius);
   }
   if(maximum<.0002)break;
  }
  return maximum;
 }
 step(targets,obstacles,dt,{instant=false,key=''}={}){
  this.configure();
  if(!this.ready||instant){targets.forEach((p,i)=>{this.x[i]=p.x;this.z[i]=p.z;this.vx[i]=this.vz[i]=0;});this.project(obstacles,90);this.ready=true;this.idle=false;this.lastKey=key;return;}
  if(dt<=0)return;
  this.lastKey=key;
  const steps=Math.max(1,Math.ceil(Math.min(.10,dt)/(1/60))),h=Math.min(.10,dt)/steps;
  let error=0,speed=0;
  for(let n=0;n<steps;n++){
   error=speed=0;
   for(let i=0;i<this.count;i++){
    const ex=targets[i].x-this.x[i],ez=targets[i].z-this.z[i];error=Math.max(error,Math.hypot(ex,ez));
    this.vx[i]+=(ex*45-this.vx[i]*13.5)*h;this.vz[i]+=(ez*45-this.vz[i]*13.5)*h;
    const length=Math.hypot(this.vx[i],this.vz[i]),limit=3.5;if(length>limit){this.vx[i]*=limit/length;this.vz[i]*=limit/length;}
    this.x[i]+=this.vx[i]*h;this.z[i]+=this.vz[i]*h;speed=Math.max(speed,Math.hypot(this.vx[i],this.vz[i]));
   }
   this.project(obstacles,24);
  }
  this.idle=error<.003&&speed<.004;
 }
 poses(){return this.actors.map((actor,i)=>({id:actor.id,x:this.x[i],z:this.z[i],radius:this.radius[i]}));}
}
