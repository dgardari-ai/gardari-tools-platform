// Align the visible capital body with the centre of the capsule, rather than
// relying on a font's asymmetric line box. No layout or content is replaced.
const header=document.querySelector('.section-header');
const title=header?.querySelector('.section-page-title');
const name=header?.querySelector('.header-page-name');
const text=header?.querySelector('#section-page-name');
const baseline=header?.querySelector('.header-title-baseline');
if(header&&title&&name&&text&&baseline){
 const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
 let frame=0;
 const measure=()=>{
  frame=0;
  if(getComputedStyle(header).display==='none'){header.dataset.geometryReady='true';return;}
  const style=getComputedStyle(name),size=Number.parseFloat(style.fontSize),leading=Number.parseFloat(style.lineHeight)||size;
  context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.textBaseline='alphabetic';
  const ink=context.measureText(text.textContent.trim().toUpperCase());
  const lines=Math.max(1,Math.round(name.getBoundingClientRect().height/leading));
  const base=baseline.getBoundingClientRect().top;
  const centre=base-(lines-1)*leading/2+(ink.actualBoundingBoxDescent-ink.actualBoundingBoxAscent)/2;
  const box=title.getBoundingClientRect();
  const previous=Number.parseFloat(name.style.getPropertyValue('--section-header-name-shift'))||0;
  const next=Math.round((box.y+box.height/2-centre+previous)*64)/64+'px';
  if(name.style.getPropertyValue('--section-header-name-shift')!==next)name.style.setProperty('--section-header-name-shift',next);
  header.dataset.geometryReady='true';
 };
 const schedule=()=>{header.dataset.geometryReady='false';if(!frame)frame=requestAnimationFrame(measure);};
 new ResizeObserver(schedule).observe(header.querySelector('.header-frame'));
 new MutationObserver(schedule).observe(text,{childList:true,characterData:true,subtree:true});
 window.addEventListener('platform:rendered',schedule);
 document.fonts.ready.then(schedule);
 document.fonts.addEventListener('loadingdone',schedule);
 schedule();
}
