/* First visit: the illustration's own colour shapes → traced/filled headline →
   two travelling sides of the accepted frame → the five subject words.
   The home below this scene reveals only after actual page scrolling. */
import {createArtwork,createHeadline,createFrame,propertySnapshot,bezier} from './home-motion-parts.js?v=20261116-release17';

let played=false;

function bindScrollReveals(main,reduced) {
 if(reduced.matches||!('IntersectionObserver' in window))return ()=>{};
 const footer=document.getElementById('site-footer');
 const targets=[...main.querySelectorAll('.home-section-heading,.home-question,.home-direction,.comment-preview'),...(footer?[footer]:[])];
 const pending=new Set(targets),events=new AbortController(),animations=new Set();
 let scrolled=window.scrollY>1,previousY=window.scrollY,frame=0,disposed=false;
 const observer=new IntersectionObserver(schedule,{rootMargin:'0px 0px -4% 0px',threshold:.02});
 function reveal(node,delay=0,instant=false) {
  if(!pending.delete(node))return;
  observer.unobserve(node);
  if(!instant&&typeof node.animate==='function'&&!reduced.matches) {
   const animation=node.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],
    {duration:460,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
   animations.add(animation);
   animation.finished.catch(()=>{}).then(()=>{animation.cancel();animations.delete(animation);});
  }
  node.classList.remove('home-scroll-pending');
 }
 function check() {
  frame=0;if(disposed||!scrolled||!main.isConnected)return;
  let order=0;
  for(const node of pending) {
   const box=node.getBoundingClientRect();
   if(box.bottom<=0)reveal(node,0,true);
   else if(box.top<window.innerHeight*.96)reveal(node,Math.min(order++*65,260));
  }
 }
 function schedule(){if(!disposed&&!frame)frame=requestAnimationFrame(check);}
 function finish() {
  if(disposed)return;disposed=true;events.abort();observer.disconnect();cancelAnimationFrame(frame);
  targets.forEach(node=>node.classList.remove('home-scroll-pending'));
  animations.forEach(animation=>animation.cancel());animations.clear();pending.clear();
 }
 targets.forEach(node=>{node.classList.add('home-scroll-pending');observer.observe(node);});
 window.addEventListener('scroll',()=>{
  const y=window.scrollY;if(y>1&&Math.abs(y-previousY)>.5)scrolled=true;previousY=y;schedule();
 },{passive:true,signal:events.signal});
 main.addEventListener('focusin',event=>{
  const target=targets.find(node=>node.contains(event.target));if(target)reveal(target,0,true);
 },{signal:events.signal});
 main.addEventListener('pointerdown',event=>{
  const target=targets.find(node=>node.contains(event.target));if(target)reveal(target,0,true);
 },{capture:true,signal:events.signal});
 footer?.addEventListener('focusin',()=>reveal(footer,0,true),{signal:events.signal});
 reduced.addEventListener('change',event=>{if(event.matches)finish();},{signal:events.signal});
 window.addEventListener('resize',finish,{passive:true,signal:events.signal});
 window.addEventListener('pageshow',()=>{if(window.scrollY>1)scrolled=true;schedule();},{signal:events.signal});
 schedule();return finish;
}

export function bindHomeMotion(main) {
 const hero=main.querySelector('.home-hero'),stage=hero?.querySelector('.home-prototype-stage');
 const image=stage?.querySelector('.hero-illustration'),heading=stage?.querySelector('#home-title');
 if(!hero||!stage||!image||!heading)return ()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // The accepted phone layout is static and has no authorial outer contour.
 const phoneLayout=matchMedia('(max-width:700px)').matches&&!!heading.querySelector('.hero-mobile-phrase');
 if(played||reduced.matches||phoneLayout||typeof requestAnimationFrame!=='function') {
  hero.dataset.motionStage='complete';hero.dataset.motionResult=reduced.matches?'reduced-motion':phoneLayout?'mobile-layout':'return';
  played=true;return ()=>{};
 }
 played=true;
 const releaseScroll=bindScrollReveals(main,reduced);
 const events=new AbortController(),resources=new AbortController();
 const topics=[...hero.querySelectorAll('.hero-topics > span')];
 const restoreTopics=topics.map(node=>propertySnapshot(node,'opacity'));
 let artwork,headline,outline,raf=0,resourceTimer=0,ended=false,lastTime=null,elapsed=0;
 let samples=0,longestFrame=0,total=0,renderFrame=null;
 hero.classList.add('home-motion-preparing');hero.dataset.motionStage='preparing';
 function finish(reason='complete') {
  if(ended)return;ended=true;
  events.abort();resources.abort();cancelAnimationFrame(raf);clearTimeout(resourceTimer);
  artwork?.finish();headline?.finish();outline?.finish();restoreTopics.forEach(restore=>restore());
  hero.classList.remove('home-motion-preparing');
  hero.dataset.motionStage='complete';hero.dataset.motionResult=reason;
  hero.dataset.motionElapsed=String(Math.round(elapsed));
  hero.dataset.motionFrames=String(samples);hero.dataset.motionLongestFrame=String(Math.round(longestFrame));
 }
 function dispose(){finish('navigation');releaseScroll();}
 const options={signal:events.signal};
 window.addEventListener('hashchange',()=>finish('navigation'),options);
 window.addEventListener('resize',()=>finish('resize'),{passive:true,...options});
 window.addEventListener('scroll',()=>{if(window.scrollY>1)finish('scroll');},{passive:true,...options});
 const interactive=event=>{if(event.target.closest('a,button,input,summary,[tabindex]'))finish('interaction');};
 hero.addEventListener('pointerdown',interactive,{capture:true,...options});
 hero.addEventListener('focusin',interactive,options);
 reduced.addEventListener('change',event=>{if(event.matches){finish('reduced-motion');releaseScroll();}},options);
 document.addEventListener('visibilitychange',()=>{
  cancelAnimationFrame(raf);lastTime=null;
  if(!document.hidden&&!ended&&renderFrame)raf=requestAnimationFrame(renderFrame);
 },options);
 resourceTimer=setTimeout(()=>{finish('resource-timeout');releaseScroll();},4000);
 (async()=>{
  try {
   await Promise.all([image.decode(),document.fonts.ready]);
   if(ended)return;
   await new Promise(resolve=>requestAnimationFrame(resolve));
   if(ended)return;
   outline=createFrame(stage);headline=createHeadline(stage,heading);
   artwork=await createArtwork(stage,image,{signal:resources.signal});
   if(ended){artwork.finish();return;}
   clearTimeout(resourceTimer);
   topics.forEach(node=>{node.style.opacity='0';});
   const wordStart=400,wordSpeed=1.2,frameStart=wordStart+headline.dotsReadyAt/wordSpeed;
   const topicsStart=frameStart+outline.duration;
   total=Math.max(artwork.duration,wordStart+headline.duration/wordSpeed,topicsStart+(topics.length-1)*130+320);
   hero.dataset.motionDuration=String(Math.round(total));
   hero.dataset.motionPieces=String(artwork.count);hero.dataset.motionLetters=String(headline.count);
   hero.classList.remove('home-motion-preparing');
   renderFrame=timestamp=>{
    if(ended)return;
    if(lastTime!==null){const delta=Math.max(0,timestamp-lastTime);elapsed+=delta;longestFrame=Math.max(longestFrame,delta);}
    lastTime=timestamp;samples++;
    hero.dataset.motionStage=elapsed<wordStart?'artwork':elapsed<frameStart?'headline':elapsed<topicsStart?'frame':'topics';
    hero.dataset.motionElapsed=String(Math.round(elapsed));
    try {
     artwork.render(elapsed);
     headline.render((elapsed-wordStart)*wordSpeed);
     outline.render(elapsed-frameStart);
     topics.forEach((node,i)=>{node.style.opacity=String(bezier((elapsed-topicsStart-i*130)/320,.16,1,.3,1));});
    }catch{finish('render-fallback');releaseScroll();return;}
    if(elapsed>=total)finish();else raf=requestAnimationFrame(renderFrame);
   };
   if(!document.hidden)raf=requestAnimationFrame(renderFrame);
  }catch{if(!ended){finish('resource-fallback');releaseScroll();}}
 })();
 return dispose;
}
