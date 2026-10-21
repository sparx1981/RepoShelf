// Referrers are reduced to a bare website name before storage. Paths, query strings and the visitor's own site never reach the database.
const SELF=/(^|\.)reposhelf\.co\.uk$|(^|\.)reposhelf[a-z0-9-]*\.vercel\.app$/;
export function referrerHost(value){
 if(typeof value!=='string')return null;
 const host=value.trim().toLowerCase().replace(/^www\./,'');
 if(!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)||host.length>80)return null;
 if(SELF.test(host)||/^\d+(\.\d+){3}$/.test(host)||host.endsWith('.local')||host==='localhost')return null;
 return host;
}
