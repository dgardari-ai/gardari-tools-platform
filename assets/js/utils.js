export const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const arrow = (extra = '') => `<svg class="chevron ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg>`;
export const number = value => String(value).padStart(2, '0');
export const paragraphs = values => values.map(p => `<p>${E(p)}</p>`).join('');
export const list = values => values.map(p => `<li>${E(p)}</li>`).join('');
let toastTimer;
export function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify('Текст скопирован.');
    return true;
  } catch { /* A selected-text fallback also works on ordinary HTTP previews. */ }
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('aria-label', 'Текст для копирования');
  field.style.cssText = 'position:fixed;left:-10000px;top:0';
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Report the actual result. */ }
  field.remove();
  previous?.focus({preventScroll:true});
  notify(copied ? 'Текст скопирован.' : 'Копирование недоступно. Выделите и скопируйте готовый запрос вручную.');
  return copied;
}
export function focusElement(element, scroll = false) {
  if (!element) return;
  if (!element.matches('a,button,input,textarea,select,[tabindex]')) element.tabIndex = -1;
  element.focus({preventScroll:true});
  if (scroll) element.scrollIntoView({block:'start', behavior:'instant'});
}
