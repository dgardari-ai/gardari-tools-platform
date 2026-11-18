import {analyticsProvider} from './analytics-provider.js?v=20261118';

const storageKey = 'gardari-platform:analytics-choice:v1';
const necessary = 'necessary';
const allowed = 'analytics';

function afterEntrance(show) {
  const root = document.documentElement;
  const main = document.querySelector('main');
  let timer = 0;

  function canShow() {
    const hero = main?.querySelector('.home-hero');
    return !document.hidden && root.dataset.platformBoot !== 'pending' &&
      (!hero || hero.dataset.motionStage === 'complete');
  }

  function check() {
    if (!canShow()) {
      clearTimeout(timer);
      timer = 0;
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = 0;
        if (!canShow()) return;
        observer.disconnect();
        document.removeEventListener('visibilitychange', check);
        show();
      }, 700);
    }
  }

  const observer = new MutationObserver(check);
  observer.observe(root, {attributes: true, attributeFilter: ['data-platform-boot']});
  if (main) observer.observe(main, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['data-motion-stage'],
  });
  document.addEventListener('visibilitychange', check);
  check();
}

function initConsent(provider) {
  if (!provider?.revision || provider.origin !== location.origin ||
      typeof provider.start !== 'function' || typeof provider.stop !== 'function') return;

  const settings = [...document.querySelectorAll('[data-analytics-settings]')];
  const panel = document.createElement('section');
  panel.id = 'analytics-consent';
  panel.className = 'analytics-consent';
  panel.setAttribute('aria-labelledby', 'analytics-consent-title');
  panel.hidden = true;
  panel.innerHTML = `
    <header class="analytics-consent-head"><h2 id="analytics-consent-title" tabindex="-1">Куки и аналитика</h2></header>
    <div class="analytics-consent-body">
      <p>Аналитика помогает улучшать Платформу. Включается с вашего разрешения.</p>
      <a href="privacy.html#technical">Как обрабатываются данные</a>
      <p class="analytics-consent-current" hidden></p>
    </div>
    <div class="analytics-consent-actions">
      <button type="button" data-choice="necessary">Только необходимые</button>
      <button type="button" data-choice="analytics">Разрешить аналитику</button>
    </div>`;
  document.body.append(panel);
  const layout = new URLSearchParams(location.search).get('layout');
  if (layout === 'desktop' || layout === 'phone') {
    panel.querySelector('a').href = `privacy.html?layout=${layout}#technical`;
  }

  let decision = readChoice() ?? null;
  let sessionChoice = false;
  let active = null;
  let opener = null;
  let entranceFinished = false;
  const current = panel.querySelector('.analytics-consent-current');
  const heading = panel.querySelector('h2');

  function readChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved?.revision === provider.revision && [necessary, allowed].includes(saved.choice)
        ? saved.choice : null;
    } catch {
      return undefined;
    }
  }

  function stopAnalytics() {
    if (!active) return;
    const previous = active;
    active = null;
    previous.abort();
    try {
      provider.stop();
    } catch (error) {
      console.error('Не удалось остановить аналитику Платформы.', error);
    }
  }

  function syncAnalytics() {
    if (decision !== allowed) {
      stopAnalytics();
    } else if (!active) {
      active = new AbortController();
      try {
        provider.start(active.signal);
      } catch (error) {
        stopAnalytics();
        console.error('Не удалось запустить аналитику Платформы.', error);
      }
    }
  }

  function showPanel(open) {
    current.hidden = !decision;
    current.textContent = decision === allowed ? 'Текущий выбор: аналитика разрешена.' : 'Текущий выбор: только необходимые.';
    panel.hidden = !open;
    for (const button of settings) button.setAttribute('aria-expanded', String(open));
  }

  function closePanel() {
    showPanel(false);
    opener?.focus({preventScroll: true});
    opener = null;
  }

  panel.addEventListener('click', event => {
    const button = event.target.closest('button[data-choice]');
    if (!button) return;
    decision = button.dataset.choice;
    try {
      localStorage.setItem(storageKey, JSON.stringify({revision: provider.revision, choice: decision}));
      sessionChoice = false;
    } catch {
      sessionChoice = true;
    }
    syncAnalytics();
    closePanel();
  });

  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opener && decision) closePanel();
  });

  for (const button of settings) {
    button.hidden = false;
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => {
      if (opener === button && !panel.hidden) {
        closePanel();
        return;
      }
      opener = button;
      showPanel(true);
      heading.focus({preventScroll: true});
    });
  }

  const refreshChoice = () => {
    const saved = readChoice();
    if (saved !== undefined && (!sessionChoice || saved !== null)) {
      decision = saved;
      sessionChoice = false;
    } else if (!sessionChoice) {
      decision = null;
    }
    syncAnalytics();
    showPanel(Boolean(opener) || (entranceFinished && !decision));
  };
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) refreshChoice();
  });
  window.addEventListener('pageshow', refreshChoice);
  showPanel(false);
  syncAnalytics();
  afterEntrance(() => {
    entranceFinished = true;
    if (!decision && !opener) showPanel(true);
  });
}

initConsent(analyticsProvider);
