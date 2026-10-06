import assert from 'node:assert/strict';import {extractSetup} from '../lib/setup-extract.mjs';
const readme=`# Demo app

## Getting started
Requires Node.js 18+ and a PostgreSQL database.

\`\`\`bash
git clone https://github.com/example/app.git
cd app
$ npm install
cp .env.example .env
OPENAI_API_KEY=sk-your-key
DATABASE_URL=postgres://localhost/app
npm run dev
\`\`\`

Then open http://localhost:3000. Set \`STRIPE_SECRET_KEY\` for payments and read process.env.SESSION_SECRET in the server.

\`\`\`
pip install -r requirements.txt
python app.py --port 8000
\`\`\`
`;
const r=extractSetup({readme,documents:[{name:'package.json',text:JSON.stringify({engines:{node:'>=18'},scripts:{dev:'vite',build:'vite build'},dependencies:{react:'18',vite:'5',lodash:'4'}})},{name:'requirements.txt',text:'flask==3.0\nrequests'}]});
assert.equal(r.found,true);
assert(r.installCommands.includes('npm install'),'strips the shell prompt');assert(r.installCommands.includes('git clone https://github.com/example/app.git'));assert(r.installCommands.some(c=>c.startsWith('pip install')));
assert(r.runCommands.includes('npm run dev'));assert(r.runCommands.some(c=>c.startsWith('python app.py')));
assert(r.runtimes.some(x=>x.name==='Node.js'&&x.version==='>=18'&&x.source==='package.json'));assert(r.runtimes.some(x=>x.name==='Python'));
const names=r.environmentVariables.map(v=>v.name);for(const n of ['OPENAI_API_KEY','DATABASE_URL','STRIPE_SECRET_KEY','SESSION_SECRET'])assert(names.includes(n),n);
assert(!names.includes('NODE_ENV'));assert(r.ports.includes(3000)&&r.ports.includes(8000));
assert(r.frameworks.includes('react')&&r.frameworks.includes('vite')&&!r.frameworks.includes('lodash'));assert(r.packageScripts.includes('dev'));
for(const s of ['PostgreSQL','OpenAI API','Stripe'])assert(r.likelyExternalServices.includes(s),s);
assert.equal(r.confidence,'heuristic');assert.match(r.caution,/untrusted/);
const empty=extractSetup({readme:'A small library for formatting dates.',documents:[]});assert.equal(empty.found,false);assert.deepEqual(empty.installCommands,[]);
assert.equal(extractSetup({readme:'',documents:[{name:'package.json',text:'{not json'}]}).found,false,'malformed manifests are ignored safely');
assert.doesNotThrow(()=>extractSetup({}));assert(extractSetup({readme:'x'.repeat(200)+'\n```\n'+'npm install\n'.repeat(500)+'```'}).installCommands.length<=8,'output is bounded');
console.log('PASS: setup extraction finds runtimes, install and run commands, environment variables, ports and services, ignores bad input and stays bounded.');
