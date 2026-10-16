import assert from 'node:assert/strict';
import {bezierEase,elasticEase,bounceEase,wiggleEase,linearList} from '../dist/studio/motion-lab.mjs';
const near=(a,b,e=1e-3,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} expected ${b}, got ${a}`);
// Every ease starts at 0 and ends at 1 (wiggle returns an offset that is 0 at both ends).
for(const [name,f] of Object.entries({bezier:bezierEase(.25,.1,.25,1),elastic:elasticEase(1.2,.4),bounce:bounceEase(3,.5)})){near(f(0),0,1e-6,name+' start');near(f(1),1,1e-6,name+' end')}
const w=wiggleEase(6,.5,'decay');near(w(0),0,1e-6,'wiggle start');near(w(1),0,1e-6,'wiggle end');
// A linear bezier is the identity; ease-in is below and ease-out above the diagonal.
const lin=bezierEase(0,0,1,1);for(const t of [.1,.3,.5,.9])near(lin(t),t,2e-3,'linear '+t);
assert.ok(bezierEase(.42,0,1,1)(.5)<.5,'ease-in lags');assert.ok(bezierEase(0,0,.58,1)(.5)>.5,'ease-out leads');
// Monotonic for a plain curve.
let prev=-1;const ease=bezierEase(.3,.1,.2,1);for(let i=0;i<=50;i++){const v=ease(i/50);assert.ok(v>=prev-1e-9);prev=v}
// Elastic overshoots 1 at some point, bounce never exceeds 1 by much.
assert.ok(Array.from({length:101},(_,i)=>elasticEase(1.4,.35)(i/100)).some(v=>v>1.02),'elastic overshoots');
assert.ok(Array.from({length:101},(_,i)=>bounceEase(4,.5)(i/100)).every(v=>v<=1.001),'bounce stays within bounds');
// linear() export has the right number of points and valid syntax.
const list=linearList(bezierEase(.3,.1,.2,1),20);assert.match(list,/^linear\((-?\d+(\.\d+)?, ){20}-?\d+(\.\d+)?\)$/);
console.log('motion lab maths ok');
