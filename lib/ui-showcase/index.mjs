import {components} from './components.mjs';
import {micro} from './micro.mjs';
import {textfx} from './textfx.mjs';
import {textfxCanvas} from './textfx-canvas.mjs';
import {textfxMore} from './textfx-more.mjs';
import {textfxFlow} from './textfx-flow.mjs';
import {componentCode,previewPage,SHOWCASE_LICENCE_TEXT} from './base.mjs';
export {SHOWCASE_LICENCE_TEXT,SHOWCASE_LICENCE,previewPage,componentCode} from './base.mjs';
// Showcase order is deliberate: the strongest, most visual examples come first.
const order=['s-spotlight-cards','s-particle-text','s-magnify-dock','s-letter-cubes','s-tilt-card','s-shatter-type','s-glow-bento','s-neon-sign','s-slide-pill-nav','s-split-flap','s-squish-switch','s-proximity-type','s-holo-profile-card','s-word-morph','s-gooey-nav','s-vapour-type','s-hold-to-confirm','s-echo-type','s-glass-panel','s-cipher-reveal','s-flowing-menu','s-ring-text','s-burst-like','s-wave-lettering','s-card-stack','s-flashlight-text','s-rubber-segmented','s-type-wall','s-orbit-border-button','s-bending-marquee','s-spring-checkbox','s-scatter-type','s-expanding-gallery','s-ink-outline','s-voice-pill','s-velocity-marquee','s-slosh-gauge','s-domino-type','s-magnet-button','s-rising-lines','s-progress-stepper','s-swipe-rows','s-spring-tooltip','s-status-morph-button','s-click-spark','s-scrub-number','s-glare-hover','s-peek-rating','s-logo-loop'];
const thumb={'s-spotlight-cards':{hover:'.spc-card:nth-child(2)',pos:{x:150,y:40}},'s-magnify-dock':{hover:'.dk-item:nth-child(3)'},'s-tilt-card':{hover:'.tc',pos:{x:280,y:50}},'s-glow-bento':{hover:'.gb-card:nth-child(1)',pos:{x:300,y:40}},'s-holo-profile-card':{hover:'.hp',pos:{x:230,y:70}},'s-flowing-menu':{hover:'.fm a:nth-child(2)',pos:{x:200,y:10},wait:700},'s-glare-hover':{hover:'.gh-card',wait:380},'s-click-spark':{click:'.cp',pos:{x:220,y:90},wait:130},'s-spring-tooltip':{hover:'.tp-wrap:nth-child(2) .tp-btn',wait:500},'s-magnet-button':{hover:'.mg',pos:{x:330,y:90}},'s-voice-pill':{click:'.vp-btn',wait:1500},'s-hold-to-confirm':{},'s-logo-loop':{wait:20},
's-particle-text':{hover:'canvas',pos:{x:360,y:150},wait:2200},'s-shatter-type':{click:'canvas',pos:{x:300,y:150},wait:330},'s-word-morph':{wait:1900},'s-letter-cubes':{wait:3350},'s-neon-sign':{wait:3000},'s-split-flap':{wait:4300},'s-proximity-type':{hover:'.px-line',pos:{x:300,y:70},wait:500},'s-echo-type':{hover:'.ec',pos:{x:560,y:130},wait:900},'s-vapour-type':{hover:'.vp-word',wait:420},'s-cipher-reveal':{wait:750},'s-flashlight-text':{hover:'.fl',pos:{x:230,y:130},wait:700},'s-type-wall':{hover:'.tw',pos:{x:300,y:150},wait:900},'s-bending-marquee':{hover:'.bm',pos:{x:380,y:50},wait:1500},'s-scatter-type':{click:'.sct',pos:{x:330,y:160},wait:260},'s-ink-outline':{wait:1100},'s-domino-type':{click:'.dm-tile:nth-child(4)',wait:1000},'s-rising-lines':{wait:1500},'s-ring-text':{hover:'.rt',pos:{x:420,y:120},wait:500},'s-wave-lettering':{hover:'.wv',pos:{x:520,y:90},wait:500}};
const all=[...components,...micro,...textfx,...textfxCanvas,...textfxMore,...textfxFlow].map(i=>({...i,thumb:thumb[i.id]}));
const rank=id=>{const i=order.indexOf(id);return i<0?order.length:i};
export const showcase=[...all].sort((a,b)=>rank(a.id)-rank(b.id));
export const showcaseIds=new Set(showcase.map(i=>i.id));
export function showcaseItem(id){return showcase.find(i=>i.id===id)}
// Public catalogue row, in the shape dist/ui/index.json already uses.
export function showcaseRow(item,n){return {id:item.id,c:item.component,k:item.key,f:item.family,t:item.title,d:item.description,o:n+1,s:1,p:'/ui/s/'+item.id+'.html'}}
// Member-only detail, in the shape /api/prompts?area=ui-detail returns for database components.
export function showcaseDetail(id){const item=showcaseItem(id);if(!item)return null;return {id:item.id,title:item.title,category:item.component,family:item.family,description:item.description,prompt:item.prompt,code:componentCode(item),files:[],shadcn:[],npm:[],filename:'component.html',licence:SHOWCASE_LICENCE_TEXT,original:true}}
export function showcasePreview(id){const item=showcaseItem(id);return item?previewPage(item):null}
