import {E,arrow,number,notify,focusElement} from './utils.js';
export const newBench = tool => ({tab:'trial',mode:0,text:tool.modes[0].example,output:'',registers:[]});
export function renderBench(tool,data,state,focusSelector) {
  const holder = document.getElementById('bench-body');
  if (!holder) return;
  document.querySelectorAll('.bench-tabs [role="tab"]').forEach(tab => {
    const selected = tab.dataset.tab === state.tab;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  holder.setAttribute('aria-labelledby',`tab-${state.tab}`);
  if (state.tab === 'guide') {
    holder.innerHTML = `<p class="bench-label">ХОД РАБОТЫ</p><ol class="bench-steps">${tool.steps.map((step,i) => `<li><span class="num">${number(i+1)}</span><span>${E(step)}</span></li>`).join('')}</ol><h3>примеры применения</h3>${tool.modes.map((mode,i) => `<details class="bench-example"><summary>${E(mode.label)}</summary><p>${E(mode.example)}</p><p>${E(mode.instruction)}</p><p><strong>Результат:</strong> ${E(mode.goal)}</p><button type="button" class="btn light benchbtn" data-action="example" data-ix="${i}">ВЗЯТЬ ПРИМЕР ${arrow()}</button></details>`).join('')}<button class="btn primary benchbtn" type="button" data-action="bench" data-tab="trial">ПЕРЕЙТИ К ПРОБЕ ${arrow()}</button>`;
  } else if (state.tab === 'install') {
    holder.innerHTML = `<p class="bench-label">ВАРИАНТЫ ПОЛУЧЕНИЯ</p>${tool.formats.map((format,index) => `<div class="format-row"><div><b>${E(format)}</b><span>Ознакомительный образец · .md</span></div><button type="button" data-action="download" data-id="${tool.id}" data-index="${index}" aria-label="Получить образец: ${E(format)}">ПОЛУЧИТЬ ${arrow()}</button></div>`).join('')}<p class="bench-hint">Полная поставка зависит от выбранной среды. Сейчас каждый вариант открывает образец в текстовом формате; автоматическая установка не выполняется.</p><p class="bench-hint">Издание образца: demo-1.0. Методическая и установочная версии учитываются отдельно.</p>`;
  } else {
    const mode = tool.modes[state.mode];
    const registers = tool.id === 'triads' ? `<fieldset class="triad-fields"><legend class="bench-label">ОПТИКА 3×3 · ВЫБЕРИТЕ ПОЛЯ</legend><div class="bench-matrix">${data.triads.map(([code,name]) => `<button type="button" data-action="reg" data-reg="${code}" class="${state.registers.includes(code)?'selected':''}" aria-pressed="${state.registers.includes(code)}" aria-label="${code} ${E(name)}"><span>${code}</span>${E(name)}</button>`).join('')}</div><div class="matrix-route" role="status" aria-live="polite">${state.registers.length ? state.registers.map((code,i) => `${i?arrow():''}<span>${code}</span>`).join('') : 'ВЫБЕРИТЕ ОДИН ИЛИ НЕСКОЛЬКО РЕГИСТРОВ'}</div></fieldset>` : '';
    holder.innerHTML = `<p class="bench-label">ВЫБЕРИТЕ ПРИМЕНЕНИЕ</p><div class="bench-pick" role="group" aria-label="Применение метода">${tool.modes.map((item,index) => `<button type="button" data-action="mode" data-ix="${index}" aria-pressed="${index===state.mode}">${E(item.label)}</button>`).join('')}</div>${registers}<label for="bench-prompt" class="bench-label">ВАША ЗАДАЧА</label><textarea id="bench-prompt" spellcheck="true" maxlength="30000" aria-describedby="bench-context">${E(state.text)}</textarea><p id="bench-error" class="form-error" role="alert" hidden></p><button type="button" class="text-link bench-example-link" data-action="example" data-ix="${state.mode}">Подставить пример ${arrow()}</button><button type="button" class="btn primary benchbtn" data-action="compose">СОБРАТЬ ЗАПРОС ${arrow()}</button><p class="bench-hint" id="bench-context"><strong>Что получите:</strong> ${E(mode.goal)}. Запрос составляется здесь; исследование выполняется в вашей ИИ-среде.</p>${state.output ? `<div class="output-panel"><p class="bench-label" role="status">ГОТОВЫЙ ЗАПРОС</p><pre id="composed-prompt" tabindex="0">${E(state.output)}</pre><button type="button" class="btn light" data-action="copy" data-target="composed-prompt">СКОПИРОВАТЬ ДЛЯ ИИ ${arrow()}</button></div>` : ''}`;
  }
  if (focusSelector) focusElement(holder.querySelector(focusSelector));
}
export function compose(tool,data,state) {
  const value = state.text.trim();
  if (!value) {
    const error = document.getElementById('bench-error');
    error.textContent = 'Напишите несколько слов о своей задаче.';
    error.hidden = false;
    const field = document.getElementById('bench-prompt');
    field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby','bench-error bench-context');
    focusElement(field);
    return;
  }
  const mode = tool.modes[state.mode];
  const triads = tool.id === 'triads' && state.registers.length ? '\nПредпочтительные регистры: ' + state.registers.map(code => `${code} ${data.triads.find(r => r[0] === code)[1]}`).join(' → ') + '. Не подменяй выбор регистра доказательством перехода.' : '';
  state.output = `Примени метод «${tool.name}» к следующей задаче.\n\nМОЯ ЗАДАЧА\n${value}\n\nНАПРАВЛЕНИЕ РАБОТЫ\n${mode.instruction}${triads}\n\nМЕРА РЕЗУЛЬТАТА\nВерни содержательный результат по существу вопроса. Укажи основания существенных выводов, границы известного и сильную альтернативу. Не заполняй схему искусственно ради полноты.\n\nОЖИДАЕМОЕ ПРИОБРЕТЕНИЕ\n${mode.goal}.`;
  renderBench(tool,data,state,'#composed-prompt');
  notify('Запрос собран. Его можно скопировать в свою ИИ-среду.');
}
