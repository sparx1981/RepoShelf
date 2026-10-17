// One-off import of the MotionSites.ai free prompt texts (github.com/TheSatyam-Singh/motionsites.ai, prompts/).
// Text only: the repository's preview videos and images are never fetched or stored. Rows are stored as
// 'siteshelf' prompts, so the library shows our own generated pages once they exist, and source_url keeps the credit.
// A prompt already in the library is never touched, so edits made in the admin area survive a re-run, and a prompt deleted
// in the admin area is remembered (ss_prompt_tombstones) and not brought back.
export const REPO_URL='https://github.com/TheSatyam-Singh/motionsites.ai';
export const CREDIT_NAME='MotionSites.ai prompt library';
const FILE_BASE=REPO_URL+'/blob/main/prompts/';

export const slugOf=(file)=>file.replace(/\.md$/i,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);

export function parsePrompt(file,markdown){
  const md=markdown.replace(/\r\n/g,'\n');
  const title=/^#\s+(.+)$/m.exec(md)?.[1].trim();
  const meta=(k)=>new RegExp('^>\\s*\\*\\*'+k+':\\*\\*\\s*(.+?)\\s*$','mi').exec(md)?.[1].trim()||null;
  const start=md.indexOf('```text\n'),end=md.lastIndexOf('\n```');
  if(!title||start<0||end<=start)return null;
  const prompt=md.slice(start+8,end).trim();
  if(!prompt)return null;
  const licence=(meta('License')||'').toLowerCase();
  if(licence!=='free')return null;
  const first=prompt.split(/(?<=[.!?])\s/)[0].replace(/\s+/g,' ').trim();
  return {
    source:'siteshelf',source_id:slugOf(file),type:'free',title:title.slice(0,200),category:(meta('Category')||'Other').slice(0,80),
    description:(first.length>240?first.slice(0,237)+'...':first),
    prompt,original_prompt:prompt,published:true,is_new:true,
    source_url:FILE_BASE+encodeURIComponent(file)
  };
}

export function planImport(files,existingIds){
  const rows=[],skipped=[],seen=new Set();
  for(const [file,markdown] of files){
    const row=parsePrompt(file,markdown);
    if(!row||!/^[a-z0-9-]{1,80}$/.test(row.source_id)){skipped.push(file);continue}
    if(existingIds.has(row.source_id)||seen.has(row.source_id)){skipped.push(file);continue}
    seen.add(row.source_id);rows.push(row);
  }
  return {rows,skipped};
}

export function createMotionSitesImport({db}){
  return async function run(files){
    const have=await db('ss_prompts?source=eq.siteshelf&select=source_id&limit=5000');
    let gone=[];try{gone=await db('ss_prompt_tombstones?source=eq.siteshelf&select=source_id&limit=5000')}catch{} // before migration 0038
    const plan=planImport(files,new Set([...have,...gone].map(r=>r.source_id)));
    for(const row of plan.rows)await db('ss_prompts',{method:'POST',body:row});
    return {found:files.length,added:plan.rows.length,skipped:plan.skipped.length};
  };
}

// Downloads the free prompt files straight from the public repository (text only).
export async function fetchMotionSitesFiles(fetcher=fetch){
  const headers={'User-Agent':'RepoShelf prompt library import (+https://www.reposhelf.co.uk)',Accept:'application/vnd.github+json'};
  const get=async(url,as)=>{const r=await fetcher(url,{headers,signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`GitHub answered ${r.status}`);return r[as]()};
  const list=await get('https://api.github.com/repos/TheSatyam-Singh/motionsites.ai/contents/prompts','json');
  if(!Array.isArray(list))throw new Error('GitHub did not return the prompt list.');
  const names=list.filter(f=>f&&f.type==='file'&&/^[A-Za-z0-9_.-]{1,120}\.md$/.test(f.name)).map(f=>f.name).slice(0,200);
  const files=[];
  for(let i=0;i<names.length;i+=8)files.push(...await Promise.all(names.slice(i,i+8).map(async n=>[n,await get('https://raw.githubusercontent.com/TheSatyam-Singh/motionsites.ai/main/prompts/'+encodeURIComponent(n),'text')])));
  return files;
}
