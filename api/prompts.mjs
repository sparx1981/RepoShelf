// Prompt library (formerly SiteShelf). One function, several areas, to stay inside the 12-function Hobby limit.
//   Public:    list, thumb, preview      - listing details, thumbnails and the live generated page.
//   Signed in: detail, bundle            - the prompt text and the code. Never returned to guests.
//   Admin:     admin-list, admin-get (GET); admin-save, admin-delete, admin-sync (POST) - manage the library.
import {requireLegal} from '../lib/legal.mjs';
import {createAccounts,respond,accountFailure,only,fail,readBody} from '../lib/accounts.mjs';
import {createSceneAiSync} from '../lib/sceneai-sync.mjs';

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
    credit:own?null:{name:'SceneAI',url:row.source_url||'https://sceneai.art'},
    updatedAt:row.updated_at||row.created_at
  };
}
function publicCache(res,status,data,seconds){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=60, s-maxage=${seconds}, stale-while-revalidate=3600`,'X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(data));
}

export function createPromptsHandler({accounts=createAccounts()}={}){
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
