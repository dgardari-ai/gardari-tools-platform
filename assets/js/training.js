import {E,arrow} from './utils.js';
import {LESSONS,lessonById} from './lessons-data.js';
import {photoByTool} from './card-images.js';

const promoMark='<span class="learning-promo-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 11 7-11 7Z"/></svg></span>';

function lessonPresentation(item,data) {
 const tool=data?.byId.get(item.tool);
 const group=data?.groups.find(group=>group.id===tool?.category);
 return {tool,tone:group?.tone||'research',photo:photoByTool[item.tool]};
}

export function learningCard(item,account,data) {
 const saved=account?.savedLessons().includes(item.id)||false;
 const {tone,photo}=lessonPresentation(item,data);
 return `<div class="card-slot card-slot--sketch learning-card-slot" data-card-tone="${E(tone)}">
  <span class="card-index">${E(item.code)}</span>
  <article class="toolcard photo-card photo-card--sketch learning-card learning-photo-card tone-${E(tone)}" data-lesson-id="${E(item.id)}">
   <svg class="card-shell" aria-hidden="true"><path vector-effect="non-scaling-stroke"/></svg>
   <img class="card-photo" style="object-position:${E(photo.position)}" src="assets/images/catalog/${E(photo.src)}" alt="${E(photo.alt)}" width="600" height="600" decoding="async">${promoMark}
   <header class="card-heading"><div class="card-identity"><a class="card-name" href="#lesson/${E(item.id)}" aria-label="${E(item.title)}"><span class="card-name-text">${E(item.kind)}<span class="photo-name-baseline" aria-hidden="true"></span></span><span class="card-name-arrow" aria-hidden="true"><svg class="card-name-chevron" viewBox="0 4 24 16"><path d="m9 5 7 7-7 7"/></svg></span></a></div><h2 class="card-title cardtitle" id="lesson-title-${E(item.id)}"><span class="photo-title-baseline" aria-hidden="true"><span class="photo-title-cap"></span></span>${E(item.cardTitle||item.title)}</h2></header>
   <div class="card-copy"><div class="copy-block"><span class="copy-label">Для кого</span><p>${E(item.input)}</p></div><div class="copy-block"><span class="copy-label">Результат</span><p>${E(item.result)}</p></div></div>
   <div class="card-actions"><a class="card-cta card-details" href="#lesson/${E(item.id)}" aria-label="Читать подробно: ${E(item.title)}">Подробнее ${arrow()}</a><button class="star card-favorite ${saved?'saved':''}" type="button" data-action="learning-save" data-lesson="${E(item.id)}" aria-pressed="${saved}" aria-label="${saved?'Убрать из выбранного':'Выбрать'}: ${E(item.title)}"><span aria-hidden="true">${saved?'★':'☆'}</span></button></div>
  </article>
 </div>`;
}

export function refreshTraining(data,filters,account) {
 const query=filters.search.trim().toLocaleLowerCase('ru');
 const found=LESSONS.filter(x=>(filters.kind==='Все'||x.kind===filters.kind)&&(!query||JSON.stringify(x).toLocaleLowerCase('ru').includes(query)));
 document.getElementById('learning-results').innerHTML=found.length?`<div class="catalog-grid" aria-label="Курсы и лекции">${found.map(x=>learningCard(x,account,data)).join('')}</div>`:'<div class="empty-result"><h2>Ничего не найдено</h2><p>Попробуйте другое слово или сбросьте фильтр.</p><button class="btn primary" data-action="learning-reset">ПОКАЗАТЬ ВСЁ</button></div>';
 document.querySelectorAll('[data-action="learning-filter"]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.kind===filters.kind)));
 document.getElementById('learning-reset').hidden=filters.kind==='Все'&&!query;
 document.getElementById('learning-count').textContent=`Найдено материалов: ${found.length}`;
}

export function renderTraining(main,data,filters={kind:'Все',search:''},account) {
 main.innerHTML=`<section class="panel catalog-panel learning-catalog"><div class="catalog-intro photo-catalog-intro"><h1 class="catalog-heading"><span class="catalog-heading-square" aria-hidden="true"></span><span class="catalog-heading-text">ОБУЧЕНИЕ: КУРСЫ И ЛЕКЦИИ<span class="photo-catalog-baseline" aria-hidden="true"></span></span></h1><div class="catalog-controls" aria-label="Формат обучения">${['Все','Мини-курс','Лекция'].map((kind,i)=>`<button class="filter" data-action="learning-filter" data-kind="${kind}" aria-pressed="${filters.kind===kind}">${['ВСЁ','МИНИ-КУРСЫ','ЛЕКЦИИ'][i]}</button>`).join('')}<button class="filter reset" id="learning-reset" data-action="learning-reset" hidden>СБРОСИТЬ</button><span class="visually-hidden" id="learning-count" role="status" aria-live="polite" aria-atomic="true"></span></div></div><div id="learning-results"></div></section>`;
 refreshTraining(data,filters,account);
}

export function renderLesson(main,id,data,account) {
 const item=lessonById(id),saved=account.savedLessons().includes(id);
 const {tool,tone,photo}=lessonPresentation(item,data);
 const title=item.cardTitle||item.title;
 main.innerHTML=`<div class="detail-main lesson-page learning-lesson-page">
  <div class="tool-intro-slot"><section class="reading-panel reading-intro reading-intro--photo-right" id="section-lesson-${E(id)}-intro" data-intro-tone="${E(tone)}">
   <span class="intro-code">${E(item.code)}</span>
   <img class="intro-photo" src="assets/images/catalog/${E(photo.src)}" alt="${E(photo.alt)}" style="object-position:${E(photo.position)}" width="600" height="600" decoding="async">${promoMark}
   <div class="tool-intro-heading"><div class="tool-identity"><span>${E(item.kind)}</span></div>${title!==item.title?`<p class="tool-intro-name">${E(item.title)}</p>`:''}<h1 class="intro-card-title" id="section-lesson-${E(id)}-title">${E(title)}</h1></div>
   <div class="intro-description"><h2>О материале</h2><p class="intro-summary">${E(item.how)}</p></div>
   <div class="intro-features"><h2>На занятиях</h2><div class="essence-grid" role="list">${item.work.map(x=>`<div class="essence-card" role="listitem"><p>${E(x)}</p></div>`).join('')}</div></div>
   <div class="lesson-outcomes"><div><h2>Для кого</h2><p>${E(item.input)}</p></div><div><h2>Результат</h2><p>${E(item.result)}</p></div></div>
   <div class="intro-index lesson-program"><h2>План материала</h2><ol class="lesson-outline">${item.outline.map(x=>`<li>${E(x)}</li>`).join('')}</ol></div>
  </section></div>
  <aside class="workbench lesson-panel" aria-label="Выбрать учебный материал"><div class="worktop"><span>ОБУЧЕНИЕ</span><span>${E(item.code)}</span></div><div class="work-content"><h2>${E(item.kind)}</h2><p>Можно сохранить материал в выбранном и попробовать связанный инструмент.</p><button class="btn primary benchbtn" data-action="learning-save" data-lesson="${E(id)}" aria-pressed="${saved}">${saved?'УБРАТЬ ИЗ ВЫБРАННОГО':'ВЫБРАТЬ МАТЕРИАЛ'} ${arrow()}</button><a class="btn light benchbtn" href="#tool/${E(tool.id)}/workbench">ПРОБА ИНСТРУМЕНТА ${arrow()}</a><a class="lesson-back" href="#training">Вернуться к обучению</a></div></aside>
 </div>`;
}
