import {applyManualData} from './manual-edits.js';
// All runtime requests remain on the current static origin.
export async function loadData() {
  const names = ['catalog', 'groups', 'triads', 'editions', 'manual-edits'];
  const values = await Promise.all(names.map(async name => {
    const response = await fetch(new URL(`../../data/${name}.json`, import.meta.url));
    if (!response.ok) throw new Error(`Не загружен файл ${name}.json (${response.status})`);
    return response.json();
  }));
  const data = Object.fromEntries(names.map((name, i) => [name, values[i]]));
  if (data.catalog.length !== 13 || new Set(data.catalog.map(t => t.id)).size !== 13) throw new Error('Неполный каталог.');
  data.byId = new Map(data.catalog.map(t => [t.id,t]));
  applyManualData(data,data['manual-edits']);
  return data;
}
