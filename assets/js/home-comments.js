import {E} from './utils.js';

// Temporary layout media. Stock names below are placeholders, not testimonials.
const COMMENTS = [
 {id:'author-portrait',name:'Денис Гардари',poster:'denis-portrait.jpg',video:'denis-portrait-demo.mp4',position:'50% 45%'},
 {id:'demo-woman',name:'Анна',poster:'demo-woman.jpg',video:'demo-woman.mp4',position:'50% 50%'},
 {id:'author-art',name:'Денис Гардари',poster:'denis-art.jpg',video:'denis-art-demo.mp4',position:'50% 25%'},
 {id:'demo-man',name:'Алексей',poster:'demo-man.jpg',video:'demo-man.mp4',position:'50% 50%'},
 {id:'demo-woman-2',name:'Мария',poster:'demo-woman-2.jpg',video:'demo-woman-2.mp4',position:'50% 50%'}
];
const triangle='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5 20 12 7 19.5Z"/></svg>';

export function commentsMarkup(heading) {
 return `<section class="home-comments" id="home-comments" aria-label="Комментарии авторов и пользователей">${heading('КОММЕНТАРИИ АВТОРОВ И ПОЛЬЗОВАТЕЛЕЙ')}<div class="comments-row">${COMMENTS.map((item,i)=>`<button class="comment-preview" type="button" data-comment-index="${i}" aria-label="Открыть видео: ${E(item.name)}" aria-haspopup="dialog" aria-controls="comment-player" aria-expanded="false"><img src="assets/images/comments/${item.poster}" width="640" height="640" alt="" loading="lazy" decoding="async" style="object-position:${item.position}"><span class="comment-preview-play">${triangle}</span></button>`).join('')}</div><dialog class="comment-player" id="comment-player" aria-labelledby="comment-player-title"><div class="comment-player-view"><video playsinline preload="none" aria-label="Видеокомментарий" disablepictureinpicture></video><button class="comment-video-toggle" type="button" aria-label="Воспроизвести видео">${triangle}</button><svg class="comment-progress-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="comment-progress-track" cx="50" cy="50" r="49"/><circle class="comment-progress-value" cx="50" cy="50" r="49"/></svg><progress class="comment-progress-accessible" value="0" max="1" aria-label="Прогресс видео"></progress><p class="comment-player-status" role="status" aria-live="polite"></p></div><button class="comment-player-close" type="button" aria-label="Закрыть видео"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button><h2 class="comment-player-title" id="comment-player-title"></h2></dialog></section>`;
}

export function bindComments() {
 const section=document.getElementById('home-comments');
 const triggers=[...section.querySelectorAll('[data-comment-index]')];
 if(!triggers.length)return;
 const dialog=section.querySelector('dialog'),view=dialog.querySelector('.comment-player-view');
 const video=dialog.querySelector('video'),title=dialog.querySelector('.comment-player-title');
 const toggleButton=dialog.querySelector('.comment-video-toggle');
 const ring=dialog.querySelector('.comment-progress-value'),progress=dialog.querySelector('progress');
 const status=dialog.querySelector('.comment-player-status');
 const events=new AbortController(),options={signal:events.signal};
 let origin=null,animation=null,closing=false,generation=0,frame=0;
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const size=()=>{
  const field=section.getBoundingClientRect().width;
  const desired=window.matchMedia('(max-width:680px)').matches?field:field*2/3;
  dialog.style.setProperty('--comment-size',`${Math.max(100,Math.min(desired,window.innerWidth-32,window.innerHeight-100))}px`);
 };
 const transform=()=>{
  if(!origin?.isConnected)return null;
  const a=origin.getBoundingClientRect(),b=view.getBoundingClientRect();
  return `translate(${a.x+a.width/2-b.x-b.width/2}px,${a.y+a.height/2-b.y-b.height/2}px) scale(${a.width/b.width})`;
 };
 const drawProgress=()=>{
  const value=Number.isFinite(video.duration)&&video.duration>0?Math.min(1,video.currentTime/video.duration):0;
  ring.style.strokeDashoffset=String(307.876080052*(1-value));
  progress.value=value;
 };
 const update=()=>{
  toggleButton.setAttribute('aria-label',video.paused?'Воспроизвести видео':'Пауза');
  view.classList.toggle('is-playing',!video.paused);
  drawProgress();
 };
 const tick=()=>{
  drawProgress();
  if(!video.paused&&!video.ended)frame=window.requestAnimationFrame(tick);
 };
 const resume=()=>{
  const request=generation;
  status.textContent='';
  if(video.error)video.load();
  video.play().catch(()=>{
   if(request===generation&&dialog.open){status.textContent='Нажмите на видео, чтобы воспроизвести.';update();}
  });
 };
 const reset=()=>{
  generation++;animation?.cancel();animation=null;closing=false;
  window.cancelAnimationFrame(frame);frame=0;
  video.pause();video.removeAttribute('src');video.load();
  origin?.setAttribute('aria-expanded','false');
  if(origin?.isConnected)origin.focus({preventScroll:true});
  status.textContent='';drawProgress();
 };
 const close=()=>{
  if(!dialog.open||closing)return;
  closing=true;video.pause();animation?.cancel();
  const end=transform();
  if(reduced()||!end){dialog.close();return;}
  animation=view.animate([{transform:'none'},{transform:end}],{duration:220,easing:'cubic-bezier(.3,0,.7,1)',fill:'forwards'});
  animation.finished.then(()=>dialog.close()).catch(()=>{});
 };
 triggers.forEach((button,index)=>button.addEventListener('click',()=>{
  const item=COMMENTS[index];generation++;origin=button;closing=false;
  size();title.textContent=item.name;status.textContent='';drawProgress();
  video.poster=`assets/images/comments/${item.poster}`;
  video.src=`assets/videos/comments/${item.video}`;
  video.setAttribute('aria-label',item.name);
  button.setAttribute('aria-expanded','true');
  dialog.showModal();
  dialog.querySelector('.comment-player-close').focus({preventScroll:true});
  const start=transform();
  if(!reduced()&&start)animation=view.animate([{transform:start},{transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.75,.15,1)'});
  resume();update();
 },options));
 const toggle=()=>video.paused?resume():video.pause();
 toggleButton.addEventListener('click',toggle,options);
 for(const event of ['loadedmetadata','timeupdate','pause','ended'])video.addEventListener(event,()=>{
  if(video.paused||video.ended){window.cancelAnimationFrame(frame);frame=0;}
  update();
 },options);
 video.addEventListener('playing',()=>{status.textContent='';update();window.cancelAnimationFrame(frame);tick();},options);
 video.addEventListener('error',()=>{if(dialog.open){status.textContent='Видео не загрузилось. Нажмите, чтобы повторить.';update();}},options);
 dialog.querySelector('.comment-player-close').addEventListener('click',close,options);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();},options);
 dialog.addEventListener('close',reset,options);
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}},options);
 window.addEventListener('resize',()=>{if(dialog.open){animation?.cancel();size();}},options);
 window.addEventListener('hashchange',()=>{animation?.cancel();if(dialog.open)dialog.close();reset();events.abort();},{once:true});
}
