import {applyManualData,manualPresentation} from './manual-edits.js';
import {loadData} from './data.js';
import {createLocalAdapter} from './storage.js';
import {parseRoute} from './router.js';
import {E,arrow,notify,copyText,focusElement} from './utils.js';
import {renderCatalog,refreshCatalog,renderFavorites} from './catalog.js';
import {renderDetail} from './detail.js';
import {newBench,renderBench,compose} from './workbench.js';
import {createDownloads} from './downloads.js';
import {renderAccount,renderAbout} from './account.js';

async function start() {
  const data = await loadData();
  const presentManual=manualPresentation(data.manual);
  const store = createLocalAdapter(data);
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  const side = document.getElementById('sidebar-content');
  const frame = document.getElementById('frame');
  const menuButton = document.getElementById('toggle-menu');
  const mobile = matchMedia('(max-width:1060px)');
  const filters = {category:'Все',search:''};
  const benches = new Map();
  const benchFor = id => {
    if (!benches.has(id)) benches.set(id,newBench(data.byId.get(id)));
    return benches.get(id);
  };
  let route = parseRoute(data);
  let menuOpen = !mobile.matches;
  const storageNotice = document.createElement('p');
  storageNotice.className = 'storage-notice';
  storageNotice.setAttribute('role','status');
  document.getElementById('frame').before(storageNotice);
  function updateStorageNotice() {
    storageNotice.hidden = store.available();
    storageNotice.textContent = store.available() ? '' : 'Хранилище браузера недоступно. Избранное и история работают до закрытия этой страницы.';
  }
  function syncMenu() {
    frame.classList.toggle('noside',!menuOpen);
    menuButton.setAttribute('aria-expanded',String(menuOpen));
    menuButton.setAttribute('aria-label',menuOpen?'Скрыть меню':'Открыть меню');
    sidebar.inert = !menuOpen;
    sidebar.setAttribute('aria-hidden',String(!menuOpen));
    document.body.classList.toggle('menu-open',menuOpen && mobile.matches);
    const modalMenu = menuOpen && mobile.matches;
    if (modalMenu) {sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');}
    else {sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');}
    main.inert = modalMenu;
    document.querySelector('.site-header').inert = modalMenu;
    document.getElementById('site-footer').inert = modalMenu;
    document.querySelector('.skip-link').inert = modalMenu;
  }
  function setMenu(open,restore = true) {
    menuOpen = open;
    syncMenu();
    if (open && mobile.matches) focusElement(document.getElementById('side-close'));
    else if (!open && restore) focusElement(menuButton);
  }
  function renderSide() {
    const nav = (href,label,code,active,tail='') => `<a href="${href}" class="side-link ${active?'active':''}" ${active?'aria-current="page"':''}><span class="num">${code}</span><span>${E(label)}</span>${tail}</a>`;
    side.innerHTML = `<nav aria-label="Разделы и инструменты"><div class="side-head">НАВИГАЦИЯ / РАЗДЕЛЫ</div>${nav('#catalog','Весь каталог','00',route.page==='catalog')}<div class="side-section"></div>${data.groups.map(group => `<a href="#catalog" class="side-group-name" data-filter-link="${E(group.id)}"><span class="num">${group.n}.0</span><span>${E(group.name)}</span></a>${data.catalog.filter(t => t.category===group.id).map(t => nav('#tool/'+t.id,t.name,t.code,route.page==='tool'&&route.id===t.id)).join('')}`).join('')}<div class="side-section"><div class="side-group-name"><span class="num">5.0</span>Личное</div>${nav('#saved','Избранное','5.1',route.page==='saved',`<span class="end" id="side-favorite-count">${store.snapshot().favorites.length}</span>`)}${nav('#account','Кабинет','5.2',route.page==='account')}</div><div class="side-footer-link">${nav('#about','О платформе','',route.page==='about')}</div><p class="side-note">Каталог, подробные материалы и личная библиотека — в одной платформе.</p></nav>`;
  }
  function updateChapter() {
    document.querySelectorAll('.chapter-link').forEach(link => {
      if (link.dataset.chapterId===route.anchor) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  function renderPage() {
    main.dataset.view=route.page==='tool'?`tool/${route.id}`:route.page;
    renderSide();
    if (route.page==='catalog') renderCatalog(main,data,store,filters);
    else if (route.page==='tool') renderDetail(main,data.byId.get(route.id),data,store,benchFor(route.id));
    else if (route.page==='saved') renderFavorites(main,data,store);
    else if (route.page==='account') renderAccount(main,data,store);
    else if (route.page==='about') renderAbout(main,data);
    else main.innerHTML = `<section class="panel surface-light"><p class="eyebrow">СТРАНИЦА НЕ НАЙДЕНА</p><h1>Проверьте адрес</h1><p>Такого инструмента или раздела нет в каталоге.</p><div class="empty-actions"><a class="btn primary" href="#catalog">ОТКРЫТЬ КАТАЛОГ ${arrow()}</a></div></section>`;
    const names = {catalog:'Каталог',saved:'Избранное',account:'Личный кабинет',about:'О платформе','not-found':'Страница не найдена'};
    document.title = `${route.page==='tool'?data.byId.get(route.id).name:names[route.page]} — Платформа инструментов Гардари`;
    const description = route.page==='tool' ? data.byId.get(route.id).summary : '13 авторских методов исследования, мышления, моделирования и работы с ИИ.';
    document.querySelector('meta[name="description"]').content = description;
    syncMenu();
    updateStorageNotice();
    updateChapter();
    downloads.refresh();
    presentManual(data.manual);
    window.dispatchEvent(new CustomEvent('platform:rendered',{detail:{catalog:data.catalog}}));
  }
  function applyRoute(initial = false) {
    const next = parseRoute(data);
    const sameTool = next.page==='tool' && route.page==='tool' && next.id===route.id;
    route = next;
    if (mobile.matches) setMenu(false,false);
    if (!sameTool || !main.querySelector('.detail-main') || initial) renderPage();
    else updateChapter();
    requestAnimationFrame(() => {
      const target = route.anchor ? document.getElementById(route.anchor) : null;
      if (target) focusElement(target,true);
      else {
        window.scrollTo({top:0,left:0,behavior:'instant'});
        if (!initial) focusElement(main.querySelector('h1') || main);
      }
    });
  }
  const downloads = createDownloads(data,store,() => {
    updateStorageNotice();
    if (route.page==='account') {renderAccount(main,data,store);focusElement(main.querySelector('h1'));}
  });
  function syncFavoriteControls() {
    document.querySelectorAll('[data-action="star"]').forEach(control => {
      const tool=data.byId.get(control.dataset.id);
      if (!tool) return;
      const selected=store.isFavorite(tool.id);
      control.setAttribute('aria-pressed',String(selected));
      if (control.classList.contains('star')) {
        control.classList.toggle('saved',selected);
        control.setAttribute('aria-label',`${selected?'Убрать из избранного':'Добавить в избранное'}: ${tool.name}`);
        control.innerHTML=`<span aria-hidden="true">${selected?'★':'☆'}</span>`;
      } else control.innerHTML=`${selected?'УБРАТЬ ИЗ ИЗБРАННОГО':'СОХРАНИТЬ В БИБЛИОТЕКУ'} ${arrow()}`;
    });
    document.getElementById('side-favorite-count').textContent=store.snapshot().favorites.length;
  }
  function favorite(id,button) {
    if (!data.byId.has(id)) return;
    const oldIndex = [...main.querySelectorAll('[data-action="star"]')].indexOf(button);
    const saved = store.toggleFavorite(id);
    if (route.page==='saved') {
      renderFavorites(main,data,store);
      const buttons = [...main.querySelectorAll('[data-action="star"]')];
      focusElement(buttons[Math.min(oldIndex,buttons.length-1)] || main.querySelector('h1'));
    }
    syncFavoriteControls();
    updateStorageNotice();
    notify(`${store.isFavorite(id)?'Сохранено в избранном.':'Убрано из избранного.'}${saved?'':' После закрытия страницы выбор не сохранится.'}`);
  }
  document.addEventListener('click',event => {
    const scrollLink = event.target.closest('[data-scroll-to],.skip-link');
    if (scrollLink) {
      event.preventDefault();
      focusElement(scrollLink.classList.contains('skip-link')?main:document.getElementById('top'),true);
      return;
    }
    const filterLink = event.target.closest('[data-filter-link]');
    if (filterLink) {
      filters.category = filterLink.dataset.filterLink;
      filters.search = '';
      if (route.page==='catalog') {
        event.preventDefault();
        setMenu(false,false);
        renderPage();
        focusElement(main.querySelector('h1'),true);
      }
    }
    const control = event.target.closest('[data-action]');
    if (control) {
      const action = control.dataset.action;
      if (action==='filter') {filters.category=control.dataset.cat;refreshCatalog(data,store,filters);}
      else if (action==='reset') {filters.category='Все';filters.search='';document.getElementById('search').value='';refreshCatalog(data,store,filters);focusElement(document.getElementById('search'));}
      else if (action==='star') favorite(control.dataset.id,control);
      else if (action==='download') downloads.show(control.dataset.id,control.hasAttribute('data-index')?Number(control.dataset.index):undefined);
      else if (action==='package') downloads.download(Number(control.dataset.index));
      else if (action==='history') focusElement(document.getElementById('download-history'),true);
      else if (route.page==='tool') {
        const tool=data.byId.get(route.id), state=benchFor(route.id);
        if (action==='try') {state.tab='trial';renderBench(tool,data,state);}
        else if (action==='bench') {
          state.tab=control.dataset.tab;
          renderBench(tool,data,state);
          focusElement(document.getElementById(`tab-${state.tab}`));
        } else if (action==='mode') {
          state.mode=Number(control.dataset.ix);state.output='';
          renderBench(tool,data,state,`[data-action="mode"][data-ix="${state.mode}"]`);
        } else if (action==='example') {
          state.mode=Number(control.dataset.ix);state.tab='trial';state.text=tool.modes[state.mode].example;state.output='';
          renderBench(tool,data,state,'#bench-prompt');
        } else if (action==='reg') {
          const code=control.dataset.reg;
          state.registers=state.registers.includes(code)?state.registers.filter(r=>r!==code):[...state.registers,code];
          state.output='';
          renderBench(tool,data,state,`[data-reg="${code}"]`);
        } else if (action==='compose') compose(tool,data,state);
        else if (action==='copy') copyText(document.getElementById(control.dataset.target)?.textContent || '');
      }
    }
    const sameLink = event.target.closest('a[href^="#"]');
    if (sameLink && sameLink.hash===location.hash && !event.defaultPrevented) {event.preventDefault();applyRoute();}
  });
  document.addEventListener('input',event => {
    if (event.target.id==='search') {filters.search=event.target.value;refreshCatalog(data,store,filters);}
    if (event.target.id==='bench-prompt' && route.page==='tool') {
      const state=benchFor(route.id);state.text=event.target.value;state.output='';
      document.querySelector('.output-panel')?.remove();
      event.target.removeAttribute('aria-invalid');
      event.target.setAttribute('aria-describedby','bench-context');
      document.getElementById('bench-error').hidden=true;
    }
  });
  document.addEventListener('change',event => {
    if (event.target.id==='remember-history') {
      store.setRememberHistory(event.target.checked);updateStorageNotice();
      notify(event.target.checked?'История новых загрузок будет сохраняться.':'Новые загрузки не будут добавляться в историю.');
    }
  });
  document.addEventListener('keydown',event => {
    if (menuOpen && mobile.matches) {
      if (event.key==='Escape') {event.preventDefault();setMenu(false);return;}
      if (event.key==='Tab') {
        const controls=[...sidebar.querySelectorAll('a,button')].filter(el=>el.getClientRects().length);
        const first=controls[0],last=controls.at(-1);
        if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
        else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
      }
    }
    const tab=event.target.closest('[role="tab"]');
    if (tab && ['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) {
      event.preventDefault();
      const tabs=[...document.querySelectorAll('.bench-tabs [role="tab"]')];
      const index=tabs.indexOf(tab);
      const target=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[target].click();
    }
  });
  menuButton.addEventListener('click',()=>setMenu(!menuOpen));
  document.getElementById('side-close').addEventListener('click',()=>setMenu(false));
  document.getElementById('overlay').addEventListener('click',()=>setMenu(false));
  mobile.addEventListener('change',()=>{
    const sidebarHadFocus=sidebar.contains(document.activeElement);
    menuOpen=!mobile.matches;syncMenu();
    if (!menuOpen && sidebarHadFocus) focusElement(menuButton);
  });
  window.addEventListener('hashchange',()=>applyRoute());
  window.addEventListener('storage',event=>{
    if (event.key!==store.key && event.key!==null) return;
    store.refresh();
    updateStorageNotice();
    // Keep a task's textarea, selection and reading position intact in this tab.
    if (route.page==='saved') {
      const focusedId=document.activeElement?.dataset?.id;
      renderFavorites(main,data,store);
      if (focusedId) focusElement(main.querySelector(`[data-action="star"][data-id="${focusedId}"]`) || main.querySelector('h1'));
    } else if (route.page==='account') {
      const focusedId=document.activeElement?.id;
      const openDetails=[...main.querySelectorAll('details')].map(item=>item.open);
      renderAccount(main,data,store);
      main.querySelectorAll('details').forEach((item,index)=>{item.open=!!openDetails[index];});
      if (focusedId) focusElement(document.getElementById(focusedId));
    }
    syncFavoriteControls();
  });
  if (!location.hash) history.replaceState(null,'','#catalog');
  history.scrollRestoration='manual';
  window.addEventListener('platform:manual-preview',event=>{applyManualData(data,event.detail);renderPage();});
  window.addEventListener('platform:editor-context',event=>{
    const {kind,id}=event.detail||{};if(!data.byId.has(id))return;
    if(kind==='download')downloads.show(id);
    else if(kind==='close-download')document.getElementById('dl-modal').close();
    else if(['trial','guide','install'].includes(kind)&&route.page==='tool'&&route.id===id){const state=benchFor(id);state.tab=kind;renderBench(data.byId.get(id),data,state);}
    presentManual(data.manual);window.dispatchEvent(new CustomEvent('platform:rendered',{detail:{catalog:data.catalog}}));
  });
  window.addEventListener('platform:editor-ready',()=>window.dispatchEvent(new CustomEvent('platform:rendered',{detail:{catalog:data.catalog}})));
  applyRoute(true);
}
start().catch(error => {
  document.getElementById('main').innerHTML = `<section class="panel surface-light"><h1>Не удалось загрузить каталог</h1><p>${E(error.message)}</p><p>Проверьте соединение и откройте страницу через локальный сервер или адрес сайта.</p><div class="empty-actions"><button class="btn primary" id="retry-load" type="button">ПОВТОРИТЬ</button></div></section>`;
  document.getElementById('retry-load').addEventListener('click',()=>location.reload());
  document.getElementById('sidebar').inert=true;
});
