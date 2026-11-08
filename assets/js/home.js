import {E,arrow} from './utils.js';
import {commentsMarkup,bindComments} from './home-comments.js';
import {bindHomeEntrance} from './home-entrance.js';
import {bindDirectionsEntrance} from './home-directions-entrance.js';

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
function heading(text) {return `<div class="catalog-intro"><h2 class="catalog-heading"><span class="catalog-heading-square" aria-hidden="true"></span><span class="catalog-heading-text">${text}</span></h2></div>`;}

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
 main.innerHTML=`<section class="home-hero" aria-labelledby="home-title"><div class="home-art"><img src="assets/images/home/platform-sculpture-wordmark.png" width="4296" height="2562" alt="Скульптура и каменная надпись «Платформа инструментов»" fetchpriority="high"></div><div class="home-copy"><h1 id="home-title">когда знание становится инструментом</h1><p>Платформа инструментов объединяет авторские способы мышления, исследования, проектирования и <span class="keep-together">взаимодействия с ИИ.</span></p><p>Выберите свою задачу, познакомьтесь с методом и попробуйте его в работе. Сложная теория раскрывается через конкретное применение.</p></div></section><section class="home-directions" aria-label="Типы инструментов">${heading('ТИПЫ ИНСТРУМЕНТОВ')}<div class="home-directions-track" id="home-directions-track" aria-label="Фотослайдер типов инструментов">${data.groups.map((group,i)=>{const photo=PHOTOS[group.id];return `<article class="home-direction${i===0?' is-open':''}"><button class="direction-activate" type="button" aria-pressed="${i===0}" aria-label="Показать тип: ${E(group.name)}"><img src="assets/images/home/${photo.file}" alt="${E(photo.alt)}" width="${photo.width||1200}" height="${photo.height}" loading="lazy" draggable="false"><span class="direction-overlay" aria-hidden="true"></span><span class="direction-vertical" aria-hidden="true">${E(group.name)} · ${i+1}.0</span></button><div class="direction-caption"><span class="direction-number" aria-hidden="true">${i+1}.0</span><h3>${E(group.name)}</h3><p>${E(group.subtitle)}</p><a href="#catalog" class="direction-link" data-filter-link="${E(group.id)}">В РАЗДЕЛ ${arrow()}</a></div></article>`;}).join('')}</div></section><section class="home-faq" aria-label="Вопросы о Платформе">${heading('ПЯТЬ ВОПРОСОВ О ПЛАТФОРМЕ')}<div class="home-faq-list">${FAQ.map(([q,answers],i)=>`<details class="home-question"><summary><span class="home-question-number">${String(i+1).padStart(2,'0')}</span><span>${E(q)}</span><span class="home-question-mark" aria-hidden="true"></span></summary><div class="home-answer">${answers.map(a=>`<p>${E(a)}</p>`).join('')}</div></details>`).join('')}</div></section>${commentsMarkup(heading)}`;
 bindHomeEntrance(main);
 bindDirectionsEntrance(main);
 bindDirections();
 bindComments();
}
