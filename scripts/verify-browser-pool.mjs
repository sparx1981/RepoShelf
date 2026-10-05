import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {chromium} from 'playwright';
import {createDemoSession} from './demo-session.mjs';
import {publicUrlGuard} from './demo-health.mjs';
const dir=await mkdtemp(join(tmpdir(),'reposhelf-context-'));let launches=0;
const session=createDemoSession({launch:async()=>{launches++;return chromium.launch({headless:true})},guardFactory:()=>publicUrlGuard({resolver:async()=>[{address:'8.8.8.8'}]}),inspect:async page=>{
 assert.deepEqual(await page.context().cookies(),[],'Cookies must never carry across projects');assert.equal(await page.evaluate(()=>window.privateProjectState),undefined);
 await page.context().addCookies([{name:'private',value:'one-project-only',url:'https://fixture.example'}]);await page.evaluate(()=>window.privateProjectState='one-project-only');
 await page.setContent('<html><body><h1>A real isolated browser context</h1><p>Rendered screenshot fixture.</p></body></html>');return {kind:'working'};
}});
try{for(let i=0;i<3;i++){const path=join(dir,i+'.jpg');const result=await session.probe({target:'https://fixture.example',screenshot:path});assert.equal(result.screenshot,true);assert.equal((await readFile(path))[0],0xff)}assert.equal(launches,1);assert.equal(session.stats().contexts,3);console.log('PASS: real Chromium reuse creates isolated cookie/page state and valid screenshots for every context.')}finally{await session.close();await rm(dir,{recursive:true,force:true})}
