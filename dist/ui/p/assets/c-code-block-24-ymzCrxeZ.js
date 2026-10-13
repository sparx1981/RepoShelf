import{r,j as e}from"./index-KoDGA9gA.js";import{B as i}from"./badge-Ct2J1g21.js";import{C as a,a as l,b as c,g as u}from"./code-block-DivkaxDr.js";import{B as o}from"./button-B8-NCv4s.js";import{S as m}from"./sparkles-DbcGRWXT.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";import"./createLucideIcon-DK5VjWTh.js";const d=`export function totalDue(invoice: Invoice) {
  const lines = invoice.lines.map((line) => line.amount)
  const subtotal = lines.reduce((sum, amount) => sum + amount)
  return subtotal + invoice.tax
}`,x=`export function totalDue(invoice: Invoice) {
  const lines = invoice.lines.map((line) => line.amount)
  const subtotal = lines.reduce((sum, amount) => sum + amount, 0)
  return subtotal + invoice.tax
}`;function w(){const[t,s]=r.useState(!1);return e.jsx("div",{className:"w-full max-w-2xl",children:e.jsxs(a,{code:t?x:d,language:"typescript",showLineNumbers:!0,lineLevels:t?void 0:{error:[3]},children:[e.jsxs(l,{children:[e.jsx(c,{children:"invoice.ts"}),e.jsx("div",{className:"ml-auto flex items-center gap-1.5",children:t?e.jsxs(e.Fragment,{children:[e.jsx(i,{variant:"success-light",children:"Patch applied"}),e.jsx(o,{size:"xs",variant:"ghost",onClick:()=>s(!1),children:"Undo"})]}):e.jsx(i,{variant:"destructive-light",children:"Empty array crashes reduce"})})]}),e.jsx(u,{children:({state:n})=>n?.level==="error"?e.jsxs(o,{size:"xs",onClick:()=>s(!0),children:[e.jsx(m,{}),"Fix with AI"]}):null})]})})}export{w as default};
