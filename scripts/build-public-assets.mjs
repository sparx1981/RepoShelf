import {readFile,writeFile,readdir,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';
import sharp from 'sharp';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),B=require('../dist/browse.js'),Q=require('../dist/quality.js');
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
export async function generatePreviewVariants(){
 const base=new URL('previews/',dist),output=new URL('variants/',base),manifest={};await mkdir(output,{recursive:true});
 const index=JSON.parse(await readFile(new URL('data/browse/index.json',root),'utf8')),evidenceAt=Q.evidenceTime(index.snapshots?.catalog),selection=B.select(index.repositories.filter(r=>Q.publishedEligible(r,evidenceAt)),{storefront:true,limit:48,evidenceAt},{rows:[]}),wanted=new Set([...selection.items,...selection.shelfItems].flatMap(r=>(r.screenshots||[]).map(s=>s.src.replace('previews/',''))));
 const names=(await readdir(base)).filter(n=>wanted.has(n)&&/^[a-f0-9]{24}(?:-provider)?\.jpg$/.test(n));let position=0;async function worker(){while(position<names.length){const name=names[position++];
  const original=new URL(name,base),source=await stat(original),versions=[];
  for(const width of [320,640,960]){const target=name.replace('.jpg',`-${width}.webp`),file=new URL(target,output);let current;try{current=await stat(file)}catch{}
   if(!current||current.mtimeMs<source.mtimeMs)try{await sharp(fileURLToPath(original),{limitInputPixels:20000000}).rotate().resize({width,withoutEnlargement:true}).webp({quality:72}).toFile(fileURLToPath(file))}catch{continue}
   const metadata=await sharp(fileURLToPath(file)).metadata();if(!versions.some(v=>v.width===metadata.width))versions.push({src:'previews/variants/'+target,width:metadata.width,height:metadata.height});
  }if(versions.length)manifest['previews/'+name]=versions;
 }}await Promise.all(Array.from({length:4},worker));
 await writeFile(new URL('data/preview-variants.json',root),JSON.stringify(manifest));console.log(`Responsive previews: ${Object.keys(manifest).length} originals retained.`);
}
export async function restorePublicHTML(){const backup=new URL('.asset-html/',dist);let names;try{names=await readdir(backup)}catch(e){if(e.code==='ENOENT')return;throw e}for(const name of names){const file=new URL(name,dist),html=await readFile(file,'utf8');if(/\/assets\/[^"']+\.[a-f0-9]{16}\.(js|css)/.test(html))await writeFile(file,await readFile(new URL(name,backup)))}}
export async function buildPublicAssets(){
 await restorePublicHTML();const backup=new URL('.asset-html/',dist);await mkdir(backup,{recursive:true});
 const assets=new URL('assets/',dist);await mkdir(assets,{recursive:true});const files=(await readdir(dist)).filter(n=>/\.(?:js|css)$/.test(n)),names={};
 for(const name of files){const source=await readFile(new URL(name,dist),'utf8'),result=await transform(source,{loader:name.endsWith('.css')?'css':'js',minify:true,target:'es2020',legalComments:'inline'}),hash=createHash('sha256').update(result.code).digest('hex').slice(0,16),target=name.replace(/\.(js|css)$/,`.${hash}.$1`);await writeFile(new URL(target,assets),result.code);names[name]='/assets/'+target;}
 // HTML source remains readable and unchanged; only the deployment output is rewritten.
 for(const name of (await readdir(dist)).filter(n=>n.endsWith('.html'))){let html=await readFile(new URL(name,dist),'utf8');await writeFile(new URL(name,backup),html);html=html.replace(/(src|href)=(['"])(\/?)([^'"/?]+\.(?:js|css))\2/g,(all,attribute,quote,slash,file)=>names[file]?`${attribute}=${quote}${names[file]}${quote}`:all);await writeFile(new URL(name,dist),html)}
 console.log(`Public assets: ${files.length} minified, fingerprinted files.`);
}
if(process.argv.includes('--restore'))await restorePublicHTML();
if(process.argv.includes('--previews'))await generatePreviewVariants();
if(process.argv.includes('--assets'))await buildPublicAssets();
