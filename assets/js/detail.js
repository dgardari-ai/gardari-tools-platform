import {E,arrow,number,paragraphs,list} from './utils.js';
import {chapterRoute} from './router.js';
import {renderBench} from './workbench.js';
import {renderToolGuide} from './tool-guide.js';
export function renderIntroText(text) {
  return E(text);
}
export function renderDetail(main,tool,data,store,bench) {
  const group = data.groups.find(g => g.id === tool.category);
  const kindLabel=tool.kind.charAt(0).toLocaleUpperCase('ru-RU')+tool.kind.slice(1);
  const toc = tool.sections.map((part,i) => `<a class="chapter-link" data-chapter-id="section-${tool.id}-${i+1}" href="${chapterRoute(tool.id,i+1)}"><span class="chapter-index">${number(i+1)}</span><span>${E(part.title)}</span>${arrow()}</a>`).join('');
  main.innerHTML = `<nav class="breadcrumb" aria-label="Путь"><a href="#catalog">КАТАЛОГ</a><span aria-hidden="true">/</span><a href="#catalog" data-filter-link="${E(group.id)}">${E(group.name)}</a><span aria-hidden="true">/</span><span>${E(tool.name)}</span></nav>
    <div class="detail-main">
      <section class="reading-panel reading-intro ${group.surface}" id="section-${tool.id}-intro">
        <div class="tool-intro-heading"><div class="tool-identity"><span class="tool-ident-meta"><span class="tool-code num">${tool.code}</span> <span>${E(kindLabel)}</span> <span class="tool-ident-name">${E(tool.name)}</span></span> <span class="tool-identity-separator" aria-hidden="true">/</span> <p class="eyebrow intro-small-label">${E(tool.eyebrow)}</p></div><h1 class="tool-intro-name">${E(tool.name)}</h1></div>
        <div class="intro-description"><h2>Суть инструмента</h2><p class="intro-summary">${renderIntroText(tool.summary)}</p></div>
        <div class="intro-features"><h2>Особенности работы</h2><div class="essence-grid" role="list">${tool.essence.map(item => `<div class="essence-card" role="listitem"><p>${E(item)}</p></div>`).join('')}</div></div>
        <div class="intro-actions"><button type="button" class="btn dark" data-action="download" data-id="${tool.id}">ПОЛУЧИТЬ ИНСТРУМЕНТ ${arrow()}</button><a class="btn light" href="#tool/${tool.id}/workbench" data-action="try">ПОПРОБОВАТЬ ${arrow()}</a></div>
        <div class="intro-index"><p class="eyebrow">ЧИТАТЬ ПОДРОБНО</p><nav class="chapter-links" aria-label="Разделы подробного описания">${toc}</nav></div>
      </section>
      <aside class="workbench" id="workbench" tabindex="-1" aria-label="Интерактивная работа с инструментом"><div class="worktop"><span>РАБОЧЕЕ ОКНО</span><span>ГАРДАРИ ${arrow()}</span></div><div class="work-content"><h2>попробовать метод</h2><p>Соберите запрос для своей задачи, посмотрите состав инструмента и выберите вариант получения.</p><div class="bench-tabs" role="tablist" aria-label="Режим рабочего окна">${[['trial','ПРОБА'],['guide','КАК РАБОТАЕТ'],['install','ПОЛУЧИТЬ']].map(([id,label]) => `<button type="button" id="tab-${id}" role="tab" data-action="bench" data-tab="${id}" aria-selected="${bench.tab===id}" tabindex="${bench.tab===id?0:-1}" aria-controls="bench-body">${label}</button>`).join('')}</div><div id="bench-body" role="tabpanel" tabindex="0" aria-labelledby="tab-${bench.tab}"></div></div></aside>
      <article class="detail-chapters" aria-label="Подробное описание инструмента">
        ${tool.sections.map((section,i) => `<section class="reading-panel reading-chapter surface-white" id="section-${tool.id}-${i+1}" tabindex="-1"><p class="eyebrow reading-kicker"><span class="chapter-number">${number(i+1)}</span></p><h2>${E(section.title)}</h2><div class="reading-prose">${paragraphs(section.paragraphs)}${section.bullets.length?`<ul>${list(section.bullets)}</ul>`:''}</div></section>`).join('')}
        <section class="reading-panel ${group.surface} start-last tool-delivery" id="section-${tool.id}-download" tabindex="-1"><h2>Получение инструмента</h2><p>Выберите вариант для своей среды. Сейчас доступен ознакомительный файл Markdown (текст с разметкой) с порядком работы и примером.</p><div class="cover-bottom"><button type="button" class="btn dark" data-action="download" data-id="${tool.id}">ПОЛУЧИТЬ ОБРАЗЕЦ ${arrow()}</button><button type="button" class="btn light" data-action="star" data-id="${tool.id}" aria-pressed="${store.isFavorite(tool.id)}">${store.isFavorite(tool.id)?'УБРАТЬ ИЗ ИЗБРАННОГО':'СОХРАНИТЬ В БИБЛИОТЕКУ'} ${arrow()}</button></div><div class="delivery-meta"><span>Образец · demo-1.0</span><a href="#tool/${tool.id}/guide">Как начать ${arrow()}</a></div></section>
        ${renderToolGuide(tool)}
      </article>
    </div>`;
  renderBench(tool,data,bench);
}
