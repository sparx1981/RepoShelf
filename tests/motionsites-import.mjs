import assert from 'node:assert/strict';
import {parsePrompt,planImport,slugOf,createMotionSitesImport,CREDIT_NAME} from '../lib/motionsites-import.mjs';

const md=(licence='free')=>`# Apex SaaS

> **Category:** SaaS  
> **Type:** hero  
> **License:** ${licence}

---

## 🎬 Video Preview

![Video Preview 0](../assets/videos/Apex_SaaS_0.mp4)
## 📋 Prompt

\`\`\`text
Build a dark SaaS landing page. Use React.

Nested example:
\`\`\`css
a{b:c}
\`\`\`
Done.
\`\`\`
`;
assert.equal(slugOf('AI_Designer_Agency.md'),'ai-designer-agency');
assert.equal(slugOf('E-commerce_Website.md'),'e-commerce-website');

const row=parsePrompt('Apex_SaaS.md',md());
assert.equal(row.source,'siteshelf');assert.equal(row.source_id,'apex-saas');assert.equal(row.title,'Apex SaaS');assert.equal(row.category,'SaaS');
assert.equal(row.description,'Build a dark SaaS landing page.');
assert(row.prompt.startsWith('Build a dark SaaS')&&row.prompt.endsWith('Done.'),'whole prompt kept, nested fences included');
assert(!/Video Preview|\.mp4/.test(row.prompt),'preview media never enters the prompt');
assert.equal(row.thumbnail,undefined);assert.equal(row.animated_thumbnail,undefined);
assert.equal(row.published,true);assert.equal(row.prompt,row.original_prompt);
assert.match(row.source_url,/^https:\/\/github\.com\/TheSatyam-Singh\/motionsites\.ai\/blob\/main\/prompts\/Apex_SaaS\.md$/);

// Only free prompts, and only well-formed files.
assert.equal(parsePrompt('Pro.md',md('pro')),null);
assert.equal(parsePrompt('Bad.md','# Title\nno prompt here'),null);

// Existing prompts and duplicates are left alone.
const plan=planImport([['Apex_SaaS.md',md()],['Apex_SaaS.md',md()],['Old.md',md().replace('Apex SaaS','Old')],['Bad.md','x']],new Set(['old']));
assert.deepEqual(plan.rows.map(r=>r.source_id),['apex-saas']);assert.equal(plan.skipped.length,3);

const posts=[];
const out=await createMotionSitesImport({db:async(p,o={})=>{if(o.method==='POST'){posts.push(o.body);return null}return [{source_id:'old'}]}})([['Apex_SaaS.md',md()],['Old.md',md()]]);
assert.deepEqual(out,{found:2,added:1,skipped:1});assert.equal(posts.length,1);

assert.match(CREDIT_NAME,/MotionSites/);
console.log('motionsites-import tests passed');
