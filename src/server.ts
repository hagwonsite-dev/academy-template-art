import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp, type Config } from './app.ts';
import { openDatabase } from './database.ts';
import { authorize } from './access.ts';
const config: Config=JSON.parse(readFileSync('src/config.json','utf8'));
const db=await openDatabase();
if(!process.env.TURSO_DATABASE_URL&&!process.env.DATABASE_URL?.startsWith('postgres')) {
    const seed: Record<string,Record<string,string|number|null>[]>=JSON.parse(readFileSync('src/seed.json','utf8'));
    for(const [name,rows] of Object.entries(seed)) for(const row of rows) {
        const keys=Object.keys(row);
        await db.query(`INSERT INTO "${name}" (${keys.map(k=>'"'+k+'"').join(',')}) VALUES (${keys.map(()=>'?').join(',')}) ON CONFLICT(id) DO NOTHING`,Object.values(row));
    }
}
const handle=createApp(config,db);
const files: Record<string,string>={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};
const server=createServer(async(req,res)=>{
    const method=req.method||'GET';
    const access=authorize(req.headers,method);
    const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
    if(access!==200) {res.writeHead(access,{...headers,'WWW-Authenticate':'Basic realm="Academy", charset="UTF-8"'});res.end(access===503?'App password not configured':'Authentication required');return;}
    try {
        const path=new URL(req.url||'/','http://localhost').pathname;
        if(files[path]&&method==='GET') {const file=files[path];res.writeHead(200,{...headers,'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});res.end(readFileSync(join('public',file)));return;}
        let raw=''; for await(const chunk of req) {raw+=chunk;if(Buffer.byteLength(raw)>32768){res.writeHead(413,headers);res.end();return;}}
        let body:unknown;try{body=raw?JSON.parse(raw):{};}catch{res.writeHead(400,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({error:'입력 내용을 확인하세요'}));return;}
        const result=await handle(path,method,body,process.env.READ_ONLY==='1'||process.env.PUBLIC_DEMO==='1');
        res.writeHead(result.status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(result.data));
    }catch{res.writeHead(500,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({error:'요청을 처리하지 못했어요'}));}
});
server.listen(Number(process.env.PORT||3100),process.env.VERCEL==='1'?'0.0.0.0':'127.0.0.1',()=>console.log('Academy listening on '+String((server.address() as {port:number}).port)));
process.on('SIGTERM',()=>server.close(()=>{db.close();process.exit(0);}));
