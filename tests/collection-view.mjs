import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/collection-view.js',import.meta.url),'utf8');
function fixture(saved,blocked=false){
 let changed,clicked,writes=[];
 const classes=()=>({values:new Set(),toggle(key,on){on?this.values.add(key):this.values.delete(key)}});
 const buttons=['cards','list'].map(view=>({dataset:{collectionView:view},setAttribute(key,value){this[key]=value}}));
 const tabs={hidden:true,after(node){this.controls=node}},grid={classList:classes()},resources={classList:classes()};
 vm.runInNewContext(source,{document:{querySelector:s=>({'#collection-tabs':tabs,'#grid':grid,'#saved-prompts':resources})[s],createElement:()=>({setAttribute(){},querySelectorAll:()=>buttons,addEventListener(type,fn){clicked=fn}})},localStorage:{getItem(){if(blocked)throw Error('blocked');return saved},setItem(k,v){if(blocked)throw Error('blocked');writes.push([k,v])}},MutationObserver:class{constructor(fn){changed=fn}observe(){}}});
 return {tabs,grid,resources,buttons,writes,refresh:()=>changed(),click:view=>clicked({target:{closest:()=>buttons.find(b=>b.dataset.collectionView===view)}})};
}
for(const blocked of [false,true]){const f=fixture(null,blocked);assert(f.tabs.controls.hidden);f.tabs.hidden=false;f.refresh();assert.equal(f.buttons[0]['aria-pressed'],'true');f.click('list');assert(f.grid.classList.values.has('collection-list'));assert(f.resources.classList.values.has('collection-list'));assert.equal(f.buttons[1]['aria-pressed'],'true');f.tabs.hidden=true;f.refresh();assert(!f.grid.classList.values.has('collection-list'));f.tabs.hidden=false;f.refresh();assert(f.grid.classList.values.has('collection-list'));f.click('cards');assert(!f.resources.classList.values.has('collection-list'));if(!blocked)assert.deepEqual(f.writes.at(-1),['reposhelf.collection.view.v1','cards'])}
const saved=fixture('list');saved.tabs.hidden=false;saved.refresh();assert(saved.grid.classList.values.has('collection-list'));
const html=await readFile(new URL('../dist/connect.html',import.meta.url),'utf8');assert.match(html,/Authentication<\/strong>, select <strong>No sign-in/);assert.match(html,/Request headers/);assert.doesNotMatch(html,/leave sign-in options empty/);
console.log('PASS: collection view defaults, saved preference, storage failure, resource layouts, discover isolation and Claude API-key instructions.');
