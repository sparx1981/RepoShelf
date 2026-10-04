/* Cache only the offline screen and public app icons. Never cache catalogue, account or API responses. */
const CACHE='reposhelf-install-v1';
const OFFLINE='/offline.html';
const ASSETS=[OFFLINE,'/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('reposhelf-install-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.searchParams.has('code')||url.searchParams.has('error'))return;
 if(request.mode==='navigate')event.respondWith(fetch(request).catch(async()=>{const cached=await caches.match(OFFLINE);return cached||new Response('You are offline. Reconnect and reload RepoShelf.',{status:503,headers:{'Content-Type':'text/plain'}})}));
 else if(ASSETS.includes(url.pathname))event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
