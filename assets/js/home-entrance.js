/* Paper-fold behavior adapted from React Bits FoldText (David Haz).
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import {bindHeroParticles} from './home-particles.js';
const active=new WeakMap();
const titleDelay=100,pieceDuration=420,stagger=20;
const clamp01=value=>Math.max(0,Math.min(1,value));

function foldTitle(heading,onComplete) {
 const box=heading.getBoundingClientRect(),copy=heading.parentElement;
 const parent=copy.getBoundingClientRect(),style=getComputedStyle(heading);
 const layer=document.createElement('span');layer.className='home-title-fold';
 layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{left:(box.left-parent.left)+'px',top:(box.top-parent.top)+'px',
  width:box.width+'px',height:box.height+'px',font:style.font,
  letterSpacing:style.letterSpacing,textTransform:style.textTransform,color:style.color});
 const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),glyphs=[];
 let textNode,index=0;
 while((textNode=walker.nextNode())) {
  const text=textNode.textContent;
  const chars=typeof Intl.Segmenter==='function'
   ?Array.from(new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(text),x=>({text:x.segment,offset:x.index}))
   :Array.from(text).map((text,i,all)=>({text,offset:all.slice(0,i).join('').length}));
  for(const glyph of chars) {
   const order=index++;
   if(!glyph.text.trim())continue;
   const range=document.createRange();range.setStart(textNode,glyph.offset);range.setEnd(textNode,glyph.offset+glyph.text.length);
   const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;
   const segment=document.createElement('span'),piece=document.createElement('span');
   segment.className='home-fold-segment';piece.className='home-fold-piece';
   Object.assign(segment.style,{left:(r.left-box.left)+'px',top:(r.top-box.top)+'px',width:r.width+'px',height:r.height+'px'});
   piece.style.lineHeight=r.height+'px';piece.textContent=glyph.text;piece.dataset.foldText=glyph.text;
   piece.style.transform='rotateX(-92deg)';piece.style.opacity='0';
   segment.appendChild(piece);layer.appendChild(segment);glyphs.push({node:piece,order});
  }
 }
 let resolveDone,frame=null,finished=false,observer=null,mutation=null;
 const done=new Promise(resolve=>{resolveDone=resolve;});
 const finish=()=>{
  if(finished)return;finished=true;
  if(frame!==null)cancelAnimationFrame(frame);
  observer?.disconnect();mutation?.disconnect();
  onComplete();layer.remove();resolveDone();
 };
 copy.appendChild(layer);
 const started=performance.now();
 const draw=time=>{
  if(!heading.isConnected){finish();return;}
  let moving=false;
  for(const glyph of glyphs) {
   const t=clamp01((time-started-glyph.order*stagger)/pieceDuration);
   const progress=1-Math.pow(1-t,4);
   glyph.node.style.transform=`rotateX(${-92*(1-progress)}deg)`;
   glyph.node.style.opacity=String(progress);
   glyph.node.style.setProperty('--heading-crease',String(.55*(1-progress)));
   if(t<1)moving=true;
  }
  if(moving)frame=requestAnimationFrame(draw);else finish();
 };
 if(typeof ResizeObserver!=='undefined') {
  observer=new ResizeObserver(()=>{
   const r=heading.getBoundingClientRect();
   if(Math.abs(r.width-box.width)>.5||Math.abs(r.height-box.height)>.5)finish();
  });observer.observe(heading);
 }
 mutation=new MutationObserver(finish);mutation.observe(heading,{childList:true,characterData:true,subtree:true});
 if(glyphs.length)frame=requestAnimationFrame(draw);else finish();
 return {done,cancel:finish};
}

export function bindHomeEntrance(main) {
 active.get(main)?.();
 const art=main?.querySelector('.home-art'),heading=main?.querySelector('#home-title');
 if(!art||!heading)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches){bindHeroParticles(art);main.dataset.homeEntry='ready';return;}
 const paragraphs=[...main.querySelectorAll('.home-copy > p')];
 const lower=[...main.querySelectorAll(':scope > section:not(.home-hero)')];
 const footer=document.getElementById('site-footer');
 const blocked=[...lower,...(footer?[footer]:[])].map(node=>({node,inert:node.hasAttribute('inert')}));
 const release=()=>blocked.forEach(({node,inert})=>{if(inert)node.setAttribute('inert','');else node.removeAttribute('inert');});
 const events=new AbortController(),options={signal:events.signal},animations=[];
 let disposed=false,started=false,titleTimer=null,loadTimer=null,titleMotion=null,cancelArt=()=>{},resolveArt;
 const artDone=new Promise(resolve=>{resolveArt=resolve;});
 const classes=['home-title-hidden','home-description-hidden','home-lower-hidden'];
 const finish=()=>{
  if(disposed)return;disposed=true;
  clearTimeout(titleTimer);clearTimeout(loadTimer);events.abort();
  cancelArt('cancelled');titleMotion?.cancel();
  animations.forEach(a=>a.cancel());
  main.classList.remove(...classes);footer?.classList.remove('home-entry-footer-hidden');
  release();
  if(active.get(main)===finish)active.delete(main);
  if(main.dataset.view==='about')main.dataset.homeEntry='ready';else delete main.dataset.homeEntry;
 };
 const alive=()=>!disposed&&art.isConnected&&active.get(main)===finish;
 const fade=async(nodes,hiddenClass,ms,distance)=>{
  const current=[];
  for(const node of nodes)if(typeof node.animate==='function') {
   const animation=node.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],
    {duration:ms,easing:'cubic-bezier(.2,.75,.15,1)',fill:'both'});
   animations.push(animation);current.push(animation);
  }
  if(hiddenClass)main.classList.remove(hiddenClass);
  if(nodes.includes(footer))footer?.classList.remove('home-entry-footer-hidden');
  await Promise.all(current.map(a=>a.finished.catch(()=>{})));
  if(alive())current.forEach(a=>a.cancel());
 };
 const reveal=async()=>{
  if(!alive())return;
  main.dataset.homeEntry='description';
  await fade(paragraphs,'home-description-hidden',220,4);
  if(!alive())return;
  main.dataset.homeEntry='sections';
  await fade([...lower,...(footer?[footer]:[])],'home-lower-hidden',280,6);
  if(alive()){release();main.dataset.homeEntry='content-ready';}
 };
 active.set(main,finish);main.classList.add(...classes);main.dataset.homeEntry='waiting';
 footer?.classList.add('home-entry-footer-hidden');blocked.forEach(({node})=>{node.setAttribute('inert','');});
 window.addEventListener('hashchange',finish,{once:true,...options});
 window.addEventListener('platform:rendered',()=>{if(!art.isConnected)finish();},options);
 window.addEventListener('resize',finish,options);
 motion.addEventListener('change',()=>{if(motion.matches)finish();},options);
 loadTimer=setTimeout(finish,3500);
 // The app applies the saved author text/styles synchronously after renderHome.
 queueMicrotask(()=>{
  if(!alive())return;
  try {
   cancelArt=bindHeroParticles(art,{
    onStart:()=>{
     if(!alive())return;
     started=true;clearTimeout(loadTimer);main.dataset.homeEntry='art';
     titleTimer=setTimeout(()=>{
      if(!alive())return;
      try {
       main.dataset.homeEntry='headline';
       titleMotion=foldTitle(heading,()=>{if(alive())main.classList.remove('home-title-hidden');});
       // Reveal content after the faster title. Let the photo finish independently.
       Promise.all([titleMotion.done.then(reveal),artDone]).then(()=>{if(alive())finish();}).catch(finish);
      }catch{finish();}
     },titleDelay);
    },
    onFinish:reason=>{resolveArt();if(!started||reason!=='complete')finish();}
   });
  }catch{finish();}
 });
 return finish;
}
