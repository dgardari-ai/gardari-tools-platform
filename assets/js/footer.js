import {copyText,notify} from './utils.js';

// Share the public entry point, including from a local or editor preview.
export const PLATFORM_URL = 'https://dgardari-ai.github.io/gardari-tools-platform/';

export async function sharePlatform() {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({title:'Платформа инструментов Гардари',url:PLATFORM_URL});
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
  const identity = document.querySelector('.footer-identity');
  const name = identity?.querySelector('.footer-name');
  if (!identity || !name) return;
  const alignShareButton = () => {
    const width = name.getBoundingClientRect().right - identity.getBoundingClientRect().left;
    identity.style.setProperty('--footer-share-width',`${Math.max(0,width)}px`);
  };
  const observer = new ResizeObserver(alignShareButton);
  observer.observe(identity);
  observer.observe(name);
  alignShareButton();
}
