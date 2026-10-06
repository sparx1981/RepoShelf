import {createHash} from 'node:crypto';
// A qualification scenario is a short, explicit, admin-reviewed script run inside the framed demo.
// It must contain at least one interaction and at least one visible-result assertion, so "the page loaded" alone can
// never qualify a demo. Selectors and text are plain data run through Playwright locators, never evaluated as code.
export const INTERACTIONS=['click','fill','press'],ASSERTIONS=['expectText','expectVisible','expectPopup','expectDownload'],OTHER=['waitFor'];
export const MAX_STEPS=14,MAX_TEXT=300;
// Provider login hosts: a popup to one of these means the demo needs an OAuth flow, which qualification cannot complete
// (it cannot sign in and verify the result back in the demo), so such demos stay external in the pilot.
export const LOGIN_HOSTS=['accounts.google.com','github.com','login.microsoftonline.com','login.live.com','appleid.apple.com','www.facebook.com','facebook.com','api.twitter.com','x.com','twitter.com','discord.com','gitlab.com','auth0.com','okta.com'];
const looksSecret=v=>typeof v==='string'&&(/^(sk|pk|ghp|gho|ghu|ghs|xox[bp]|AKIA)[-_A-Za-z0-9]{12,}/.test(v)||/^[A-Za-z0-9_\-+/=]{32,}$/.test(v)||/^eyJ[A-Za-z0-9_-]{10,}\./.test(v));
const trivial=sel=>/^(body|html|\*|:root)$/i.test(String(sel||'').trim());
const text=(v,max=MAX_TEXT)=>typeof v==='string'&&v.length>0&&v.length<=max;
export function validateScenario(input){
 const problems=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,problems:['The scenario must be an object with a summary and steps.']};
 if(!text(input.summary,200))problems.push('Give a short summary of what the scenario proves (up to 200 characters).');
 const steps=Array.isArray(input.steps)?input.steps:null;
 if(!steps||!steps.length)problems.push('Add at least one step.');
 else if(steps.length>MAX_STEPS)problems.push(`Use at most ${MAX_STEPS} steps.`);
 const clean=[];
 for(const [i,step] of (steps||[]).entries()){
  const n=i+1;if(!step||typeof step!=='object'){problems.push(`Step ${n} is not an object.`);continue}
  const action=step.action;if(![...INTERACTIONS,...ASSERTIONS,...OTHER].includes(action)){problems.push(`Step ${n} has an unknown action.`);continue}
  const out={action};
  if(action==='press'){if(!text(step.key,40))problems.push(`Step ${n}: press needs a key such as Enter.`);else out.key=step.key;if(step.selector!==undefined){if(!text(step.selector,200))problems.push(`Step ${n}: the selector is invalid.`);else out.selector=step.selector}}
  else if(action==='expectPopup'){if(step.host!==undefined){if(!text(step.host,200))problems.push(`Step ${n}: the host is invalid.`);else if(LOGIN_HOSTS.some(h=>step.host===h||step.host.endsWith('.'+h)))problems.push(`Step ${n}: provider login popups cannot be qualified. Demos that need a login stay external.`);else out.host=step.host}}
  else if(action==='expectDownload'){if(step.filename!==undefined){if(!text(step.filename,120))problems.push(`Step ${n}: the filename is invalid.`);else out.filename=step.filename}if(step.minBytes!==undefined){if(!Number.isInteger(step.minBytes)||step.minBytes<1||step.minBytes>50000000)problems.push(`Step ${n}: minBytes must be a whole number of at least 1.`);else out.minBytes=step.minBytes}}
  else if(action==='expectText'){if(!text(step.text))problems.push(`Step ${n}: expectText needs the text that should appear.`);else out.text=step.text;if(step.selector!==undefined){if(!text(step.selector,200))problems.push(`Step ${n}: the selector is invalid.`);else out.selector=step.selector}}
  else{if(!text(step.selector,200))problems.push(`Step ${n}: ${action} needs a selector.`);else if(action==='expectVisible'&&trivial(step.selector))problems.push(`Step ${n}: expectVisible must name the element that shows the result, not the whole page.`);else out.selector=step.selector;if(action==='fill'){if(typeof step.value!=='string'||step.value.length>MAX_TEXT)problems.push(`Step ${n}: fill needs a value.`);else if(looksSecret(step.value)||/password|passwd|secret|token|api[-_ ]?key|credential/i.test(step.selector||''))problems.push(`Step ${n}: keep credentials and secrets out of scenarios.`);else out.value=step.value}}
  if(step.timeoutMs!==undefined){if(!Number.isInteger(step.timeoutMs)||step.timeoutMs<500||step.timeoutMs>30000)problems.push(`Step ${n}: timeoutMs must be between 500 and 30000.`);else out.timeoutMs=step.timeoutMs}
  clean.push(out)}
 if(clean.length){
  const last=clean.map(s=>INTERACTIONS.includes(s.action)).lastIndexOf(true);
  if(last<0)problems.push('Add at least one interaction (click, fill or press). Loading the page is not enough.');
  // A result must be asserted after the last action it depends on. An assertion that comes first proves nothing about the action.
  else if(!clean.slice(last+1).some(s=>ASSERTIONS.includes(s.action)))problems.push('Add an expectText, expectVisible, expectPopup or expectDownload step after the last interaction, showing the result.');
 }
 return problems.length?{ok:false,problems}:{ok:true,scenario:{summary:input.summary,steps:clean}};
}
// Stable hash so evidence records which scenario produced it.
export const scenarioHash=scenario=>createHash('sha256').update(JSON.stringify(scenario)).digest('hex').slice(0,16);
