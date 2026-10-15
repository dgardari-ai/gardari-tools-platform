import {E,arrow,notify} from './utils.js';
export function createDownloads(data,store,onChange) {
  const modal = document.getElementById('dl-modal');
  let origin = null;
  function show(productId,preferredIndex) {
    const tool = data.byId.get(productId);
    if (!tool) return;
    const wasOpen=modal.open,scroll=document.getElementById('modal-content').scrollTop;
    if(!wasOpen)origin = document.activeElement;
    modal.dataset.tool = productId;
    document.getElementById('modal-content').innerHTML = `<p class="eyebrow">${tool.code} / ОБРАЗЕЦ ПОСТАВКИ</p><h2 id="modal-title">${E(tool.name)}</h2><p>Выберите удобную форму. Ознакомительный файл содержит назначение метода, порядок работы и пример первого применения.</p><div class="modal-options">${tool.formats.map((format,index) => `<button type="button" data-action="package" data-index="${index}"><span>${E(format)}<small>Демо-образец · Markdown (текст с разметкой) · .md</small></span>${arrow()}</button>`).join('')}</div><p class="modal-note">Издание образца: demo-1.0. Это ознакомительный материал, не полный производственный навык или установочный плагин. Полные пакеты будут доступны после выпуска. Регистрация, подписка и автоматическая установка сейчас не подключены.</p>`;
    if(!wasOpen)modal.showModal();else document.getElementById('modal-content').scrollTop=scroll;
    if (Number.isInteger(preferredIndex)) modal.querySelector(`[data-index="${preferredIndex}"]`)?.focus();
  }
  function close() { modal.close(); }
  modal.addEventListener('close',() => { if (origin?.isConnected) origin.focus({preventScroll:true}); });
  modal.addEventListener('click',event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  document.getElementById('close-modal').addEventListener('click',close);
  function download(index) {
    const tool = data.byId.get(modal.dataset.tool);
    const edition = data.editions.find(item => item.productId === tool?.id);
    const asset = edition?.assets[index];
    if (!tool || !asset) return;
    // Delivery adapter: this release supports public, locally generated samples only.
    if (asset.delivery !== 'generated-markdown') { notify('Эта поставка пока недоступна.'); return; }
    const content = `# ${tool.name}\n\nОзнакомительный образец · Платформа инструментов Гардари\nКод: ${tool.code}\nВариант: ${tool.formats[index]}\nИздание образца: ${edition.editionVersion}\nВерсия полного метода: пока не назначена\n\n## Назначение\n${tool.summary}\n\n## Как начать\n${tool.steps.map((step,i) => `${i+1}. ${step}`).join('\n')}\n\n## Пример задачи\n${tool.modes[0].example}\n\n## Пробное обращение к своему ИИ\n${tool.modes[0].instruction}\n\n## Обратите внимание\nЭто проверяемый образец структуры будущей поставки, а не полный производственный навык или плагин. Автоматическая установка не выполняется. Работа выполняется в вашей ИИ-среде в пределах её возможностей и разрешений.\n`;
    const url = URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `gardari-${tool.id}-${index+1}-example.md`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),10000);
    const rememberHistory = store.snapshot().settings.rememberHistory;
    const saved = store.recordDownload(tool.id,index);
    close();
    onChange();
    notify(!rememberHistory ? 'Демо-файл передан браузеру. Сохранение истории отключено.' : saved ? 'Демо-файл передан браузеру. Запись доступна в кабинете.' : 'Демо-файл передан браузеру. История не сохранена: хранилище недоступно.');
  }
  return {show,download,refresh(){if(modal.open)show(modal.dataset.tool);}};
}
