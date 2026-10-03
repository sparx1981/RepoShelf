import {saveReadmeSnapshot} from './agent-snapshots.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {withProjectInsights,INSIGHTS_VERSION} from './project-insights.mjs';
import {createRequire} from 'node:module';
import {OVERVIEW_VERSION,readOverviewReadme,withOverview} from './readme-overviews.mjs';
const require=createRequire(import.meta.url),P=require('../dist/providers.js');
const files=['catalog.json','spaces.json'].map(name=>new URL('../dist/'+name,import.meta.url));
const snapshots=await Promise.all(files.map(async file=>JSON.parse(await readFile(file,'utf8'))));
const now=Date.now(),at=new Date(now).toISOString();
const due=snapshots.flatMap(s=>s.repositories).filter(r=>r.availability!=='unavailable')
  .filter(r=>!r.overviewAttemptAt||now-Date.parse(r.overviewAttemptAt)>=6*3600000)
  .filter(r=>!r.overviewCheckedAt||now-Date.parse(r.overviewCheckedAt)>=7*86400000||r.overview?.version&&r.overview.version!==OVERVIEW_VERSION||r.updated!==r.overviewRepoUpdated||r.projectInsights?.version!==INSIGHTS_VERSION||r.readmeSnapshot?.version!==1);
// Start with projects that have never been checked, then revisit the oldest overviews.
due.sort((a,b)=>(Date.parse(a.overviewCheckedAt)||0)-(Date.parse(b.overviewCheckedAt)||0));
const github=P.popular(due.filter(r=>!P.isSpace(r))).sort((a,b)=>(Date.parse(a.overviewCheckedAt)||0)-(Date.parse(b.overviewCheckedAt)||0));
const spaces=P.popular(due.filter(P.isSpace)).sort((a,b)=>(Date.parse(a.overviewCheckedAt)||0)-(Date.parse(b.overviewCheckedAt)||0));
const candidates=[...github.slice(0,Number(process.env.OVERVIEW_GITHUB_BATCH||100)),...spaces.slice(0,Number(process.env.OVERVIEW_SPACE_BATCH||40))];
let checked=0,found=0,failed=0;
for(const r of candidates){r.overviewAttemptAt=at;try{const {markdown,sourceUrl}=await readOverviewReadme(r);Object.assign(r,withProjectInsights(withOverview(r,markdown,sourceUrl),markdown,sourceUrl),{overviewRepoUpdated:r.updated,readmeSnapshot:await saveReadmeSnapshot(r,markdown,sourceUrl)});checked++;if(r.overview)found++}catch(e){r.overviewError={at,kind:'temporary'};failed++;console.warn(`Overview postponed: ${r.full}: ${e.message}`)}}
for(let i=0;i<files.length;i++){snapshots[i].updatedAt=new Date().toISOString();await writeFile(files[i],JSON.stringify(snapshots[i],null,2)+'\n')}
console.log(`Overviews: ${checked} READMEs checked, ${found} author overviews saved, ${failed} temporary failures. Saved text retained on failures.`);
