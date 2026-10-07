import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { authorize } from './access.ts';
import { createApp, type Database } from './operations.ts';
import { createReader } from './queries.ts';
import type { AcademyConfig, ListParams } from './model.ts';

export function createApi(config:AcademyConfig, database:()=>Promise<Database>, env:NodeJS.ProcessEnv=process.env) {
 const app=new Hono().basePath('/api');
 app.use('*',async(c,next)=>{
  c.header('Cache-Control','private, no-store');c.header('X-Content-Type-Options','nosniff');
  const access=authorize(Object.fromEntries(c.req.raw.headers),c.req.method,env);
  if(access!==200) return new Response(access===503?'App password not configured':'Authentication required',{status:access,headers:{'WWW-Authenticate':'Basic realm="Academy", charset="UTF-8"','Cache-Control':'no-store'}});
  await next();
 });
 app.use('*',bodyLimit({maxSize:32768,onError:c=>c.json({error:'입력 내용이 너무 큽니다'},413)}));
 app.get('/config',c=>c.json({...config,readOnly:env.READ_ONLY==='1'||env.PUBLIC_DEMO==='1'}));
 app.get('/overview',async c=>c.json(await createReader(config,await database()).overview()));
 const params=(url:URL):ListParams=>({page:Number(url.searchParams.get('page')??1),q:url.searchParams.get('q')??'',status:url.searchParams.get('status')??'',studentId:url.searchParams.get('studentId')??''});
 app.get('/:entity/options',async c=>{
  const name=c.req.param('entity');
  if(!Object.hasOwn(config.entities,name))return c.json({error:'목록을 찾을 수 없습니다'},404);
  return c.json(await createReader(config,await database()).options(name,params(new URL(c.req.url))));
 });
 app.get('/:entity',async c=>{
  const name=c.req.param('entity');
  if(!Object.hasOwn(config.entities,name))return c.json({error:'목록을 찾을 수 없습니다'},404);
  return c.json(await createReader(config,await database()).list(name,params(new URL(c.req.url))));
 });
 app.on(['POST','PATCH'],'/*',async c=>{
  if(env.READ_ONLY==='1'||env.PUBLIC_DEMO==='1')return c.json({error:'공개 예시는 조회만 가능해요.'},403);
  let body:unknown;
  try{body=await c.req.json();}catch{return c.json({error:'올바른 JSON을 입력하세요'},400);}
  const result=await createApp(config,await database())(new URL(c.req.url).pathname,c.req.method,body,false);
  return new Response(JSON.stringify(result.data),{status:result.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'}});
 });
 app.onError((_error,c)=>c.json({error:'요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.'},500));
 return app;
}
