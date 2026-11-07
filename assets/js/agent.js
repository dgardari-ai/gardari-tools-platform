import {arrow} from './utils.js';

export function renderAgent(main) {
  main.innerHTML = `<section class="agent-intro"><div class="catalog-intro"><h1 class="catalog-heading"><span class="catalog-heading-square" aria-hidden="true"></span><span class="catalog-heading-text">AI АГЕНТ</span></h1></div><div class="agent-status"><p class="eyebrow">РАЗДЕЛ ГОТОВИТСЯ</p><p>Пока можно выбрать инструмент и собрать запрос для своей задачи или начать с готового примера.</p><div class="agent-actions"><a class="btn dark" href="#catalog">ОТКРЫТЬ КАТАЛОГ ${arrow()}</a><a class="btn light" href="#training">ВЫБРАТЬ ПРИМЕР ${arrow()}</a></div></div></section>`;
}
