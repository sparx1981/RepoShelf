import{r as h,j as e}from"./index-KoDGA9gA.js";import{B as x}from"./badge-Ct2J1g21.js";import{C as g,a as u,b as p,g as f,j}from"./code-block-DivkaxDr.js";import{B as l}from"./button-B8-NCv4s.js";import{C as b}from"./card-CD9IwugE.js";import{X as N}from"./x-TWgb8GJG.js";import{P as B}from"./plus-2DnQf2FM.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";import"./createLucideIcon-DK5VjWTh.js";const d="use-mobile.ts",C="src/hooks/use-mobile.ts",v=`import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>()

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}`;function E({line:s,onAdd:a}){const{selectedLines:o,clearSelection:r}=j(),i=o.length>0?o:[s];return e.jsx(l,{type:"button",size:"icon-xs","aria-label":i.length>1?`Reference ${i.length} selected lines in the chat`:`Reference line ${s} in the chat`,title:i.length>1?`Reference ${i.length} lines`:`Reference line ${s}`,onClick:()=>{a(i),r()},className:"size-5",children:e.jsx(B,{})})}function T(){const[s,a]=h.useState([]),[o,r]=h.useState(null),i=t=>a(n=>[...new Set([...n,...t])].sort((c,m)=>c-m));return e.jsxs("div",{className:"flex w-full max-w-2xl flex-col gap-3",children:[e.jsxs(g,{code:v,language:"typescript",showLineNumbers:!0,selectable:!0,highlightedLines:o===null?void 0:[o],children:[e.jsxs(u,{children:[e.jsx(p,{children:d}),e.jsx("span",{className:"text-muted-foreground ml-auto text-xs",children:"Press + on a line to reference it"})]}),e.jsx(f,{side:"gutter",children:({line:t})=>e.jsx(E,{line:t,onAdd:i})})]}),e.jsxs(b,{size:"sm",className:"gap-2 p-3",children:[e.jsx("div",{className:"flex flex-wrap items-center gap-1.5",children:s.length===0?e.jsxs("span",{className:"text-muted-foreground px-1 text-sm",children:["Ask about ",d,"..."]}):s.map(t=>e.jsxs(x,{variant:o===t?"primary-light":"outline",title:`${C}:${t}`,className:"gap-0.5 font-mono",children:[e.jsxs(l,{variant:"ghost",size:"xs","aria-pressed":o===t,"aria-label":`Highlight line ${t} in the code`,onClick:()=>r(n=>n===t?null:t),className:"h-auto p-0 font-mono hover:bg-transparent",children:[d,":",t]}),e.jsx(l,{variant:"ghost",size:"icon-xs","aria-label":`Remove the reference to line ${t}`,onClick:()=>{a(n=>n.filter(c=>c!==t)),r(n=>n===t?null:n)},className:"size-4 hover:bg-transparent [&_svg]:size-2.5",children:e.jsx(N,{})})]},t))}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-muted-foreground text-xs",children:s.length>0?`${s.length} ${s.length===1?"line":"lines"} in context`:"No context yet"}),e.jsx(l,{size:"xs",className:"ml-auto",disabled:!s.length,children:"Ask AI"})]})]})]})}export{T as default};
