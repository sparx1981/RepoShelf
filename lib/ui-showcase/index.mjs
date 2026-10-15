import {components} from './components.mjs';
import {micro} from './micro.mjs';
import {componentCode,previewPage,SHOWCASE_LICENCE_TEXT} from './base.mjs';
export {SHOWCASE_LICENCE_TEXT,SHOWCASE_LICENCE,previewPage,componentCode} from './base.mjs';
// Showcase order is deliberate: the strongest, most visual examples come first.
const order=['s-spotlight-cards','s-magnify-dock','s-tilt-card','s-glow-bento','s-slide-pill-nav','s-squish-switch','s-holo-profile-card','s-gooey-nav','s-hold-to-confirm','s-glass-panel','s-flowing-menu','s-burst-like','s-card-stack','s-rubber-segmented','s-orbit-border-button','s-spring-checkbox','s-expanding-gallery','s-voice-pill','s-slosh-gauge','s-magnet-button','s-progress-stepper','s-swipe-rows','s-spring-tooltip','s-status-morph-button','s-click-spark','s-scrub-number','s-glare-hover','s-peek-rating','s-logo-loop'];
const thumb={'s-spotlight-cards':{hover:'.spc-card:nth-child(2)',pos:{x:150,y:40}},'s-magnify-dock':{hover:'.dk-item:nth-child(3)'},'s-tilt-card':{hover:'.tc',pos:{x:280,y:50}},'s-glow-bento':{hover:'.gb-card:nth-child(1)',pos:{x:300,y:40}},'s-holo-profile-card':{hover:'.hp',pos:{x:230,y:70}},'s-flowing-menu':{hover:'.fm a:nth-child(2)',pos:{x:200,y:10},wait:700},'s-glare-hover':{hover:'.gh-card',wait:380},'s-click-spark':{click:'.cp',pos:{x:220,y:90},wait:130},'s-spring-tooltip':{hover:'.tp-wrap:nth-child(2) .tp-btn',wait:500},'s-magnet-button':{hover:'.mg',pos:{x:330,y:90}},'s-voice-pill':{click:'.vp-btn',wait:1500},'s-hold-to-confirm':{},'s-logo-loop':{wait:20}};
const all=[...components,...micro].map(i=>({...i,thumb:thumb[i.id]}));
const rank=id=>{const i=order.indexOf(id);return i<0?order.length:i};
export const showcase=[...all].sort((a,b)=>rank(a.id)-rank(b.id));
export const showcaseIds=new Set(showcase.map(i=>i.id));
export function showcaseItem(id){return showcase.find(i=>i.id===id)}
// Public catalogue row, in the shape dist/ui/index.json already uses.
export function showcaseRow(item,n){return {id:item.id,c:item.component,k:item.key,f:item.family,t:item.title,d:item.description,o:n+1,s:1,p:'/ui/s/'+item.id+'.html'}}
// Member-only detail, in the shape /api/prompts?area=ui-detail returns for database components.
export function showcaseDetail(id){const item=showcaseItem(id);if(!item)return null;return {id:item.id,title:item.title,category:item.component,family:item.family,description:item.description,prompt:item.prompt,code:componentCode(item),files:[],shadcn:[],npm:[],filename:'component.html',licence:SHOWCASE_LICENCE_TEXT,original:true}}
export function showcasePreview(id){const item=showcaseItem(id);return item?previewPage(item):null}
