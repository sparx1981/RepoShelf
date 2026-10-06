'use strict';
(()=>{
const url=location.origin+'/api/mcp',status=document.getElementById('copy-status');
for(const id of ['mcp-url','codex-config','claude-code-command']){const el=document.getElementById(id);if(el)el.textContent=el.textContent.replace('https://www.reposhelf.co.uk/api/mcp',url)}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent);status.textContent='Copied.'}catch{status.textContent='Copy was unavailable. Select the text above and copy it manually.'}}));
const gate=()=>{const A=window.RepoAccount;if(!A||!A.ready)return;const person=A.user;document.getElementById('connect-signin').hidden=Boolean(person);document.getElementById('connect-keys').hidden=!person;document.getElementById('connect-gate-title').textContent=person?'Your key':'Sign in to get your key';document.getElementById('connect-gate-text').textContent=person?'Create a personal key in Account & data, then use it in the steps below. Keys can be revoked at any time.':'The connector is a members-only feature. Sign in, then create a personal key in Account & data.'};
window.addEventListener('reposhelf-account',gate);gate();
})();
