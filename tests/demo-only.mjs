import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {enforceDemoOnly,hasDemoLink} from '../scripts/demo-only-policy.mjs';
import {compressPreviews} from '../scripts/compress-previews.mjs';
const dir=await mkdtemp(join(tmpdir(),'reposhelf-demo-only-')),root=pathToFileURL(dir+'/'),key=id=>createHash('sha256').update(id.toLowerCase()).digest('hex'),file='a'.repeat(24)+'.jpg',orphan='b'.repeat(24)+'.jpg';
try{
 for(const path of ['dist/previews','data/readmes','data/context'])await mkdir(join(dir,path),{recursive:true});
 const demo={full:'org/live',demo:'https://demo.pages.dev/',availability:'available',screenshots:[{src:'previews/'+file}]},broken={full:'org/broken',demo:'https://broken.app/',demoHealth:{status:'unavailable'}},temporary={full:'org/retry',demo:'https://retry.app/',checkError:{kind:'rate_limit'}},plain={full:'org/plain',demo:null};
 await writeFile(join(dir,'dist/catalog.json'),JSON.stringify({repositories:[demo,broken,temporary,plain]}));await writeFile(join(dir,'dist/spaces.json'),JSON.stringify({repositories:[{full:'hf:org/live',demo:'https://huggingface.co/spaces/org/live'},{full:'hf:org/empty',demo:null}]}));
 for(const type of ['readmes','context'])for(const repo of [demo,plain])await writeFile(join(dir,'data',type,key(repo.full)+'.json.gz'),'saved document');
 await writeFile(join(dir,'dist/previews',file),'live image');await writeFile(join(dir,'dist/previews',orphan),'orphan image');await writeFile(join(dir,'dist/previews','unrelated.txt'),'leave alone');
 const result=await enforceDemoOnly(root);assert.equal(result.removed,2);assert.equal(result.filesRemoved,3);const data=JSON.parse(await readFile(join(dir,'dist/catalog.json'),'utf8'));assert.deepEqual(data.repositories.map(r=>r.full),[demo,broken,temporary].map(r=>r.full));assert.equal(data.policy,'demo-only');assert.equal(await readFile(join(dir,'dist/previews',file),'utf8'),'live image');assert.equal(await readFile(join(dir,'dist/previews','unrelated.txt'),'utf8'),'leave alone');await assert.rejects(readFile(join(dir,'data/readmes',key(plain.full)+'.json.gz')));assert(hasDemoLink({demo:'https://huggingface.co/spaces/a/b'}));assert(!hasDemoLink({demo:'https://github.com/a/b'}));assert.deepEqual(await enforceDemoOnly(root),{removed:0,filesRemoved:0,bytesRemoved:0});
 let sharp;try{sharp=(await import('sharp')).default}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e}
 if(sharp){const large=await sharp(randomBytes(1600*1000*3),{raw:{width:1600,height:1000,channels:3}}).jpeg({quality:92}).toBuffer();await writeFile(join(dir,'dist/previews',file),large);const first=await compressPreviews(root,1);assert.equal(first.checked,1);assert(first.bytesSaved>0);const optimized=await readFile(join(dir,'dist/previews',file));assert.equal((await sharp(optimized).metadata()).width,960);const second=await compressPreviews(root,1);assert.equal(second.checked,0,'Skip already optimized bytes, preventing cumulative JPEG loss');assert.deepEqual(await readFile(join(dir,'dist/previews',file)),optimized)}else console.log('Screenshot codec checks run in CI with sharp installed.');
 console.log('PASS: demo-only cleanup, broken/rate-limited retention, HF demo eligibility, orphan document/image deletion, idempotency and screenshot compression deduplication.');
}finally{await rm(dir,{recursive:true,force:true})}
