// Geometry in authored CSS units. Native scrolling and pointer hit tests keep
// using viewport units; layout/style calculations use these normalized rects.
export const layoutRect=target=>globalThis.PlatformLayout?.rect(target)??target?.getBoundingClientRect();
export const layoutRects=range=>[...range.getClientRects()].map(r=>{
 const s=globalThis.PlatformLayout?.scale||1;
 return {x:r.x/s,y:r.y/s,left:r.left/s,top:r.top/s,right:r.right/s,bottom:r.bottom/s,width:r.width/s,height:r.height/s};
});
export const layoutMedia=query=>globalThis.PlatformLayout?.media(query)??globalThis.matchMedia?.(query)??{matches:false,addEventListener(){},removeEventListener(){}};
export const layoutCondition=query=>globalThis.PlatformLayout?globalThis.PlatformLayoutModel.media(query,globalThis.PlatformLayout.queryWidth):query;
export const isPhone=()=>globalThis.PlatformLayout?.isPhone()??globalThis.matchMedia?.('(max-width:700px)')?.matches??false;
export const layoutScale=()=>globalThis.PlatformLayout?.scale||1;
export const layoutWidth=()=>globalThis.PlatformLayout?.viewportWidth??innerWidth;
export const layoutHeight=()=>globalThis.PlatformLayout?.viewportHeight??innerHeight;
