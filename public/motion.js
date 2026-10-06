export function createMotionSystem({isEnabled}) {
  const {gsap}=window;
  if(!gsap)return {setEnabled(){},drop(){},sceneChange(){}};
  const stage=document.querySelector('.stage-shell'),cursor=document.querySelector('.room-cursor'),board=document.getElementById('comparison-board');
  let context,dropCleanup,introPlayed=false,cleanups=[];
  const listen=(element,event,handler)=>{element.addEventListener(event,handler);cleanups.push(()=>element.removeEventListener(event,handler));};
  board.addEventListener('tierchange',()=>{
    if(!isEnabled()||!document.querySelector('.package-tile[aria-pressed=true]'))return;
    gsap.fromTo('.package-tile[aria-pressed=true] .package-price',{y:5,opacity:.5},{y:0,opacity:1,duration:.3,ease:'power2.out',overwrite:true});
  });
  function destroy(){
    dropCleanup?.kill();context?.revert();
    const targets='.package-price,.brand-mark i,.drop-ring,.room-cursor,#scene-name';
    gsap.killTweensOf(targets);gsap.set(targets,{clearProps:'transform,opacity'});
    cleanups.forEach(clean=>clean());cleanups=[];cursor.classList.remove('is-dragging');stage.classList.remove('is-dropping');document.documentElement.classList.remove('motion-enabled');
  }
  function build(){
    destroy();if(!isEnabled())return;
    document.documentElement.classList.add('motion-enabled');
    context=gsap.context(()=>{
      if(!introPlayed&&scrollY<150){
        gsap.from(stage,{opacity:.65,duration:.7,ease:'power2.out'});
      }
      introPlayed=true;
      if(matchMedia('(pointer:fine)').matches){
        document.querySelectorAll('.button,.drop-button').forEach(button=>{
          const x=gsap.quickTo(button,'x',{duration:.3,ease:'power3.out'}),y=gsap.quickTo(button,'y',{duration:.3,ease:'power3.out'});let bounds;
          listen(button,'pointerenter',()=>{bounds=button.getBoundingClientRect();});
          listen(button,'pointermove',event=>{if(!bounds)return;x((event.clientX-bounds.left-bounds.width/2)*.07);y((event.clientY-bounds.top-bounds.height/2)*.1);});
          listen(button,'pointerleave',()=>{x(0);y(0);});
        });
        const cursorX=gsap.quickTo(cursor,'x',{duration:.1,ease:'power2.out'}),cursorY=gsap.quickTo(cursor,'y',{duration:.1,ease:'power2.out'}),region=document.getElementById('stage');
        listen(region,'pointerenter',()=>gsap.to(cursor,{opacity:1,scale:1,duration:.18,overwrite:true}));
        listen(region,'pointermove',event=>{cursorX(event.clientX-28);cursorY(event.clientY-28);});
        listen(region,'pointerleave',()=>gsap.to(cursor,{opacity:0,scale:.6,duration:.18,overwrite:true}));
        listen(region,'pointerdown',()=>{cursor.classList.add('is-dragging');gsap.to(cursor,{scale:.75,duration:.18,overwrite:true});});
        for(const event of ['pointerup','pointercancel'])listen(region,event,()=>{cursor.classList.remove('is-dragging');gsap.to(cursor,{scale:1,duration:.18,overwrite:true});});
      }
      listen(window,'scs:beat',()=>{if(!isEnabled()||document.hidden)return;gsap.fromTo('.brand-mark i',{scaleY:1.2},{scaleY:1,duration:.35,stagger:.02,overwrite:true});});
    });
  }
  function sceneChange(){
    if(!isEnabled())return;
    gsap.fromTo('#scene-name',{y:8,opacity:.3},{y:0,opacity:1,duration:.5,stagger:.05,ease:'power3.out',overwrite:true});
  }
  function drop(){
    if(!isEnabled())return;stage.classList.add('is-dropping');
    gsap.fromTo('.drop-ring',{scale:.65,opacity:.35},{scale:3,opacity:0,duration:1.7,ease:'power2.out',overwrite:true});
    dropCleanup?.kill();dropCleanup=gsap.delayedCall(4.5,()=>stage.classList.remove('is-dropping'));
  }
  build();return {setEnabled:build,drop,sceneChange};
}
