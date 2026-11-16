import {E} from './utils.js';
import {chapterRoute} from './router.js';
export function renderSidebar(side,data,store,route) {
 const selected=route.page==='tool'||route.page==='saved'?'catalog':route.page==='lesson'?'training':route.page;
 const sections=[['about','ГЛАВНАЯ'],['catalog','ИНСТРУМЕНТЫ'],['training','ОБУЧЕНИЕ'],['account','ЛИЧНЫЙ КАБИНЕТ']];
 const nav=tool=>{
  const active=route.page==='tool'&&route.id===tool.id;
  const chapters=active?`<nav class="side-chapters" aria-label="Оглавление ${E(tool.name)}">${tool.sections.map((part,i)=>`<a class="side-chapter-link" data-chapter-id="section-${tool.id}-${i+1}" href="${chapterRoute(tool.id,i+1)}"${route.anchor===`section-${tool.id}-${i+1}`?' aria-current="location"':''}><span>${String(i+1).padStart(2,'0')}</span>${E(part.title)}</a>`).join('')}<a href="#tool/${tool.id}/workbench">Рабочее окно</a><a href="#tool/${tool.id}/guide">Как начать</a></nav>`:'';
  return `<div class="side-tool-entry"><a href="#tool/${tool.id}" class="side-link ${active?'active':''}" ${active?'aria-current="page"':''}><span class="num">${tool.code}</span><span>${E(tool.name)}</span></a>${chapters}</div>`;
 };
 const favorites=data.catalog.filter(tool=>store.isFavorite(tool.id));
 side.innerHTML=`<nav class="side-nav" aria-label="Инструменты Платформы"><div class="side-main-pages">${sections.map(([id,label])=>`<a href="#${id}"${id==='catalog'?' data-full-catalog':''}${id===selected?' aria-current="page"':''}><span class="nav-dot" aria-hidden="true"></span><span class="side-page-label">${label}<i class="side-label-baseline" aria-hidden="true"></i></span></a>`).join('')}</div><div class="side-catalog"><section class="side-section side-tool-section side-favorites${favorites.length?'':' is-empty'}"><h2 class="side-section-title"><a href="#saved">ИЗБРАННОЕ <span id="side-favorite-count">${favorites.length}</span></a></h2><div class="side-tool-list" id="sidebar-favorite-tools">${favorites.map(nav).join('')||'<p class="side-empty-note">Пока нет выбранных</p>'}</div></section><section class="side-section side-tool-section side-all-tools"><h2 class="side-section-title"><a href="#catalog" data-full-catalog>ВСЕ ИНСТРУМЕНТЫ</a></h2><div class="side-tool-list">${data.catalog.map(nav).join('')}</div></section><a class="side-agent" href="#agent">AI АГЕНТ <span aria-hidden="true">›</span></a></div></nav>`;
}
