import http from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('../dist/',import.meta.url);
const port=Number(process.env.PORT||3000);
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=files[path];if(!file){res.writeHead(404);res.end('Not found');return}const body=await readFile(new URL(file,root));res.writeHead(200,{'Content-Type':types[file.slice(file.lastIndexOf('.'))]});res.end(body)}catch{res.writeHead(500);res.end('Unable to serve file')}}).listen(port,'0.0.0.0',()=>console.log(`RepoShelf running at http://localhost:${port}`));
