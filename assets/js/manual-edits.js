// One author-edit layer over the preserved reference data. Older v1 files stay valid.
export const emptyManual = () => ({version:1,catalog:{},text:{},styles:{all:{},tablet:{},mobile:{}}});
const length=(min=0,max=2400,keywords=[])=>({kind:'length',min,max,keywords});
export const styleRules={
 'font-size':length(1,500), 'line-height':length(0,500,['normal']), 'letter-spacing':length(-100,200,['normal']),
 'font-weight':['100','200','300','400','500','600','700','800','900'],
 'font-family':['Arial, Helvetica, sans-serif','var(--label-font)','ui-monospace, Menlo, Consolas, monospace'],
 'font-style':['normal','italic'], 'text-align':['left','center','right','justify','start','end'],
 'text-transform':['none','uppercase','lowercase','capitalize'], 'white-space':['normal','pre-line'],
 'color':'color','background-color':'color','border-color':'color',
 '--manual-body-color':'color','--manual-hover-color':'color','--manual-hover-background':'color',
 'width':length(0,3000,['auto','fit-content','min-content','max-content']), 'min-width':length(0,3000,['auto']), 'max-width':length(0,3000,['none','fit-content']),
 'height':length(0,4000,['auto','fit-content']), 'min-height':length(0,4000,['auto']), 'max-height':length(0,4000,['none']),
 'border-width':length(0,40),'border-radius':length(0,1000),'border-style':['none','solid','dashed','dotted'],
 'padding':{...length(0,500),multiple:true},'padding-top':length(0,500),'padding-right':length(0,500),'padding-bottom':length(0,500),'padding-left':length(0,500),
 'margin':{...length(-1000,2000,['auto']),multiple:true},'margin-top':length(-1000,2000,['auto']),'margin-right':length(-1000,2000,['auto']),'margin-bottom':length(-1000,2000,['auto']),'margin-left':length(-1000,2000,['auto']),
 'gap':length(0,500),'row-gap':length(0,500),'column-gap':length(0,500),
 'align-items':['start','end','center','flex-start','flex-end','stretch','baseline'],
 'justify-content':['start','end','center','flex-start','flex-end','space-between','space-around','space-evenly'],
 'grid-template-columns':['repeat(1, minmax(0, 1fr))','repeat(2, minmax(0, 1fr))','repeat(3, minmax(0, 1fr))','repeat(4, minmax(0, 1fr))']
};
const roots=new Set(['name','cardTitle','cardLead','summary','tagline','eyebrow','mini','essence','steps','sections','modes','formats','card']);
export function catalogValue(catalog,key){const [id,...parts]=key.split('/');if(!roots.has(parts[0])||parts.some(p=>['__proto__','constructor','prototype'].includes(p)))throw Error('Недоступное поле текста.');let value=catalog.find(t=>t.id===id);for(const part of parts){if(!value||!Object.hasOwn(value,part))throw Error('Текст больше не найден.');value=value[part];}if(typeof value!=='string')throw Error('Выберите отдельный текст.');return value;}
export function catalogFields(tool){const result=[];const walk=(obj,parts=[])=>{for(const [k,v]of Object.entries(obj)){if(!parts.length&&!roots.has(k))continue;const next=[...parts,k];if(typeof v==='string')result.push({key:tool.id+'/'+next.join('/'),path:next,value:v});else if(v&&typeof v==='object')walk(v,next);}};walk(tool);return result;}
export function selectorOK(selector){
 if(typeof selector!=='string'||selector.length>800)return false;
 const id='#(?:main|top|sidebar|site-footer|dl-modal|workbench|(?:section|card)-[a-z0-9-]+)';
 const view='#main\\[data-view="(?:catalog|saved|account|about|not-found|tool/[a-z0-9-]+)"\\]';
 const modal='#dl-modal\\[data-tool="[a-z0-9-]+"\\]';
 const card='#main \\.toolcard\\[data-tool-id="[a-z0-9-]+"\\]';
 const names='cardtitle|cardtop|card-name|card-how|card-workzone|card-workmain|card-worklabel|card-featurelist|card-feature|card-bottom-info|card-use|card-outcome|card-meta-label|card-meta-copy|card-result|card-example|card-example-label|card-example-copy|cardbottom|card-cta|star|toolcard';
 const group='\\.(?:catalog-grid|group-tools) \\.(?:'+names+')';
 const children='(?: > [a-z][a-z0-9]*:nth-of-type\\([1-9][0-9]{0,3}\\))*';
 return new RegExp('^(?:'+id+'|'+view+'|'+modal+'|'+card+'|'+group+')'+children+'$').test(selector);
}
export function validateStyleValue(prop,value){
 const rule=styleRules[prop];if(!rule||typeof value!=='string'||value.length>100)throw Error('Недоступное свойство оформления.');
 if(rule==='color'){if(!/^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent|currentColor|inherit)$/.test(value))throw Error('Укажите цвет или прозрачный фон.');}
 else if(Array.isArray(rule)){if(!rule.includes(value))throw Error('Выберите значение из списка.');}
 else {
  if(rule.keywords.includes(value))return;
  const values=rule.multiple?value.split(/\s+/):[value];if(values.length>4)throw Error('Не больше четырёх размеров.');
  for(const item of values){if(rule.keywords.includes(item))continue;const match=item.match(/^(-?\d+(?:\.\d+)?)(px|em|rem|%|vw|vh|dvh|svh|ch)?$/);if(!match)throw Error('Укажите размер в пикселях, %, em или rem.');const number=Number(match[1]);if(number<rule.min||number>rule.max)throw Error('Размер вне допустимого диапазона.');if(!match[2]&&number!==0&&!(prop==='line-height'&&number>=.5&&number<=5))throw Error('Укажите единицу размера.');}
 }
}
function permutation(values,expected){return Array.isArray(values)&&values.length===expected.length&&new Set(values).size===expected.length&&values.every(v=>expected.includes(v));}
export function validateManual(value,catalog){
 const fail=()=>{throw Error('Недопустимые данные ручной правки.');};
 if(!value||value.version!==1||['catalog','text','styles','version'].some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>!['version','catalog','text','styles','order','buttons'].includes(k)))fail();
 for(const k of ['catalog','text','styles'])if(!value[k]||Array.isArray(value[k])||typeof value[k]!=='object')fail();
 if(Object.keys(value.catalog).length>2000||Object.keys(value.text).length>1500)fail();
 for(const [key,text]of Object.entries(value.catalog)){catalogValue(catalog,key);if(typeof text!=='string'||text.length>30000)fail();}
 for(const [selector,text]of Object.entries(value.text)){if(!selectorOK(selector))fail();const fragments=Array.isArray(text)?text:[text];if(!fragments.length||fragments.length>30||fragments.some(t=>typeof t!=='string'||t.length>30000))fail();}
 if(Object.keys(value.styles).sort().join(',')!=='all,mobile,tablet')fail();
 for(const scope of Object.values(value.styles)){if(!scope||typeof scope!=='object'||Array.isArray(scope)||Object.keys(scope).length>1500)fail();for(const [selector,props]of Object.entries(scope)){if(!selectorOK(selector)||!props||typeof props!=='object'||Array.isArray(props))fail();for(const [prop,val]of Object.entries(props))validateStyleValue(prop,val);}}
 if(value.buttons!==undefined&&(!Array.isArray(value.buttons)||value.buttons.length>1500||new Set(value.buttons).size!==value.buttons.length||value.buttons.some(s=>!selectorOK(s))))fail();
 if(value.order!==undefined){const order=value.order;if(!order||typeof order!=='object'||Array.isArray(order)||Object.keys(order).some(k=>!['catalog','chapters'].includes(k)))fail();if(order.catalog!==undefined&&!permutation(order.catalog,catalog.map(t=>t.id)))fail();if(order.chapters!==undefined){if(!order.chapters||typeof order.chapters!=='object'||Array.isArray(order.chapters))fail();for(const [id,indices]of Object.entries(order.chapters)){const tool=catalog.find(t=>t.id===id);if(!tool||!permutation(indices,tool.sections.map((_,i)=>i)))fail();}}}
 return value;
}
export function applyManualData(data,manual){
 data.baseCatalog??=structuredClone(data.catalog);validateManual(manual,data.baseCatalog);data.manual=manual;data.catalog=structuredClone(data.baseCatalog);
 for(const [key,text]of Object.entries(manual.catalog)){const [id,...parts]=key.split('/');let obj=data.catalog.find(t=>t.id===id);for(const part of parts.slice(0,-1))obj=obj[part];obj[parts.at(-1)]=text;}
 if(manual.order?.catalog){const byId=new Map(data.catalog.map(t=>[t.id,t]));data.catalog=manual.order.catalog.map(id=>byId.get(id));}
 data.byId=new Map(data.catalog.map(t=>[t.id,t]));
}
export function directTextNodes(el){return [...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());}
export function directTextNode(el){const nodes=directTextNodes(el);return nodes.length===1?nodes[0]:null;}
export function manualCSS(manual){
 const declarations=props=>Object.entries(props).map(([k,v])=>`${k}:${v} !important;`).join('');
 return Object.entries(manual.styles).map(([scope,entries])=>{const rules=[];for(const [selector,props]of Object.entries(entries)){
  const normal=Object.fromEntries(Object.entries(props).filter(([k])=>!k.startsWith('--manual-')));
  if(manual.buttons?.includes(selector)&&normal.height&&!['auto','inherit'].includes(normal.height)){normal['min-height']??='0px';if(!normal.padding){normal['padding-top']??='0px';normal['padding-bottom']??='0px';}}
  if(normal['border-width']&&!normal['border-style'])normal['border-style']='solid';
  rules.push(`${selector}{${declarations(normal)}}`);
  if(props['--manual-body-color'])rules.push(`${selector} :is(p,li,.card-how,.card-feature,.card-meta-copy,.caption){color:${props['--manual-body-color']} !important}`);
  const hover={};if(props['--manual-hover-color'])hover.color=props['--manual-hover-color'];if(props['--manual-hover-background'])hover['background-color']=props['--manual-hover-background'];
  if(Object.keys(hover).length)rules.push(`${selector}:hover,${selector}:focus-visible{${declarations(hover)}}`);
 }const css=rules.join('\n');return scope==='all'?css:`@media(max-width:${scope==='tablet'?1060:700}px){${css}}`;}).join('\n');
}
function orderChapters(manual){
 const view=document.getElementById('main')?.dataset.view;if(!view?.startsWith('tool/'))return;const id=view.slice(5),holder=document.querySelector('.detail-chapters');if(!holder)return;
 const parts=[...holder.children].filter(el=>new RegExp('^section-'+id+'-\\d+$').test(el.id));const base=parts.map(el=>Number(el.id.split('-').at(-1))-1).sort((a,b)=>a-b),wanted=manual.order?.chapters?.[id]||base;
 const ids=wanted.map(i=>`section-${id}-${i+1}`),present=parts.map(el=>el.id),download=holder.querySelector('.start-last');
 if(ids.join()!==present.join())for(const sectionId of ids){const el=document.getElementById(sectionId);if(el)holder.insertBefore(el,download);}
 const toc=document.querySelector('.chapter-links');if(toc){const links=[...toc.children];if(links.map(el=>el.dataset.chapterId).join()!==ids.join())for(const sectionId of ids){const el=links.find(l=>l.dataset.chapterId===sectionId);if(el)toc.append(el);}}
 ids.forEach((sectionId,i)=>{for(const el of [document.querySelector(`#${sectionId} .chapter-number`),toc?.querySelector(`[data-chapter-id="${sectionId}"] .chapter-index`)]){const n=String(i+1).padStart(2,'0');if(el&&el.textContent!==n)el.textContent=n;}});
}
export function manualPresentation(initial){
 let manual=initial;const originalNodes=new Map(),style=document.createElement('style');style.id='author-manual-styles';document.head.append(style);
 const apply=()=>{orderChapters(manual);for(const [selector,value]of Object.entries(manual.text)){let elements;try{elements=document.querySelectorAll(selector);}catch{continue;}for(const el of elements){const nodes=directTextNodes(el),values=Array.isArray(value)?value:[value];if(nodes.length!==values.length)continue;nodes.forEach((node,i)=>{if(node.textContent.trim()!==values[i]){if(!originalNodes.has(node))originalNodes.set(node,node.textContent);const original=originalNodes.get(node);node.textContent=(original.match(/^\s*/)?.[0]||'')+values[i]+(original.match(/\s*$/)?.[0]||'');}});}}};
 const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});
 return next=>{for(const [node,text]of originalNodes)if(node.isConnected)node.textContent=text;originalNodes.clear();manual=next;style.textContent=manualCSS(manual);apply();};
}
