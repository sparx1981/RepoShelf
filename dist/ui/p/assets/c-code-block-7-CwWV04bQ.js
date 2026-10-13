import{j as e}from"./index-KoDGA9gA.js";import{C as t,a as o,b as i,d as s}from"./code-block-DivkaxDr.js";import"./index-2uqsLyWL.js";import"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";const n=`const client = createClient({
  url: process.env.DATABASE_URL,
  maxConnections: 20,
  idleTimeoutMillis: 30000,
})

await client.connect()`;function u(){return e.jsx("div",{className:"w-full max-w-2xl",children:e.jsx(t,{code:n,language:"typescript",showLineNumbers:!0,highlightedLines:"2-4",highlightedWords:["createClient","maxConnections"],children:e.jsxs(o,{children:[e.jsx(i,{children:"db/client.ts"}),e.jsx(s,{className:"ml-auto"})]})})})}export{u as default};
