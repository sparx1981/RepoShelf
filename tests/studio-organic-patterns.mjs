import assert from 'node:assert/strict';
import sharp from 'sharp';
import {seededRandom,periodicVoronoi} from '../dist/studio/pattern-geometry.mjs';
import {patternSVG,patternState} from '../dist/studio/experiments-core.mjs';
const a=seededRandom('test'),b=seededRandom('test');assert.deepEqual(Array.from({length:20},a),Array.from({length:20},b));
const cells=periodicVoronoi([[10,10],[35,9],[24,32]],48);let area=0;for(const {points:p} of cells){for(const [x,y] of p)assert.ok(x>=-1e-6&&x<=48.000001&&y>=-1e-6&&y<=48.000001);area+=Math.abs(p.reduce((n,v,i)=>n+v[0]*p[(i+1)%p.length][1]-v[1]*p[(i+1)%p.length][0],0))/2}assert.ok(Math.abs(area-48*48)<1e-5,'periodic Voronoi completely covers the tile');
for(const kind of ['blobs','truchet','contours','voronoi','triangles']){
 const s={kind,seed:'repeat',spacing:48,density:24,variation:.7};const svg=patternSVG(s,true);assert.equal(svg,patternSVG(s,true));assert.notEqual(svg,patternSVG({...s,seed:'another'},true));assert.ok(svg.length<150000);assert.doesNotMatch(svg,/NaN|Infinity/);const data=await sharp(Buffer.from(svg)).raw().toBuffer();assert.ok(data.length>1000);assert.notEqual(svg,patternSVG({...s,variation:0},true));
 const tile=await sharp(Buffer.from(svg)).resize(192,192).removeAlpha().raw().toBuffer();const full=await sharp(Buffer.from(patternSVG(s))).removeAlpha().raw().toBuffer();let error=0;for(let y=0;y<192;y++)for(let x=0;x<192;x++)for(let c=0;c<3;c++)error+=Math.abs(tile[(y*192+x)*3+c]-full[(y*960+x+192)*3+c]);assert.ok(error/(192*192*3)<1,'raster repeats agree for '+kind);
}
assert.equal(patternState({seed:'<script>!'}).seed,'script');
console.log('PASS: Seeded organic patterns vary predictably; periodic cells cover tile; actual tile/full raster repeats agree for all five new families.');

for(const kind of ['blobs','triangles'])assert.notEqual(patternSVG({kind,size:1}),patternSVG({kind,size:24}));
