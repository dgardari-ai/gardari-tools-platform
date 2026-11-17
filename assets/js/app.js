import {layoutWidth} from './layout.js?v=20261117-preview20';
import {layoutRect} from './layout.js?v=20261117-preview20';
import {layoutMedia} from './layout.js?v=20261117-preview20';
import {initPhotoCards} from './photo-cards.js?v=20261117-preview20';
import {initFooter} from './footer.js?v=20261117-preview20';
import {applyManualData,manualPresentation} from './manual-edits.js?v=20261117-preview20';
import {loadData} from './data.js?v=20261117-preview20';
import {createLocalAdapter} from './storage.js?v=20261117-preview20';
import {parseRoute} from './router.js?v=20261117-preview20';
import {E,arrow,notify,copyText,focusElement} from './utils.js?v=20261117-preview20';
import {renderCatalog,refreshCatalog,renderFavorites} from './catalog.js?v=20261117-preview20';
import {renderDetail} from './detail.js?v=20261117-preview20';
import {newBench,renderBench,compose} from './workbench.js?v=20261117-preview20';
import {createDownloads} from './downloads.js?v=20261117-preview20';
import {renderAccount,renderAbout} from './account.js?v=20261117-preview20';
import {renderTraining,refreshTraining,renderLesson} from './training.js?v=20261117-preview20';
import {renderHome} from './home.js?v=20261117-preview20';
import {renderSidebar} from './sidebar.js?v=20261117-preview20';
import {createAccountState} from './account-state.js?v=20261117-preview20';
import {lessonById} from './lessons-data.js?v=20261117-preview20';
import {renderAgent} from './agent.js?v=20261117-preview20';
import {followWorkbench} from './sticky-workbench.js?v=20261117-preview20';
import {bindHomeMotion} from './home-motion.js?v=20261117-preview20';
import {bindHeroHover} from './home-hover.js?v=20261117-hover4';

initFooter();

async function start() {
  await window.PlatformLayout?.ready;
  const data = await loadData();
  const presentManual=manualPresentation(data.manual);
  const store = createLocalAdapter(data);
  const main = document.getElementById('main');
  initPhotoCards(main);
  const sidebar = document.getElementById('sidebar');
  const side = document.getElementById('sidebar-content');
  const frame = document.getElementById('frame');
  const menuButton = document.getElementById('toggle-menu');
  followWorkbench();
  const filters = {category:'Все',search:''};
  const learningFilters = {kind:'Все',search:''};
  const account=createAccountState();
  const benches = new Map();
  const benchFor = id => {
    if (!benches.has(id)) benches.set(id,newBench(data.byId.get(id)));
    return benches.get(id);
  };
  let route = parseRoute(data);
  let menuOpen = false;
  let menuReturn=menuButton;
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
    menuButton.setAttribute('aria-label',menuOpen?'Закрыть каталог':'Открыть каталог');
    const mobileMenu=layoutMedia('(max-width:700px)').matches;
    document.querySelectorAll('[data-menu-trigger]').forEach(button=>{
      const navigationOnly=mobileMenu&&(button.dataset.headerPage==='catalog'||button.matches('.hero-brand-symbol'));
      if(navigationOnly){button.removeAttribute('aria-expanded');button.removeAttribute('aria-controls');}
      else{button.setAttribute('aria-expanded',String(menuOpen));button.setAttribute('aria-controls','sidebar');}
      if(button.matches('.hero-brand-symbol'))button.setAttribute('aria-label',mobileMenu?'Главная':'Открыть каталог');
      if(button.matches('.header-logo,.hero-menu-trigger'))button.setAttribute('aria-label',mobileMenu?'Открыть меню':'Открыть каталог');
    });
    document.getElementById('close-menu').setAttribute('aria-label',mobileMenu?'Закрыть меню':'Закрыть каталог');
    sidebar.inert = !menuOpen;
    sidebar.setAttribute('aria-hidden',String(!menuOpen));
    document.body.classList.remove('menu-open');
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
  }
  function setMenu(open,restore = true) {
    if(open)menuReturn=document.activeElement?.closest?.("[data-menu-trigger],#toggle-menu") || menuButton;
    menuOpen = open;
    syncMenu();
    if(open) { positionMenu(); focusElement(side.querySelector('[aria-current="page"]') || side.querySelector('a')); }
    else if (restore) {
      const available=menuReturn?.isConnected&&menuReturn.getClientRects().length;
      const homeTrigger=layoutMedia('(max-width:700px)').matches?'.hero-menu-trigger':'.hero-brand-symbol';
      const fallback=route.page==='about'?main.querySelector(homeTrigger):document.querySelector('.header-logo');
      focusElement(available?menuReturn:fallback||menuButton);
    }
  }
  function positionMenu() {
    const viewport=layoutWidth();
    const content=layoutRect(frame);
    const safe=getComputedStyle(document.body);
    const left=parseFloat(safe.paddingLeft)||0,right=parseFloat(safe.paddingRight)||0;
    const width=Math.min(284,viewport-left-right-24);
    const aside=content.left-left>=width+52;
    sidebar.style.width=`${width}px`;
    sidebar.style.left=`${aside?Math.max(left,content.left-width-48):left}px`;
    sidebar.dataset.placement=aside?'aside':'overlay';
    document.documentElement.style.setProperty('--platform-header-height',`${document.getElementById('top').offsetHeight}px`);
  }
  new ResizeObserver(positionMenu).observe(document.getElementById('top'));
  window.addEventListener('resize',positionMenu);
  window.addEventListener('platform:layout',positionMenu);
  window.addEventListener('scroll',positionMenu,{passive:true});
  layoutMedia('(max-width:700px)').addEventListener('change',()=>{
    syncMenu();
    if(route.page==='catalog'&&main.dataset.view==='catalog')refreshCatalog(data,store,filters);
  });
  positionMenu();
  function syncHeader() {
    const headerNames={catalog:'Каталог инструментов',training:'Обучение: курсы и лекции',saved:'Избранное',account:'Личный кабинет',agent:'AI агент',about:'Главная','not-found':'Страница не найдена'};
    const pageName=route.page==='tool'?data.byId.get(route.id).name:route.page==='lesson'?(lessonById(route.id).cardTitle||lessonById(route.id).title):headerNames[route.page]||headerNames['not-found'];
    document.getElementById('section-page-name').textContent=pageName;
    const selected = route.page==='tool'||route.page==='saved' ? 'catalog' : route.page==='lesson' ? 'training' : route.page;
    document.querySelectorAll('[data-header-page]').forEach(link => {
      if (link.dataset.headerPage===selected) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    const learning=route.page==='training'||route.page==='lesson';
    document.getElementById('search').value=learning?learningFilters.search:filters.search;
    document.getElementById('search').setAttribute('aria-label',learning?'Поиск обучения':'Поиск инструмента');
    document.getElementById('header-search').setAttribute('aria-label',learning?'Поиск по обучению':'Поиск по каталогу инструментов');
    positionMenu();
  }

  function renderSide() { renderSidebar(side,data,store,route); }
  function updateChapter() {
    document.querySelectorAll('.chapter-link,.side-chapter-link').forEach(link => {
      if (link.dataset.chapterId===route.anchor) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  let releaseHomeMotion=()=>{};
  function renderPage() {
    releaseHomeMotion();releaseHomeMotion=()=>{};
    main.dataset.view=route.page==='tool'?`tool/${route.id}`:route.page==='lesson'?`lesson/${route.id}`:route.page;
    renderSide();
    syncHeader();
    if (route.page==='catalog') renderCatalog(main,data,store,filters);
    else if (route.page==='tool') renderDetail(main,data.byId.get(route.id),data,store,benchFor(route.id));
    else if (route.page==='saved') renderFavorites(main,data,store);
    else if (route.page==='account') renderAccount(main,data,store,account);
    else if (route.page==='about') renderHome(main,data,store);
    else if (route.page==='training') renderTraining(main,data,learningFilters,account);
    else if (route.page==='lesson') renderLesson(main,route.id,data,account);
    else if (route.page==='agent') renderAgent(main);
    else main.innerHTML = `<section class="panel surface-light"><p class="eyebrow">СТРАНИЦА НЕ НАЙДЕНА</p><h1>Проверьте адрес</h1><p>Такого инструмента или раздела нет в каталоге.</p><div class="empty-actions"><a class="btn primary" href="#catalog">ОТКРЫТЬ КАТАЛОГ ${arrow()}</a></div></section>`;
    const names = {catalog:'Каталог',saved:'Избранное',account:'Личный кабинет',about:'Главная',training:'Обучение',lesson:'Обучение',agent:'AI агент','not-found':'Страница не найдена'};
    document.title = `${route.page==='tool'?data.byId.get(route.id).name:route.page==='lesson'?lessonById(route.id).title:names[route.page]} — Платформа инструментов Гардари`;
    const description = route.page==='tool' ? data.byId.get(route.id).summary : '13 авторских методов исследования, мышления, моделирования и работы с ИИ.';
    document.querySelector('meta[name="description"]').content = description;
    syncHeader();
    syncMenu();
    updateStorageNotice();
    updateChapter();
    downloads.refresh();
    presentManual(data.manual);
    if(route.page==='about'){
      const releaseMotion=bindHomeMotion(main),releaseHover=bindHeroHover(main);
      releaseHomeMotion=()=>{releaseHover();releaseMotion();};
    }
    window.dispatchEvent(new CustomEvent('platform:rendered',{detail:{catalog:data.catalog}}));
  }
  function applyRoute(initial = false) {
    const next = parseRoute(data);
    const sameTool = next.page==='tool' && route.page==='tool' && next.id===route.id;
    route = next;
    if (!sameTool || !main.querySelector('.detail-main') || initial) renderPage();
    else updateChapter();
    requestAnimationFrame(() => {
      const target = route.anchor ? document.getElementById(route.anchor) : null;
      if (target) focusElement(target,true);
      else {
        window.scrollTo({top:0,left:0,behavior:'instant'});
        if (!initial) focusElement(main.querySelector('.filters-only')?document.getElementById('section-page-title'):main.querySelector('h1') || main);
      }
    });
  }
  const downloads = createDownloads(data,store,() => {
    updateStorageNotice();
    if (route.page==='account') {renderPage();focusElement(main.querySelector('h1'));}
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
    renderSide();
  }
  function favorite(id,button) {
    if (!data.byId.has(id)) return;
    const oldIndex = [...main.querySelectorAll('[data-action="star"]')].indexOf(button);
    const saved = store.toggleFavorite(id);
    if (route.page==='account') renderPage();
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
    const menuTrigger=event.target.closest('[data-menu-trigger]');
    if(menuTrigger){
      event.preventDefault();
      const catalog=menuTrigger.dataset.headerPage==='catalog';
      const mobileMenu=layoutMedia('(max-width:700px)').matches;
      if(catalog){
        filters.category='Все';filters.search='';document.getElementById('search').value='';
        if(route.page==='catalog')renderPage();
        else location.hash='#catalog';
        if(mobileMenu)return;
      }
      if(mobileMenu&&menuTrigger.matches('.hero-brand-symbol')){window.scrollTo({top:0,left:0,behavior:'instant'});return;}
      setMenu(true);return;
    }
    if(event.target.closest('#close-menu')){setMenu(false);return;}
    if(event.target.closest('[data-full-catalog]')){
      filters.category='Все';filters.search='';document.getElementById('search').value='';
      if(route.page==='catalog')renderPage();
    }
    const scrollLink = event.target.closest('[data-scroll-to],.skip-link');
    if (scrollLink) {
      event.preventDefault();
      if (scrollLink.classList.contains('skip-link')) focusElement(main,true);
      else {
        focusElement(document.getElementById('top'));
        window.scrollTo({top:0,left:0,behavior:'instant'});
      }
      return;
    }
    const filterLink = event.target.closest('[data-filter-link]');
    if (filterLink) {
      filters.category = filterLink.dataset.filterLink;
      filters.search = '';
      if (route.page==='catalog') {
        event.preventDefault();
        renderPage();
        focusElement(main.querySelector('h1'),true);
      }
    }
    const control = event.target.closest('[data-action]');
    if (control) {
      const action = control.dataset.action;
      if (action==='demo-signin') {account.signInDemo();renderPage();window.scrollTo({top:0,left:0,behavior:'instant'});focusElement(main.querySelector('h1'));}
      else if (action==='demo-signout') {account.signOut();renderPage();window.scrollTo({top:0,left:0,behavior:'instant'});focusElement(main.querySelector('.account-profile h2'));}
      else if (action==='account-section') focusElement(document.getElementById(control.dataset.section),true);
      else if (action==='learning-save') {account.toggleLesson(control.dataset.lesson);renderPage();focusElement(main.querySelector(`[data-action="learning-save"][data-lesson="${control.dataset.lesson}"]`));}
      else if (action==='learning-filter') {learningFilters.kind=control.dataset.kind;refreshTraining(data,learningFilters,account);}
      else if (action==='learning-reset') {learningFilters.kind='Все';learningFilters.search='';document.getElementById('search').value='';refreshTraining(data,learningFilters,account);}
      else if (action==='filter') {filters.category=control.dataset.cat;refreshCatalog(data,store,filters);}
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
    if (event.target.id==='search') {
      if(route.page==='training'||route.page==='lesson') {learningFilters.search=event.target.value;if(route.page==='training')refreshTraining(data,learningFilters,account);}
      else {filters.search=event.target.value;if(route.page==='catalog')refreshCatalog(data,store,filters);}
    }
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
    if (menuOpen && event.key==='Escape') {event.preventDefault();setMenu(false);return;}
    const tab=event.target.closest('[role="tab"]');
    if (tab && ['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) {
      event.preventDefault();
      const tabs=[...document.querySelectorAll('.bench-tabs [role="tab"]')];
      const index=tabs.indexOf(tab);
      const target=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[target].click();
    }
  });
  menuButton.addEventListener('click',()=>{filters.category='Все';filters.search='';location.hash='#catalog';setMenu(true);});
  document.getElementById('header-search').addEventListener('submit',event=>{
    event.preventDefault();
    if(route.page==='training'||route.page==='lesson'){
      learningFilters.search=document.getElementById('search').value;
      if(route.page==='training'){renderPage();window.scrollTo({top:0,left:0,behavior:'instant'});focusElement(main.querySelector('h1'));}
      else location.hash='#training';
      return;
    }
    filters.search=document.getElementById('search').value;
    filters.category='Все';
    if(route.page==='catalog'){renderPage();window.scrollTo({top:0,left:0,behavior:'instant'});focusElement(main.querySelector('h1'));}
    else location.hash='#catalog';
  });
  window.addEventListener('hashchange',()=>applyRoute());
  window.addEventListener('storage',event=>{
    if(event.key===account.key){account.refresh();if(['training','lesson','account'].includes(route.page))renderPage();return;}
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
      renderPage();
      main.querySelectorAll('details').forEach((item,index)=>{item.open=!!openDetails[index];});
      if (focusedId) focusElement(document.getElementById(focusedId));
    }
    syncFavoriteControls();
  });
  if (!location.hash) history.replaceState(null,'','#about');
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
  document.dispatchEvent(new CustomEvent('platform:boot-ready',{detail:{error:false}}));
  const initialMenu=new URLSearchParams(location.search).get('catalog')==='open';
  if(initialMenu){
    setMenu(true);
    const cleanURL=new URL(location.href);cleanURL.searchParams.delete('catalog');
    history.replaceState(null,'',cleanURL.pathname+cleanURL.search+cleanURL.hash);
  }
}
start().catch(error => {
  document.getElementById('main').innerHTML = `<section class="panel surface-light"><h1>Не удалось загрузить каталог</h1><p>${E(error.message)}</p><p>Проверьте соединение и откройте страницу через локальный сервер или адрес сайта.</p><div class="empty-actions"><button class="btn primary" id="retry-load" type="button">ПОВТОРИТЬ</button></div></section>`;
  document.getElementById('retry-load').addEventListener('click',()=>location.reload());
  document.getElementById('sidebar').inert=true;
  document.dispatchEvent(new CustomEvent('platform:boot-ready',{detail:{error:true}}));
});
