import {respond,readBody,only,fail} from './accounts.mjs';
// Boards group items from a member's collection for use in a specific project. They are private to their owner and
// reached only through server-side database functions that take the verified owner: the website passes the signed-in
// member, the connector passes the owner of the personal key.
const rpc=name=>'/rest/v1/rpc/'+name,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS={invalid_name:[400,'Give the board a name of up to 80 characters.'],duplicate_name:[409,'You already have a board with that name.'],limit:[409,'Limit reached: up to 50 boards per account and 100 items per board.'],not_found:[404,'That board no longer exists.'],not_in_collection:[409,'Save the item to your collection first, then add it to a board.'],no_account:[409,'This account cannot hold boards.']};
const refuse=result=>{const [status,message]=REASONS[result?.reason]||[409,'The board could not be changed.'];fail(status,result?.reason||'board_unavailable',message)};
export function createBoards(accounts){
 async function call(name,body){
  if(!accounts.config.serviceKey)fail(503,'boards_unavailable','Boards are being set up. Please try again later.');
  try{return await accounts.request(rpc(name),{service:true,method:'POST',body})}
  catch(e){if(['PGRST202','PGRST205','42P01'].includes(e?.code)||e.code==='migration_required')fail(503,'migration_required','A database update is required before boards can be used.');throw e}}
 return {
  async list(user){return (await call('reposhelf_boards_list',{p_user:user}))||[]},
  async get(user,ref){return await call('reposhelf_board_get',{p_user:user,p_ref:String(ref??'').slice(0,100)})||null},
  async save(user,{id=null,name,description}){const result=await call('reposhelf_board_save',{p_user:user,p_id:id,p_name:name,p_description:description??null});if(!result?.ok)refuse(result);return result.id},
  async remove(user,id){return (await call('reposhelf_board_delete',{p_user:user,p_id:id}))===true},
  async item(user,board,project,present){const result=await call('reposhelf_board_item',{p_user:user,p_board:board,p_project:project,p_present:present});if(!result?.ok)refuse(result)}}}
const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
// Website API, reached as /api/collection?action=boards (boards) or action=board-items (membership).
export async function boardsApi(req,res,{boards,person,action}){
 only(req,['GET','PUT','DELETE']);
 const url=new URL(req.url,'https://reposhelf.invalid');
 if(action==='board-items'){
  only(req,['PUT']);const body=await readBody(req);
  if(typeof body?.board!=='string'||!UUID.test(body.board))fail(400,'invalid_board','Choose a board.');
  if(typeof body.id!=='string'||body.id.length<3||body.id.length>220)fail(400,'invalid_project','Choose a project from your collection.');
  if(typeof body.present!=='boolean')fail(400,'invalid_request','Say whether the project should be on the board.');
  await boards.item(person.id,body.board,body.id,body.present);return respond(res,200,{board:body.board,id:body.id,present:body.present})}
 if(req.method==='GET'){
  const ref=url.searchParams.get('board');
  if(!ref)return respond(res,200,{boards:await boards.list(person.id)});
  const board=await boards.get(person.id,ref);if(!board)fail(404,'not_found','That board no longer exists.');return respond(res,200,{board})}
 const body=await readBody(req);
 if(req.method==='DELETE'){
  if(typeof body?.id!=='string'||!UUID.test(body.id))fail(400,'invalid_board','Choose a board to delete.');
  if(!await boards.remove(person.id,body.id))fail(404,'not_found','That board no longer exists.');return respond(res,200,{id:body.id,deleted:true})}
 if(body?.id!==undefined&&body.id!==null&&(typeof body.id!=='string'||!UUID.test(body.id)))fail(400,'invalid_board','Choose a board to edit.');
 const name=text(body?.name,400).replace(/[\u0000-\u001f\u007f\s]+/g,' ').trim();
 if(!name||name.length>80)fail(400,'invalid_name','Give the board a name of up to 80 characters.');
 const description=body?.description===undefined?undefined:text(body.description,2000).replace(/\r\n?/g,'\n').trim();
 if(description!==undefined&&description.length>1000)fail(400,'invalid_description','Keep the description under 1,000 characters.');
 const id=await boards.save(person.id,{id:body?.id||null,name,description:body?.id?description:description??''});
 return respond(res,200,{id,saved:true})}
