import assert from 'node:assert/strict';
import sharp from 'sharp';
import {colourHSL,colourHex,harmonyColours,colourWheel,contrastResult,harmonies} from '../dist/studio/colour-tools.mjs';
for(const hex of ['#ff0000','#00ff00','#0000ff','#709f48','#ffffff','#000000','#999999']){const {h,s,l}=colourHSL(hex);assert.equal(colourHex(h,s,l),hex)}
assert.deepEqual(harmonyColours('#ff0000'),['#ff0000','#00ffff']);assert.equal(contrastResult('#000000','#ffffff').ratio,21);assert.equal(contrastResult('#777777','#ffffff').normalAA,false);assert.equal(contrastResult('#777777','#ffffff').largeAA,true);
for(const kind of Object.keys(harmonies)){const colours=harmonyColours('#709f48',kind);assert(colours.every(c=>/^#[a-f0-9]{6}$/.test(c)));await sharp(Buffer.from(colourWheel('#709f48',kind))).png().toBuffer()}
console.log('PASS: Colour conversion, harmony geometry, WCAG thresholds and wheel rasterisation.');
