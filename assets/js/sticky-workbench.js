import {isPhone,layoutScale,layoutHeight} from './layout.js?v=20261117-preview20';
import {layoutRect} from './layout.js?v=20261117-preview20';
// A full-height sidebar follows the document in both directions. Tall panels
// travel between the header and viewport bottom instead of gaining a scrollbar.
export function followWorkbench() {
  let panel = null;
  let previousY = (window.scrollY/layoutScale());
  let offset = 0;
  let scheduled = false;
  const header = document.getElementById('top');
  const clamp = (value,min,max) => Math.max(min,Math.min(value,max));

  function update(reset = false) {
    scheduled = false;
    const y = (window.scrollY/layoutScale());
    if (!panel?.isConnected) { previousY=y; return; }
    // An independently scrolling window is anchored by CSS. Document scrolling
    // must never move its frame or feed the old tall-panel offset algorithm.
    if (panel.dataset.scrollMode==='independent') {
      const mode=isPhone()?'flow':'independent';
      if(panel.dataset.followMode!==mode)panel.dataset.followMode=mode;
      if(panel.style.getPropertyValue('--workbench-follow-top'))panel.style.removeProperty('--workbench-follow-top');
      previousY=y;
      return;
    }
    if (isPhone()) {
      panel.style.removeProperty('--workbench-follow-top');
      panel.dataset.followMode='flow';
      previousY=y;
      return;
    }
    const top = layoutRect(header).height+12;
    const height = layoutRect(panel).height;
    const bottom = Math.min(top,layoutHeight()-height-12);
    if (bottom===top) offset=top;
    else if (reset) offset=clamp(layoutRect(panel).top,bottom,top);
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
      previousY=(window.scrollY/layoutScale());
      if(panel) { observer.observe(panel); observer.observe(header); }
    }
    update(true);
  }
  window.addEventListener('platform:rendered',attach);
window.addEventListener('platform:layout',attach);
  window.addEventListener('resize',()=>update(true));
  window.addEventListener('scroll',()=>{
    if(!scheduled) { scheduled=true; requestAnimationFrame(()=>update()); }
  },{passive:true});
}
