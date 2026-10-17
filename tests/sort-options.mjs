import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// "View all" on a shelf copies the shelf's ranking into the sort box. A ranking the box does not offer used to leave it blank,
// after which every redraw of the page threw an error (seen with the Trendshift shelf).
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const select=/<select id="sort"[^>]*>([\s\S]*?)<\/select>/.exec(html)[1],options=[...select.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]);
const migration=await readFile(new URL('../supabase/migrations/202610100029_trendshift_ribbon.sql',import.meta.url),'utf8');
const modes=/mode in \(([^)]*)\)/.exec(migration)[1].split(',').map(x=>x.trim().replace(/'/g,''));
assert(modes.includes('trendshift'),'the latest shelf mode list is read');
const NO_OWN_SORT=new Set(['manual','random','daily','community']); // these fall back to Popular
for(const mode of modes)if(!NO_OWN_SORT.has(mode))assert(options.includes(mode),`the shelf mode "${mode}" needs a matching option in the sort box (has: ${options.join(', ')})`);
assert.match(app,/\.some\(o=>o\.value===all\.dataset\.rank\)\?all\.dataset\.rank:'popular'/,'View all falls back to Popular for a ranking the sort box lacks');
assert.match(app,/selectedOptions\[0\]\?\.textContent/,'a blank sort box can no longer stop the page from redrawing');
// searches shorter than two letters are real searches: the page waits for them instead of showing an empty result
assert.doesNotMatch(app,/state\.query\.trim\(\)\.length===1\)return/,'one-letter searches are not ignored');
assert.match(app,/browseQueued=true;browseTimer=setTimeout\(\(\)=>\{browseQueued=false/,'a search waiting for its short delay is marked as pending');
assert.match(app,/\(browsePending\|\|browseQueued\)&&state\.view==='discover'/,'the grid shows the loading state while a search is pending');
console.log(`PASS: every shelf ranking has a sort option (${options.join(', ')}), View all cannot blank the sort box, and short searches show a loading state.`);
