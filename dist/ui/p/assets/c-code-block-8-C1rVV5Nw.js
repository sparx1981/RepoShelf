import{r as l,j as s}from"./index-KoDGA9gA.js";import{B as i}from"./badge-Ct2J1g21.js";import{C as c,a as n,b as m}from"./code-block-DivkaxDr.js";import{B as p}from"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";const u=`export async function checkout(cart: Cart) {
  const totals = computeTotals(cart)

  const session = await payments.createSession({
    amount: totals.total,
    currency: cart.currency,
  })

  await audit.record("checkout.started", session.id)
  return session
}`,a=[{label:"Totals",lines:"2"},{label:"Payment session",lines:"4-7"},{label:"Audit",lines:"9-10"}];function y(){const[e,o]=l.useState(0);return s.jsx("div",{className:"w-full max-w-2xl",children:s.jsx(c,{code:u,language:"typescript",showLineNumbers:!0,focusedLines:a[e].lines,children:s.jsxs(n,{className:"gap-1.5",children:[s.jsx(m,{children:"checkout.ts"}),s.jsx("div",{role:"group","aria-label":"Walkthrough step",className:"ml-auto flex items-center gap-1",children:a.map((r,t)=>s.jsx(p,{"aria-pressed":t===e,size:"xs",variant:t===e?"secondary":"ghost",onClick:()=>o(t),children:r.label},r.label))}),s.jsxs(i,{variant:"primary-light",children:[e+1,"/",a.length]})]})})})}export{y as default};
