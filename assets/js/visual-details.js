import {layoutRect} from './layout.js?v=20261117-preview20';
// One vector and one cap-height anchor for action chevrons across system fonts.
// The already measured photo-card name arrows keep their own baseline geometry.
const measure=document.createElement('canvas').getContext('2d');
const sizes=new Map(), offsets=new WeakMap();
let pending=0;
function cap(style){
 const font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
 if(!sizes.has(font)){
  measure.font=font;
  const m=measure.measureText('Н');
  const ascent=m.actualBoundingBoxAscent||parseFloat(style.fontSize)*.73;
  const descent=m.actualBoundingBoxDescent||0;
  sizes.set(font,{height:ascent+descent,centre:(ascent-descent)/2});
 }
 return sizes.get(font);
}
function labelFor(icon){
 const action=icon.closest('a,button,summary');
 if(!action)return null;
 const fixed=action.querySelector('.hero-cta-label,.footer-control-label,.footer-policy-first,.footer-link-label');
 if(fixed)return fixed;
 const walker=document.createTreeWalker(action,NodeFilter.SHOW_TEXT);
 let text;
 while((text=walker.nextNode())){
  if(!text.textContent.trim()||text.parentElement.closest('svg,[aria-hidden="true"]'))continue;
  if(text.parentElement===action){
   const label=document.createElement('span');label.className='type-label';
   text.replaceWith(label);label.append(text);return label;
  }
  return text.parentElement;
 }
 return null;
}
function align(){
 pending=0;
 for(const icon of document.querySelectorAll('svg.chevron,svg.hero-action-arrow')){
  if(!icon.getClientRects().length||icon.closest('[inert],[hidden],[aria-hidden="true"]:not(svg)'))continue;
  const label=labelFor(icon);
  if(!label||!label.getClientRects().length)continue;
  let baseline=label.querySelector(':scope>.type-baseline');
  if(!baseline){
   baseline=document.createElement('i');baseline.className='type-baseline';baseline.setAttribute('aria-hidden','true');label.prepend(baseline);
  }
  const size=cap(getComputedStyle(label));
  if(!icon.classList.contains('type-chevron'))icon.classList.add('type-chevron');
  if(icon.getAttribute('viewBox')!=='0 4 24 16')icon.setAttribute('viewBox','0 4 24 16');
  if(icon.style.getPropertyValue('--chevron-cap')!==size.height+'px')icon.style.setProperty('--chevron-cap',size.height+'px');
  const path=icon.querySelector('path');
  if(path?.getAttribute('d')!=='m9 5 7 7-7 7')path?.setAttribute('d','m9 5 7 7-7 7');
  const box=layoutRect(icon);
  const centre=layoutRect(baseline).top-size.centre;
  const delta=centre-box.top-box.height/2;
  // Do not reset/rewrite identical style attributes: the author's runtime also
  // observes them. Subpixel quantization after zoom must settle, not oscillate.
  if(Math.abs(delta)>1/32){
   const shift=Math.round(((offsets.get(icon)||0)+delta)*128)/128;
   const value=`0px ${shift}px`;
   if(icon.style.getPropertyValue('translate')!==value)icon.style.setProperty('translate',value);
   offsets.set(icon,shift);
  }
 }
 document.documentElement.dataset.visualGeometryReady='true';
}
// Baseline adapters for Affinity text and footer labels run in the first frame.
// Measure their final positions in the next one, also after a viewport change.
const schedule=()=>{
 if(pending)return;
 document.documentElement.dataset.visualGeometryReady='false';
 pending=requestAnimationFrame(()=>{pending=requestAnimationFrame(align);});
};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
new ResizeObserver(schedule).observe(document.body);
window.addEventListener('resize',schedule);
window.addEventListener('platform:rendered',schedule);
window.addEventListener('platform:layout',schedule);
window.addEventListener('platform:type-baselines',schedule);
window.addEventListener('vmg:design-rendered',schedule);
document.addEventListener('click',schedule);
document.addEventListener('transitionend',schedule);
document.fonts.ready.then(()=>{sizes.clear();schedule();});
document.fonts.addEventListener('loadingdone',()=>{sizes.clear();schedule();});
schedule();
