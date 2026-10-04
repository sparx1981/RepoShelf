(()=>{
 'use strict';
 const dialog=document.querySelector('#install-app'),button=document.querySelector('#install-app-button'),native=document.querySelector('#install-native'),instructions=document.querySelector('#install-instructions');
 if(!dialog||!button)return;
 let deferred=null,installed=false;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 function render(){
  button.hidden=installed||standalone();native.hidden=!deferred||installed||standalone();
  if(standalone())instructions.innerHTML='<p>RepoShelf is already running as an installed app.</p>';
  else if(ios())instructions.innerHTML='<ol><li>Open RepoShelf in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong> (the square with an arrow), then <strong>Add to Home Screen</strong>. You may need to scroll through the actions.</li><li>If shown, leave <strong>Open as Web App</strong> enabled, then tap <strong>Add</strong>.</li></ol>';
  else if(deferred)instructions.innerHTML='<p>Install RepoShelf to open it directly from your home screen.</p>';
  else instructions.innerHTML='<ol><li>Open RepoShelf in <strong>Chrome</strong> on Android.</li><li>Open the browser menu <strong>⋮</strong> and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm to add RepoShelf.</li></ol><p>On a computer, use your browser’s install icon or menu. If installation is unavailable, reopen RepoShelf in your device’s main browser.</p>';
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;render()});
 window.addEventListener('appinstalled',()=>{installed=true;deferred=null;render();if(dialog.open)dialog.close()});
 window.matchMedia('(display-mode: standalone)').addEventListener('change',render);
 button.addEventListener('click',()=>{render();dialog.showModal()});
 dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
 native.addEventListener('click',async()=>{const prompt=deferred;if(!prompt)return;deferred=null;native.disabled=true;try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')dialog.close()}catch{ /* Browser menu instructions remain available after a failed prompt. */ }finally{native.disabled=false;render()}});
 render();
 if('serviceWorker' in navigator&&window.isSecureContext){
  // An OAuth callback must reach the server without service-worker involvement.
  const params=new URLSearchParams(location.search);if(params.has('code')||params.has('error'))return;
  navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{/* Installation guidance still works if offline or unsupported. */});
 }
})();
