// Only short, ordinary search phrases are eligible. Never keep prompts, URLs,
// email addresses, identifiers or credentials, even in an aggregate.
export function searchTerm(value){
 if(typeof value!=='string'||value.length>80)return null;
 const term=value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
 if(term.length<2||!/^[\p{L}\p{M} +#.-]+$/u.test(term)||term.split(' ').length>8||/(?:password|secret|token|api[ -]?key|bearer)\b/i.test(term))return null;
 return term;
}
export async function recordMcpSearch(accounts,body){
 const call=Array.isArray(body)?null:body;
 if(call?.method!=='tools/call'||call.params?.name!=='search_projects'||call.params.arguments?.cursor)return;
 const term=searchTerm(call.params.arguments?.q);if(!term||!accounts.config.serviceKey)return;
 try{await accounts.request('/rest/v1/rpc/reposhelf_record_mcp_search',{service:true,method:'POST',body:{term}})}catch{/* Telemetry must never interrupt a search. */}
}
