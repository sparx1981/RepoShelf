import {createAccounts,accountFailure} from '../lib/accounts.mjs';import {createViewerHandler} from '../lib/viewer.mjs';
export function createHandler(accounts=createAccounts(),options={}){const handler=createViewerHandler({accounts,...options});return async(req,res)=>{try{await handler(req,res)}catch(e){accountFailure(res,e)}}}
export default createHandler();
