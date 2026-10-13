import{j as e}from"./index-KoDGA9gA.js";import{B as t}from"./badge-Ct2J1g21.js";import{C as a,a as i,b as r,i as o,p as n}from"./code-block-DivkaxDr.js";import"./index-B8k91cqS.js";import"./clsx-B-dksMZM.js";import"./index-2uqsLyWL.js";import"./index-C6p621qs.js";import"./button-B8-NCv4s.js";const l=`diff --git a/lib/seats.ts b/lib/seats.ts
--- a/lib/seats.ts
+++ b/lib/seats.ts
@@ -12,7 +12,8 @@ export async function countBillableSeats(workspaceId: string) {
   const members = await db.member.findMany({ where: { workspaceId } })
-  const used = members.length
+  const used = members.filter((member) => !member.isGuest).length
+  if (used < 0) throw new SeatCountError(workspaceId)
   return { used, total: await seatAllowance(workspaceId) }
 }
diff --git a/app/api/invites/route.ts b/app/api/invites/route.ts
--- a/app/api/invites/route.ts
+++ b/app/api/invites/route.ts
@@ -3,6 +3,7 @@ export async function POST(request: Request) {
   const { email } = await request.json()
+  if (!email) return new Response("email required", { status: 422 })
   const invite = await createInvite(session.workspaceId, email)
   return Response.json(invite, { status: 201 })
 }`,c=n(l);function h(){return e.jsx("div",{className:"flex w-full max-w-2xl flex-col gap-3",children:c.map(s=>e.jsx(a,{lines:s.lines,showLineNumbers:!0,label:`Patch for ${s.file}`,children:e.jsxs(i,{children:[e.jsx(r,{children:s.file}),e.jsxs("div",{className:"ml-auto flex items-center gap-1.5",children:[e.jsxs(t,{variant:"success-light",children:["+",s.added]}),e.jsxs(t,{variant:"destructive-light",children:["-",s.removed]}),e.jsx(o,{filename:`${s.file.split("/").pop()}.patch`})]})]})},s.file))})}export{h as default};
