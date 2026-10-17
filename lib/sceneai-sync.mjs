// Weekly import of SceneAI's free prompts into the prompt library.
// Only free prompts are ever requested. Premium items are counted and left alone. A prompt is
// fetched when it is new here, or when SceneAI says it changed after the copy we hold. Edits made
// in the admin area (the prompt, or the title, category or description) are never overwritten, and a prompt deleted
// in the admin area is not brought back. New prompts arrive unpublished, because they have no
// generated live page yet; an administrator reviews them and publishes.
const API='https://sceneai.art/api/landing-pages';
const UA={'User-Agent':'RepoShelf prompt library sync (+https://www.reposhelf.co.uk)',Accept:'application/json'};

export function planSync(listItems,existing){
  const free=listItems.filter(i=>i&&i.type==='free'&&typeof i._id==='string'&&/^[a-f0-9]{24}$/.test(i._id));
  const fetchIds=[];
  for(const i of free){
    const have=existing.get(i._id);
    if(!have)fetchIds.push(i._id);
    else if(i.updatedAt&&have.source_updated_at&&new Date(i.updatedAt)>new Date(have.source_updated_at))fetchIds.push(i._id);
  }
  return {fetchIds,premium:listItems.length-free.length,free:free.length};
}
export function mergeUpdate(row,incoming){
  const untouched=row.prompt===row.original_prompt;
  return {original_prompt:incoming,...(untouched?{prompt:incoming}:{}),keptEdits:!untouched&&incoming!==row.original_prompt};
}
// The listing fields SceneAI controls, minus any an administrator has edited.
export function upstreamFields(row,common){
  const edited=new Set(row?.edited_fields||[]),out={...common};
  for(const k of ['title','category','description'])if(edited.has(k))delete out[k];
  return out;
}
const text=(v,max)=>typeof v==='string'?v.slice(0,max):null;
const safeImage=v=>typeof v==='string'&&/^https:\/\/cdn\.sceneai\.art\//.test(v)?v.slice(0,500):null;

export function createSceneAiSync({db,fetcher=fetch}){
  async function getJson(url){
    const r=await fetcher(url,{headers:UA,signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw new Error(`SceneAI answered ${r.status}`);
    return r.json();
  }
  async function listAll(){
    const items=[];
    for(let page=1;page<20;page++){
      const j=await getJson(`${API}?limit=100&page=${page}`);
      if(!j.success||!Array.isArray(j.data))throw new Error('SceneAI list request was refused.');
      items.push(...j.data);
      if(page>=(j.pagination?.totalPages||1))break;
    }
    return items;
  }
  async function run(trigger,{limit=Infinity}={}){
    const started=new Date().toISOString();
    let result={found:0,added:0,updated:0,skipped_locked:0},error=null;
    try{
      const list=await listAll();
      let rows;
      try{rows=await db('ss_prompts?source=eq.sceneai&select=id,source_id,source_updated_at,prompt,original_prompt,edited_fields&limit=5000')}
      catch{rows=await db('ss_prompts?source=eq.sceneai&select=id,source_id,source_updated_at,prompt,original_prompt&limit=5000')} // before migration 0038
      const existing=new Map(rows.map(r=>[r.source_id,r]));
      let gone=[];try{gone=(await db('ss_prompt_tombstones?source=eq.sceneai&select=source_id&limit=5000')).map(r=>r.source_id)}catch{}
      const deleted=new Set(gone);
      const plan=planSync(list.filter(i=>!deleted.has(i?._id)),existing);plan.fetchIds=plan.fetchIds.slice(0,limit);const byId=new Map(list.map(i=>[i._id,i]));
      let added=0,updated=0,locked=0;
      for(let i=0;i<plan.fetchIds.length;i+=4){
        await Promise.all(plan.fetchIds.slice(i,i+4).map(async id=>{
          const d=(await getJson(`${API}/${id}`)).data,meta=byId.get(id);
          if(!d||d.locked||typeof d.prompt!=='string'||!d.prompt){locked++;return}
          const have=existing.get(id),common={title:text(meta.title,200)||'Untitled',category:text(meta.category,80),description:text(meta.description,1000),thumbnail:safeImage(meta.thumbnail),animated_thumbnail:safeImage(meta.animatedThumbnailGif),source_updated_at:meta.updatedAt||null};
          if(!have){
            await db('ss_prompts',{method:'POST',body:{source:'sceneai',source_id:id,type:'free',...common,original_prompt:d.prompt,prompt:d.prompt,is_new:true,published:false}});
            added++;
          }else{
            const {keptEdits,...patch}=mergeUpdate(have,d.prompt);
            await db(`ss_prompts?id=eq.${have.id}`,{method:'PATCH',body:{...patch,...upstreamFields(have,common),updated_at:new Date().toISOString()}});
            updated++;
          }
        }));
      }
      result={found:plan.free,added,updated,skipped_locked:locked+plan.premium};
    }catch(e){error=String(e.message||e).slice(0,500)}
    await db('ss_sync_runs',{method:'POST',body:{trigger,started_at:started,finished_at:new Date().toISOString(),...result,error}});
    if(error)throw new Error(error);
    return result;
  }
  return {run,planSync,listAll};
}
