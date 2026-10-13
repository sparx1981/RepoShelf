import{j as e}from"./index-KoDGA9gA.js";import{C as r,d as t,e as s}from"./code-block-DivkaxDr.js";import{S as o,a as i}from"./scroll-area-CwSdhwlx.js";import"./index-2uqsLyWL.js";import"./button-B8-NCv4s.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-C6p621qs.js";import"./index-CZiugqNn.js";import"./index-B4AMw7YF.js";import"./index-DJZlPJ1v.js";import"./index-CtIgaTnE.js";import"./index-B7wzzUyy.js";import"./index-BzUqHPzX.js";import"./index-CYQF4aJD.js";import"./index-D17hSi50.js";import"./index-B2KxKFY1.js";const m=`export async function resolveWorkspaceMembershipForActiveSubscription(workspaceId: string, userId: string) {
  const membership = await db.membership.findFirst({ where: { workspaceId, userId, status: "active" } })
  if (!membership) throw new WorkspaceAccessError("No active membership for this workspace")
  return membership
}

export function formatSeatSummary(seats: number, used: number) {
  return \`\${used} of \${seats} seats in use, \${Math.max(0, seats - used)} remaining\`
}

export function countBillableSeats(members: Member[]) {
  return members.filter((member) => member.status === "active" && !member.isGuest).length
}

export function canInviteMember(seats: number, used: number) {
  return used < seats
}`;function B(){return e.jsxs(r,{code:m,language:"typescript",className:"w-full max-w-2xl",children:[e.jsx(t,{variant:"outline",size:"icon-sm",className:"bg-card hover:bg-muted"}),e.jsxs(o,{className:"rounded-[inherit] **:data-[slot=scroll-area-viewport]:max-h-56",children:[e.jsx(s,{}),e.jsx(i,{orientation:"horizontal"})]})]})}export{B as default};
