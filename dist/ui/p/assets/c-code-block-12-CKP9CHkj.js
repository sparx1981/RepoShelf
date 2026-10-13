import{r as o,j as t}from"./index-KoDGA9gA.js";import{B as l}from"./badge-Ct2J1g21.js";import{C as n,a,b as i}from"./code-block-DivkaxDr.js";import{B as s}from"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";const c=`function applyDiscount(order: Order) {
  if (order.coupon) {
    const rate = COUPONS[order.coupon]
    order.total = order.total * (1 - rate)
  }
  return order
}`;function d(e){return e.length?e.length===1?`Ask about line ${e[0]}`:`Ask about ${e.length} lines`:"Select lines to ask about them"}function k(){const[e,r]=o.useState([]);return t.jsxs("div",{className:"flex w-full max-w-2xl flex-col gap-3",children:[t.jsx(n,{code:c,language:"typescript",showLineNumbers:!0,selectable:!0,selectedLines:e,onSelectedLinesChange:r,children:t.jsxs(a,{children:[t.jsx(i,{children:"discount.ts"}),t.jsxs("div",{className:"ml-auto flex items-center gap-1.5",children:[e.length>0&&t.jsxs(l,{variant:"primary-light",children:[e.length," selected"]}),t.jsx("span",{className:"text-muted-foreground text-xs",children:"Click a line, shift-click to extend"})]})]})}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(s,{size:"sm",disabled:!e.length,children:d(e)}),e.length>0&&t.jsx(s,{size:"sm",variant:"ghost",onClick:()=>r([]),children:"Clear"})]})]})}export{k as default};
