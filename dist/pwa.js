(()=>{
 'use strict';
 const dialog=document.querySelector('#install-app'),button=document.querySelector('#install-app-button'),native=document.querySelector('#install-native'),instructions=document.querySelector('#install-instructions');
 if(!dialog||!button)return;
 let deferred=null,installed=false;
 const welcome=document.querySelector('#install-welcome'),preference='reposhelf.install.invitation.v1';
 let invited=false;try{invited=!!localStorage.getItem(preference)}catch{}
 const mobile=()=>ios()||/Android/.test(navigator.userAgent)||navigator.userAgentData?.mobile===true;
 function remember(){invited=true;try{localStorage.setItem(preference,'seen')}catch{}if(welcome)welcome.hidden=true}
 function invite(){if(!welcome||invited||installed||standalone()||!mobile()||document.visibilityState!=='visible'||document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const params=new URLSearchParams(location.search);if(params.has('code')||params.has('error'))return;remember();welcome.hidden=false}
 async function install(){const prompt=deferred;if(!prompt)return;deferred=null;native.disabled=true;remember();try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted'&&dialog.open)dialog.close()}catch{render();if(!dialog.open)dialog.showModal()}finally{native.disabled=false;render()}}
 document.querySelector('#install-welcome-dismiss')?.addEventListener('click',remember);
 document.querySelector('#install-welcome-accept')?.addEventListener('click',()=>{remember();if(deferred)install();else{render();dialog.showModal()}});
 setTimeout(invite,3500);document.addEventListener('visibilitychange',invite);document.addEventListener('close',()=>setTimeout(invite,500),true);document.addEventListener('focusout',()=>setTimeout(invite,500));
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 function render(){
  if((installed||standalone())&&welcome)welcome.hidden=true;
  button.hidden=installed||standalone();native.hidden=!deferred||installed||standalone();
  if(standalone())instructions.innerHTML='<p>RepoShelf is already running as an installed app.</p>';
  else if(ios())instructions.innerHTML='<ol><li>Open RepoShelf in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong> (the square with an arrow), then <strong>Add to Home Screen</strong>. You may need to scroll through the actions.</li><li>If shown, leave <strong>Open as Web App</strong> enabled, then tap <strong>Add</strong>.</li></ol>';
  else if(deferred)instructions.innerHTML='<p>Install RepoShelf to open it directly from your home screen.</p>';
  else instructions.innerHTML='<ol><li>Open RepoShelf in <strong>Chrome</strong> on Android.</li><li>Open the browser menu <strong>⋮</strong> and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm to add RepoShelf.</li></ol><p>On a computer, use your browser’s install icon or menu. If installation is unavailable, reopen RepoShelf in your device’s main browser.</p>';
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;render()});
 window.addEventListener('appinstalled',()=>{installed=true;deferred=null;render();if(dialog.open)dialog.close()});
 window.matchMedia('(display-mode: standalone)').addEventListener('change',render);
 button.addEventListener('click',()=>{remember();render();dialog.showModal()});
 dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
 native.addEventListener('click',install);
 render();
 if('serviceWorker' in navigator&&window.isSecureContext){
  // An OAuth callback must reach the server without service-worker involvement.
  const params=new URLSearchParams(location.search);if(params.has('code')||params.has('error'))return;
  navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{/* Installation guidance still works if offline or unsupported. */});
 }
})();
