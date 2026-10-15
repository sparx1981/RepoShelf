import assert from 'node:assert/strict';
import vm from 'node:vm';
import sharp from 'sharp';
import {motionState,motionFrame,motionHTML} from '../dist/studio/experiments-core.mjs';
import {createInk,inkHTML} from '../dist/studio/fluid-ink.mjs';
for(const kind of ['flow','plasma','spring','path','lissajous','ripples','tunnel','constellation','helix','pendulums','orbits','radar','lattice','fountain','bloom','equalizer']){
 const s=motionState({kind});assert.equal(s.kind,kind);assert.notEqual(motionFrame(s,.1),motionFrame(s,.3));assert.equal(motionFrame(s,0),motionFrame(s,1));
 for(const phase of [0,.1,.25,.5,.75,.99])await sharp(Buffer.from(motionFrame(s,phase))).resize(192,108).png().toBuffer();
 const exported=motionHTML(s).match(/<script>([\s\S]*?)<\/script>/)[1];
 const art={},button={setAttribute(){}},media={matches:false,addEventListener(){}};
 vm.runInNewContext(exported,{document:{hidden:false,getElementById:id=>id==='art'?art:button,addEventListener(){}},matchMedia:()=>media,cancelAnimationFrame(){},requestAnimationFrame(){throw Error('Exports must start paused')}});
 assert.equal(art.innerHTML,motionFrame(s,s.phase),'standalone export renders the same frame');
 for(const amount of [8,64])for(const amplitude of [10,160]){const svg=motionFrame(motionState({kind,amount,amplitude}),.37);assert.doesNotMatch(svg,/NaN|Infinity/);await sharp(Buffer.from(svg)).resize(192,108).png().toBuffer()}
}
assert.notEqual(motionFrame(motionState({kind:'flow',seed:'one'})),motionFrame(motionState({kind:'flow',seed:'two'})));
const engine=createInk(),empty=engine.pixels();engine.splat(.5,.5,.5,-.5,'#ff2200');assert.notDeepEqual(engine.pixels(),empty);const first=engine.snapshot();
for(let i=0;i<300;i++)engine.step(1/30,{swirl:50,dissipation:.05});assert(engine.snapshot().fields.flat().every(Number.isFinite));assert.notDeepEqual(engine.snapshot(),first);
const copy=createInk();assert(copy.restore(engine.snapshot()));assert.deepEqual(copy.snapshot(),engine.snapshot());assert(!copy.restore({n:32,fields:[[NaN]]}));
engine.step(NaN,{swirl:NaN,dissipation:NaN});assert(engine.snapshot().fields.flat().every(Number.isFinite));
await sharp(Buffer.from(engine.svg())).resize(192,108).png().toBuffer();
const html=inkHTML(motionState({kind:'ink'}),engine.snapshot());new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);assert(!html.includes('https://'));engine.clear();assert.deepEqual(engine.pixels(),empty);
console.log('PASS: New motion modes render and loop; fluid evolves, stays finite, restores safely and exports offline HTML.');
// Execute standalone ink export, including its keyboard controls and playback lifecycle.
const elements=new Map(),frames=new Map(),media={matches:false,addEventListener(){}},events={};let serial=0;
const node=()=>({width:960,height:540,textContent:'',getContext:()=>({putImageData(){},drawImage(){}}),setAttribute(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})});
const doc={hidden:false,getElementById:id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)},createElement:node,addEventListener:(k,f)=>events[k]=f};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{document:doc,matchMedia:()=>media,ImageData:class{constructor(data,width,height){Object.assign(this,{data,width,height})}},requestAnimationFrame:f=>{frames.set(++serial,f);return serial},cancelAnimationFrame:id=>frames.delete(id)});
assert.equal(frames.size,0);elements.get('splat').onclick();elements.get('play').onclick();assert.equal(frames.size,1);doc.hidden=true;events.visibilitychange();assert.equal(frames.size,0);
