import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { openDatabase } from './database.ts';
import { authorize } from './access.ts';
import { config } from './academy-config.ts';
import { createReader } from './queries.ts';
import seed from './seed.json';
import type { Scalar } from './model.ts';

let pending: ReturnType<typeof openDatabase> | undefined;
export function database() {
 return pending??=openDatabase().then(async db=>{
  // Remote schema and data are provisioned before deployment, never at startup.
  if(!process.env.TURSO_DATABASE_URL&&!process.env.DATABASE_URL?.startsWith('postgres')) {
   for(const [table,records] of Object.entries(seed)) {
    if(!Object.hasOwn(config.entities,table))throw Error('Unknown seed entity');
    for(const row of records as Record<string,Scalar>[]) {
     const keys=Object.keys(row);
     if(keys.some(key=>!/^[A-Za-z][A-Za-z0-9]*$/.test(key)))throw Error('Invalid seed field');
     await db.query(`INSERT INTO "${table}" (${keys.map(key=>'"'+key+'"').join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT(id) DO NOTHING`,Object.values(row));
    }
   }
  }
  return db;
 }).catch(error=>{pending=undefined;throw error;});
}
export const requireAccess=cache(async()=>{
 const incoming=await headers();
 if(authorize(Object.fromEntries(incoming),'GET')!==200)throw Error('Authentication required');
});
export const reader=cache(async()=>{
 await requireAccess();
 return createReader(config,await database());
});
export const readOnly=()=>process.env.READ_ONLY==='1';
