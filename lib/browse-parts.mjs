import {createRequire} from 'node:module';
const Q=createRequire(import.meta.url)('../dist/quality.js');
// Public pages only ever show repositories that pass publishedEligible: the server filters every public request down to them before doing anything
// else, and listing controls can only remove repositories or screenshots, never make an unpublished repository eligible. So the index and its search text
// are also written in two parts. Every public request loads only the published part; the rest is read only to merge the complete list back for
// administrators. `positions` records where each repository sat in the complete list, so merging restores the exact order.
export const PUBLISHED_INDEX='index-pub.json',REST_INDEX='index-rest.json',PUBLISHED_SEARCH='search-pub.json.gz',REST_SEARCH='search-rest.json.gz';
export function splitPublished(index,search,at=Q.evidenceTime(index.snapshots?.catalog)){
 const parts={published:{repositories:[],positions:[],entries:{}},rest:{repositories:[],positions:[],entries:{}}};
 index.repositories.forEach((r,i)=>{const part=Q.publishedEligible(r,at)?parts.published:parts.rest;part.repositories.push(r);part.positions.push(i);const entry=search.entries?.[r.full];if(entry)part.entries[r.full]=entry});
 const make=(name,file,{repositories,positions,entries})=>({index:{...index,part:name,search:file,total:index.repositories.length,positions,repositories},search:{...search,entries}});
 return {published:make('published',PUBLISHED_SEARCH,parts.published),rest:make('rest',REST_SEARCH,parts.rest)};
}
// The inverse of splitPublished: the complete list in its original order.
export function mergePublished(published,rest){
 const repositories=new Array(published.total);published.positions.forEach((p,i)=>{repositories[p]=published.repositories[i]});rest.positions.forEach((p,i)=>{repositories[p]=rest.repositories[i]});
 const {positions,part,total,repositories:_a,search,...head}=published;return {...head,search:[PUBLISHED_SEARCH,REST_SEARCH],repositories};
}
