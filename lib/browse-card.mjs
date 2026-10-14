import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),S=require('../dist/storefront.js'),Q=require('../dist/quality.js');
export function compactProject(r,now=Date.now()){
 const keys=['repositoryId','repositoryAliases','full','name','description','authorDescription','editorialDescription','source','spaceId','githubFull','category','subjects','platforms','classification','language','demo','demoSource','availability','stars','forks','likes','created','updated','license','runtime','color','ink','symbol','lastCheckedAt','releaseCheckedAt','spaces'];
 const out=Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
 // Runtime filtering only needs the version marker; full evidence remains in saved project details and admin summaries.
 if(r.classification)out.classification={version:r.classification.version};
 out.catalogueState=Q.catalogueState(r,now);
 out.description=String(out.description||'').slice(0,1000);
 out.technologies=S.technologies(r);out.topics=(r.topics||[]).slice(0,40);
 out.discoveredVia=(r.discoveredVia||[]).filter(s=>s.kind==='x'&&typeof s.url==='string'&&/^https:\/\/(?:x\.com|twitter\.com)\/(?:[^/?#]+\/status|i\/web\/status)\/\d+(?:[?#].*)?$/.test(s.url)).slice(0,20).map(({kind,name,url})=>({kind,name,url}));
 out.screenshots=S.images(r).slice(0,1).map(({src,kind,url,capturedAt})=>({src,kind,url,capturedAt}));
 if(r.demoHealth)out.demoHealth={url:r.demoHealth.url,status:r.demoHealth.status,checkedAt:r.demoHealth.checkedAt,attemptedAt:r.demoHealth.attemptedAt,nextCheckAt:r.demoHealth.nextCheckAt,consecutiveTemporaryFailures:r.demoHealth.consecutiveTemporaryFailures,...(r.demoHealth.error?{error:{reason:r.demoHealth.error.reason}}:{})};
 if(r.previewCheck)out.previewCheck={url:r.previewCheck.url,attemptedAt:r.previewCheck.attemptedAt,nextCheckAt:r.previewCheck.nextCheckAt,consecutiveFailures:r.previewCheck.consecutiveFailures,status:r.previewCheck.status,reason:r.previewCheck.reason};
 if(r.previewAttemptAt)out.previewAttemptAt=r.previewAttemptAt;
 if(r.latestRelease)out.latestRelease={tag:r.latestRelease.tag,name:r.latestRelease.name,publishedAt:r.latestRelease.publishedAt,url:r.latestRelease.url};
 // External trend evidence (one derived score, no list positions); the boost itself is applied at ranking time so it can fade.
 if(r.trendshift&&r.trendshift.signal>0)out.trendshift={seenAt:r.trendshift.seenAt,signal:r.trendshift.signal};
 out.trendSummary=S.trend(r,now);out.trendComputedAt=new Date(now).toISOString();
 out.searchOverview=(r.overview?.paragraphs||[]).join(' ').slice(0,6000);
 out.searchReadme=(r.readmeSnapshot?.searchTerms||[]).join(' ').slice(0,12000);
 return out;
}
