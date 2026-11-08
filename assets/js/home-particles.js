// x0 supplies the scattered origins and easing. Each particle is a piece of
// the original image and grows into its exact tile. No full-photo crossfade.
let played=false;
const duration=2.24;
const clamp01=value=>Math.max(0,Math.min(1,value));
const smooth01=value=>{const t=clamp01(value);return t*t*(3-2*t);};

function bezierEase(value,x1=.17,y1=.9,x2=.24,y2=1) {
 const p=clamp01(value);let t=p;
 for(let i=0;i<5;i++) {
  const inv=1-t,x=3*inv*inv*t*x1+3*inv*t*t*x2+t*t*t;
  const derivative=3*inv*inv*x1+6*inv*t*(x2-x1)+3*t*t*(1-x2);
  if(derivative<.0001)break;
  t=clamp01(t-(x-p)/derivative);
 }
 const inv=1-t;return 3*inv*inv*t*y1+3*inv*t*t*y2+t*t*t;
}

export function artworkPoints({data,width,height},random=Math.random) {
 if(!width||!height||!data||data.length<width*height*4)return [];
 const step=Math.max(8,Math.ceil(Math.sqrt(width*height/1000))),points=[];
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step) {
  const w=Math.min(step,width-x),h=Math.min(step,height-y);
  let alpha=0,red=0,green=0,blue=0;
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++) {
   const k=(yy*width+xx)*4,a=data[k+3];
   alpha+=a;red+=data[k]*a;green+=data[k+1]*a;blue+=data[k+2]*a;
  }
  // Include every visible pixel, even white highlights and subpixel edges.
  if(!alpha)continue;
  const tx=x+w/2,ty=y+h/2,angle=random()*Math.PI*2;
  const radius=18+random()*Math.max(width,height)*.85;
  points.push({x,y,width:w,height:h,tx,ty,
   sx:tx+Math.cos(angle)*radius,sy:ty+Math.sin(angle)*radius,
   delay:random()*.192,startScale:.10+random()*.05,wobble:random()*Math.PI*2,
   color:[Math.round(red/alpha),Math.round(green/alpha),Math.round(blue/alpha)],
   alpha:alpha/(255*w*h)});
 }
 return points;
}

export function paintArtwork(context,texture,points,time,total=duration) {
 for(const point of points) {
  const progress=clamp01((time-point.delay)/(total-point.delay));
  if(!progress)continue;
  if(progress>=1) {
   // Integer, adjacent source/destination rectangles reconstruct the bitmap.
   context.globalAlpha=1;
   context.drawImage(texture,point.x,point.y,point.width,point.height,
    point.x,point.y,point.width,point.height);
   continue;
  }
  const ease=bezierEase(progress),residual=1-ease;
  const tremor=Math.sin(progress*13+point.wobble)*3.5*residual;
  const cx=point.sx+(point.tx-point.sx)*ease+Math.cos(point.wobble)*tremor;
  const cy=point.sy+(point.ty-point.sy)*ease+Math.sin(point.wobble)*tremor;
  const growth=smooth01((progress-.18)/.82);
  const scale=point.startScale+(1-point.startScale)*growth;
  const w=point.width*scale,h=point.height*scale;
  context.globalAlpha=Math.min(1,progress*6);
  context.drawImage(texture,point.x,point.y,point.width,point.height,
   cx-w/2,cy-h/2,w,h);
 }
 context.globalAlpha=1;
}

export function bindHeroParticles(art,{onStart=()=>{},onFinish=()=>{}}={}) {
 if(!art||played){onFinish('skipped');return ()=>{};}
 const image=art.querySelector('img');if(!image){onFinish('unavailable');return ()=>{};}
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches){onFinish('reduced-motion');return ()=>{};}
 const events=new AbortController(),options={signal:events.signal};
 let canvas=null,frame=null,observer=null,startTime=null,settledAt=null,finished=false;
 const finish=(reason='complete')=>{
  if(finished)return;finished=true;
  if(frame!==null)window.cancelAnimationFrame(frame);
  observer?.disconnect();events.abort();
  art.classList.remove('is-assembling');canvas?.remove();
  onFinish(typeof reason==='string'?reason:reason?.type||'interrupted');
 };
 const start=()=>{
  if(finished||!art.isConnected||!image.naturalWidth||motion.matches){finish();return;}
  try {
   const bounds=art.getBoundingClientRect(),photo=image.getBoundingClientRect();
   const dpr=Math.min(window.devicePixelRatio||1,2);
   const width=Math.round(bounds.width*dpr),height=Math.round(bounds.height*dpr);
   if(!width||!height){finish();return;}
   const texture=document.createElement('canvas');texture.width=width;texture.height=height;
   const sample=texture.getContext('2d',{willReadFrequently:true});
   if(!sample){finish();return;}
   sample.drawImage(image,(photo.left-bounds.left)*dpr,(photo.top-bounds.top)*dpr,
    photo.width*dpr,photo.height*dpr);
   const points=artworkPoints(sample.getImageData(0,0,width,height));
   if(!points.length){finish();return;}
   canvas=document.createElement('canvas');canvas.className='home-art-particles';
   canvas.setAttribute('aria-hidden','true');canvas.dataset.particleCount=String(points.length);
   canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d');if(!context){finish();return;}
   art.classList.add('is-assembling');art.appendChild(canvas);played=true;onStart();
   const paint=now=>{
    if(!art.isConnected){finish('unmounted');return;}
    try {
     if(startTime===null)startTime=now;
     const time=(now-startTime)/1000;
     context.clearRect(0,0,width,height);
     paintArtwork(context,texture,points,time);
     if(time>=duration) {
      if(settledAt===null){settledAt=now;canvas.dataset.assembled='true';}
      // The complete canvas is visible before the identical static image.
      if(now-settledAt>=120){finish();return;}
     }
     frame=window.requestAnimationFrame(paint);
    } catch {finish('error');}
   };
   const resized=()=>{
    const current=art.getBoundingClientRect();
    if(Math.abs(current.width-bounds.width)>1||Math.abs(current.height-bounds.height)>1)finish('resize');
   };
   if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resized);observer.observe(art);}
   window.addEventListener('resize',resized,options);
   frame=window.requestAnimationFrame(paint);
  } catch {finish('error');}
 };
 motion.addEventListener('change',event=>{if(event.matches)finish('reduced-motion');},options);
 window.addEventListener('hashchange',finish,{once:true,...options});
 window.addEventListener('platform:rendered',()=>{if(!art.isConnected)finish('unmounted');},options);
 image.addEventListener('error',finish,{once:true,...options});
 if(image.complete&&image.naturalWidth)start();
 else image.addEventListener('load',start,{once:true,...options});
 return finish;
}
