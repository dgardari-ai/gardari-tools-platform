export function parseRoute(data) {
  let raw;
  try { raw = decodeURIComponent(location.hash.slice(1)); } catch { return {page:'not-found'}; }
  if (!raw) return {page:'catalog'};
  const parts = raw.split('/');
  if (['catalog','saved','account','about'].includes(parts[0]) && parts.length === 1) return {page:parts[0]};
  if (parts[0] === 'tool' && data.byId.has(parts[1])) {
    const tool = data.byId.get(parts[1]);
    if (parts.length === 2) return {page:'tool',id:tool.id};
    if (parts[2] === 'workbench' && parts.length === 3) return {page:'tool',id:tool.id,anchor:'workbench'};
    if (parts[2] === 'chapter' && /^\d{2}$/.test(parts[3]) && parts.length === 4) {
      const index = Number(parts[3]);
      if (index >= 1 && index <= tool.sections.length) return {page:'tool',id:tool.id,anchor:`section-${tool.id}-${index}`};
    }
    if (parts[2] === 'download' && parts.length === 3) return {page:'tool',id:tool.id,anchor:`section-${tool.id}-download`};
    if (parts[2] === 'guide' && parts.length === 3) return {page:'tool',id:tool.id,anchor:`section-${tool.id}-guide`};
  }
  // v0.4 chapter addresses remain usable when shared directly.
  const oldChapter = raw.match(/^section-(.+)-(\d+)$/);
  if (oldChapter && data.byId.has(oldChapter[1]) && +oldChapter[2] <= data.byId.get(oldChapter[1]).sections.length && +oldChapter[2] > 0) return {page:'tool',id:oldChapter[1],anchor:`section-${oldChapter[1]}-${Number(oldChapter[2])}`};
  return {page:'not-found'};
}
export const toolRoute = id => `#tool/${id}`;
export const chapterRoute = (id,index) => `#tool/${id}/chapter/${String(index).padStart(2,'0')}`;
