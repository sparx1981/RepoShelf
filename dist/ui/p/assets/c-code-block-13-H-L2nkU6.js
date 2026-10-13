import{r as s,j as e}from"./index-KoDGA9gA.js";import{B as i}from"./badge-Ct2J1g21.js";import{C as n,a as l,b as c,d as m,e as p,u as d}from"./code-block-DivkaxDr.js";import{B as u}from"./button-B8-NCv4s.js";import{B as h}from"./button-group-CZ25RDbP.js";import{I as w}from"./input-njM_YqqL.js";import{S as x,a as f}from"./scroll-area-CwSdhwlx.js";import{X as g}from"./x-TWgb8GJG.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";import"./separator-COaIE9Us.js";import"./index-CZiugqNn.js";import"./index-B4AMw7YF.js";import"./index-DJZlPJ1v.js";import"./index-CtIgaTnE.js";import"./index-B7wzzUyy.js";import"./index-BzUqHPzX.js";import"./index-CYQF4aJD.js";import"./index-D17hSi50.js";import"./index-B2KxKFY1.js";import"./createLucideIcon-DK5VjWTh.js";const k=`export async function createInvite(workspaceId: string, email: string) {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } })
  if (!workspace) throw new WorkspaceNotFoundError(workspaceId)

  const seats = await countBillableSeats(workspaceId)
  if (seats.used >= seats.total) {
    throw new SeatLimitError(workspaceId, seats.total)
  }

  const invite = await db.invite.create({
    data: { workspaceId, email, status: "pending" },
  })

  await mail.send({ to: email, template: "workspace-invite" })
  return invite
}`;function j({query:t}){const{code:a}=d("MatchCount"),r=s.useMemo(()=>{const o=t.trim();return o.length<2?null:a.split(o).length-1},[a,t]);return r===null?null:e.jsxs(i,{variant:r?"primary-light":"secondary",children:[r," ",r===1?"match":"matches"]})}function X(){const[t,a]=s.useState("workspace"),r=s.useMemo(()=>t.trim().length<2?void 0:[t.trim()],[t]);return e.jsxs(n,{code:k,language:"typescript",showLineNumbers:!0,highlightedWords:r,className:"w-full max-w-2xl",children:[e.jsxs(l,{className:"gap-2",children:[e.jsx(c,{children:"invites.ts"}),e.jsxs("div",{className:"ml-auto flex items-center gap-2",children:[e.jsx(j,{query:t}),e.jsxs(h,{children:[e.jsx(w,{type:"search",value:t,"aria-label":"Search in file",placeholder:"Search",onChange:o=>a(o.target.value),className:"w-40 text-xs"}),e.jsx(u,{variant:"outline",size:"icon","aria-label":"Clear search",disabled:!t,onClick:()=>a(""),children:e.jsx(g,{})})]})]})]}),e.jsx(m,{variant:"outline",size:"icon-xs",className:"bg-card hover:bg-muted"}),e.jsxs(x,{className:"rounded-[inherit] **:data-[slot=scroll-area-viewport]:max-h-72",children:[e.jsx(p,{}),e.jsx(f,{orientation:"horizontal"})]})]})}export{X as default};
