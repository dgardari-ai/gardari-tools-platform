import {E} from './utils.js';

export function renderSidebar(side,data,store,route) {
 const nav=tool=>`<a href="#tool/${tool.id}" class="side-link ${route.page==='tool'&&route.id===tool.id?'active':''}" ${route.page==='tool'&&route.id===tool.id?'aria-current="page"':''}><span class="num">${tool.code}</span><span>${E(tool.name)}</span></a>`;
 const favorites=data.catalog.filter(tool=>store.isFavorite(tool.id));
 side.innerHTML=`<nav class="side-nav" aria-label="Инструменты Платформы">
  <p class="side-head">ПЛАТФОРМА ИНСТРУМЕНТОВ</p>
  <section class="side-section side-tool-section side-favorites"><h2 class="side-section-title"><a href="#saved">ИЗБРАННЫЕ <span id="side-favorite-count">${favorites.length}</span></a></h2><div class="side-tool-list" id="sidebar-favorite-tools">${favorites.map(nav).join('')||'<p class="side-empty-note">Пока нет выбранных</p>'}</div></section>
  <section class="side-section side-tool-section side-all-tools"><h2 class="side-section-title">ВСЕ ИНСТРУМЕНТЫ</h2><div class="side-tool-list">${data.catalog.map(nav).join('')}</div></section>
 </nav>`;
}
