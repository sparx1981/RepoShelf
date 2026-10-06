(()=>{'use strict';
const A=RepoAccount,$=s=>document.querySelector(s),URL_='/api/viewer';
let data=null,busy=false;
const viewer=RepoViewer.create({fetchEligibility:async()=>({eligible:false,reason:'preview_only'})});
const when=v=>v?new Date(v).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'never';
const reasonText={global_disabled:'Global switch is off',not_approved:'Not approved',manual_disabled:'Disabled by an administrator',suspended:'Suspended after a failed or inconclusive check',not_https:'Address is not https',no_evidence:'No qualification yet',latest_failed:'Latest qualification failed',latest_inconclusive:'Latest qualification was inconclusive',url_changed:'Address changed since the last qualification',config_changed:'Viewer settings changed since the last qualification',stale:'Qualification is older than 48 hours',ok:'Eligible for the viewer'};
function render(){
 const ws=$('#vw-workspace');ws.hidden=!(A.user?.admin&&data);if(ws.hidden)return;
 $('#vw-enabled').checked=data.enabled===true;$('#vw-config').textContent=`Viewer configuration version ${data.config.version}. Evidence is good for ${data.config.maxEvidenceAgeHours} hours. The viewer runs on ${data.config.viewerOrigin}.`;
 const list=$('#vw-list');list.replaceChildren();
 for(const d of data.demos||[]){
  const li=document.createElement('li'),text=document.createElement('span'),actions=document.createElement('span');
  const ev=d.latest,flags=[d.allow_popups?'popups':'',d.allow_downloads?'downloads':''].filter(Boolean).join(', ')||'no extras';
  text.textContent=`${d.project_id} · ${d.approved?'approved':'not approved'} · ${reasonText[d.eligibility?.reason]||d.eligibility?.reason} · ${ev?`last run ${ev.result}${ev.reason?' ('+ev.reason+')':''} in ${ev.browser}, ${when(ev.checked_at)}`:'never qualified'} · ${flags}${d.manual_disabled?' · disabled: '+(d.manual_disabled_reason||'no reason given'):''}`;
  actions.className='account-actions';
  const preview=document.createElement('button');preview.type='button';preview.className='button outline';preview.textContent='Preview in viewer';preview.setAttribute('aria-label','Preview '+d.project_id+' in the viewer');preview.onclick=()=>viewer.open({id:d.project_id,url:d.demo_url,flags:{popups:d.allow_popups,downloads:d.allow_downloads},title:d.project_id,preview:true,opener:preview});
  const edit=document.createElement('button');edit.type='button';edit.className='button outline';edit.textContent='Edit';edit.setAttribute('aria-label','Edit '+d.project_id);edit.onclick=()=>{$('#vw-project').value=d.project_id;$('#vw-url').value=d.demo_url;$('#vw-scenario').value=JSON.stringify(d.scenario,null,2);$('#vw-popups').checked=d.allow_popups;$('#vw-downloads').checked=d.allow_downloads;$('#vw-approved').checked=d.approved;$('#vw-notes').value=d.notes||'';$('#vw-form').scrollIntoView({block:'start'});$('#vw-project').focus()};
  const toggle=document.createElement('button');toggle.type='button';toggle.className='button outline';toggle.textContent=d.manual_disabled?'Re-enable':'Disable';toggle.setAttribute('aria-label',(d.manual_disabled?'Re-enable ':'Disable ')+d.project_id);toggle.onclick=async()=>{let reason='';if(!d.manual_disabled){reason=prompt('Why is this demo being disabled?','')??null;if(reason===null)return}await post('disable',{project:d.project_id,disabled:!d.manual_disabled,reason},'#vw-list-status')};
  actions.append(preview,edit,toggle);li.append(text,actions);list.append(li)}
 if(!(data.demos||[]).length){const li=document.createElement('li');li.textContent='No demos have been added yet.';list.append(li)}
}
async function load(){try{data=await A.request(URL_+'?action=list');$('#vw-gate').hidden=true;render()}catch(e){$('#vw-gate').hidden=false;$('#vw-gate').textContent=e.message}}
async function post(action,body,status){if(busy)return;busy=true;try{$(status).textContent='';await A.request(URL_+'?action='+action,{method:'POST',body:JSON.stringify(body)});await load();$(status).textContent='Saved.'}catch(e){$(status).textContent=e.message}finally{busy=false}}
$('#vw-enabled').onchange=async e=>{const box=e.target;await post('settings',{enabled:box.checked},'#vw-switch-status');box.checked=data?.enabled===true};
$('#vw-form').onsubmit=async e=>{e.preventDefault();let scenario;try{scenario=JSON.parse($('#vw-scenario').value)}catch{$('#vw-form-status').textContent='The scenario is not valid JSON.';return}
 await post('save',{project:$('#vw-project').value.trim(),demoUrl:$('#vw-url').value.trim(),scenario,allowPopups:$('#vw-popups').checked,allowDownloads:$('#vw-downloads').checked,approved:$('#vw-approved').checked,notes:$('#vw-notes').value},'#vw-form-status')};
function refresh(){if(!A.ready)return;if(!A.user){$('#vw-gate').hidden=false;$('#vw-gate').textContent='Sign in as an administrator to use this page.';$('#vw-workspace').hidden=true;return}if(!A.user.admin){$('#vw-gate').hidden=false;$('#vw-gate').textContent='Administrator access is required.';$('#vw-workspace').hidden=true;return}void load()}
window.addEventListener('reposhelf-account',refresh);refresh();
})();
