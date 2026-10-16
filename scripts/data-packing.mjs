import {pack,unpack} from '../lib/data-packing.mjs';
import {migrateReadmeTerms} from '../lib/readme-terms.mjs';
const command=process.argv[2],root=process.cwd();
if(command==='unpack'){const done=unpack(root,undefined,{force:process.argv.includes('--force')});const moved=migrateReadmeTerms(root);console.log(done.length?`Unpacked ${done.join(', ')}.`:'Nothing to unpack.');if(moved)console.log(`Moved README search terms for ${moved} projects into data/readme-terms.`)}
else if(command==='pack'){const done=pack(root);console.log(done.length?`Packed ${done.join(', ')}.`:'Nothing changed to pack.')}
else{console.error('Usage: node scripts/data-packing.mjs <pack|unpack> [--force]');process.exitCode=2}
