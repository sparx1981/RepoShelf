import{r as t,j as e}from"./index-KoDGA9gA.js";import{C as a,a as i,b as n,d as l,e as m}from"./code-block-DivkaxDr.js";import{B as s}from"./button-B8-NCv4s.js";import{S as c,a as d}from"./scroll-area-CwSdhwlx.js";import{S as p}from"./separator-COaIE9Us.js";import"./index-2uqsLyWL.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";import"./index-CZiugqNn.js";import"./index-B4AMw7YF.js";import"./index-DJZlPJ1v.js";import"./index-CtIgaTnE.js";import"./index-B7wzzUyy.js";import"./index-BzUqHPzX.js";import"./index-CYQF4aJD.js";import"./index-D17hSi50.js";import"./index-B2KxKFY1.js";const x=`export async function syncWorkspace(workspaceId: string) {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } })

  if (!workspace) {
    throw new WorkspaceNotFoundError(workspaceId)
  }

  const members = await db.member.findMany({ where: { workspaceId } })

  for (const member of members) {
    if (member.status === "invited") {
      await mail.send({
        to: member.email,
        template: "workspace-reminder",
      })
    }
  }

  return { synced: members.length }
}`,h=[1,4,10,11,12];function T(){const[r,o]=t.useState([11]);return e.jsxs(a,{code:x,language:"typescript",showLineNumbers:!0,className:"w-full max-w-2xl",foldable:!0,folded:r,onFoldedChange:o,children:[e.jsxs(i,{className:"gap-1.5",children:[e.jsx(n,{children:"sync-workspace.ts"}),e.jsxs("div",{className:"ml-auto flex items-center gap-1",children:[e.jsx(s,{size:"xs",variant:"ghost",onClick:()=>o(h),children:"Fold all"}),e.jsx(s,{size:"xs",variant:"ghost",disabled:!r.length,onClick:()=>o([]),children:"Unfold all"}),e.jsx(p,{orientation:"vertical",className:"h-4"}),e.jsx(l,{})]})]}),e.jsxs(c,{className:"rounded-[inherit] **:data-[slot=scroll-area-viewport]:max-h-72",children:[e.jsx(m,{}),e.jsx(d,{orientation:"horizontal"})]})]})}export{T as default};
