/* Gallery header entrance (gallery-header.js) and native text reveal
   (header-quote.js). Timing/keyframes retain the donor's original values.
   Only the temporary visual layer moves; native controls keep their geometry. */
(() => {
 'use strict';
 const root=document.documentElement,motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const events=new AbortController(),options={signal:events.signal};
 const ease='cubic-bezier(.16,1,.3,1)',animations=[];
 let header=null,form=null,shell=null,stopped=false,safety=null;
 let textInput=null,fullPlaceholder='',typedPlaceholder='',textFrame=null,resolveText=null;
 const finish=()=>{
  if(stopped)return;stopped=true;
  clearTimeout(safety);events.abort();
  if(textFrame!==null)cancelAnimationFrame(textFrame);
  if(textInput&&textInput.placeholder===typedPlaceholder)textInput.placeholder=fullPlaceholder;
  resolveText?.();resolveText=null;
  animations.forEach(animation=>animation.cancel());shell?.remove();
  form?.classList.remove('header-search-entering');root.classList.remove('header-entry-pending');
  header=header||document.getElementById('top');
  if(header)header.dataset.headerEntrance=motion.matches?'still':'complete';
  if(header)header.dataset.headerTextEntrance='complete';
 };
 const interrupt=event=>{if(event.target.closest?.('#top'))finish();};
 document.addEventListener('pointerdown',interrupt,{capture:true,...options});
 document.addEventListener('focusin',interrupt,options);
 window.addEventListener('resize',finish,options);
 window.addEventListener('hashchange',finish,options);
 window.addEventListener('scroll',finish,{passive:true,...options});
 window.addEventListener('pagehide',finish,options);
 motion.addEventListener('change',()=>{if(motion.matches)finish();},options);
 if(!motion.matches)root.classList.add('header-entry-pending');
 safety=setTimeout(finish,3000);
 async function init() {
  header=document.getElementById('top');form=header?.querySelector('.header-search');
  if(stopped)return;
  if(!form||motion.matches||typeof form.animate!=='function'){finish();return;}
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(stopped)return;
  const brand=form.querySelector('.brand'),tabs=[...header.querySelectorAll('.section-tab')];
  const input=form.querySelector('input'),submit=form.querySelector('.search-submit');
  if(!brand||!input||!submit||!tabs.length){finish();return;}
  // Gallery removes the pending class BEFORE sampling its native border.
  // Sampling while pending captured transparent and made the whole reveal invisible.
  root.classList.remove('header-entry-pending');
  const style=getComputedStyle(form),width=form.getBoundingClientRect().width,height=form.offsetHeight;
  shell=document.createElement('span');shell.className='header-entrance-shell';shell.setAttribute('aria-hidden','true');
  Object.assign(shell.style,{color:style.borderTopColor,backgroundColor:'transparent'});
  const h=form.getBoundingClientRect().height,join=h/2,stroke=parseFloat(style.borderTopWidth)||1;
  const radius=(h-stroke)/2,edge=stroke/2,length=Math.max(0,width-h);
  const arc=(name,path,left)=>{
   const box=document.createElement('span');box.className=name;
   Object.assign(box.style,{left:left+'px',width:join+'px',height:h+'px'});
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('viewBox',`0 0 ${join} ${h}`);
   svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');
   const shape=document.createElementNS('http://www.w3.org/2000/svg','path');
   shape.setAttribute('d',path);shape.setAttribute('fill',style.backgroundColor);
   shape.setAttribute('stroke','currentColor');shape.setAttribute('stroke-width',String(stroke));
   shape.setAttribute('vector-effect','non-scaling-stroke');svg.append(shape);box.append(svg);return box;
  };
  const left=arc('header-pill-left',`M${join} ${edge}A${radius} ${radius} 0 0 0 ${join} ${h-edge}`,0);
  const right=arc('header-pill-right',`M0 ${edge}A${radius} ${radius} 0 0 1 0 ${h-edge}`,join);
  const straight=document.createElement('span');straight.className='header-pill-straight';
  Object.assign(straight.style,{left:join+'px',width:length+'px',borderBlockWidth:stroke+'px',backgroundColor:style.backgroundColor});
  shell.append(left,straight,right);
  form.appendChild(shell);form.classList.add('header-search-entering');header.dataset.headerEntrance='entering';
  const animationStart=document.timeline.currentTime;
  function animate(element,frames,duration,delay=0,curve=ease) {
   if(!element)return;
   const animation=element.animate(frames,{duration,delay,easing:curve,fill:'both'});
   if(animationStart!==null)animation.startTime=animationStart;
   animations.push(animation);return animation;
  }
  const discFrames=[
   {transform:'scale(.015)',opacity:1,offset:0,easing:'cubic-bezier(.3,0,.35,1)'},
   {transform:'scale(1.3)',opacity:1,offset:.65,easing:'ease-in-out'},
   {transform:'scale(1)',opacity:1,offset:1}
  ];
  animate(brand,discFrames,800,0,'ease-in-out');
  // Exact Gallery widths, offsets and curve. Translating the right semicircle
  // and extending the straight edges gives the same outline without per-frame
  // layout work competing with the sculpture's canvas.
  const shellFrames=[{width:height,opacity:0,offset:0},
   {width:height+(form.clientWidth-height)*.08,opacity:1,offset:.12},
   {width,opacity:1,offset:1}];
  animate(shell,shellFrames.map(({opacity,offset})=>({opacity,offset})),440,456);
  animate(straight,shellFrames.map(({width:w,offset})=>({transform:`scaleX(${length?(w-h)/length:0})`,offset})),440,456);
  animate(right,shellFrames.map(({width:w,offset})=>({transform:`translateX(${w-h}px)`,offset})),440,456);
  tabs.forEach((tab,index)=>animate(tab,[
   {opacity:0,transform:'perspective(650px) rotateX(-86deg)'},
   {opacity:1,transform:'perspective(650px) rotateX(0deg)'}
  ],420,index*90));
  // The Gallery releases its text after this exact clock, then types it with
  // a 140ms pause and one grapheme every 45ms. Keep native input positioning.
  const textDone=new Promise(resolve=>{resolveText=resolve;});
  const clock=animate(input,[{opacity:0},{opacity:0}],956);
  header.dataset.headerTextEntrance='waiting-menu';
  clock.finished.then(()=>{
   if(stopped)return;
   textInput=input;fullPlaceholder=input.placeholder;typedPlaceholder='';input.placeholder='';
   const letters=typeof Intl.Segmenter==='function'
    ?Array.from(new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(fullPlaceholder),x=>x.segment)
    :Array.from(fullPlaceholder);
   clock.cancel();header.dataset.headerTextEntrance='typing';
   clearTimeout(safety);safety=setTimeout(finish,2000+140+letters.length*45);
   let start=null,visible=0;
   const step=now=>{
    textFrame=null;if(stopped)return;
    if(start===null)start=now;
    const count=now-start<140?0:Math.min(letters.length,Math.floor((now-start-140)/45)+1);
    if(count>visible){typedPlaceholder=letters.slice(0,count).join('');input.placeholder=typedPlaceholder;visible=count;}
    if(visible===letters.length){header.dataset.headerTextEntrance='complete';resolveText?.();resolveText=null;return;}
    textFrame=requestAnimationFrame(step);
   };
   textFrame=requestAnimationFrame(step);
  }).catch(()=>{});
  animate(submit,[{opacity:0},{opacity:1}],180,956);
  clearTimeout(safety);safety=setTimeout(finish,4000);
  await Promise.all(animations.map(animation=>animation.finished.catch(()=>{})));
  if(!stopped)header.dataset.headerEntrance='complete';
  await textDone;
  finish();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(finish),{once:true,...options});
 else init().catch(finish);
})();
