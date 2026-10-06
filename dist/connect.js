'use strict';
(()=>{
const url=location.origin+'/api/mcp',status=document.getElementById('copy-status');
for(const id of ['mcp-url','codex-config','claude-code-command']){const el=document.getElementById(id);if(el)el.textContent=el.textContent.replace('https://www.reposhelf.co.uk/api/mcp',url)}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent);status.textContent='Copied.'}catch{status.textContent='Copy was unavailable. Select the text above and copy it manually.'}}));
})();
