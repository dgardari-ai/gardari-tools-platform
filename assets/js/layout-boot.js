/* Stable device mode and authored desktop canvas. Runs before the application. */
(() => {
 'use strict';
 const FIELD=936,GAP=32,MIN=.85,DESKTOP=1440,PHONE_MAX=600;
 function classify(device,override){
  if(override==='phone'||override==='desktop')return override;
  const ua=String(device.ua||''),touch=Number(device.touchPoints)||0;
  const phone=/iPhone|iPod|Windows Phone|Android[^\n]*Mobile/i.test(ua);
  if(phone)return 'phone';
  const tablet=/iPad|Android/i.test(ua)||(/Macintosh|MacIntel/i.test(ua+' '+(device.platform||''))&&touch>1);
  const side=Math.min(Number(device.screenWidth)||Infinity,Number(device.screenHeight)||Infinity);
  if(tablet)return side<768?'phone':'desktop';
  return device.mobile===true?'phone':'desktop';
 }
 function geometry(width,height,mode,browserZoom=1){
  width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
  const scale=mode==='phone'?1:Math.min(1,Math.max(MIN,(width*Math.max(.1,browserZoom)-2*GAP)/FIELD));
  const painted=mode==='phone'?width:Math.max(width,FIELD*scale+2*GAP);
  return {scale,canvasWidth:painted/scale,paintedWidth:painted,visibleWidth:width/scale,
   height:height/scale,queryWidth:mode==='phone'?Math.min(PHONE_MAX,width):DESKTOP,
   phase:mode==='phone'?'phone':painted>width+.1?'clip':scale<.999?'scale':'margins'};
 }
 function media(query,width,authorMode=null){
  const legacy=query.replace(/\((min|max)-width\s*:\s*([\d.]+)(px|em|rem)\s*\)/gi,(_,kind,n,unit)=>{
   const limit=Number(n)*(unit.toLowerCase()==='px'?1:16);
   const legacyTablet=authorMode&&kind.toLowerCase()==='max'&&(limit===1024||limit===1060);
   const on=legacyTablet?authorMode==='desktop':kind.toLowerCase()==='min'?width>=limit:width<=limit;
   return on?'(min-width:0px)':'(max-width:0px)';
  });
  return legacy.replace(/\(\s*width\s*(<=|>=|<|>|=)\s*([\d.]+)(px|em|rem)\s*\)/gi,(_,op,n,unit)=>{
   const v=Number(n)*(unit.toLowerCase()==='px'?1:16),on=op==='<='?width<=v:op==='>='?width>=v:op==='<'?width<v:op==='>'?width>v:width===v;
   return on?'(min-width:0px)':'(max-width:0px)';
  });
 }
 function units(value,state,phone){
  if(/url\s*\(/i.test(value)||/^\s*["']/.test(value))return value;
  return value.replace(/(?<![\w-])(-?(?:\d*\.)?\d+)(dvw|svw|lvw|vw|dvh|svh|lvh|vh)\b/gi,(all,n,u)=>{
   const horizontal=u.toLowerCase().endsWith('vw');
   if(!horizontal&&phone)return all;
   return Number((Number(n)*(horizontal?state.queryWidth:state.height)/100).toFixed(8))+'px';
  });
 }
 const model=Object.freeze({classify,geometry,media,units,FIELD,GAP,MIN,DESKTOP,PHONE_MAX});
 globalThis.PlatformLayoutModel=model;
 if(typeof document==='undefined')return;
 const root=document.documentElement,params=new URLSearchParams(location.search);
 const device={ua:navigator.userAgent,platform:navigator.platform,mobile:navigator.userAgentData?.mobile,
  touchPoints:navigator.maxTouchPoints,screenWidth:screen.width,screenHeight:screen.height};
 const forced=params.get('layout'),override=forced==='phone'||forced==='desktop'?forced:null;
 const automatic=classify(device,override);
 let mode=automatic,state=geometry(innerWidth,innerHeight,mode),pending=0,started=false,disposed=false,dirty=true,key='',sheetKey='',viewportProbe=null;
 const originalDpr=devicePixelRatio||1,mediaRules=new WeakMap(),declarations=new WeakMap(),queries=new Map();
 let resolveReady;
 const failSafe=setTimeout(()=>{if(!disposed&&root.dataset.layoutReady==='pending'){state=geometry(innerWidth,innerHeight,mode,100);root.style.zoom='1';root.style.width=mode==='desktop'?state.canvasWidth+'px':'';root.dataset.layoutReady='fallback';resolveReady(window.PlatformLayout);}},12000);
 const ready=new Promise(resolve=>{resolveReady=resolve;});
 root.dataset.layout=mode;root.dataset.layoutReady='pending';
 class LayoutMedia extends EventTarget{
  constructor(query){super();this.media=query;this.current=this.read();}
  read(){return matchMedia(media(this.media,state.queryWidth)).matches;}
  get matches(){return this.read();}
  update(){const next=this.read();if(next===this.current)return;this.current=next;const e=new Event('change');Object.defineProperty(e,'matches',{value:next});this.dispatchEvent(e);}
  addListener(fn){this.addEventListener('change',fn);}
  removeListener(fn){this.removeEventListener('change',fn);}
 }
 function rect(target){
  if(!target)return undefined;
  const r=target.getBoundingClientRect(),s=state.scale;
  return {x:r.x/s,y:r.y/s,left:r.left/s,top:r.top/s,right:r.right/s,bottom:r.bottom/s,width:r.width/s,height:r.height/s};
 }
 function domMedia(){
  for(const node of document.querySelectorAll('source[data-layout-media]')){const next=media(node.dataset.layoutMedia,state.queryWidth);if(node.getAttribute('media')!==next)node.setAttribute('media',next);}
 }
 const api={ready,model,isPhone:()=>mode==='phone',rect,
  media:query=>{if(!queries.has(query))queries.set(query,new LayoutMedia(query));return queries.get(query);},
  get mode(){return mode;},get scale(){return state.scale;},get viewportWidth(){return state.visibleWidth;},
  get viewportHeight(){return state.height;},get queryWidth(){return state.queryWidth;},get safe(){return state.safe||{top:0,right:0,bottom:0,left:0};},
  toViewport:value=>value*state.scale,toLayout:value=>value/state.scale};
 window.PlatformLayout=api;
 function visit(rules,author=false){
  for(const rule of rules){
   if(rule.media){if(!mediaRules.has(rule))mediaRules.set(rule,rule.media.mediaText);const next=media(mediaRules.get(rule),state.queryWidth,author?mode:null);if(rule.media.mediaText!==next)rule.media.mediaText=next;}
   if(rule.style){
    if(!declarations.has(rule)){
     const values=[];
     for(let i=0;i<rule.style.length;i++){const name=rule.style.item(i),value=rule.style.getPropertyValue(name);if(/(?:vw|vh)\b/i.test(value))values.push([name,value,rule.style.getPropertyPriority(name)]);}
     declarations.set(rule,values);
    }
    for(const [name,value,priority] of declarations.get(rule)){const next=units(value,state,mode==='phone');if(rule.style.getPropertyValue(name)!==next)rule.style.setProperty(name,next,priority);}
   }
   if(rule.cssRules)visit(rule.cssRules,author);
  }
 }
 function editorMode(){
  // Only the existing local editor may use its selected preview viewport.
  if(parent===window)return null;
  try{
   const local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||(location.protocol==='about:'&&/^(localhost|127\.0\.0\.1)$/.test(parent.location.hostname));
   if(!local)return null;
   const own=document.body?.classList.contains('platform-editor-active')||window.__VMG_DESIGN_EDITING__;
   const host=parent.document;
   const known=/Редактор|VMG|ВМГ|Designer/i.test(host.title)&&!!host.querySelector('iframe');
   const selected=host.querySelector('#device')?.value;
   const view=selected==='auto'?automatic:selected&&Number.isFinite(+selected)?(+selected<=700?'phone':'desktop'):(innerWidth<=700?'phone':'desktop');
   return own||known?{mode:view,editing:!!own}:null;
  }catch{return null;}
 }
 function apply(){
  pending=0;if(disposed||!document.body)return;
  const editor=editorMode();mode=editor?.mode||automatic;
  const width=document.documentElement.clientWidth||innerWidth;
  const probeStyle=getComputedStyle(viewportProbe||document.body);
  const safe={top:viewportProbe?parseFloat(probeStyle.paddingTop)||0:0,right:parseFloat(probeStyle.paddingRight)||0,bottom:viewportProbe?parseFloat(probeStyle.paddingBottom)||0:0,left:parseFloat(probeStyle.paddingLeft)||0};
  const visual=window.visualViewport;
  const height=mode==='phone'&&visual&&Math.abs(visual.scale-1)<.01?Math.min(innerHeight,visual.height):innerHeight;
  const supportsZoom=!!window.CSS?.supports?.('zoom','0.85');
  const next=geometry(width-safe.left-safe.right,height,mode,editor?.editing||!supportsZoom?100:(devicePixelRatio||1)/originalDpr);
  next.canvasWidth+=(safe.left+safe.right)/next.scale;next.paintedWidth+=safe.left+safe.right;next.visibleWidth=width/next.scale;
  next.safe=Object.fromEntries(Object.entries(safe).map(([k,v])=>[k,v/next.scale]));
  const signature=[mode,width,height,next.scale,next.queryWidth,...Object.values(safe),editor?.editing?'editor':editor?'preview':'device'].join('|');
  if(signature===key&&!dirty)return;
  key=signature;dirty=false;state=next;
  root.dataset.layout=mode;root.dataset.layoutPhase=state.phase;root.dataset.layoutContext=editor?(editor.editing?'editor':'preview'):'device';
  root.style.zoom=String(state.scale);
  root.style.width=mode==='desktop'?state.canvasWidth+'px':'';
  root.style.setProperty('--platform-layout-scale',state.scale);
  root.style.setProperty('--platform-phone-width',state.queryWidth+'px');
  root.style.setProperty('--platform-layout-gutter',GAP/state.scale+'px');
  root.style.setProperty('--platform-visible-width',state.visibleWidth+'px');
  root.style.setProperty('--platform-visible-height',state.height+'px');
  for(const [side,value] of Object.entries(state.safe))root.style.setProperty('--platform-layout-safe-'+side,value+'px');
  for(const sheet of document.styleSheets){try{visit(sheet.cssRules,!!sheet.ownerNode?.matches?.('style[data-vmg-runtime="styles"],#author-manual-styles'));}catch{/* A foreign sheet cannot be read; native conditions remain in effect. */}}
  domMedia();
  queries.forEach(query=>query.update());
  clearTimeout(failSafe);root.dataset.layoutReady='true';
  resolveReady(api);
  window.dispatchEvent(new CustomEvent('platform:layout',{detail:{mode,scale:state.scale,phase:state.phase}}));
 }
 function schedule(force=false){if(disposed)return;if(force)dirty=true;if(started&&!pending)pending=requestAnimationFrame(apply);}
 function sheetsChanged(){
  // Setting the same style text still replaces its CSSRule objects. Reapply
  // mode gates after that replacement; CSSOM writes do not mutate style text.
  schedule(true);
 }
 function start(){
  if(started)return;started=true;
  const probe=document.createElement('i');probe.setAttribute('aria-hidden','true');probe.setAttribute('data-vmg-editor-ui','');
  probe.style.cssText='position:fixed;inset:0;visibility:hidden;pointer-events:none;contain:strict;z-index:-1;padding:var(--platform-safe-top,0px) var(--platform-safe-right,0px) var(--platform-safe-bottom,0px) var(--platform-safe-left,0px)';document.body.append(probe);viewportProbe=probe;
  apply();
  new ResizeObserver(()=>schedule()).observe(probe);
  sheetKey=[...document.head.querySelectorAll('style,link[rel="stylesheet"]')].map(e=>e.tagName==='STYLE'?e.textContent:e.href+'|'+e.media).join('\u0000');
  new MutationObserver(sheetsChanged).observe(document.head,{childList:true,subtree:true,characterData:true});
  new MutationObserver(()=>schedule()).observe(document.body,{attributes:true,attributeFilter:['class']});
 }
 addEventListener('resize',()=>schedule());
 addEventListener('orientationchange',()=>schedule());
 window.visualViewport?.addEventListener('resize',()=>schedule());
 document.addEventListener('load',e=>{if(e.target?.tagName==='LINK')schedule(true);},true);
 addEventListener('platform:editor-ready',()=>schedule(true));
 addEventListener('platform:rendered',domMedia);
 addEventListener('vmg:design-rendered',()=>schedule());
 document.addEventListener('click',event=>{
  if(!override)return;
  const a=event.target.closest?.('a[href]'),href=a?.getAttribute('href');
  if(!href||href.startsWith('#'))return;
  try{const u=new URL(href,location.href);if(u.origin===location.origin&&(/\/(?:index|privacy)\.html$/.test(u.pathname)||u.pathname.endsWith('/'))){u.searchParams.set('layout',override);a.href=u.pathname+u.search+u.hash;}}catch{}
 },true);
 addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(pending);clearTimeout(failSafe);});
 addEventListener('pageshow',()=>{if(disposed){disposed=false;schedule(true);}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
