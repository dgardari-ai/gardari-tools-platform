import {E,arrow} from './utils.js';
import {renderPhotoCard} from './photo-cards.js';
export function card(tool,data,store){return renderPhotoCard(tool,data,store);}
const normalize = text => text.toLocaleLowerCase('ru').replaceAll('ё','е');
export function refreshCatalog(data,store,filters) {
  const query = normalize(filters.search.trim());
  const group=data.groups.find(g=>g.id===filters.category);
  const pending=!query&&group&&!data.catalog.some(t=>t.category===group.id);
  const chosen = data.catalog.filter(tool => (filters.category === 'Все' || tool.category === filters.category) && (!query || normalize(JSON.stringify(tool)).includes(query)));
  document.getElementById('catalog-results').innerHTML = chosen.length ? `<div class="catalog-grid" aria-label="Инструменты">${chosen.map(t => card(t,data,store)).join('')}</div>` : `<div class="empty-result"><h2>${pending?E(group.name):'Ничего не найдено'}</h2><p>${pending?E(group.subtitle)+'. Раздел наполняется.':'Попробуйте другое слово или сбросьте фильтр.'}</p><div class="empty-actions"><button type="button" class="btn primary" data-action="reset">ПОКАЗАТЬ ВСЁ ${arrow()}</button></div></div>`;
  document.getElementById('result-count').textContent = `${chosen.length} / ${data.catalog.length} ИНСТРУМЕНТОВ`;
  document.querySelectorAll('[data-action="filter"]').forEach(button => button.setAttribute('aria-pressed',String(filters.category === button.dataset.cat)));
  document.getElementById('reset-filters').hidden = !filters.search && filters.category === 'Все';
}
export function renderCatalog(main,data,store,filters) {
  main.innerHTML = `<section class="panel catalog-panel"><div class="catalog-intro photo-catalog-intro"><h1 class="catalog-heading"><span class="catalog-heading-square" aria-hidden="true"></span><span class="catalog-heading-text">КАТАЛОГ ИНСТРУМЕНТОВ<span class="photo-catalog-baseline" aria-hidden="true"></span></span></h1><div class="catalog-controls" aria-label="Фильтр по типу инструмента">${[{id:'Все',name:'Все'},...data.groups].map(group => `<button type="button" class="filter" data-action="filter" data-cat="${E(group.id)}" aria-pressed="${filters.category === group.id}">${E(group.name)}</button>`).join('')}<button type="button" class="filter" data-action="reset" id="reset-filters">Сбросить</button><span class="catalog-count visually-hidden" id="result-count" role="status" aria-live="polite" aria-atomic="true"></span></div></div><div id="catalog-results"></div></section>`;
  refreshCatalog(data,store,filters);
}
export function renderFavorites(main,data,store) {
  const favorites = data.catalog.filter(t => store.isFavorite(t.id));
  main.innerHTML = `<section class="panel surface-yellow page-intro"><p class="eyebrow">5.1 / МОЯ БИБЛИОТЕКА</p><h1 class="headline">избранное</h1><p class="leadin">Сохраняйте часто используемые методы, чтобы быстро возвращаться к ним.</p></section><section class="panel catalog-panel favorites-panel">${favorites.length ? `<div class="catalog-grid">${favorites.map(t => card(t,data,store)).join('')}</div>` : `<div class="empty-result"><h2>Пока нет избранных инструментов</h2><p>Перейдите в каталог и отметьте интересующие карточки звёздочкой.</p><div class="empty-actions"><a href="#catalog" class="btn primary">ПЕРЕЙТИ В КАТАЛОГ ${arrow()}</a></div></div>`}</section>`;
}
