import {createInterface} from 'node:readline';
import {chromium} from 'playwright';
import {createDemoSession} from './demo-session.mjs';
const session=createDemoSession({launch:()=>chromium.launch({headless:true})});
try{for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 let id;try{const request=JSON.parse(line);id=request.id;if(!Number.isSafeInteger(id))throw Error('Invalid ID');const result=await session.probe(request.input);process.stdout.write(JSON.stringify({id,result,stats:session.stats()})+'\n')}
 catch{process.stdout.write(JSON.stringify({id,result:{kind:'temporary',reason:'probe_error'}})+'\n')}
}}finally{await session.close()}
