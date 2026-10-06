// Decide once per gesture: sideways camera orbit or the browser's vertical scroll.
export class TouchOrbitIntent {
  begin(id,x,y){this.id=id;this.startX=this.lastX=x;this.startY=y;this.intent='pending';}
  move(id,x,y){
    if(id!==this.id)return null;
    const dx=x-this.startX,dy=y-this.startY;
    if(this.intent==='scroll')return null;
    let activated=false;
    if(this.intent==='pending'){
      if(Math.max(Math.abs(dx),Math.abs(dy))<8)return null;
      if(Math.abs(dx)<=Math.abs(dy)*1.2){this.intent='scroll';return null;}
      this.intent='orbit';activated=true;
    }
    const delta=x-this.lastX;this.lastX=x;return {delta,activated};
  }
  reset(){this.id=undefined;this.intent='pending';}
}
