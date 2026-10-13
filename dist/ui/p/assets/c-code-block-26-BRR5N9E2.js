import{j as e}from"./index-KoDGA9gA.js";import{B as s}from"./badge-Ct2J1g21.js";import{C as r,a,b as o,d as i}from"./code-block-DivkaxDr.js";import{C as n,d as m}from"./card-CD9IwugE.js";import{S as c}from"./scroll-area-CwSdhwlx.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";import"./button-B8-NCv4s.js";import"./index-CZiugqNn.js";import"./index-B4AMw7YF.js";import"./index-DJZlPJ1v.js";import"./index-CtIgaTnE.js";import"./index-B7wzzUyy.js";import"./index-BzUqHPzX.js";import"./index-CYQF4aJD.js";import"./index-D17hSi50.js";import"./index-B2KxKFY1.js";const d=[{name:"app/api/invites/route.ts",added:12,removed:3,code:`export async function POST(request: Request) {
  const { email } = await request.json()
  const invite = await createInvite(session.workspaceId, email)
  return Response.json(invite, { status: 201 })
}`},{name:"lib/seats.ts",added:8,removed:0,code:`export async function countBillableSeats(workspaceId: string) {
  const members = await db.member.findMany({ where: { workspaceId } })
  const used = members.filter((member) => !member.isGuest).length
  return { used, total: await seatAllowance(workspaceId) }
}`},{name:"emails/workspace-invite.tsx",added:24,removed:1,code:`export function WorkspaceInvite({ workspace }: InviteProps) {
  return (
    <Email preview={\`Join \${workspace.name}\`}>
      <Button href={workspace.inviteUrl}>Accept invite</Button>
    </Email>
  )
}`}];function A(){return e.jsx(n,{className:"w-full max-w-2xl gap-0 py-0",children:e.jsx(m,{className:"p-0",children:e.jsx(c,{className:"h-96 rounded-[inherit]",children:e.jsx("div",{className:"flex flex-col gap-3 p-3",children:d.map(t=>e.jsx(r,{code:t.code,language:"tsx",showLineNumbers:!0,children:e.jsxs(a,{className:"gap-2",children:[e.jsx(o,{children:t.name}),e.jsxs("div",{className:"ml-auto flex items-center gap-1.5",children:[e.jsxs(s,{variant:"success-light",children:["+",t.added]}),e.jsxs(s,{variant:"destructive-light",children:["-",t.removed]}),e.jsx(i,{})]})]})},t.name))})})})})}export{A as default};
