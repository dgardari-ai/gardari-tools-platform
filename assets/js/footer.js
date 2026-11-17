import {copyText,notify} from './utils.js';

// Share the public entry point, including from a local or editor preview.
export const PLATFORM_URL = 'https://platforma.gardari.art/';

export async function sharePlatform() {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({title:'ПЛАТФОРМА ИНСТРУМЕНТОВ',url:PLATFORM_URL});
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  const copied = await copyText(PLATFORM_URL);
  notify(copied ? 'Ссылка на Платформу скопирована.' : `Скопируйте ссылку вручную: ${PLATFORM_URL}`);
}

export function initFooter() {
  document.getElementById('share-platform')?.addEventListener('click',sharePlatform);
  const footer = document.getElementById('site-footer');
  const legal = document.getElementById('footer-contact-dialog');
  const mobile = window.matchMedia('(max-width:700px)');
  footer?.addEventListener('click', event => {
    if (!event.target.closest('[data-footer-home]')) return;
    event.preventDefault();
    if (location.hash !== '#about') location.hash = '#about';
    window.scrollTo({top:0,left:0,behavior:'instant'});
    requestAnimationFrame(() => window.scrollTo({top:0,left:0,behavior:'instant'}));
  });
  const opener = footer?.querySelector('[data-footer-legal]');
  if (opener && legal) {
    opener.addEventListener('click', () => {
      if (legal.open) return;
      legal.showModal();
      opener.setAttribute('aria-expanded','true');
      legal.querySelector('[data-footer-legal-close]')?.focus({preventScroll:true});
    });
    legal.querySelector('[data-footer-legal-close]')?.addEventListener('click', () => legal.close());
    let outsideStart = false;
    const outside = event => {
      const box = legal.getBoundingClientRect();
      return event.target === legal && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom);
    };
    legal.addEventListener('pointerdown', event => { outsideStart = outside(event); });
    legal.addEventListener('click', event => {
      if (outsideStart && outside(event)) legal.close();
      outsideStart = false;
    });
    legal.addEventListener('close', () => {
      opener.setAttribute('aria-expanded','false');
      (opener.getClientRects().length ? opener : document.getElementById('share-platform'))?.focus({preventScroll:true});
    });
  }
  const identity = document.querySelector('.footer-identity');
  const name = identity?.querySelector('.footer-name');
  if (!identity || !name) return;
  const alignShareButton = () => {
    const width = name.getBoundingClientRect().right - identity.getBoundingClientRect().left;
    identity.style.setProperty('--footer-share-width',`${Math.max(0,width)}px`);
  };
  let typeFrame = 0;
  const alignLabels = () => {
    typeFrame = 0;
    for (const node of footer.querySelectorAll('[data-footer-baseline]')) {
      if (mobile.matches) { node.style.removeProperty('--footer-type-shift'); continue; }
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      let mark = node.querySelector(':scope > .footer-type-baseline');
      if (!mark) {
        mark = document.createElement('i'); mark.className = 'footer-type-baseline';
        mark.setAttribute('aria-hidden','true'); node.append(mark);
      }
      const offset = mark.getBoundingClientRect().top - node.getBoundingClientRect().top;
      const shift = -Math.round(offset*128)/128+'px';
      if (node.style.getPropertyValue('--footer-type-shift') !== shift) node.style.setProperty('--footer-type-shift',shift);
    }
  };
  const scheduleLabels = () => { if (!typeFrame) typeFrame = requestAnimationFrame(alignLabels); };
  const observer = new ResizeObserver(() => { alignShareButton(); scheduleLabels(); });
  observer.observe(footer);
  mobile.addEventListener('change',scheduleLabels);
  window.addEventListener('platform:rendered',scheduleLabels);
  document.fonts.ready.then(scheduleLabels);
  document.fonts.addEventListener('loadingdone',scheduleLabels);
  scheduleLabels();
  observer.observe(identity);
  observer.observe(name);
  alignShareButton();
}
