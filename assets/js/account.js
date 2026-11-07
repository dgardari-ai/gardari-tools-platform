import {E,arrow} from './utils.js';
import {card} from './catalog.js';
import {learningCard} from './training.js';
import {LESSONS} from './lessons-data.js';
import {createAccountState} from './account-state.js';

export function renderAccount(main,data,store,account=createAccountState()) {
  const state=store.snapshot(), signed=account.signedIn();
  const selected=data.catalog.filter(t=>state.favorites.includes(t.id));
  const lessons=LESSONS.filter(x=>account.savedLessons().includes(x.id));
  const empty=(text,href,label)=>`<div class="library-empty"><p>${text}</p>
    <a class="btn light" href="${href}">${label} ${arrow()}</a></div>`;
  const library=signed?`
    <div class="catalog-intro"><h1 class="catalog-heading">
      <span class="catalog-heading-square" aria-hidden="true"></span><span class="catalog-heading-text">МОЯ БИБЛИОТЕКА</span>
    </h1></div>
    <section class="library-section" id="library-tools"><h2>Выбранные инструменты</h2>
      ${selected.length?`<div class="account-card-grid catalog-grid">${selected.map(t=>card(t,data,store)).join('')}</div>`:empty('Вы пока не выбрали инструменты.','#catalog','ВЫБРАТЬ ИНСТРУМЕНТ')}
    </section>
    <section class="library-section" id="library-learning"><h2>Моё обучение</h2>
      ${lessons.length?`<div class="account-card-grid catalog-grid">${lessons.map(x=>learningCard(x,account)).join('')}</div>`:empty('Сохраните интересующие мини-курсы и лекции.','#training','ПОСМОТРЕТЬ ОБУЧЕНИЕ')}
    </section>
    <section class="library-section library-purchased"><h2>Приобретённые материалы</h2>
      <p>Приобретённых инструментов и курсов пока нет. Подписка и платежи пока не подключены.</p>
    </section>
    <section class="library-section" id="download-history"><h2>Полученные образцы</h2>
      ${state.downloads.length?state.downloads.map(item=>{
        const t=data.byId.get(item.productId);
        return `<div class="activity-row"><a href="#tool/${t.id}">${E(t.name)}</a>
          <button class="text-link" data-action="download" data-id="${t.id}" data-index="${item.formatIndex}">ПОЛУЧИТЬ СНОВА ${arrow()}</button></div>`;
      }).join(''):'<p>Здесь появятся полученные ознакомительные файлы.</p>'}
    </section>`:'';
  const profile=signed?`
    <div class="profile-person"><span class="profile-avatar" aria-hidden="true">Д</span>
      <div><h2>Демо-профиль</h2><p>Почта не привязана</p></div>
    </div>
    <p class="profile-badge">ДЕМОНСТРАЦИОННЫЙ ДОСТУП</p>
    <nav class="profile-nav" aria-label="Материалы кабинета">
      <button data-action="account-section" data-section="library-tools">Инструменты <span>${selected.length}</span></button>
      <button data-action="account-section" data-section="library-learning">Обучение <span>${lessons.length}</span></button>
      <button data-action="account-section" data-section="download-history">Образцы <span>${state.downloads.length}</span></button>
    </nav>
    <details class="profile-details"><summary>Мой доступ</summary>
      <p>Открытая демонстрационная библиотека. Подписка и платежи пока не подключены.</p>
      <p>Выбранные материалы сохранены в этом браузере. Выбор не означает покупку или доступ к готовящемуся курсу.</p>
    </details>
    <details class="profile-details"><summary>Настройки</summary>
      <label class="profile-check"><input type="checkbox" id="remember-history" ${state.settings.rememberHistory?'checked':''}> Сохранять историю новых образцов</label>
    </details>
    <button class="btn light profile-logout" data-action="demo-signout">ВЫЙТИ ${arrow()}</button>`:`
    <h1 class="visually-hidden">Личный кабинет</h1>
    <h2>вход в кабинет</h2><p>Ваши инструменты и обучение — в одном месте.</p>
    <div class="profile-email">
      <label for="account-email">ЭЛЕКТРОННАЯ ПОЧТА</label>
      <input id="account-email" type="email" placeholder="name@example.com" disabled autocomplete="off">
      <button class="btn light" disabled>ПОЛУЧИТЬ КОД ${arrow()}</button>
      <p class="profile-note">Вход по email ещё не подключён.</p>
    </div>
    <div class="profile-demo"><p class="profile-badge">ДЕМОНСТРАЦИОННЫЙ ДОСТУП</p>
      <button class="btn primary" data-action="demo-signin">ДЕМО-ВХОД ${arrow()}</button>
      <p class="profile-note">Без регистрации и ввода личных данных.</p>
    </div>
    <details class="profile-details"><summary>Как устроен доступ</summary>
      <p>В демо-кабинете можно увидеть выбранные инструменты, обучение и историю образцов. Подписка и платежи пока не подключены.</p>
    </details>`;
  main.innerHTML=`<div class="account-layout ${signed?'is-signed-in':'is-signed-out'}">
    <div class="account-library" ${signed?'':'data-account-empty="true" aria-hidden="true"'}>${library}</div>
    <aside class="workbench account-profile" id="account-profile" aria-label="${signed?'Профиль':'Вход в личный кабинет'}">
      <div class="worktop">${signed?'ПРОФИЛЬ':'ЛИЧНЫЙ КАБИНЕТ'}</div>
      <div class="work-content">${profile}</div>
    </aside></div>`;
}
export function renderAbout(main,data) {
  main.innerHTML = `<section class="panel surface-light page-intro"><p class="eyebrow">О ПЛАТФОРМЕ</p><h1 class="headline">знание становится инструментом</h1><p class="leadin">Платформа инструментов Гардари объединяет авторские способы исследования, мышления, проектирования и совместной работы с ИИ. Пользователь может познакомиться с методом, понять его основания и применить в собственной задаче.</p></section><section class="panel surface-blue"><p class="eyebrow">01 / КАК УСТРОЕНО</p><h2>от вопроса к работе</h2><div class="essence-grid"><div class="essence-card"><p class="eyebrow">НАЙТИ</p><p>Выберите направление, найдите инструмент по названию или назначению.</p></div><div class="essence-card"><p class="eyebrow">ПОНЯТЬ</p><p>Изучите короткую вводную часть либо полное описание метода и его оснований.</p></div><div class="essence-card"><p class="eyebrow">ПРИМЕНИТЬ</p><p>Выберите рабочую среду, получите образец инструмента и продолжите с собственной задачей.</p></div></div></section><section class="panel surface-white"><p class="eyebrow">02 / НАПРАВЛЕНИЯ</p><h2>единая библиотека, разные способы работы</h2>${data.groups.map(group => `<div class="activity-row"><span><span class="num">${group.n}.0</span> ${E(group.name)}</span><a href="#catalog" data-filter-link="${E(group.id)}" class="text-link">СМОТРЕТЬ ${arrow()}</a></div>`).join('')}<p class="caption">Разные инструменты имеют разные основания, требования и формы применения. Библиотека сохраняет их самостоятельность, связывая одной понятной средой поиска, объяснения и получения.</p></section><section class="panel surface-almost"><p class="eyebrow">03 / ТЕКУЩАЯ ВЕРСИЯ</p><h2>попробовать на своей задаче</h2><p>В открытой демонстрации доступны каталог, полные описания, сборка запросов и ознакомительные файлы. Работа модели выполняется в вашей ИИ-среде. Подписка, аккаунты и доставка полных установочных пакетов будут подключены отдельно.</p><p>Избранное и история загрузок сохраняются локально в браузере. Текст рабочей задачи остаётся в памяти открытой страницы и не отправляется на сервер.</p></section>`;
}
