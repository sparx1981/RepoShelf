import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import {liveItems,liveFragment} from './dist/studio/live-shaders.mjs';
const only=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();
for(const it of liveItems.filter(i=>!only.length||only.includes(i.category))){
 const r=await p.evaluate(src=>{const g=document.createElement('canvas').getContext('webgl');const s=g.createShader(g.FRAGMENT_SHADER);g.shaderSource(s,src);g.compileShader(s);return g.getShaderParameter(s,g.COMPILE_STATUS)?'ok':g.getShaderInfoLog(s)},liveFragment(it.id));
 if(r!=='ok')console.log(it.id,r.trim().slice(0,300));
}
console.log('checked');await b.close();
