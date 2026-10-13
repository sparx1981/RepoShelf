import{j as e}from"./index-KoDGA9gA.js";import{C as s,a,b as o,d as r}from"./code-block-DivkaxDr.js";import"./index-2uqsLyWL.js";import"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";const t=`export function Hero({ headline, snippet }: HeroProps) {
  const seats = useSeatCount()

  return (
    <section className="dark bg-background py-24">
      <h1 className="text-4xl font-semibold">{headline}</h1>
      <img src={cover} />
      <pre className="overflow-x-auto">{snippet}</pre>
      <CodeBlock code={snippet} language="tsx" showLineNumbers />
      <a onClick={goToPricing}>Start free</a>
      <p>{seats} seats claimed</p>
    </section>
  )
}`;function u(){return e.jsx("div",{className:"dark w-full max-w-2xl",children:e.jsx(s,{code:t,language:"tsx",showLineNumbers:!0,highlightedLines:[5],highlightedWords:["useSeatCount"],diff:{removed:[8],added:[9]},lineLevels:{error:[10],warning:[7],info:[11]},children:e.jsxs(a,{children:[e.jsxs("span",{"aria-hidden":"true",className:"flex shrink-0 items-center gap-1.5",children:[e.jsx("span",{className:"size-2.5 rounded-full bg-[#ff5f57]"}),e.jsx("span",{className:"size-2.5 rounded-full bg-[#febc2e]"}),e.jsx("span",{className:"size-2.5 rounded-full bg-[#28c840]"})]}),e.jsx(o,{className:"ml-1",children:"hero.tsx"}),e.jsx(r,{className:"ml-auto"})]})})})}export{u as default};
