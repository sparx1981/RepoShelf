import{r as a,j as e}from"./index-KoDGA9gA.js";import{B as l}from"./badge-Ct2J1g21.js";import{C as c,a as m,b as p,c as u,d,e as x}from"./code-block-DivkaxDr.js";import{B as g}from"./button-B8-NCv4s.js";import{S as h,a as f}from"./scroll-area-CwSdhwlx.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";import"./index-CZiugqNn.js";import"./index-B4AMw7YF.js";import"./index-DJZlPJ1v.js";import"./index-CtIgaTnE.js";import"./index-B7wzzUyy.js";import"./index-BzUqHPzX.js";import"./index-CYQF4aJD.js";import"./index-D17hSi50.js";import"./index-B2KxKFY1.js";const o=`export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = streamText({
    model: openai("gpt-5"),
    system: "You are a concise assistant.",
    messages,
    temperature: 0.2,
    maxOutputTokens: 1024,
  })

  result.usage.then((usage) => {
    metrics.record("chat.tokens", usage.totalTokens)
  })

  return result.toUIMessageStreamResponse()
}`;function A(){const[t,r]=a.useState(0);a.useEffect(()=>{if(t>=o.length)return;const i=window.setTimeout(()=>r(n=>n+3),24);return()=>window.clearTimeout(i)},[t]);const s=t>=o.length;return e.jsxs("div",{className:"flex w-full max-w-2xl flex-col gap-3",children:[e.jsxs(c,{code:o.slice(0,t),language:"typescript",showLineNumbers:!0,streaming:!s,children:[e.jsxs(m,{children:[e.jsx(p,{children:"app/api/chat/route.ts"}),e.jsx(u,{}),e.jsxs("div",{className:"ml-auto flex items-center gap-1.5",children:[e.jsx(l,{variant:s?"success-light":"info-light",children:s?"Complete":"Generating"}),e.jsx(d,{})]})]}),e.jsxs(h,{className:"rounded-[inherit] **:data-[slot=scroll-area-viewport]:max-h-60",children:[e.jsx(x,{}),e.jsx(f,{orientation:"horizontal"})]})]}),e.jsx(g,{variant:"outline",size:"sm",className:"self-start",onClick:()=>r(0),children:"Replay stream"})]})}export{A as default};
