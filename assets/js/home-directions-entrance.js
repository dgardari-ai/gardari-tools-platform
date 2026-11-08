// A single, left-to-right entrance for the photo strip. Accordion sizing stays native.
const active=new WeakMap();
let entered=false;

export function bindDirectionsEntrance(main) {
 active.get(main)?.();
 const track=main?.querySelector('#home-directions-track');
 if(!track)return;
 const panels=[...track.querySelectorAll('.home-direction')];
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(entered||motion.matches||!panels.length||typeof IntersectionObserver==='undefined') {
  track.dataset.directionsEntry='ready';return;
 }
 const events=new AbortController(),options={signal:events.signal},animations=[];
 let observer,mutation,visible=false,started=false,disposed=false;
 const finish=()=>{
  if(disposed)return;disposed=true;
  observer?.disconnect();mutation?.disconnect();events.abort();
  animations.forEach(animation=>animation.cancel());
  track.classList.remove('directions-enter-pending');
  track.dataset.directionsEntry='ready';
  if(active.get(main)===finish)active.delete(main);
 };
 const reveal=()=>{
  if(disposed||started||!visible||!track.isConnected)return;
  // The existing hero owns the first reveal of the lower sections. Wait for it.
  if(main.classList.contains('home-lower-hidden')||track.closest('[inert]'))return;
  started=true;entered=true;observer.disconnect();mutation.disconnect();
  track.dataset.directionsEntry='entering';
  try {
   panels.forEach((panel,index)=>{
    const animation=panel.animate([
     {opacity:0,transform:'perspective(1000px) translateY(24px) rotateX(-18deg)'},
     {opacity:1,transform:'perspective(1000px) translateY(0) rotateX(0deg)'}
    ],{duration:560,delay:index*80,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
    animations.push(animation);animation.finished.catch(finish);
   });
   track.classList.remove('directions-enter-pending');
   Promise.all(animations.map(animation=>animation.finished)).then(finish,finish);
  }catch{finish();}
 };
 active.set(main,finish);
 track.classList.add('directions-enter-pending');track.dataset.directionsEntry='waiting';
 try {
  observer=new IntersectionObserver(entries=>{
   visible=entries.some(entry=>entry.isIntersecting);
   reveal();
  },{threshold:0,rootMargin:'0px 0px -24px 0px'});
  mutation=new MutationObserver(reveal);
  mutation.observe(main,{attributes:true,attributeFilter:['data-home-entry']});
  observer.observe(track);
  // An interaction never waits for the entrance, even while the hero is revealing.
  const interact=()=>{entered=true;finish();};
  track.addEventListener('focusin',interact,options);
  track.addEventListener('pointerdown',interact,{capture:true,...options});
  window.addEventListener('hashchange',finish,{once:true,...options});
  window.addEventListener('pagehide',finish,{once:true,...options});
  window.addEventListener('platform:rendered',()=>{if(!track.isConnected)finish();},options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)finish();},options);
  motion.addEventListener('change',()=>{if(motion.matches)finish();},options);
 }catch{finish();}
 return finish;
}
