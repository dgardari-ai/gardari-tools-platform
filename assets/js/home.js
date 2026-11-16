import {E,arrow} from './utils.js';
import {commentsMarkup,bindComments} from './home-comments.js';

const FAQ=[
 ['Что это за платформа и кому она полезна?',[
  'Это собрание авторских методов Дениса Гардари, превращённых в инструменты для конкретных задач. Они помогают исследовать незнакомую тему, находить смысловые связи, проверять замысел, разбирать противоречия и рассматривать возможное развитие ситуации. Для каждого инструмента показано, когда он уместен, как работает и к какому результату ведёт.',
  'Начать можно со своей рабочей, учебной или творческой задачи. Платформа помогает выбрать способ действия и организовать работу с ИИ. Оценка оснований, выбор решения и ответственность за применение результата остаются у человека.'
 ]],
 ['Как подобрать инструмент под свою задачу?',[
  'Сначала сформулируйте, что именно нужно изменить: разобраться в вопросе, увидеть новую связь, построить модель или наладить работу с ИИ. Затем выберите соответствующий раздел каталога. Крупные названия карточек описывают задачи обычным языком; ниже указаны ход работы, условия применимости и ожидаемый результат.',
  'Сопоставьте результат инструмента с тем, что вам сейчас нужно. На подробной странице можно прочитать суть метода и его ограничения, а в рабочем окне — выбрать подходящее применение. Если точного совпадения нет, воспользуйтесь поиском по задаче или начните с исследования темы.'
 ]],
 ['Как попробовать метод в работе?',[
  'Откройте страницу инструмента и перейдите к рабочему окну. Опишите свою задачу, выберите применение и укажите, что считать полезным результатом. Можно начать с готового примера: он помогает понять, какой конкретности ждёт метод. Окно соберёт из этих условий запрос.',
  'Скопируйте запрос и передайте своему ИИ вместе с необходимыми материалами. Сейчас сама Платформа не вызывает внешнюю модель. Полученный ответ стоит проверить по источникам и условиям задачи, затем уточнить запрос. Ознакомительный файл можно скачать, чтобы сохранить описание и порядок работы с методом.'
 ]],
 ['Нужна ли подготовка и что даёт обучение?',[
  'Для первого знакомства специальная подготовка не обязательна. Достаточно понятной задачи и готовности проверить, помогает ли предложенный способ работы. Начните с краткого описания и примера; к подробным основаниям метода можно вернуться, когда появится собственный опыт его применения.',
  'Раздел обучения задуман как набор мини-курсов и лекций: как поставить задачу, пройти работу шаг за шагом, распознать ошибки и оценить результат. Сейчас там представлены предварительные программы с отметкой «Готовится». Они уже связаны с рабочими пробами инструментов; готовые уроки и видео пока не опубликованы.'
 ]],
 ['Что доступно сейчас и зачем нужен личный кабинет?',[
  'В текущей версии открыты каталог, подробные описания, рабочие пробы и ознакомительные файлы. Полные пакеты, обучение и условия платного доступа развиваются отдельно. Наличие карточки не означает, что курс уже выпущен или покупка доступна: готовность материала указана на его странице.',
  'Кабинет объединяет выбранные инструменты и программы обучения, а в дальнейшем — приобретённые материалы и доступ к ним. Сейчас работает демо-вход: выбранное сохраняется в этом браузере. Настоящая авторизация, покупки и перенос библиотеки между устройствами ещё не подключены; демо-профиль позволяет познакомиться с устройством кабинета.'
 ]]
];
const PHOTOS={
 'Исследования':{file:'research.webp',width:900,height:900,alt:'Книги, образующие проём'},
 'Мышление':{file:'thinking.webp',width:886,height:886,alt:'Композиция со скульптурой, портретами и цифровыми знаками'},
 'Моделирование':{file:'modelling.webp',width:1920,height:1920,alt:'Люди и цветные отражения в прозрачных панелях'},
 'ИИ-проекты':{file:'ai-projects.webp',height:1800,alt:'Программный код на экране'},
 'Креатив':{file:'creative.webp',width:1361,height:1361,alt:'Руки в разноцветной краске'}
};
function heading(text) {return `<div class="home-section-heading"><h2><span class="home-heading-mark" aria-hidden="true"></span><span class="home-heading-text">${text}</span></h2></div>`;}

// Interaction follows the x0 photo accordion: pointer, focus, click and arrows.
function bindDirections() {
 const track=document.getElementById('home-directions-track');
 const panels=[...track.querySelectorAll('.home-direction')];
 const activate=index=>panels.forEach((panel,i)=>{
  const open=i===index;
  panel.classList.toggle('is-open',open);
  panel.querySelector('.direction-activate').setAttribute('aria-pressed',String(open));
 });
 panels.forEach((panel,index)=>{
  panel.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')activate(index);});
  const button=panel.querySelector('.direction-activate');
  button.addEventListener('focus',()=>activate(index));
  button.addEventListener('click',()=>activate(index));
 });
 track.addEventListener?.('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
  const current=panels.findIndex(p=>p.classList.contains('is-open'));
  const next=event.key==='Home'?0:event.key==='End'?panels.length-1:(current+(event.key==='ArrowRight'?1:-1)+panels.length)%panels.length;
  activate(next);panels[next].querySelector('.direction-activate').focus();event.preventDefault();
 });
}

export function renderHome(main,data) {
 if(main.dataset){main.dataset.rhythmReady="false";delete main.dataset.rhythmWidth;}
 const legacyFirstAnswer='#main[data-view="about"] > section:nth-of-type(3) > div:nth-of-type(2) > details:nth-of-type(1) > div:nth-of-type(1) > p:nth-of-type(1)';
 const firstAnswer=data.manual?.text?.[legacyFirstAnswer]?.[0] || FAQ[0][1][0];
 main.innerHTML=`<section class="home-hero" aria-labelledby="home-title">
 <div class="home-prototype-stage">
  <svg class="hero-outline" viewBox="0 0 936 425.598" preserveAspectRatio="none" aria-hidden="true"><path d="M448.194 0H19.56A19.56 19.56 0 0 0 0 19.56V406.038A19.56 19.56 0 0 0 19.56 425.598H95.931 M854.511 0H916.44A19.56 19.56 0 0 1 936 19.56V406.038A19.56 19.56 0 0 1 916.44 425.598H854.511 M468.002 425.598H589.5"/></svg>
  <button class="hero-brand-symbol" type="button" data-menu-trigger aria-controls="sidebar" aria-expanded="false" aria-label="Открыть каталог"><img src="assets/images/redesign/platform-logo.svg" alt=""></button>
  <p class="hero-wordmark"><span>ПЛАТФОРМА ИНСТРУМЕНТОВ</span></p>
  <img class="hero-illustration" src="assets/images/redesign/platform-workers.svg" alt="Люди с молотками и красным флагом" fetchpriority="high">
  <div class="home-hero-phrase"><h1 id="home-title"><span>КОГДА ЗНАНИЕ</span> <span>СТАНОВИТСЯ</span> <span>ИНСТРУМЕНТОМ &nbsp;<b aria-hidden="true">. . .</b></span></h1></div>
  <div class="home-hero-description"><p><span>Платформа инструментов объединяет</span><span>наши авторские способы мышления,</span><span>исследования, проектирования</span><span>и взаимодействия с ИИ.</span></p><p><span>Выберите свою задачу, познакомьтесь</span><span>с методом и попробуйте его в работе.</span></p></div>
  <a class="hero-catalog-cta" href="#catalog" data-full-catalog><span class="hero-cta-content"><span class="hero-cta-label">К ИНСТРУМЕНТАМ</span><svg class="hero-action-arrow" viewBox="0 0 8 12" aria-hidden="true"><path d="m2 1 5 5-5 5"/></svg></span></a>
  <nav class="prototype-tabs" aria-label="Разделы платформы"><a class="prototype-tab" href="#about" data-header-page="about" aria-current="page"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M54.46,14.047C54.46,10.322 55.94,6.749 58.574,4.114C61.209,1.48 64.782,0 68.507,0C79.525,0 94.792,0 105.839,0C113.66,0 120,6.34 120,14.161V105.361C120,113.446 113.446,120 105.361,120H14.488C10.645,120 6.96,118.474 4.243,115.757C1.526,113.04 0,109.355 0,105.512V68.507C0,64.782 1.48,61.209 4.114,58.574C6.749,55.94 10.322,54.46 14.047,54.46H28.096C42.656,54.46 54.46,42.656 54.46,28.096V14.047Z"/></svg><span class="prototype-tab-dot" aria-hidden="true"></span><span class="prototype-tab-name">ГЛАВНАЯ</span></a><button class="prototype-tab" type="button" data-menu-trigger aria-controls="sidebar" aria-expanded="false" data-header-page="catalog"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M54.46,14.047C54.46,10.322 55.94,6.749 58.574,4.114C61.209,1.48 64.782,0 68.507,0C79.525,0 94.792,0 105.839,0C113.66,0 120,6.34 120,14.161V105.361C120,113.446 113.446,120 105.361,120H14.488C10.645,120 6.96,118.474 4.243,115.757C1.526,113.04 0,109.355 0,105.512V68.507C0,64.782 1.48,61.209 4.114,58.574C6.749,55.94 10.322,54.46 14.047,54.46H28.096C42.656,54.46 54.46,42.656 54.46,28.096V14.047Z"/></svg><span class="prototype-tab-dot" aria-hidden="true"></span><span class="prototype-tab-name">КАТАЛОГ</span></button><a class="prototype-tab" href="#training" data-header-page="training"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M54.46,14.047C54.46,10.322 55.94,6.749 58.574,4.114C61.209,1.48 64.782,0 68.507,0C79.525,0 94.792,0 105.839,0C113.66,0 120,6.34 120,14.161V105.361C120,113.446 113.446,120 105.361,120H14.488C10.645,120 6.96,118.474 4.243,115.757C1.526,113.04 0,109.355 0,105.512V68.507C0,64.782 1.48,61.209 4.114,58.574C6.749,55.94 10.322,54.46 14.047,54.46H28.096C42.656,54.46 54.46,42.656 54.46,28.096V14.047Z"/></svg><span class="prototype-tab-dot" aria-hidden="true"></span><span class="prototype-tab-name">ОБУЧЕНИЕ</span></a><a class="prototype-tab" href="#account" data-header-page="account"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M54.46,14.047C54.46,10.322 55.94,6.749 58.574,4.114C61.209,1.48 64.782,0 68.507,0C79.525,0 94.792,0 105.839,0C113.66,0 120,6.34 120,14.161V105.361C120,113.446 113.446,120 105.361,120H14.488C10.645,120 6.96,118.474 4.243,115.757C1.526,113.04 0,109.355 0,105.512V68.507C0,64.782 1.48,61.209 4.114,58.574C6.749,55.94 10.322,54.46 14.047,54.46H28.096C42.656,54.46 54.46,42.656 54.46,28.096V14.047Z"/></svg><span class="prototype-tab-dot" aria-hidden="true"></span><span class="prototype-tab-name">КАБИНЕТ</span></a><a class="prototype-tab" href="#agent" data-header-page="agent"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M54.46,14.047C54.46,10.322 55.94,6.749 58.574,4.114C61.209,1.48 64.782,0 68.507,0C79.525,0 94.792,0 105.839,0C113.66,0 120,6.34 120,14.161V105.361C120,113.446 113.446,120 105.361,120H14.488C10.645,120 6.96,118.474 4.243,115.757C1.526,113.04 0,109.355 0,105.512V68.507C0,64.782 1.48,61.209 4.114,58.574C6.749,55.94 10.322,54.46 14.047,54.46H28.096C42.656,54.46 54.46,42.656 54.46,28.096V14.047Z"/></svg><span class="prototype-tab-dot" aria-hidden="true"></span><span class="prototype-tab-name">AI АГЕНТ</span></a></nav>
  
 </div><div class="hero-topics" aria-label="Направления платформы"><span>мышление</span><span>исследование</span><span>ai, нейросети</span><span>моделирование</span><span>креатив<i class="rhythm-baseline" aria-hidden="true"></i></span></div></section><section class="home-faq" aria-label="Вопросы о Платформе">${heading('ПЯТЬ ВОПРОСОВ О ПЛАТФОРМЕ')}<div class="home-faq-list">${FAQ.map(([q,answers],i)=>`<details class="home-question"><summary><span class="home-question-number">${String(i+1).padStart(2,'0')}</span><span>${E(q)}</span><span class="home-question-mark" aria-hidden="true"><span class="question-sign">+</span></span></summary><div class="home-answer">${answers.map((a,ai)=>`<p>${E(i===0&&ai===0?firstAnswer:a)}</p>`).join('')}</div></details>`).join('')}</div></section><section class="home-directions" aria-label="Типы инструментов">${heading('ТИПЫ ИНСТРУМЕНТОВ')}<div class="home-directions-track" id="home-directions-track" aria-label="Фотослайдер типов инструментов">${data.groups.map((group,i)=>{const photo=PHOTOS[group.id];return `<article class="home-direction${i===0?' is-open':''}"><button class="direction-activate" type="button" aria-pressed="${i===0}" aria-label="Показать тип: ${E(group.name)}"><img src="assets/images/home/${photo.file}" alt="${E(photo.alt)}" width="${photo.width||1200}" height="${photo.height}" loading="lazy" draggable="false"><span class="direction-overlay" aria-hidden="true"></span><span class="direction-vertical" aria-hidden="true">${E(group.name)} · ${i+1}.0</span></button><div class="direction-caption"><span class="direction-number" aria-hidden="true">${i+1}.0</span><h3>${E(group.name)}</h3><p>${E(group.subtitle)}</p><a href="#catalog" class="direction-link" data-filter-link="${E(group.id)}">В РАЗДЕЛ ${arrow()}</a></div></article>`;}).join('')}</div></section>${commentsMarkup(heading)}`;
 bindDirections();
 bindComments();
}
