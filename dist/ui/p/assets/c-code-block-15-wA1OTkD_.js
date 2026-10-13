import{j as e}from"./index-KoDGA9gA.js";import{C as n,a as i,b as a,d as l}from"./code-block-DivkaxDr.js";import"./index-2uqsLyWL.js";import"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";const s=`def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`,c=s.split(`
`).map((o,t)=>({number:t+1,text:o,tokens:o.split(/(\b(?:def|for|in|return)\b)/).filter(Boolean).map(r=>({content:r,.../^(def|for|in|return)$/.test(r)?{color:"#cf222e",colorDark:"#ff7b72"}:{}}))}));function h(){return e.jsx("div",{className:"w-full max-w-2xl",children:e.jsx(n,{lines:c,showLineNumbers:!0,label:"Python code",children:e.jsxs(i,{children:[e.jsx(a,{children:"fib.py"}),e.jsxs("div",{className:"ml-auto flex items-center gap-1.5",children:[e.jsx("span",{className:"text-muted-foreground text-xs",children:"No shiki on the client"}),e.jsx(l,{value:s})]})]})})})}export{h as default};
