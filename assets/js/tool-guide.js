import {E,arrow} from './utils.js';

// First-use form grounded in the existing trial flow. Installation is a later,
// package-specific guide; no current sample is presented as an installed skill.
export function renderToolGuide(tool) {
  const example=tool.modes[0];
  return `<section class="reading-panel tool-guide surface-white" id="section-${tool.id}-guide" tabindex="-1" aria-labelledby="guide-title-${tool.id}">
    <div class="guide-heading"><h2 id="guide-title-${tool.id}">Гайд</h2><span class="guide-stage">ПЕРВАЯ ПРОБА</span></div>
    <p class="guide-lead">От одной конкретной задачи — к первому проверенному результату.</p>
    <ol class="tool-guide-steps">
      <li><span class="guide-step-number" aria-hidden="true">1</span><div><h3>Подготовьте задачу</h3><p>Опишите свой случай, добавьте существенные условия и скажите, что хотите получить.</p>
        <details class="guide-help"><summary>Пример для инструмента «${E(tool.name)}»</summary><p>${E(example.example)}</p></details>
        <a class="guide-action" href="#tool/${tool.id}/workbench" data-action="try">Открыть рабочее окно ${arrow()}</a>
      </div></li>
      <li><span class="guide-step-number" aria-hidden="true">2</span><div><h3>Соберите запрос</h3><p>В рабочем окне выберите применение, заполните поле «Ваша задача» и нажмите «Собрать запрос».</p><p class="guide-check">Проверьте: в готовом тексте есть ваша задача и ожидаемый результат.</p></div></li>
      <li><span class="guide-step-number" aria-hidden="true">3</span><div><h3>Передайте запрос своему ИИ</h3><p>Нажмите «Скопировать для ИИ», вставьте весь текст в новый чат своей ИИ-среды и отправьте. Добавьте материалы, на которые должен опираться ответ.</p>
        <details class="guide-help"><summary>Если текст не скопировался</summary><p>Выделите готовый запрос в рабочем окне и скопируйте его вручную. После вставки проверьте начало и конец текста.</p></details>
      </div></li>
      <li><span class="guide-step-number" aria-hidden="true">4</span><div><h3>Проверьте, что получилось</h3><p>Сопоставьте ответ с задачей: он помог продвинуться, показывает основания и оставшиеся вопросы?</p><p class="guide-check"><strong>Ориентир для примера:</strong> ${E(example.goal)}.</p>
        <details class="guide-help"><summary>Если ответ слишком общий</summary><p>Добавьте конкретный материал или ограничение. Уточните, какой вывод нужно обосновать и в какой форме вам пригодится результат.</p></details>
      </div></li>
    </ol>
    <details class="guide-install"><summary><span>Установка по платформам</span><span class="guide-draft">ФОРМА · ДОПОЛНИМ</span></summary><p>Для каждой поддерживаемой среды здесь будет свой маршрут: подготовка → установка пакета → первый запуск → проверка.</p><p>Сейчас можно пройти пробу и получить ознакомительный файл. Пошаговая установка появится вместе с полным пакетом инструмента.</p></details>
  </section>`;
}
