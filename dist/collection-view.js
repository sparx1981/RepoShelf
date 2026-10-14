// Presentation preference only: collection membership and actions stay with their existing controllers.
(()=>{
'use strict';
const tabs=document.querySelector('#collection-tabs'),grid=document.querySelector('#grid'),resources=document.querySelector('#saved-prompts');
if(!tabs||!grid)return;
let view='cards';try{if(localStorage.getItem('reposhelf.collection.view.v1')==='list')view='list'}catch{}
const controls=document.createElement('div');controls.className='collection-view-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Collection view');
controls.innerHTML='<span>View</span><button type="button" data-collection-view="cards">Cards</button><button type="button" data-collection-view="list">List</button>';
tabs.after(controls);
function apply(){const active=!tabs.hidden;controls.hidden=!active;grid.classList.toggle('collection-list',active&&view==='list');resources?.classList.toggle('collection-list',active&&view==='list');for(const button of controls.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.collectionView===view))}
controls.addEventListener('click',event=>{const button=event.target.closest('[data-collection-view]');if(!button)return;view=button.dataset.collectionView;try{localStorage.setItem('reposhelf.collection.view.v1',view)}catch{}apply()});
new MutationObserver(apply).observe(tabs,{attributes:true,attributeFilter:['hidden']});
apply();
})();
