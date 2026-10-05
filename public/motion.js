export function createMotionSystem({getRoom,isEnabled}) {
  const {gsap,ScrollTrigger}=window;
  if(!gsap||!ScrollTrigger)return {setEnabled(){},drop(){}};
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ignoreMobileResize:true});
  const stage=document.querySelector('.stage-shell'),cursor=document.querySelector('.room-cursor'),board=document.getElementById('comparison-board');
  let context,media,tickerTween,dropCleanup,introPlayed=false,cleanups=[];
  const listen=(element,event,handler)=>{element.addEventListener(event,handler);cleanups.push(()=>element.removeEventListener(event,handler));};
  document.querySelectorAll('.hero-line-inner').forEach(line=>{
    const text=line.textContent;line.replaceChildren(...Array.from(text,letter=>{const span=document.createElement('span');span.className=letter===' '?'hero-char hero-char-space':'hero-char';span.textContent=letter===' '?'\u00a0':letter;return span;}));
  });
  function placeIndicator(animate=true){
    const picker=document.querySelector('.mobile-tier-picker'),active=picker.querySelector('[aria-pressed=true]'),indicator=picker.querySelector('.tier-indicator');
    if(!picker.offsetWidth)return;
    const rect=active.getBoundingClientRect(),base=picker.getBoundingClientRect();
    const values={x:rect.left-base.left-4,width:rect.width,height:rect.height};
    if(animate&&isEnabled())gsap.to(indicator,{...values,duration:.45,ease:'power3.out',overwrite:true});else gsap.set(indicator,values);
  }
  board.addEventListener('tierchange',()=>{
    placeIndicator();
    if(!isEnabled())return;
    gsap.fromTo(board.querySelectorAll('td.is-selected .cell-main'),{y:5,opacity:.35},{y:0,opacity:1,duration:.35,stagger:.025,ease:'power2.out',overwrite:true});
    gsap.fromTo(board.querySelector('.tier-button[aria-pressed=true] .tier-price'),{y:7,opacity:.5},{y:0,opacity:1,duration:.4,ease:'power3.out',overwrite:true});
  });
  window.addEventListener('resize',()=>placeIndicator(false),{passive:true});
  function destroy(){
    dropCleanup?.kill();
    if(tickerTween)gsap.killTweensOf(tickerTween);
    media?.revert();context?.revert();
    const transientTargets='.cell-main,.tier-price,#vibe-description,.brand-mark i,.drop-ring,.hero-char,.room-cursor';
    gsap.killTweensOf(transientTargets);
    gsap.set(transientTargets,{clearProps:'transform,opacity'});
    cleanups.forEach(clean=>clean());cleanups=[];
    stage.classList.remove('is-dropping');document.documentElement.classList.remove('motion-enabled');
  }
  function build(){
    destroy();placeIndicator(false);if(!isEnabled())return;
    document.documentElement.classList.add('motion-enabled');
    context=gsap.context(()=>{
      if(!introPlayed&&scrollY<150){
        gsap.timeline({defaults:{ease:'power3.out'}})
          .from('.hero-char',{yPercent:115,rotationX:-65,rotationZ:7,opacity:0,duration:.85,stagger:.018},.08)
          .from('.hero-copy > .eyebrow',{y:12,opacity:0,duration:.6},.15)
          .from('.hero-description,.hero-actions,.hero-facts',{y:24,opacity:.3,duration:.8,stagger:.12},.65)
          .from(stage,{y:45,rotationY:-9,rotationZ:2,opacity:.35,duration:1.2},.28);
      }
      introPlayed=true;
      gsap.to('.stage-aura',{rotation:360,duration:70,repeat:-1,ease:'none'});
      gsap.to('.comparison-corner i',{rotation:180,duration:24,repeat:-1,ease:'none'});
      document.querySelectorAll('.reveal').forEach(element=>{
        gsap.from(element,{y:36,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 91%',once:true}});
      });
      gsap.from('.comparison-row',{opacity:.3,duration:.55,stagger:.04,ease:'power2.out',scrollTrigger:{trigger:board,start:'top 75%',once:true}});
      gsap.from('.tier-button',{y:20,opacity:.5,duration:.65,stagger:.08,ease:'power3.out',scrollTrigger:{trigger:board,start:'top 88%',once:true}});
      const track=document.querySelector('.ticker-track');
      tickerTween=gsap.to(track,{xPercent:-50,duration:30,repeat:-1,ease:'none'});
      ScrollTrigger.create({trigger:'.ticker',start:'top bottom',end:'bottom top',onUpdate:self=>{gsap.to(tickerTween,{timeScale:1+Math.min(4,Math.abs(self.getVelocity())/700),duration:.35,overwrite:true});gsap.to(tickerTween,{timeScale:1,duration:.9,delay:.18,overwrite:'auto'});}});
      gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:true}});
      ScrollTrigger.create({trigger:'.hero',start:'top 80px',end:'bottom top',onUpdate:self=>getRoom()?.setScroll(self.progress)});
      media=gsap.matchMedia();
      media.add('(min-width:900px)',()=>{
        const timeline=gsap.timeline({scrollTrigger:{trigger:'.cinematic',start:'top 80px',end:'+=720',pin:true,scrub:.8,anticipatePin:1,invalidateOnRefresh:true}});
        timeline.fromTo('.cinematic-frame',{clipPath:'inset(12% 9% round 36px)'},{clipPath:'inset(0% 0% round 0px)',duration:1,ease:'none'},0)
          .fromTo('.cinematic-frame > img',{scale:1.38,y:55},{scale:1.06,y:-25,duration:1.6,ease:'none'},0)
          .fromTo('.cinematic-line:first-child',{x:-100},{x:15,duration:1.6,ease:'none'},0)
          .fromTo('.cinematic-line:last-child',{x:100},{x:-15,duration:1.6,ease:'none'},0)
          .fromTo('.cinematic-subtitle',{y:20,opacity:0},{y:0,opacity:1,duration:.7},.55)
          .to('.cinematic-track b',{scaleX:1,duration:1.6,ease:'none'},0);
      });
      media.add('(max-width:899px)',()=>{
        gsap.fromTo('.cinematic-frame > img',{scale:1.18,y:35},{scale:1.07,y:-30,ease:'none',scrollTrigger:{trigger:'.cinematic',start:'top bottom',end:'bottom top',scrub:.7}});
        gsap.from('.cinematic-line',{y:35,opacity:0,stagger:.12,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.cinematic',start:'top 65%',once:true}});
      });
      if(matchMedia('(pointer:fine)').matches){
        document.querySelectorAll('.button,.drop-button').forEach(button=>{
          const x=gsap.quickTo(button,'x',{duration:.35,ease:'power3.out'}),y=gsap.quickTo(button,'y',{duration:.35,ease:'power3.out'});let bounds;
          listen(button,'pointerenter',()=>{bounds=button.getBoundingClientRect();});
          listen(button,'pointermove',event=>{if(!bounds)return;x((event.clientX-bounds.left-bounds.width/2)*.075);y((event.clientY-bounds.top-bounds.height/2)*.15);});
          listen(button,'pointerleave',()=>{x(0);y(0);});
        });
        const tiltX=gsap.quickTo(stage,'rotationX',{duration:.65,ease:'power3.out'}),tiltY=gsap.quickTo(stage,'rotationY',{duration:.65,ease:'power3.out'});
        const cursorX=gsap.quickTo(cursor,'x',{duration:.22,ease:'power3.out'}),cursorY=gsap.quickTo(cursor,'y',{duration:.22,ease:'power3.out'});let bounds;
        const canvasRegion=document.getElementById('stage');
        listen(canvasRegion,'pointerenter',()=>{bounds=stage.getBoundingClientRect();gsap.to(cursor,{opacity:1,scale:1,duration:.25,overwrite:true});});
        listen(canvasRegion,'pointermove',event=>{if(!bounds)return;const x=(event.clientX-bounds.left)/bounds.width-.5,y=(event.clientY-bounds.top)/bounds.height-.5;tiltX(-y*4);tiltY(x*5);cursorX(event.clientX-45);cursorY(event.clientY-45);});
        listen(canvasRegion,'pointerleave',()=>{tiltX(0);tiltY(0);gsap.to(cursor,{opacity:0,scale:.7,duration:.2,overwrite:true});});
        gsap.to('.room-cursor i',{rotation:360,duration:20,repeat:-1,ease:'none'});
        document.querySelectorAll('.brief-card').forEach(card=>{let bounds;listen(card,'pointerenter',()=>{bounds=card.getBoundingClientRect();});listen(card,'pointermove',event=>{if(bounds){card.style.setProperty('--spot-x',`${event.clientX-bounds.left}px`);card.style.setProperty('--spot-y',`${event.clientY-bounds.top}px`);}});});
      }
      listen(document.querySelector('.vibe-options'),'click',event=>{if(!event.target.closest('button'))return;gsap.fromTo('#vibe-description',{y:10,opacity:.2},{y:0,opacity:1,duration:.4,ease:'power3.out',overwrite:true});});
      listen(window,'scs:beat',()=>{if(!isEnabled())return;gsap.fromTo('.brand-mark i',{scaleY:1.2},{scaleY:1,duration:.42,stagger:.025,ease:'power2.out',overwrite:true});});
    });
    document.fonts.ready.then(()=>{ScrollTrigger.refresh();placeIndicator(false);});
  }
  function drop(){
    if(!isEnabled())return;
    stage.classList.add('is-dropping');
    gsap.fromTo('.drop-ring',{scale:.65,opacity:.5},{scale:2.5,opacity:0,duration:1.5,ease:'power2.out',overwrite:true});
    gsap.fromTo('.hero-line:last-child .hero-char',{y:6},{y:0,duration:.55,stagger:.015,ease:'back.out(2)',overwrite:true});
    dropCleanup?.kill();dropCleanup=gsap.delayedCall(4.5,()=>stage.classList.remove('is-dropping'));
  }
  build();
  return {setEnabled:build,drop};
}
