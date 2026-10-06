import {createHash} from 'node:crypto';
// A qualification scenario is a short, explicit, admin-reviewed script run inside the framed demo.
// It must contain at least one interaction and at least one visible-result assertion, so "the page loaded" alone can
// never qualify a demo. Selectors and text are plain data run through Playwright locators, never evaluated as code.
export const INTERACTIONS=['click','fill','press'],ASSERTIONS=['expectText','expectVisible','expectPopup','expectDownload'],OTHER=['waitFor'];
export const MAX_STEPS=14,MAX_TEXT=300;
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
  else if(action==='expectPopup'){if(step.host!==undefined){if(!text(step.host,200))problems.push(`Step ${n}: the host is invalid.`);else out.host=step.host}}
  else if(action==='expectDownload'){}
  else if(action==='expectText'){if(!text(step.text))problems.push(`Step ${n}: expectText needs the text that should appear.`);else out.text=step.text;if(step.selector!==undefined){if(!text(step.selector,200))problems.push(`Step ${n}: the selector is invalid.`);else out.selector=step.selector}}
  else{if(!text(step.selector,200))problems.push(`Step ${n}: ${action} needs a selector.`);else out.selector=step.selector;if(action==='fill'){if(typeof step.value!=='string'||step.value.length>MAX_TEXT)problems.push(`Step ${n}: fill needs a value.`);else out.value=step.value}}
  if(step.timeoutMs!==undefined){if(!Number.isInteger(step.timeoutMs)||step.timeoutMs<500||step.timeoutMs>30000)problems.push(`Step ${n}: timeoutMs must be between 500 and 30000.`);else out.timeoutMs=step.timeoutMs}
  clean.push(out)}
 if(clean.length&&!clean.some(s=>INTERACTIONS.includes(s.action)))problems.push('Add at least one interaction (click, fill or press). Loading the page is not enough.');
 if(clean.length&&!clean.some(s=>ASSERTIONS.includes(s.action)))problems.push('Add at least one expectText, expectVisible, expectPopup or expectDownload step that shows the result.');
 return problems.length?{ok:false,problems}:{ok:true,scenario:{summary:input.summary,steps:clean}};
}
// Stable hash so evidence records which scenario produced it.
export const scenarioHash=scenario=>createHash('sha256').update(JSON.stringify(scenario)).digest('hex').slice(0,16);
