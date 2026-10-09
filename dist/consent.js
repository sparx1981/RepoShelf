'use strict';
// Optional analytics consent. Nothing is stored until a choice is made, Accept and Decline carry equal weight,
// and the choice can be reopened from "Cookie settings" at any time. Browser privacy signals keep analytics off.
(()=>{
const KEY='reposhelf.analytics.consent.v2',blocked=()=>navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
const read=()=>{try{return localStorage.getItem(KEY)||(localStorage.getItem('reposhelf.analytics.consent.v1')==='no'?'no':null)}catch{return 'unavailable'}};
function save(on){try{localStorage.setItem(KEY,on?'yes':'no');if(!on){localStorage.removeItem('reposhelf.analytics.visitor');sessionStorage.removeItem('reposhelf.analytics.session');sessionStorage.removeItem('reposhelf.analytics.signin')}window.dispatchEvent(new Event('reposhelf-privacy'))}catch{}}
let banner=null;
function hide(){if(!banner)return;banner.remove();banner=null;document.body.style.removeProperty('padding-bottom')}
function show({reopened=false}={}){if(banner)return;const current=read(),signal=blocked();
 banner=document.createElement('section');banner.className='consent-banner';banner.setAttribute('role','region');banner.setAttribute('aria-label','Analytics preference');
 const text=document.createElement('p');text.innerHTML=signal?'Your browser’s Do Not Track or Global Privacy Control signal is on, so optional analytics stays off. Essential cookies for sign-in still work. See our <a href=\"/cookies.html\">Cookie Policy</a>.':'RepoShelf would like to use optional analytics to see which features are used. They use random identifiers and collect filtered search terms and country codes as totals. IP addresses are not stored in application analytics. Essential cookies for sign-in are always used.'+(reopened&&current==='yes'?' Analytics is currently on.':reopened&&current==='no'?' Analytics is currently off.':'')+' See our <a href="/cookies.html">Cookie Policy</a>.';
 const actions=document.createElement('div');actions.className='consent-actions';
 const make=(label,on)=>{const b=document.createElement('button');b.type='button';b.className='button outline';b.textContent=label;b.addEventListener('click',()=>{save(on);hide()});return b};
 if(signal){const close=document.createElement('button');close.type='button';close.className='button outline';close.textContent='Close';close.addEventListener('click',hide);actions.append(close)}else actions.append(make('Accept analytics',true),make('Decline',false));
 banner.append(text,actions);document.body.append(banner);document.body.style.paddingBottom=banner.offsetHeight+'px';if(reopened)actions.querySelector('button')?.focus({preventScroll:true})}
document.addEventListener('click',e=>{const trigger=e.target instanceof Element?e.target.closest('[data-consent-open]'):null;if(trigger){e.preventDefault();hide();show({reopened:true})}});
addEventListener('resize',()=>{if(banner)document.body.style.paddingBottom=banner.offsetHeight+'px'});
if(location.pathname!=='/admin.html'&&read()===null&&!blocked())show();
})();
