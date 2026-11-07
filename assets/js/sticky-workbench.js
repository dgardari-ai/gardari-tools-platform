// A full-height sidebar follows the document in both directions. Tall panels
// travel between the header and viewport bottom instead of gaining a scrollbar.
export function followWorkbench() {
  let panel = null;
  let previousY = window.scrollY;
  let offset = 0;
  let scheduled = false;
  const header = document.getElementById('top');
  const clamp = (value,min,max) => Math.max(min,Math.min(value,max));

  function update(reset = false) {
    scheduled = false;
    const y = window.scrollY;
    if (!panel?.isConnected) { previousY=y; return; }
    if (document.documentElement.clientWidth<=925) {
      panel.style.removeProperty('--workbench-follow-top');
      panel.dataset.followMode='flow';
      previousY=y;
      return;
    }
    const top = header.getBoundingClientRect().height+12;
    const height = panel.getBoundingClientRect().height;
    const bottom = Math.min(top,window.innerHeight-height-12);
    if (bottom===top) offset=top;
    else if (reset) offset=clamp(panel.getBoundingClientRect().top,bottom,top);
    else offset=clamp(offset-(y-previousY),bottom,top);
    panel.style.setProperty('--workbench-follow-top',`${offset}px`);
    panel.dataset.followMode=bottom===top?'top':'tall';
    previousY=y;
  }

  const observer = new ResizeObserver(()=>update(true));
  function attach() {
    const next = document.querySelector('#workbench, #account-profile, .lesson-panel');
    if (next!==panel) {
      observer.disconnect();
      panel=next;
      previousY=window.scrollY;
      if(panel) { observer.observe(panel); observer.observe(header); }
    }
    update(true);
  }
  window.addEventListener('platform:rendered',attach);
  window.addEventListener('resize',()=>update(true));
  window.addEventListener('scroll',()=>{
    if(!scheduled) { scheduled=true; requestAnimationFrame(()=>update()); }
  },{passive:true});
}
