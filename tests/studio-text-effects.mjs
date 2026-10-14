import assert from 'node:assert/strict';
import vm from 'node:vm';
import sharp from 'sharp';
import {textEffectState,textEffectSVG,textEffectHTML,textUnits} from '../dist/studio/text-effects-core.mjs';
assert.deepEqual(textUnits('A👩‍👩‍👧‍👦e\u0301','letter'),['A','👩‍👩‍👧‍👦','é']);
assert.equal(textEffectState({font:'dm',weight:800}).weight,700);
for(const layout of ['straight','arc','circle','wave'])for(const appearance of ['plain','glow','neon','spotlight','embossed','enamel']){
 const svg=textEffectSVG({layout,appearance,text:'Ágyp 0123',radius:220,size:144});assert.ok(!svg.includes('NaN'));const out=await sharp(Buffer.from(svg)).png().toBuffer();assert.ok(out.length>1000);const pixels=await sharp(Buffer.from(textEffectSVG({layout,appearance:'plain',ink:'#ffffff',background:'#000000',text:'TEST words',unit:'letter'}))).removeAlpha().raw().toBuffer();assert.ok(pixels.some(v=>v>20),'curved layouts contain actual text');
}
for(const animation of ['reveal','rise','wave','sweep','weight'])assert.notEqual(textEffectSVG({animation},.2),textEffectSVG({animation},.7));
for(const layout of ['straight','arc','circle','wave'])for(const unit of ['word','letter']){const {data,info}=await sharp(Buffer.from(textEffectSVG({layout,unit,text:'W'.repeat(120),size:144,radius:220,appearance:'plain',ink:'#ffffff',background:'#000000'}))).removeAlpha().raw().toBuffer({resolveWithObject:true});let min=info.width,max=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*info.channels]>30){min=Math.min(min,x);max=Math.max(max,x)}assert.ok(max>=min&&min>0&&max<info.width-1,'wide words fit '+layout+' '+unit)}
const dangerous='</script><img src=x onerror=alert(1)> & "';const svg=textEffectSVG({text:dangerous});assert.ok(!svg.includes('<img'));assert.match(svg,/&lt;/);
const html=textEffectHTML({text:dangerous,animation:'rise',unit:'word'});const script=/<script>([\s\S]*)<\/script>/.exec(html)[1];assert.equal((html.match(/<\/script>/g)||[]).length,1);new vm.Script(script);assert.match(script,/\\u003c/);assert.match(script,/prefers-reduced-motion/);
const nodes={art:{},play:{setAttribute(){}}},frames=new Map();let id=0;const media={matches:false,addEventListener(){}};
vm.runInNewContext(script,{Intl,document:{hidden:false,getElementById:id=>nodes[id],addEventListener(){}},matchMedia:()=>media,requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:i=>frames.delete(i)});assert.equal(frames.size,0);assert.match(nodes.art.innerHTML,/<svg/);nodes.play.onclick();assert.equal(frames.size,1);nodes.play.onclick();assert.equal(frames.size,0);
console.log('PASS: Text layouts/materials rasterise; glyph clusters, safe text, animation phases and paused standalone export pass.');
