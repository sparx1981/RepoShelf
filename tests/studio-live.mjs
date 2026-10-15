import assert from 'node:assert/strict';
import {readdir,stat} from 'node:fs/promises';
import {liveItems,liveFragment,liveParams,liveHTML,liveReact,PRELUDE,LIVE_IDS} from '../dist/studio/live-shaders.mjs';
import {transform} from 'esbuild';
import {studioItem,backgroundDetail} from '../lib/studio.mjs';

assert.ok(liveItems.length>=20,'At least twenty live backgrounds ship');
assert.equal(new Set(LIVE_IDS).size,LIVE_IDS.length,'Live ids are unique');
const existing=JSON.parse((await import('node:fs/promises').then(m=>m.readFile(new URL('../dist/studio/index.json',import.meta.url),'utf8'))));
const taken=new Set(existing.map(i=>i.id));
for(const item of liveItems){
 assert.match(item.id,/^[a-z0-9-]{1,80}$/,'Safe id '+item.id);assert.ok(!taken.has(item.id),'No clash with static ids: '+item.id);
 assert.equal(item.colors.length,4);for(const c of item.colors)assert.match(c,/^#[0-9a-f]{6}$/i);
 assert.ok(item.title&&item.description&&item.category.startsWith('Live'),'Metadata present: '+item.id);
 assert.ok(['Green','Blue','Purple','Pink','Orange','Neutral'].includes(item.colour),'Colour filter value: '+item.id);
 const source=liveFragment(item.id);
 assert.ok(source.startsWith(PRELUDE),'Shares the common prelude: '+item.id);
 assert.match(source,/void main\(\)\{[\s\S]*gl_FragColor=/,'Writes a colour: '+item.id);
 assert.equal([...source].filter(c=>c==='{').length,[...source].filter(c=>c==='}').length,'Balanced braces: '+item.id);
 assert.doesNotMatch(source,/texture2D|sampler2D|#extension|\bfor\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*[a-z]/,'No dynamic loops or texture dependencies: '+item.id);
 assert.doesNotMatch(source,/gl_FragColor=vec4\([^;]*\bNaN\b/);
}
assert.throws(()=>liveFragment('nope'));assert.throws(()=>liveParams('nope'));

// Parameters are always clamped to safe, renderable values.
const wild=liveParams('aurora-veil',{speed:999,scale:-4,amount:NaN,seed:1e9,colors:['red','#abcdef']});
assert.equal(wild.speed,4);assert.equal(wild.scale,.5);assert.equal(wild.amount,liveItems[0].defaults.amount);assert.equal(wild.seed,999);
assert.equal(wild.colors.length,4);assert.equal(wild.colors[0],liveItems[0].defaults.colors[0]);assert.equal(wild.colors[1],'#abcdef');
assert.deepEqual(liveParams('aurora-veil'),liveItems[0].defaults);

// Thumbnails: one per background, reasonably small.
const thumbs=new Set(await readdir(new URL('../dist/studio/thumbs/',import.meta.url)));
for(const item of liveItems){assert.ok(thumbs.has(item.id+'.webp'),'Thumbnail for '+item.id);assert.ok((await stat(new URL('../dist/studio/thumbs/'+item.id+'.webp',import.meta.url))).size<32000,'Small thumbnail '+item.id)}

// Exports are self-contained, dependency-free and keep the licence notice.
for(const id of ['aurora-veil','dither-waves']){
 const html=liveHTML(id,{speed:2,colors:['#112233','#445566','#778899','#aabbcc']}),react=liveReact(id);
 assert.match(html,/RepoShelf Studio licence/);assert.match(html,/const createRunner=function createRunner\(/);assert.doesNotMatch(html,/<script[^>]+src=|https?:\/\/(?!www\.reposhelf\.co\.uk)/,'No external requests in HTML export');
 assert.match(html,/"speed":2/);assert.match(html,/#aabbcc/);
 const script=html.match(/<script>([\s\S]*)<\/script>/)[1];assert.doesNotThrow(()=>new Function('document',script.replace('createRunner(document','createRunner(document')),'Standalone script parses');
 assert.match(react,/export function \w+Background\(/);assert.match(react,/useEffect/);await transform(react,{loader:'jsx',format:'esm'});
}

// Server-side: saves and exports accept live ids and reject unknown ones.
const found=await studioItem('bg','aurora-veil');assert.equal(found.live,true);
const detail=backgroundDetail(found);assert.equal(detail.live,true);assert.match(detail.html,/<canvas/);assert.match(detail.react,/useEffect/);
await assert.rejects(()=>studioItem('bg','not-a-live-background'),/not available/i);
assert.equal((await studioItem('bg',existing[0].id)).id,existing[0].id,'Static backgrounds still resolve');

// Optional: compile every shader in a real browser when Playwright is supplied.
const module=process.env.REPOSHELF_PLAYWRIGHT_MODULE;
if(module){
 const {chromium}=await import(module);const browser=await chromium.launch({headless:true,executablePath:process.env.REPOSHELF_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{const page=await browser.newPage();
  const results=await page.evaluate(sources=>Object.entries(sources).map(([id,src])=>{const gl=document.createElement('canvas').getContext('webgl');const s=gl.createShader(gl.FRAGMENT_SHADER);gl.shaderSource(s,src);gl.compileShader(s);return [id,gl.getShaderParameter(s,gl.COMPILE_STATUS)?'ok':gl.getShaderInfoLog(s)]}),Object.fromEntries(LIVE_IDS.map(id=>[id,liveFragment(id)])));
  for(const [id,result] of results)assert.equal(result,'ok','Shader compiles: '+id+' '+result);
 }finally{await browser.close()}
 console.log('Compiled every live shader in Chromium.');
}else console.log('SKIP: browser shader compilation (set REPOSHELF_PLAYWRIGHT_MODULE to enable).');
console.log(`PASS: ${liveItems.length} live backgrounds have safe metadata, bounded parameters, thumbnails, dependency-free exports and server validation.`);
