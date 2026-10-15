// Integration boundary: replace this adapter with a server implementation later.
// It intentionally holds no authentication tokens, task text or personal profile.
const KEY = 'gardari-platform:v1';
const defaults = () => ({favorites:[],downloads:[],settings:{rememberHistory:true}});
export function createLocalAdapter(data) {
  let state = defaults();
  let available = true;
  const validId = id => typeof id === 'string' && data.byId.has(id);
  const validate = raw => ({
    favorites: Array.isArray(raw?.favorites) ? [...new Set(raw.favorites.filter(validId))] : [],
    downloads: Array.isArray(raw?.downloads) ? raw.downloads.filter(item => validId(item?.productId) && Number.isInteger(item.formatIndex) && data.byId.get(item.productId).formats[item.formatIndex] && typeof item.at === 'string' && Number.isFinite(Date.parse(item.at))).slice(0,100).map(item => ({productId:item.productId,formatIndex:item.formatIndex,at:item.at,editionVersion:'demo-1.0'})) : [],
    settings: {rememberHistory:raw?.settings?.rememberHistory !== false}
  });
  try { state = validate(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { available = false; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); available = true; }
    catch { available = false; }
    return available;
  }
  return {
    session: () => ({type:'local-demo', user:null}),
    entitlement: () => ({type:'demonstration',subscription:null,availableProducts:[...data.byId.keys()]}),
    snapshot: () => structuredClone(state),
    available: () => available,
    isFavorite: id => state.favorites.includes(id),
    toggleFavorite(id) {
      if (!validId(id)) return false;
      state.favorites = state.favorites.includes(id) ? state.favorites.filter(x => x !== id) : [...state.favorites,id];
      return persist();
    },
    recordDownload(productId,formatIndex) {
      if (state.settings.rememberHistory) state.downloads.unshift({productId,formatIndex,at:new Date().toISOString(),editionVersion:'demo-1.0'});
      state.downloads = state.downloads.slice(0,100);
      return persist();
    },
    setRememberHistory(value) { state.settings.rememberHistory = !!value; return persist(); },
    refresh() { try {state=validate(JSON.parse(localStorage.getItem(KEY)||'null'));available=true;} catch {available=false;} },
    key:KEY
  };
}
