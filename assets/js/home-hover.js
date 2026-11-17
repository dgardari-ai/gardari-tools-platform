import {isPhone,layoutRect} from './layout.js?v=20261117-preview20';
import {propertySnapshot} from './home-motion-parts.js?v=20261117-preview20';

const ART_VIEWBOX='0 0 236.534886547 308.085098554';
const CYCLE=2.8;
let serial=0;

// The accepted v4 files stay intact. Only their inline viewport is matched to
// the original illustration; all moving shapes may paint outside that box.
export function bindHeroHover(main){
 const hero=main.querySelector('.home-hero'),stage=hero?.querySelector('.home-prototype-stage');
 const image=stage?.querySelector('.hero-illustration');
 if(!hero||!stage||!image)return ()=>{};
 const events=new AbortController(),resources=new AbortController();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pointer=matchMedia('(hover: hover) and (pointer: fine)');
 const instance=++serial;
 let layer,still,moving,restoreImage,loading=false,failed=false,disposed=false;
 let hovered=false,playing=false,frame=0,supported=false;
 const options={signal:events.signal};

 function mark(state){if(hero.dataset.hoverState!==state)hero.dataset.hoverState=state;}
 function eligible(){return !isPhone()&&!reduced.matches&&pointer.matches&&!document.hidden;}
 function finish(){
  cancelAnimationFrame(frame);frame=0;playing=false;
  if(moving&&supported){moving.pauseAnimations();moving.setCurrentTime(0);}
  if(moving)moving.style.visibility='hidden';
  if(still)still.style.visibility='visible';
  if(layer)layer.dataset.playing='false';
  if(!disposed&&layer&&!layer.hidden)mark(eligible()?'idle':'static');
 }
 function watch(){
  if(disposed||!playing)return;
  if(!eligible())return finish();
  if(moving.getCurrentTime()>=CYCLE){
   if(hovered)moving.setCurrentTime(0);
   else return finish();
  }
  frame=requestAnimationFrame(watch);
 }
 function start(){
  if(disposed||!hovered||!eligible()||!supported||!layer||layer.hidden)return;
  if(playing){mark('running');return;}
  moving.pauseAnimations();moving.setCurrentTime(0);
  still.style.visibility='hidden';moving.style.visibility='visible';
  playing=true;layer.dataset.playing='true';mark('running');
  moving.unpauseAnimations();frame=requestAnimationFrame(watch);
 }
 function hide(){
  hovered=false;finish();
  if(layer)layer.hidden=true;
  restoreImage?.();restoreImage=null;
 }
 function position(){
  if(!layer)return false;
  const art=layoutRect(image),host=layoutRect(stage);
  if(!art?.width||!art.height||!host)return false;
  Object.assign(layer.style,{left:`${art.left-host.left}px`,top:`${art.top-host.top}px`,width:`${art.width}px`,height:`${art.height}px`});
  return true;
 }
 async function svgAsset(file,kind){
  const response=await fetch(`assets/images/redesign/${file}?v=20261117-hover4`,{signal:resources.signal});
  if(!response.ok)throw Error('Hover asset unavailable');
  const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid hover SVG');
  const root=document.importNode(doc.documentElement,true);
  if(root.querySelector('script,foreignObject'))throw Error('Unexpected hover content');
  root.removeAttribute('width');root.removeAttribute('height');
  root.setAttribute('viewBox',ART_VIEWBOX);
  root.setAttribute('aria-hidden','true');root.setAttribute('focusable','false');
  root.classList.add(`hero-hover-${kind}`);
  // Both accepted files contain the same authoring IDs; keep them unique when
  // the stationary and animated copies share the document.
  root.querySelectorAll('[id]').forEach(node=>{node.id=`hero-hover-${instance}-${kind}-${node.id}`;});
  return root;
 }
 async function prepare(){
  if(loading||failed||disposed)return;
  loading=true;
  try{
   const [fixed,animated]=await Promise.all([
    svgAsset('platform-workers-hover-v4-static.svg','static'),
    svgAsset('platform-workers-hover-v4.svg','animated'),image.decode()
   ]);
   if(disposed)return;
   still=fixed;moving=animated;
   layer=document.createElement('div');layer.className='hero-hover-layer';
   layer.setAttribute('aria-hidden','true');layer.hidden=true;layer.dataset.playing='false';
   moving.style.visibility='hidden';layer.append(still,moving);stage.append(layer);
   supported=typeof moving.pauseAnimations==='function'&&typeof moving.setCurrentTime==='function'&&typeof moving.unpauseAnimations==='function';
   if(supported){moving.pauseAnimations();moving.setCurrentTime(0);}
   else moving.remove();
   sync();
  }catch{
   if(disposed)return;
   failed=true;hide();layer?.remove();layer=null;mark('fallback');
  }
 }
 function sync(){
  if(disposed)return;
  if(isPhone()){hide();mark('phone');return;}
  if(failed){mark('fallback');return;}
  if(!layer){mark('preparing');void prepare();return;}
  if(hero.dataset.motionStage!=='complete'){hide();mark('entrance');return;}
  if(!position())return;
  if(layer.hidden){
   // Capture opacity after v5 has restored its own temporary image opacity.
   restoreImage=propertySnapshot(image,'opacity');
   layer.hidden=false;image.style.opacity='0';
   hovered=image.matches(':hover')&&pointer.matches;
  }
  if(!eligible()){hovered=false;finish();mark('static');return;}
  if(hovered)start();else if(!playing)mark('idle');
 }
 image.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  hovered=true;start();
 },options);
 image.addEventListener('pointerleave',()=>{
  hovered=false;if(playing)mark('finishing');
 },options);
 image.addEventListener('pointercancel',()=>{hovered=false;if(playing)mark('finishing');},options);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){hovered=false;finish();}else sync();},options);
 window.addEventListener('pagehide',()=>{hovered=false;finish();},options);
 window.addEventListener('platform:layout',sync,options);
 window.addEventListener('resize',sync,{passive:true,...options});
 reduced.addEventListener('change',sync,options);pointer.addEventListener('change',sync,options);
 const entrance=new MutationObserver(sync);
 entrance.observe(hero,{attributes:true,attributeFilter:['data-motion-stage']});
 const size=typeof ResizeObserver==='function'?new ResizeObserver(sync):null;
 size?.observe(image);size?.observe(stage);
 sync();
 return ()=>{
  if(disposed)return;disposed=true;
  events.abort();resources.abort();entrance.disconnect();size?.disconnect();
  hide();layer?.remove();
 };
}
