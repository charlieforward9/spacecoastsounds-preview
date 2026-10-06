export function createMotionSystem({isEnabled}) {
  const {gsap,ScrollTrigger}=window;
  if(!gsap||!ScrollTrigger)return {setEnabled(){},drop(){},sceneChange(){}};
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ignoreMobileResize:true});
  const stage=document.querySelector('.stage-shell'),cursor=document.querySelector('.room-cursor'),board=document.getElementById('comparison-board');
  let context,tickerTween,dropCleanup,introPlayed=false,cleanups=[];
  const listen=(element,event,handler)=>{element.addEventListener(event,handler);cleanups.push(()=>element.removeEventListener(event,handler));};
  document.querySelectorAll('.hero-line-inner').forEach(line=>{
    const text=line.textContent;line.replaceChildren(...Array.from(text,letter=>{const span=document.createElement('span');span.className=letter===' '?'hero-char hero-char-space':'hero-char';span.textContent=letter===' '?'\u00a0':letter;return span;}));
  });
  function placeIndicator(animate=true){
    const picker=document.querySelector('.mobile-tier-picker'),active=picker.querySelector('[aria-pressed=true]'),indicator=picker.querySelector('.tier-indicator');
    if(!picker.offsetWidth)return;
    const rect=active.getBoundingClientRect(),base=picker.getBoundingClientRect();
    const values={x:rect.left-base.left-4,width:rect.width,height:rect.height};
    if(animate&&isEnabled())gsap.to(indicator,{...values,duration:.35,ease:'power3.out',overwrite:true});else gsap.set(indicator,values);
  }
  board.addEventListener('tierchange',()=>{
    placeIndicator();if(!isEnabled())return;
    gsap.fromTo(board.querySelectorAll('td.is-selected .cell-main'),{y:5,opacity:.35},{y:0,opacity:1,duration:.3,stagger:.02,ease:'power2.out',overwrite:true});
  });
  window.addEventListener('resize',()=>placeIndicator(false),{passive:true});
  function destroy(){
    dropCleanup?.kill();if(tickerTween)gsap.killTweensOf(tickerTween);context?.revert();
    const targets='.cell-main,.tier-price,.brand-mark i,.drop-ring,.hero-char,.room-cursor,#scene-name,#scene-number,.stage-wordmark span';
    gsap.killTweensOf(targets);gsap.set(targets,{clearProps:'transform,opacity'});
    cleanups.forEach(clean=>clean());cleanups=[];cursor.classList.remove('is-dragging');stage.classList.remove('is-dropping');document.documentElement.classList.remove('motion-enabled');
  }
  function build(){
    destroy();placeIndicator(false);if(!isEnabled())return;
    document.documentElement.classList.add('motion-enabled');
    context=gsap.context(()=>{
      if(!introPlayed&&scrollY<150){
        gsap.timeline({defaults:{ease:'power3.out'}})
          .from('.hero-char',{yPercent:110,rotationX:-60,opacity:0,duration:.8,stagger:.022},.08)
          .from('.hero-description,.hero-actions',{y:20,opacity:.35,duration:.7,stagger:.1},.5)
          .from(stage,{y:35,opacity:.4,duration:1},.15);
      }
      introPlayed=true;
      document.querySelectorAll('.reveal').forEach(element=>gsap.from(element,{y:25,opacity:0,duration:.7,scrollTrigger:{trigger:element,start:'top 94%',once:true}}));
      gsap.from('.comparison-row',{opacity:.4,duration:.45,stagger:.03,scrollTrigger:{trigger:board,start:'top 85%',once:true}});
      tickerTween=gsap.to('.ticker-track',{xPercent:-50,duration:32,repeat:-1,ease:'none'});
      gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:true}});
      if(matchMedia('(pointer:fine)').matches){
        document.querySelectorAll('.button,.drop-button').forEach(button=>{
          const x=gsap.quickTo(button,'x',{duration:.3,ease:'power3.out'}),y=gsap.quickTo(button,'y',{duration:.3,ease:'power3.out'});let bounds;
          listen(button,'pointerenter',()=>{bounds=button.getBoundingClientRect();});
          listen(button,'pointermove',event=>{if(!bounds)return;x((event.clientX-bounds.left-bounds.width/2)*.09);y((event.clientY-bounds.top-bounds.height/2)*.12);});
          listen(button,'pointerleave',()=>{x(0);y(0);});
        });
        const cursorX=gsap.quickTo(cursor,'x',{duration:.10,ease:'power2.out'}),cursorY=gsap.quickTo(cursor,'y',{duration:.10,ease:'power2.out'});
        const region=document.getElementById('stage');
        listen(region,'pointerenter',()=>gsap.to(cursor,{opacity:1,scale:1,duration:.18,overwrite:true}));
        listen(region,'pointermove',event=>{cursorX(event.clientX-28);cursorY(event.clientY-28);});
        listen(region,'pointerleave',()=>gsap.to(cursor,{opacity:0,scale:.6,duration:.18,overwrite:true}));
        listen(region,'pointerdown',()=>{cursor.classList.add('is-dragging');gsap.to(cursor,{scale:.75,duration:.18,overwrite:true});});
        for(const event of ['pointerup','pointercancel'])listen(region,event,()=>{cursor.classList.remove('is-dragging');gsap.to(cursor,{scale:1,duration:.18,overwrite:true});});
      }
      listen(window,'scs:beat',()=>{if(!isEnabled())return;gsap.fromTo('.brand-mark i',{scaleY:1.2},{scaleY:1,duration:.4,stagger:.025,overwrite:true});});
    });
    document.fonts.ready.then(()=>{ScrollTrigger.refresh();placeIndicator(false);});
  }
  function sceneChange(){
    if(!isEnabled())return;
    gsap.fromTo('#scene-name,.stage-wordmark span',{y:10,opacity:.25},{y:0,opacity:1,duration:.6,stagger:.07,ease:'power3.out',overwrite:true});
    gsap.fromTo('#scene-number',{y:18,opacity:.1},{y:0,opacity:1,duration:.7,ease:'power3.out',overwrite:true});
  }
  function drop(){
    if(!isEnabled())return;stage.classList.add('is-dropping');
    gsap.fromTo('.drop-ring',{scale:.65,opacity:.35},{scale:3,opacity:0,duration:1.7,ease:'power2.out',overwrite:true});
    dropCleanup?.kill();dropCleanup=gsap.delayedCall(4.5,()=>stage.classList.remove('is-dropping'));
  }
  build();return {setEnabled:build,drop,sceneChange};
}
