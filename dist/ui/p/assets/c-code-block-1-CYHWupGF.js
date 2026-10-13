import{j as t}from"./index-KoDGA9gA.js";import{C as e,a as o,b as s,c as a,d as r}from"./code-block-DivkaxDr.js";import"./index-2uqsLyWL.js";import"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";const l=`export function useTotals(items: Item[]) {
  return useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0)
    const tax = Math.round(subtotal * 0.2)
    return { subtotal, tax, total: subtotal + tax }
  }, [items])
}`;function p(){return t.jsx("div",{className:"w-full max-w-2xl",children:t.jsx(e,{code:l,language:"typescript",showLineNumbers:!0,children:t.jsxs(o,{children:[t.jsx(s,{children:"use-totals.ts"}),t.jsx(a,{}),t.jsx(r,{className:"ml-auto"})]})})})}export{p as default};
