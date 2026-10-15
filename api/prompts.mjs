// Prompt library (formerly SiteShelf). One function, several areas, to stay inside the 12-function Hobby limit.
//   Public:    list, thumb, preview      - listing details, thumbnails and the live generated page.
//   Signed in: detail, bundle            - the prompt text and the code. Never returned to guests.
//   UI:        ui-detail                 - a UI component's prompt, code and supporting files (signed in).
//   Admin:     admin-list, admin-get (GET); admin-save, admin-delete, admin-sync (POST) - manage the library.
import {requireLegal} from '../lib/legal.mjs';
import {showcaseDetail} from '../lib/ui-showcase/index.mjs';
import {createAccounts,respond,accountFailure,only,fail,readBody} from '../lib/accounts.mjs';
import {createSceneAiSync} from '../lib/sceneai-sync.mjs';
import {CREDIT_NAME,createMotionSitesImport,fetchMotionSitesFiles} from '../lib/motionsites-import.mjs';
import {studioItem,backgroundDetail,imageDownload} from '../lib/studio.mjs';

const SOURCES=['siteshelf','sceneai'];
const LIST_COLUMNS='source,source_id,title,category,description,type,thumbnail,animated_thumbnail,source_url,created_at,updated_at';
const idOf=(value)=>typeof value==='string'&&/^[a-z0-9-]{1,80}$/.test(value)?value:null;
const q=encodeURIComponent;

function target(params){
  const source=params.get('source'),id=idOf(params.get('id'));
  if(!SOURCES.includes(source)||!id)fail(400,'invalid_prompt','Choose a valid prompt.');
  return {source,id};
}
function publicItem(row){
  const own=row.source==='siteshelf';
  return {
    source:row.source,id:row.source_id,title:row.title,category:row.category||'Other',description:row.description||'',type:row.type||'free',
    thumbnail:own?`/api/prompts?area=thumb&source=${row.source}&id=${row.source_id}`:row.thumbnail||null,
    animated:own?null:row.animated_thumbnail||null,
    credit:own?(row.source_url?{name:CREDIT_NAME,url:row.source_url}:null):{name:'SceneAI',url:row.source_url||'https://sceneai.art'},
    updatedAt:row.updated_at||row.created_at
  };
}
function publicCache(res,status,data,seconds){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=60, s-maxage=${seconds}, stale-while-revalidate=3600`,'X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(data));
}

export function createPromptsHandler({accounts=createAccounts(),github=fetch,studio={item:studioItem,background:backgroundDetail,download:imageDownload}}={}){
  const rows=(path)=>accounts.request('/rest/v1/'+path,{service:true});
  async function find(source,id,columns){
    const [row]=await rows(`ss_prompts?source=eq.${q(source)}&source_id=eq.${q(id)}&published=eq.true&select=${columns}&limit=1`);
    if(!row)fail(404,'not_found','That prompt is not available.');
    return row;
  }
  async function member(req,res){
    const person=await accounts.user(req,res);
    await requireLegal(accounts,person);
    return person;
  }
  const text=(v,max,label)=>{if(typeof v!=='string'||v.length>max)fail(400,'invalid_field',`${label} is too long or not text.`);return v};
  async function adminWrite(req,res,area){
    accounts.origin(req);
    await accounts.admin(req,res);
    const body=await readBody(req,{limit:200000});
    if(area==='admin-sync'){
      const sync=createSceneAiSync({db:(path,opts={})=>accounts.request('/rest/v1/'+path,{service:true,...opts})});
      return respond(res,200,await sync.run('manual',{limit:40}));
    }
    if(area==='admin-import-motionsites'){
      const run=createMotionSitesImport({db:(path,opts={})=>accounts.request('/rest/v1/'+path,{service:true,...opts})});
      try{return respond(res,200,await run(await fetchMotionSitesFiles(github)))}catch(e){fail(502,'import_failed',String(e.message||e).slice(0,200))}
    }
    if(!SOURCES.includes(body?.source)||!idOf(body?.id))fail(400,'invalid_prompt','Choose a valid prompt.');
    const where=`ss_prompts?source=eq.${q(body.source)}&source_id=eq.${q(body.id)}`;
    if(area==='admin-delete'){
      if(body.confirm!==body.id)fail(400,'confirm_required','Type the prompt id to confirm deletion.');
      await accounts.request('/rest/v1/'+where,{service:true,method:'DELETE'});
      return respond(res,200,{ok:true});
    }
    if(area==='admin-save'){
      const patch={};
      if(body.title!==undefined){patch.title=text(body.title,200,'Title').trim();if(!patch.title)fail(400,'invalid_field','A title is required.')}
      if(body.category!==undefined)patch.category=text(body.category,80,'Category').trim()||null;
      if(body.description!==undefined)patch.description=text(body.description,1000,'Description');
      if(body.prompt!==undefined){patch.prompt=text(body.prompt,60000,'Prompt');if(!patch.prompt.trim())fail(400,'invalid_field','A prompt is required.')}
      if(body.published!==undefined){if(typeof body.published!=='boolean')fail(400,'invalid_field','Published must be true or false.');patch.published=body.published}
      if(!Object.keys(patch).length)fail(400,'nothing_to_save','Nothing to save.');
      patch.updated_at=new Date().toISOString();patch.is_new=false;
      await accounts.request('/rest/v1/'+where,{service:true,method:'PATCH',body:patch});
      return respond(res,200,{ok:true});
    }
    fail(400,'unknown_area','Unknown request.');
  }
  return async(req,res)=>{
    try{
      const params=new URL(req.url,accounts.config.origin).searchParams,area=params.get('area')||'list';
      if(req.method==='POST')return await adminWrite(req,res,area);
      only(req,['GET']);
      if(area==='admin-list'){
        await accounts.admin(req,res);
        const [items,runs]=await Promise.all([
          rows(`ss_prompts?select=source,source_id,title,category,type,published,is_new,created_at,updated_at&order=created_at.desc&limit=2000`),
          rows('ss_sync_runs?select=trigger,started_at,finished_at,found,added,updated,skipped_locked,error&order=started_at.desc&limit=5')]);
        return respond(res,200,{items,runs});
      }
      if(area==='admin-get'){
        await accounts.admin(req,res);
        const {source,id}=target(params),[row]=await rows(`ss_prompts?source=eq.${q(source)}&source_id=eq.${q(id)}&select=source,source_id,title,category,description,type,published,prompt,original_prompt,updated_at&limit=1`);
        if(!row)fail(404,'not_found','That prompt is not available.');
        return respond(res,200,row);
      }
      if(area==='list'){
        const items=await rows(`ss_prompts?published=eq.true&select=${LIST_COLUMNS}&order=created_at.desc&limit=2000`);
        return publicCache(res,200,{items:items.map(publicItem)},300);
      }
      if(area==='thumb'){
        const {source,id}=target(params),row=await find(source,id,'id');
        const [thumb]=await rows(`ss_thumbs?prompt_id=eq.${q(row.id)}&select=mime,data_b64&limit=1`);
        if(!thumb||!/^image\/(jpeg|png|webp)$/.test(thumb.mime))fail(404,'not_found','No thumbnail.');
        res.writeHead(200,{'Content-Type':thumb.mime,'Cache-Control':'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800','X-Content-Type-Options':'nosniff'});
        res.end(Buffer.from(thumb.data_b64,'base64'));return;
      }
      if(area==='preview'){
        const {source,id}=target(params),row=await find(source,id,'id');
        const [page]=await rows(`ss_previews?prompt_id=eq.${q(row.id)}&select=html,created_at&order=created_at.desc&limit=1`);
        if(!page)fail(404,'no_preview','This prompt has no generated page yet.');
        return publicCache(res,200,{html:page.html,createdAt:page.created_at},3600);
      }
      if(area==='detail'){
        await member(req,res);
        const {source,id}=target(params),row=await find(source,id,LIST_COLUMNS+',prompt');
        return respond(res,200,{...publicItem(row),prompt:row.prompt});
      }
      if(area==='ui-detail'){
        await member(req,res);
        const id=idOf(params.get('id'));
        if(!id)fail(400,'invalid_component','Choose a valid component.');
        const original=showcaseDetail(id);if(original)return respond(res,200,original);
        const [row]=await rows(`ui_items?id=eq.${q(id)}&published=eq.true&select=id,title,category,family,description,prompt,code,files,shadcn,npm&limit=1`);
        if(!row)fail(404,'not_found','That component is not available.');
        const paths=(row.files||[]).filter(p=>/^[a-zA-Z0-9_./-]{1,200}$/.test(p));
        const files=paths.length?await rows(`ui_files?path=in.(${q(paths.map(p=>'"'+p+'"').join(','))})&select=path,content&order=path.asc`):[];
        return respond(res,200,{...row,files});
      }
      if(area==='studio-access'){
        await member(req,res);
        return respond(res,200,{allowed:true});
      }
      if(area==='studio-background'){
        await member(req,res);
        return respond(res,200,studio.background(await studio.item('bg',params.get('id'))));
      }
      if(area==='image-download'){
        await member(req,res);
        const item=await studio.item('img',params.get('id'));
        return respond(res,200,await studio.download(accounts,item,params.get('variant')));
      }
      if(area==='bundle'){
        await member(req,res);
        const {source,id}=target(params),row=await find(source,id,'id,title,prompt');
        const [page]=await rows(`ss_previews?prompt_id=eq.${q(row.id)}&select=html&order=created_at.desc&limit=1`);
        if(!page)fail(404,'no_preview','This prompt has no generated page yet.');
        return respond(res,200,{title:row.title,prompt:row.prompt,html:page.html});
      }
      fail(400,'unknown_area','Unknown request.');
    }catch(e){accountFailure(res,e)}
  };
}
export default createPromptsHandler();
