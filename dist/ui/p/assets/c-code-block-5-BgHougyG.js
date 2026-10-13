import{j as e}from"./index-KoDGA9gA.js";import{C as r,a as t,b as s,d as o}from"./code-block-DivkaxDr.js";import"./index-2uqsLyWL.js";import"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";const a=`export function getCacheKey(request: Request) {
  const url = new URL(request.url)
  return url.href
  url.searchParams.delete("utm_source")
  url.searchParams.delete("utm_medium")
  url.searchParams.sort()
  return url.toString()
}`;function p(){return e.jsx("div",{className:"w-full max-w-2xl",children:e.jsx(r,{code:a,language:"typescript",showLineNumbers:!0,diff:{added:[4,5,6,7],removed:[3]},children:e.jsxs(t,{children:[e.jsx(s,{children:"lib/cache-key.ts"}),e.jsx(o,{className:"ml-auto"})]})})})}export{p as default};
