import {E,arrow} from './utils.js';
import {photoCardCopy} from './photo-card-data.js';
import {photoByTool} from './card-images.js';
const nameLines={"plugin-maker":["СВОЙ ПЛАГИН","CHATGPT"],"rdc-agent":["ДОСТУП К","КОМПЬЮТЕРУ ИЗ ЧАТА"],"drive-knowledge":["КАБИНЕТ НА","GOOGLE DRIVE"],"chatgpt-project":["РАБОЧИЙ ПРОЕКТ","CHATGPT"]};

export function renderPhotoCard(tool,data,store){
  const saved=store.isFavorite(tool.id);
  const tone=data.groups.find(group=>group.id===tool.category).tone;
  const photo=photoByTool[tool.id];
  const copy=photoCardCopy[tool.id];
  const configured=nameLines[tool.id];
  const plain=value=>value.toUpperCase().replaceAll('\u00b7','').replace(/\s+/g,' ').trim();
  const lines=configured&&plain(configured.join(' '))===plain(tool.name)?configured:null;
  const name=lines?`<span class="card-name-above">${E(lines[0])}</span>`:'';
  const lastLine=lines?lines[1]:tool.name;
  return `<div class="card-slot card-slot--sketch" data-card-tone="${E(tone)}"><span class="card-index">${E(tool.code)}</span><article class="toolcard photo-card photo-card--sketch tone-${E(tone)}" data-tool-id="${E(tool.id)}" data-code="${E(tool.code)}" data-photo-variant="true">
    <svg class="card-shell" aria-hidden="true"><path vector-effect="non-scaling-stroke"/></svg>
    <img class="card-photo" style="object-position:${E(photo.position)}" src="assets/images/catalog/${E(photo.src)}" alt="${E(photo.alt)}" width="600" height="600" decoding="async">
    <header class="card-heading"><div class="card-identity"><a class="card-name" id="card-name-${E(tool.id)}" href="#tool/${E(tool.id)}" aria-label="${E(tool.name)}">${name}<span class="card-name-text">${E(lastLine)}<span class="photo-name-baseline" aria-hidden="true"></span></span><span class="card-name-arrow" aria-hidden="true"><svg class="card-name-chevron" viewBox="0 4 24 16"><path d="m9 5 7 7-7 7"/></svg></span></a></div><h2 class="card-title cardtitle" id="card-title-${E(tool.id)}"><span class="photo-title-baseline" aria-hidden="true"><span class="photo-title-cap"></span></span>${E(tool.cardTitle)}</h2></header>
    <div class="card-copy"><div class="copy-block"><span class="copy-label">Когда пригодится</span><p>${E(copy.when)}</p></div><div class="copy-block"><span class="copy-label">Результат</span><p>${E(copy.result)}</p></div></div>
    <div class="card-actions"><a class="card-cta card-details" href="#tool/${E(tool.id)}" aria-label="Читать подробно: ${E(tool.name)}">Подробнее ${arrow()}</a><button class="star card-favorite ${saved?'saved':''}" type="button" data-action="star" data-id="${E(tool.id)}" aria-pressed="${saved}" aria-label="${saved?'Убрать из избранного':'Добавить в избранное'}: ${E(tool.name)}"><span aria-hidden="true">${saved?'★':'☆'}</span></button></div>
  </article></div>`;
}


export function initPhotoCards(main){
let typographyFrame=0;
const textCanvas=document.createElement('canvas');
const textContext=textCanvas.getContext('2d',{willReadFrequently:true});
const glyphCache=new Map();
function nameInkBounds(element){
  const style=getComputedStyle(element),text=element.textContent.trim().toUpperCase();
  const scale=(window.devicePixelRatio||1)*4,size=parseFloat(style.fontSize);
  const font=`${style.fontStyle} ${style.fontWeight} ${size*scale}px ${style.fontFamily}`;
  const key='ink\n'+scale+'\n'+font+'\n'+text;
  if(glyphCache.has(key))return glyphCache.get(key);
  textCanvas.width=Math.ceil(size*scale*(text.length+2));
  textCanvas.height=Math.ceil(size*scale*3);
  const baseline=Math.ceil(size*scale*1.5);
  textContext.font=font;textContext.textBaseline='alphabetic';textContext.fillStyle='#000';
  textContext.fillText(text,size*scale/2,baseline);
  const pixels=textContext.getImageData(0,0,textCanvas.width,textCanvas.height).data;
  let top=textCanvas.height,bottom=-1;
  const rows=new Array(textCanvas.height).fill(0);
  for(let y=0;y<textCanvas.height;y++)for(let x=0;x<textCanvas.width;x++){
    if(pixels[(y*textCanvas.width+x)*4+3]>=128)rows[y]++;
  }
  // Use the capital body, excluding sparse accents and descender tips (Й, Д).
  const bodyThreshold=Math.max(...rows)*.2;
  for(let y=0;y<rows.length;y++)if(rows[y]>0&&rows[y]>=bodyThreshold){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const bounds=bottom>=top?{ascent:(baseline-top)/scale,descent:(bottom+1-baseline)/scale,height:(bottom-top+1)/scale}:glyphBounds(element,text);
  glyphCache.set(key,bounds);return bounds;
}

function glyphBounds(element,text){
  const style=getComputedStyle(element);
  const scale=window.devicePixelRatio||1;
  const font=`${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize)*scale}px ${style.fontFamily}`;
  const key=scale+'\n'+font+'\n'+text;
  if(glyphCache.has(key))return glyphCache.get(key);
  textContext.font=font;
  textContext.textBaseline='alphabetic';
  const measured=textContext.measureText(text);
  const ascent=Number.isFinite(measured.actualBoundingBoxAscent)?measured.actualBoundingBoxAscent/scale:parseFloat(style.fontSize)*.72;
  const descent=Number.isFinite(measured.actualBoundingBoxDescent)?measured.actualBoundingBoxDescent/scale:0;
  const bounds={ascent,descent,height:ascent+descent};
  glyphCache.set(key,bounds);return bounds;
}

function measureTypography(){
  typographyFrame=0;
  for(const card of main.querySelectorAll('.photo-card')){
    const name=card.querySelector('.card-name-text');
    const title=card.querySelector('.card-title');
    // Measure the actual uppercase last line, including Latin/Cyrillic glyph ink.
    const nameBounds=nameInkBounds(name);
    const titleBounds=glyphBounds(title,title.textContent.trim().charAt(0));
    const values={'--name-glyph-height':nameBounds.height,'--name-glyph-ascent':nameBounds.ascent,'--name-glyph-descent':nameBounds.descent,'--title-glyph-height':titleBounds.height,'--title-glyph-ascent':titleBounds.ascent,'--title-glyph-descent':titleBounds.descent};
    for(const [key,value] of Object.entries(values)){
      const next=value+'px';if(card.style.getPropertyValue(key)!==next)card.style.setProperty(key,next);
    }
    measureSketchSpacing(card,title);measureShell(card);
    card.dataset.typographyReady='true';
  }
  measureCatalogHeading();
}

function measureCatalogHeading(){
  const intro=main.querySelector('.photo-catalog-intro');if(!intro)return;
  const heading=intro.querySelector('.catalog-heading'),text=heading.querySelector('.catalog-heading-text'),mark=heading.querySelector('.photo-catalog-baseline'),first=intro.querySelector('.filter');
  if(!first||!mark)return;
  const previous=parseFloat(heading.style.getPropertyValue('--catalog-heading-shift'))||0;
  const line=heading.getBoundingClientRect(),button=first.getBoundingClientRect();
  if(button.top>=line.bottom+4){heading.style.setProperty('--catalog-heading-shift','0px');return;}
  const ink=nameInkBounds(text),center=mark.getBoundingClientRect().top+(ink.descent-ink.ascent)/2;
  const shift=Math.round((button.top+button.height/2-center+previous)*64)/64;
  heading.style.setProperty('--catalog-heading-shift',shift+'px');
}

function measureSketchSpacing(card,title){
  const photoBottom=card.querySelector('.card-photo').getBoundingClientRect().bottom;
  const baseline=card.querySelector('.photo-title-baseline').getBoundingClientRect().top;
  const previousTrim=parseFloat(card.style.getPropertyValue('--sketch-title-trim'))||0;
  // One shared capital plane preserves the common divider across all titles.
  const originalGap=baseline-glyphBounds(title,'Н').ascent-photoBottom+previousTrim;
  const next=Math.round(Math.max(0,originalGap/3)*64)/64+'px';
  if(card.style.getPropertyValue('--sketch-title-trim')!==next)card.style.setProperty('--sketch-title-trim',next);
}

function measureShell(card){
  const {width:w,height:h}=card.getBoundingClientRect();
  const diameter=card.querySelector('.card-photo').getBoundingClientRect().width;
  const radius=diameter/2+12;
  const edge=.5,fillet=7,corner=edge+fillet;
  const outer=radius-edge,center=w-radius;
  const distance=Math.sqrt(outer*outer+2*outer*fillet);
  const join=center-distance;
  const touchX=center-outer*distance/(outer+fillet);
  const touchY=radius-outer*fillet/(outer+fillet);
  const path=`M ${corner} ${radius} H ${join} A ${fillet} ${fillet} 0 0 0 ${touchX} ${touchY} A ${outer} ${outer} 0 0 1 ${w-edge} ${radius} V ${h-corner} A ${fillet} ${fillet} 0 0 1 ${w-corner} ${h-edge} H ${corner} A ${fillet} ${fillet} 0 0 1 ${edge} ${h-corner} V ${radius+fillet} A ${fillet} ${fillet} 0 0 1 ${corner} ${radius} Z`;
  const shell=card.querySelector('.card-shell');
  const viewBox=`0 0 ${w} ${h}`;
  if(shell.getAttribute('viewBox')!==viewBox)shell.setAttribute('viewBox',viewBox);
  const contour=shell.querySelector('path');
  if(contour.getAttribute('d')!==path)contour.setAttribute('d',path);
}

function scheduleTypography(){
  if(typographyFrame)return;
  for(const card of main.querySelectorAll('.photo-card'))card.dataset.typographyReady='false';
  typographyFrame=requestAnimationFrame(measureTypography);
}

function refresh(){
  for(const grid of main.querySelectorAll('.catalog-grid,.group-tools'))grid.classList.toggle('photo-card-grid',!!grid.querySelector(':scope > .card-slot > .photo-card'));
  scheduleTypography();
}
new MutationObserver(refresh).observe(main,{childList:true,subtree:true});
new ResizeObserver(scheduleTypography).observe(main);
window.addEventListener('platform:rendered',refresh);
window.addEventListener('resize',scheduleTypography);
document.fonts.ready.then(()=>{glyphCache.clear();scheduleTypography();});
document.fonts.addEventListener('loadingdone',()=>{glyphCache.clear();scheduleTypography();});
refresh();
}
