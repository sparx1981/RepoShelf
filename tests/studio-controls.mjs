import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recipe,animationDuration,css,snippet,asciiSVG} from '../dist/studio/core.mjs';
import {drawAsciiText} from '../dist/studio/ascii.mjs';

assert.equal(animationDuration({speed:.25}),16);
assert.equal(animationDuration({speed:4}),1);
assert.equal(animationDuration({}),4);
assert.equal(recipe({speed:Infinity}).speed,1);
assert.equal(recipe({speed:999}).speed,4);
assert.equal(recipe({speed:-1}).speed,.25);
const animated={animate:true,speed:2};
assert.equal(recipe(JSON.parse(JSON.stringify(recipe(animated)))).speed,2,'Shared recipes retain speed');
for(const output of [css(animated),snippet(animated,'react'),snippet(animated,'tailwind')])assert.match(output,/studio-drift 2s/);
assert.match(css(animated),/prefers-reduced-motion: no-preference/);
assert.doesNotMatch(css({animate:false,speed:2}),/studio-drift/);
const html=await readFile(new URL('../dist/studio.html',import.meta.url),'utf8');
assert.match(html,/id="gradient-speed"/);
assert.doesNotMatch(html,/Slow animation/);

// Deliberately tall glyphs and wide advances exercise real font variability.
for(const text of ['ABC 0123456789','ÁÉÎÖÛ gypqj','AAAA\nBBBB\nCCCC\nDDDD\nEEEE','W'.repeat(200),'']){
 const painted=[],context={measureText(line){const size=Number(/([\d.]+)px/.exec(this.font)[1]);return {width:line.length*size*.8,actualBoundingBoxLeft:line?size*.1:0,actualBoundingBoxRight:line?line.length*size*.8+size*.1:0,actualBoundingBoxAscent:size*1.25,actualBoundingBoxDescent:size*.3}},fillText(line,x,y){painted.push({line,x,y})}};
 const positions=drawAsciiText(context,text,720,405);
 assert.equal(painted.length,positions.length);
 for(const box of positions){assert.ok(box.left>=31.9&&box.right<=688.1,'All glyphs fit horizontally');assert.ok(box.top>=31.9&&box.bottom<=373.1,'Accents and descenders fit vertically')}
}
const exported=asciiSVG('ABC123\ngypqj');
assert.match(exported,/height="60"/);
assert.match(exported,/<text x="16" y="26">ABC123/);
assert.match(exported,/<text x="16" y="40">gypqj/);
console.log('PASS: Animation speed persists and exports correctly; measured ASCII glyph bounds and export rows have room for accents and descenders.');
