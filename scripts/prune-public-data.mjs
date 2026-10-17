import {readdir,rm} from 'node:fs/promises';
// The complete catalogue (every record, including unpublished and moderated listings and internal check fields) is needed
// while building, but it must not be published: the website, its functions and its crawlers read the browse index and the
// runtime copies in data/runtime instead. Run at the end of the production build, after every step that reads these files.
export const PRIVATE=[/^catalog\.json$/,/^spaces\.json$/,/^catalog\.part-.+\.json\.gz$/,/^spaces\.part-.+\.json\.gz$/];
export async function prune(dir=new URL('../dist/',import.meta.url)){
 const removed=[];
 for(const name of await readdir(dir))if(PRIVATE.some(p=>p.test(name))){await rm(new URL(name,dir),{force:true});removed.push(name)}
 return removed.sort();
}
if(import.meta.url===new URL(process.argv[1],'file://'+process.cwd()+'/').href){
 const removed=await prune();
 console.log(`Removed ${removed.length} private catalogue files from the published output.`);
}
