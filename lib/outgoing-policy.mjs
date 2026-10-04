export function requiresAccount(url){
 const host=url.hostname.toLowerCase().replace(/^www\./,'');let path=url.pathname.toLowerCase();try{path=decodeURIComponent(path)}catch{};
 return host==='github.com'&&/^\/[\w.-]+\/[\w.-]+\/fork\/?$/.test(path)||host==='huggingface.co'&&path.startsWith('/spaces/')&&url.searchParams.get('duplicate')==='true';
}
