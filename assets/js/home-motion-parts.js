import {layoutRect} from './layout.js?v=20261117-preview20';
/* Choreography adapted from HOMO COGITANS 3.0.1 home-motion,
   home-wordmark-motion and home-frame-motion. The accepted Platform assets,
   native text and contour remain the final, unmodified originals. */
import {HEADLINE_PATHS} from './home-headline-paths.js?v=20261117-preview20';

const NS='http://www.w3.org/2000/svg';
export const clamp=value=>Math.max(0,Math.min(1,value));
export function bezier(value,x1=.17,y1=.9,x2=.24,y2=1) {
 const p=clamp(value);let t=p;
 for(let i=0;i<6;i++) {
  const u=1-t,x=3*u*u*t*x1+3*u*t*t*x2+t*t*t;
  const derivative=3*u*u*x1+6*u*t*(x2-x1)+3*t*t*(1-x2);
  if(derivative<.0001)break;
  t=clamp(t-(x-p)/derivative);
 }
 const u=1-t;return 3*u*u*t*y1+3*u*t*t*y2+t*t*t;
}
export function svgNode(name,attributes={}) {
 const node=document.createElementNS(NS,name);
 Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,String(value)));
 return node;
}
export function propertySnapshot(node,property) {
 const value=node.style.getPropertyValue(property),priority=node.style.getPropertyPriority(property);
 return ()=>{if(value)node.style.setProperty(property,value,priority);else node.style.removeProperty(property);};
}

export async function createArtwork(stage,image,{signal}) {
 const response=await fetch(image.currentSrc||image.src,{signal});
 if(!response.ok)throw Error('Artwork resource is unavailable');
 const source=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
 if(source.querySelector('parsererror')||signal.aborted)throw Error('Artwork could not be prepared');
 const root=document.importNode(source.documentElement,true);
 const art=layoutRect(image),host=layoutRect(stage);
 if(!art.width||!art.height)throw Error('Artwork has no visible size');
 root.removeAttribute('width');root.removeAttribute('height');
 root.setAttribute('aria-hidden','true');root.setAttribute('focusable','false');
 root.classList.add('home-motion-art');
 Object.assign(root.style,{left:`${art.left-host.left}px`,top:`${art.top-host.top}px`,width:`${art.width}px`,height:`${art.height}px`,visibility:'hidden'});
 root.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
 stage.append(root);
 const pieces=[];
 let seed=19041;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 try {
  for(const path of root.querySelectorAll('path')) {
   const box=path.getBBox(),matrix=path.getScreenCTM();
   if(!matrix||!box.width||!box.height)continue;
   const wrapper=svgNode('g');path.before(wrapper);wrapper.append(path);
   const inverse=matrix.inverse(),angle=random()*Math.PI*2;
   const distance=(35+random()*56)*Math.min(1,art.width/236.535);
   const screenX=Math.cos(angle)*distance,screenY=Math.sin(angle)*distance*.75;
   pieces.push({wrapper,cx:box.x+box.width/2,cy:box.y+box.height/2,
    dx:inverse.a*screenX+inverse.c*screenY,dy:inverse.b*screenX+inverse.d*screenY,
    rotation:(random()-.5)*18,scale:.84+random()*.25,delay:random()*270});
  }
  if(!pieces.length)throw Error('Artwork has no colour pieces');
 }catch(error){root.remove();throw error;}
 const restore=propertySnapshot(image,'opacity');
 const duration=2240;let finished=false;
 function finish(){if(finished)return;finished=true;restore();root.remove();}
 function render(time) {
  if(finished)return;
  for(const piece of pieces) {
   const p=clamp((time-piece.delay)/(duration-piece.delay)),left=1-bezier(p);
   const scale=1+(piece.scale-1)*left;
   piece.wrapper.setAttribute('transform',`translate(${piece.dx*left} ${piece.dy*left}) translate(${piece.cx} ${piece.cy}) rotate(${piece.rotation*left}) scale(${scale}) translate(${-piece.cx} ${-piece.cy})`);
   piece.wrapper.style.opacity=String(clamp((time-piece.delay)/180));
  }
  if(time>=duration)finish();
 }
 image.style.opacity='0';render(0);root.style.removeProperty('visibility');
 return {duration,render,finish,count:pieces.length};
}

let serial=0;
export function createHeadline(stage,heading) {
 const box=layoutRect(heading),host=layoutRect(stage);
 const root=svgNode('svg',{viewBox:`0 0 ${box.width} ${box.height}`,'aria-hidden':'true',focusable:'false'});
 root.classList.add('home-motion-letters');
 Object.assign(root.style,{left:`${box.left-host.left}px`,top:`${box.top-host.top}px`,width:`${box.width}px`,height:`${box.height}px`,visibility:'hidden'});
 const defs=svgNode('defs'),fills=svgNode('g'),outlines=svgNode('g');root.append(defs,fills,outlines);
 const letters=[],prefix=`platform-headline-${++serial}`;
 const measure=document.createElement('canvas').getContext('2d');
 const restore=propertySnapshot(heading,'opacity');let finished=false;
 stage.append(root);
 try {
  for(const line of heading.children) {
   if(getComputedStyle(line).display==='none')continue;
   const marker=document.createElement('i');
   Object.assign(marker.style,{display:'inline-block',width:'0',height:'0',padding:'0',margin:'0',border:'0',verticalAlign:'baseline'});
   marker.setAttribute('aria-hidden','true');line.append(marker);
   const baseline=layoutRect(marker).top-box.top;marker.remove();
   const walker=document.createTreeWalker(line,NodeFilter.SHOW_TEXT);
   let textNode;
   while((textNode=walker.nextNode())) {
    let offset=0;
    for(const char of textNode.textContent) {
     const begin=offset;offset+=char.length;if(!char.trim())continue;
     const range=document.createRange();range.setStart(textNode,begin);range.setEnd(textNode,offset);
     const rect=layoutRect(range),style=getComputedStyle(textNode.parentElement);
     const size=parseFloat(style.fontSize),scale=size/HEADLINE_PATHS.units;
     const glyph=HEADLINE_PATHS.glyphs[char];
     if(measure)measure.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
     const width=measure?.measureText(char).width;
     const exact=glyph&&width!==undefined&&Math.abs(width-glyph.advance*scale)<.06;
     const fill=exact?svgNode('path',{d:glyph.d,transform:`translate(${rect.left-box.left} ${baseline}) scale(${scale})`}):svgNode('text',{x:rect.left-box.left,y:baseline});
     if(!exact){fill.textContent=char;fill.style.font=style.font;fill.style.letterSpacing='0';}
     fill.style.fill=style.color;
     const outline=fill.cloneNode(true);outline.style.fill='none';
     outline.style.stroke=style.color;outline.style.strokeWidth=String(exact ? .55/scale : .55);
     outline.style.strokeLinejoin='round';
     const dot=char==='.'&&!!textNode.parentElement.closest('b[aria-hidden="true"]');
     const group=svgNode('g'),mask=svgNode('mask',{id:`${prefix}-${letters.length}`,maskUnits:'userSpaceOnUse',x:-20,y:-30,width:box.width+40,height:box.height+60});
     if(dot)group.classList.add('home-motion-dot');
     const surface=svgNode('path',{fill:'white'});mask.append(surface);defs.append(mask);
     group.setAttribute('mask',`url(#${prefix}-${letters.length})`);group.append(fill);fills.append(group);outlines.append(outline);
     const bounds=fill.getBBox();
     // Transformed font paths have a 100-unit glyph coordinate system.
     const top=exact?baseline+bounds.y*scale:bounds.y;
     const bottom=exact?baseline+(bounds.y+bounds.height)*scale:bounds.y+bounds.height;
     const left=rect.left-box.left-3,right=rect.right-box.left+3;
     const length=exact?outline.getTotalLength():size*6;
     outline.style.strokeDasharray=`${length} ${length}`;outline.style.strokeDashoffset=String(length);outline.style.opacity='0';
     letters.push({outline,group,surface,length,left,right,top:top-2,bottom:bottom+2,index:letters.length,dot});
    }
   }
  }
  if(!letters.length)throw Error('Headline could not be measured');
 }catch(error){root.remove();throw error;}
 const strokeEnd=580+(letters.length-1)*18,fillStart=strokeEnd-260;
 const duration=fillStart+(letters.length-1)*8+580;
 const dotFade=100,dots=letters.filter(letter=>letter.dot);
 // The ellipsis is the hand-off to both travelling sides of the frame.
 // Return its real reveal milestone, independently of the remaining text fill.
 const dotsReadyAt=dots.length===3?Math.max(...dots.map(letter=>letter.index*18+dotFade)):duration;
 function finish(){if(finished)return;finished=true;restore();root.remove();}
 function render(time) {
  if(finished)return;
  for(const letter of letters) {
   if(letter.dot) {
    letter.group.removeAttribute('mask');
    letter.group.style.opacity=String(bezier((time-letter.index*18)/dotFade,.16,1,.3,1));
    letter.outline.style.opacity='0';
    continue;
   }
   const drawn=bezier((time-letter.index*18)/580,.55,.06,.35,1);
   const filled=bezier((time-fillStart-letter.index*8)/580,.3,0,.2,1);
   letter.outline.style.opacity=drawn>0&&filled<1?'1':'0';
   letter.outline.style.strokeDashoffset=String(letter.length*(1-drawn));
   if(filled>=1){letter.group.removeAttribute('mask');continue;}
   const height=letter.bottom-letter.top,level=letter.bottom-height*filled;
   const amplitude=height*.055*Math.sin(Math.PI*filled);
   let d=`M${letter.left} ${letter.bottom}L${letter.left} ${level}`;
   for(let i=0;i<=10;i++) {
    const x=letter.left+(letter.right-letter.left)*i/10;
    const wave=amplitude*Math.sin((x-letter.left)/height*9+time*.007+letter.index);
    d+=`L${x} ${level+wave}`;
   }
   letter.surface.setAttribute('d',`${d}L${letter.right} ${letter.bottom}Z`);
  }
  if(time>=duration)finish();
 }
 heading.style.opacity='0';render(0);root.style.removeProperty('visibility');
 return {duration,dotsReadyAt,render,finish,count:letters.length};
}

export function createFrame(stage) {
 const original=stage.querySelector('.hero-outline'),path=original?.querySelector(':scope > path');
 const origin=layoutRect(stage),originalBox=layoutRect(original);
 const desktop=!!(path&&originalBox.width>0&&getComputedStyle(original).display!=='none');
 const restores=[],targets=[],routes=[];let finished=false;
 let width=936,height=425.598,radius=19.56,scale=desktop?originalBox.width/936:1;
 let leftStart=95.931,rightStart=468.002,container;
 if(desktop) {
  const defs=svgNode('defs'),id=`platform-frame-${++serial}`;
  const mask=svgNode('mask',{id,maskUnits:'userSpaceOnUse',x:-8,y:-8,width:952,height:442});
  mask.style.maskType='luminance';defs.append(mask);original.append(defs);
  const before=path.getAttribute('mask');path.setAttribute('mask',`url(#${id})`);
  restores.push(()=>{if(before===null)path.removeAttribute('mask');else path.setAttribute('mask',before);defs.remove();});
  container=mask;
 }else {
  width=origin.width;height=origin.height;leftStart=rightStart=width/2;
  const border=parseFloat(getComputedStyle(stage).borderLeftWidth)||1.5;
  radius=Math.max(0,19.56-border/2);
  container=svgNode('svg',{viewBox:`0 0 ${width} ${height}`,'aria-hidden':'true',focusable:'false'});
  container.classList.add('home-motion-phone-frame');
  Object.assign(container.style,{left:`${-border}px`,top:'0px',width:`${width}px`,height:`${height}px`});
  restores.push(propertySnapshot(stage,'border-color'));stage.style.setProperty('border-color','transparent');
  stage.prepend(container);restores.push(()=>container.remove());
 }
 const inset=desktop?0:.75,left=inset,right=width-inset,top=inset,bottom=height-inset;
 const middle=width/2;
 const leftEnd=desktop?448.194:radius;
 const rightEnd=desktop?middle:width-radius;
 const routeData=[
  `M${leftStart} ${bottom}H${left+radius}A${radius} ${radius} 0 0 1 ${left} ${bottom-radius}V${top+radius}A${radius} ${radius} 0 0 1 ${left+radius} ${top}H${leftEnd}`,
  `M${rightStart} ${bottom}H${right-radius}A${radius} ${radius} 0 0 0 ${right} ${bottom-radius}V${top+radius}A${radius} ${radius} 0 0 0 ${right-radius} ${top}H${rightEnd}`
 ];
 for(const d of routeData) {
  const node=svgNode('path',{d,fill:'none',stroke:desktop?'white':'currentColor','stroke-width':desktop?5:1.5,'stroke-linecap':'butt'});
  container.append(node);const length=node.getTotalLength();
  node.style.strokeDasharray=`${length} ${length}`;node.style.strokeDashoffset=String(length);routes.push({node,length});
 }
 const speed=.7,quarter=Math.PI*radius/2;
 const rightVertical=right-radius-rightStart+quarter,leftVertical=leftStart-left-radius+quarter;
 const vertical=bottom-top-2*radius,rightTop=rightVertical+vertical+quarter;
 const local=node=>{
  const box=layoutRect(node);return {left:(box.left-origin.left)/scale,right:(box.right-origin.left)/scale,bottom:(box.bottom-origin.top)/scale};
 };
 const upRight=y=>rightVertical+clamp((bottom-radius-y)/vertical)*vertical;
 function add(node,distance,direction='right',duration=220) {
  if(!node||!node.getClientRects().length)return;
  // A clipped control loses its hit area. Clip its visual children instead,
  // keeping the actual button/link available from the first pointer event.
  const clips=node.matches('a,button')?[...node.children]:[node];
  restores.push(propertySnapshot(node,'opacity'),...clips.map(child=>propertySnapshot(child,'clip-path')));
  node.style.opacity='0';
  targets.push({node,clips,at:Math.max(0,distance)*scale/speed,direction,duration});
 }
 stage.querySelectorAll('.prototype-tab').forEach(node=>{
  const box=local(node);add(node,desktop?(box.left+box.right)/2-rightStart:0,'left');
 });
 for(const selector of ['.hero-catalog-cta','.home-hero-description']) {
  const node=stage.querySelector(selector);if(node)add(node,upRight(local(node).bottom));
 }
 const wordmark=stage.querySelector('.hero-wordmark');
 if(wordmark){const box=local(wordmark);add(wordmark,rightTop+Math.max(0,right-radius-box.right),'right',Math.max(220,(box.right-box.left)*scale/speed));}
 const symbol=stage.querySelector('.hero-brand-symbol');
 if(symbol)add(symbol,desktop?routes[0].length:leftVertical+vertical,'left');
 const duration=Math.max(...routes.map(route=>route.length*scale/speed),...targets.map(target=>target.at+target.duration));
 function finish(){if(finished)return;finished=true;restores.forEach(restore=>restore());}
 function render(time) {
  if(finished)return;
  const distance=Math.max(0,time)*speed/scale;
  routes.forEach(({node,length})=>{node.style.strokeDashoffset=String(Math.max(0,length-distance));});
  targets.forEach(({node,clips,at,direction,duration})=>{
   const progress=bezier((time-at)/duration,.16,1,.3,1),inset=`${100*(1-progress)}%`;
   node.style.opacity=String(progress);
   clips.forEach(child=>{child.style.clipPath=direction==='right'?`inset(0 0 0 ${inset})`:`inset(0 ${inset} 0 0)`;});
  });
  if(time>=duration)finish();
 }
 render(0);return {duration,render,finish};
}
