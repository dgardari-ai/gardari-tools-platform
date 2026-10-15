import {E,arrow} from './utils.js';
export function card(tool, data, store) {
  const group = data.groups.find(g => g.id === tool.category);
  const saved = store.isFavorite(tool.id);
  const content = tool.card;
  return `<article class="toolcard tone-${group.tone}" data-tool-id="${tool.id}" data-code="${tool.code}">
    <a class="cardlink clickable" href="#tool/${tool.id}" aria-labelledby="card-title-${tool.id} card-name-${tool.id}">
      <span class="cardtop"><span class="cardnum num">${tool.code}</span><span class="card-name" id="card-name-${tool.id}">${E(tool.name)} ${arrow()}</span></span>
      <h2 class="cardtitle" id="card-title-${tool.id}">${E(tool.cardTitle)}</h2>
      <span class="card-how">${E(content.how)}</span>
      <span class="card-workzone">
        <span class="card-workmain"><span class="card-worklabel">В РАБОТЕ</span><span class="card-featurelist">${content.work.map(item => `<span class="card-feature">${E(item)}</span>`).join('')}</span></span>
        <span class="card-example"><span class="card-example-label">НАПРИМЕР</span><span class="card-example-copy">«${E(content.example)}»</span></span>
      </span>
      <span class="card-bottom-info">
        <span class="card-meta-block card-use"><span class="card-meta-label">КОГДА ПРИГОДИТСЯ</span><span class="card-meta-copy">${E(content.input)}</span></span>
        <span class="card-meta-block card-outcome"><span class="card-meta-label">РЕЗУЛЬТАТ</span><span class="card-meta-copy card-result">${E(content.result)}</span></span>
      </span>
    </a>
    <div class="cardbottom"><a class="card-cta" href="#tool/${tool.id}" aria-label="Читать подробно: ${E(tool.name)}">ПОДРОБНЕЕ ${arrow()}</a><button type="button" class="star ${saved?'saved':''}" data-action="star" data-id="${tool.id}" aria-pressed="${saved}" aria-label="${saved?'Убрать из избранного':'Добавить в избранное'}: ${E(tool.name)}"><span aria-hidden="true">${saved?'★':'☆'}</span></button></div>
  </article>`;
}
const normalize = text => text.toLocaleLowerCase('ru').replaceAll('ё','е');
export function refreshCatalog(data,store,filters) {
  const query = normalize(filters.search.trim());
  const chosen = data.catalog.filter(tool => (filters.category === 'Все' || tool.category === filters.category) && (!query || normalize(JSON.stringify(tool)).includes(query)));
  document.getElementById('catalog-results').innerHTML = chosen.length ? `<div class="catalog-grid" aria-label="Инструменты">${chosen.map(t => card(t,data,store)).join('')}</div>` : `<div class="empty-result"><h2>Ничего не найдено</h2><p>Попробуйте другое слово или сбросьте фильтр.</p><div class="empty-actions"><button type="button" class="btn primary" data-action="reset">ПОКАЗАТЬ ВСЁ ${arrow()}</button></div></div>`;
  document.getElementById('result-count').textContent = `${chosen.length} / ${data.catalog.length} ИНСТРУМЕНТОВ`;
  document.querySelectorAll('[data-action="filter"]').forEach(button => button.setAttribute('aria-pressed',String(filters.category === button.dataset.cat)));
  document.getElementById('reset-filters').hidden = !filters.search && filters.category === 'Все';
}
export function renderCatalog(main,data,store,filters) {
  main.innerHTML = `<section class="panel catalog-panel"><div class="catalog-intro"><div><h1>0.0 КАТАЛОГ ИНСТРУМЕНТОВ</h1><p class="catalog-subhead">Выберите инструмент Гардари в каталоге или воспользуйтесь поиском.</p></div><div class="catalog-tools"><label class="searchbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.4"/><path d="m15.5 15.5 5.2 5.2"/></svg><input id="search" type="search" aria-label="Поиск инструмента" placeholder="Найти инструмент…" autocomplete="off" value="${E(filters.search)}"></label></div></div><div class="catalog-controls" aria-label="Фильтр по направлению">${['Все',...data.groups.map(g => g.id)].map(category => `<button type="button" class="filter" data-action="filter" data-cat="${E(category)}" aria-pressed="${filters.category === category}">${E(category)}</button>`).join('')}<button type="button" class="filter" data-action="reset" id="reset-filters">Сбросить</button><span class="catalog-count" id="result-count" role="status" aria-live="polite" aria-atomic="true"></span></div><div id="catalog-results"></div></section>`;
  refreshCatalog(data,store,filters);
}
export function renderFavorites(main,data,store) {
  const favorites = data.catalog.filter(t => store.isFavorite(t.id));
  main.innerHTML = `<section class="panel surface-yellow page-intro"><p class="eyebrow">5.1 / МОЯ БИБЛИОТЕКА</p><h1 class="headline">избранное</h1><p class="leadin">Сохраняйте часто используемые методы, чтобы быстро возвращаться к ним.</p></section><section class="panel catalog-panel favorites-panel">${favorites.length ? `<div class="catalog-grid">${favorites.map(t => card(t,data,store)).join('')}</div>` : `<div class="empty-result"><h2>Пока нет избранных инструментов</h2><p>Перейдите в каталог и отметьте интересующие карточки звёздочкой.</p><div class="empty-actions"><a href="#catalog" class="btn primary">ПЕРЕЙТИ В КАТАЛОГ ${arrow()}</a></div></div>`}</section>`;
}
