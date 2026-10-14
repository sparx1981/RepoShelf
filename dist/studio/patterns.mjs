import {patternState,patternSVG,patternCSS} from './experiments-core.mjs';
export function patternTool({change}){const $=id=>document.getElementById('pattern-'+id);let state=patternState();
 function draw(){for(const key of Object.keys(state)){const node=$(key);if(node){if(node.type==='checkbox')node.checked=state[key];else node.value=state[key]}}for(const key of ['spacing','size','opacity'])$(key+'-value').textContent=key==='opacity'?Math.round(state[key]*100)+'%':state[key]+' px';$('preview').innerHTML=patternSVG(state);change()}
 for(const key of Object.keys(state))if($(key))$(key).oninput=e=>{$('preset').value='';state=patternState({...state,[key]:e.target.type==='checkbox'?e.target.checked:e.target.value});draw()};
 const presets={print:{kind:'dots',spacing:22,size:2,ink:'#18382e',background:'#e7eddd'},technical:{kind:'grid',spacing:48,size:1,ink:'#80a8bb',background:'#111e29',opacity:.35},ripple:{kind:'waves',spacing:80,size:2,ink:'#bfd5fa',background:'#182549',angle:45}};
 $('preset').onchange=e=>{state=patternState(presets[e.target.value]||{});draw()};$('reset').onclick=()=>{state=patternState();$('preset').value='';draw()};draw();return {get:()=>({...state}),set:s=>{if(s){state=patternState(s);draw()}},svg:()=>patternSVG(state),tile:()=>patternSVG(state,true),css:()=>patternCSS(state)}
}
