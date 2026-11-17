import {layoutRect} from './layout.js?v=20261117-preview20';
import {layoutMedia} from './layout.js?v=20261117-preview20';
// Affinity places type by baselines. Keep those anchors after font loading and
// resizing without baking the system font's asymmetric line box into each rule.
const mobile=layoutMedia('(max-width:700px)');
const sideMeasure=document.createElement('canvas').getContext('2d');
const policyLinks=[...document.querySelectorAll('.policy-page .prototype-tabs a')]
 .map(link=>[link,link.getAttribute('href')])
 .filter(([,href])=>new URL(href,location.href).searchParams.get('catalog')==='open');
const policyLogo=document.querySelector('.policy-page .header-logo');
const policyLogoLabel=policyLogo?.getAttribute('aria-label');
const selectors=[
 '.hero-mobile-line','.hero-cta-label','.home-hero-description p>span','.hero-topics>span',
 '.prototype-tab-name','.home-heading-text','.home-question-number',
 '.home-question-mark','.footer-version','.footer-contacts>.footer-label',
 '.footer-control-label',
 '.footer-link-label:not(:has(.footer-policy-first))','.footer-policy-first','.footer-policy-last',
 '.footer-copyright-desktop'
].join(',');
let frame=0;
function align(){
 frame=0;
 for(const [link,href] of policyLinks){
  const url=new URL(href,location.href);url.searchParams.delete('catalog');
  link.setAttribute('href',mobile.matches?url.pathname+url.search+url.hash:href);
 }
 if(policyLogo)policyLogo.setAttribute('aria-label',mobile.matches?'Открыть меню':policyLogoLabel);
 // Share the capital body height and baseline. Sparse accents (Й) must not
 // shift an entire heading relative to the other section bands.
 for(const label of document.querySelectorAll('.home-section-heading .home-heading-text')){
  if(!mobile.matches){label.style.removeProperty('--mobile-heading-baseline');label.closest('.home-section-heading').style.removeProperty('--mobile-heading-cap-height');continue;}
  const band=label.closest('.home-section-heading');
  const box=layoutRect(band);
  if(!box.height||!box.width||!sideMeasure)continue;
  const style=getComputedStyle(label);
  sideMeasure.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const metrics=sideMeasure.measureText('Н');
  const ascent=Number.isFinite(metrics.actualBoundingBoxAscent)?metrics.actualBoundingBoxAscent:Number.parseFloat(style.fontSize)*.75;
  const descent=Number.isFinite(metrics.actualBoundingBoxDescent)?metrics.actualBoundingBoxDescent:0;
  band.style.setProperty('--mobile-heading-cap-height',(ascent+descent)+'px');
  const baseline=Math.round((box.height+ascent-descent)*64)/128+'px';
  if(label.style.getPropertyValue('--mobile-heading-baseline')!==baseline)label.style.setProperty('--mobile-heading-baseline',baseline);
 }
 for(const element of document.querySelectorAll(selectors)){
  if(!mobile.matches){element.style.removeProperty('--mobile-baseline-shift');continue;}
  const box=layoutRect(element);
  if(!box.width&&!box.height)continue;
  const text=element.matches('.home-question-mark')?element.querySelector('.question-sign'):element;
  let mark=text.querySelector(':scope>.mobile-baseline');
  if(!mark){mark=document.createElement('i');mark.className='mobile-baseline';mark.setAttribute('aria-hidden','true');text.append(mark);}
  const offset=layoutRect(mark).top-layoutRect(element).top;
  const shift=-Math.round(offset*128)/128+'px';
  if(element.style.getPropertyValue('--mobile-baseline-shift')!==shift)element.style.setProperty('--mobile-baseline-shift',shift);
 }
 for(const title of document.querySelectorAll('.home-question-title')){
  if(!mobile.matches){title.style.removeProperty('--mobile-title-shift');continue;}
  const row=title.closest('summary'),mark=title.querySelector('.question-title-baseline');
  const wanted=layoutRect(row).top+layoutRect(row).width*.078166;
  const previous=Number.parseFloat(title.style.getPropertyValue('--mobile-title-shift'))||0;
  const shift=Math.round((wanted-layoutRect(mark).top+previous)*128)/128+'px';
  if(title.style.getPropertyValue('--mobile-title-shift')!==shift)title.style.setProperty('--mobile-title-shift',shift);
 }
 const close=document.getElementById('close-menu');
 if(close){
  if(!mobile.matches)close.style.removeProperty('--mobile-close-top');
  else{
   const label=document.querySelector('.side-main-pages a:first-child .side-page-label');
   const baseline=label?.querySelector('.side-label-baseline');
   if(label&&baseline&&sideMeasure){
    const style=getComputedStyle(label);
    sideMeasure.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const descent=sideMeasure.measureText(label.textContent.trim()).actualBoundingBoxDescent||0;
    // Content coordinates keep the close control fixed when the menu scrolls.
    const panel=close.closest('.sidepanel');
    const top=layoutRect(baseline).top+descent+panel.scrollTop-layoutRect(close.parentElement).top-layoutRect(close).height;
    const next=Math.round(top*128)/128+'px';
    if(close.style.getPropertyValue('--mobile-close-top')!==next)close.style.setProperty('--mobile-close-top',next);
   }
  }
 }
 document.documentElement.dataset.mobileGeometryReady=String(mobile.matches);
 window.dispatchEvent(new Event('platform:type-baselines'));
}
const schedule=()=>{if(!frame)frame=requestAnimationFrame(align);};
new ResizeObserver(schedule).observe(document.body);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
mobile.addEventListener('change',schedule);
window.addEventListener('platform:rendered',schedule);
window.addEventListener('platform:layout',schedule);
document.fonts.ready.then(schedule);
document.fonts.addEventListener('loadingdone',schedule);
// "Up" on an internal page stays on that page; it is not a route to the home.
document.addEventListener('click',event=>{
 const top=event.target.closest('[data-page-top]');
 if(!top)return;
 event.preventDefault();
 window.scrollTo({top:0,behavior:'instant'});
});
schedule();
