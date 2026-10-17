export function requiresAccount(url){
 const host=url.hostname.toLowerCase().replace(/^www\./,'');let path=url.pathname.toLowerCase();try{path=decodeURIComponent(path)}catch{};
 return host==='github.com'&&/^\/[\w.-]+\/[\w.-]+\/fork\/?$/.test(path)||host==='huggingface.co'&&path.startsWith('/spaces/')&&url.searchParams.get('duplicate')==='true';
}

// A link that arrives from anywhere but a RepoShelf page (an email, a chat, another website) must not bounce a visitor straight
// to another site under our domain's name. Browsers say where a navigation came from; anything but our own pages, including a
// browser that sends nothing, gets a page that names the destination first.
export const fromThisSite=headers=>String(headers?.['sec-fetch-site']||'').toLowerCase()==='same-origin';
const html=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function leavingPage(url){
 const host=html(url.host),target=html(url.href);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>You are leaving RepoShelf</title><style>:root{color-scheme:light dark}body{font:16px/1.5 system-ui,sans-serif;margin:0;display:grid;min-height:100vh;place-items:center;padding:16px;background:Canvas;color:CanvasText}main{max-width:34rem}h1{font-size:1.5rem;margin:0 0 .75rem}p{margin:.5rem 0}code{display:block;overflow-wrap:anywhere;padding:.75rem;border:1px solid GrayText;border-radius:6px}a.go{display:inline-block;margin:.75rem .75rem .75rem 0;padding:.65rem 1rem;border-radius:6px;background:LinkText;color:Canvas;text-decoration:none;min-height:24px}a{color:LinkText}</style></head><body><main><h1>You are leaving RepoShelf</h1><p>This link goes to <strong>${host}</strong>. RepoShelf does not run that site and cannot vouch for it.</p><code>${target}</code><p><a class="go" href="${target}" rel="noopener noreferrer nofollow">Continue to ${host}</a><a href="/">Back to RepoShelf</a></p></main></body></html>`;
}
