import {createInterface} from 'node:readline';
import {chromium} from 'playwright';
import {createDemoSession} from './demo-session.mjs';
import {demoPreflight} from './demo-preflight.mjs';
import {inspectPreview} from './preview-quality.mjs';
import {readFile,unlink} from 'node:fs/promises';
const session=createDemoSession({launch:()=>chromium.launch({headless:true})});
try{for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 let id;try{const request=JSON.parse(line);id=request.id;if(!Number.isSafeInteger(id))throw Error('Invalid ID');const preflight=await demoPreflight(request.input.target);let result=preflight.skip?{...preflight,preflight:true}:await session.probe(request.input);if(result.screenshot){const quality=await inspectPreview(await readFile(request.input.screenshot));if(!quality.usable){result.screenshot=false;result.reason=quality.reason;await unlink(request.input.screenshot).catch(()=>{})}}process.stdout.write(JSON.stringify({id,result,stats:session.stats()})+'\n')}
 catch{process.stdout.write(JSON.stringify({id,result:{kind:'temporary',reason:'probe_error'}})+'\n')}
}}finally{await session.close()}
