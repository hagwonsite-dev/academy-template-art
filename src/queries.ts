import type { Database } from './operations.ts';
import type { AcademyConfig, AcademyEntity, ListParams, PageData, Overview, Row, Scalar, OptionsPage } from './model.ts';

const quote = (name: string): string => {
 if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw Error('Invalid schema identifier');
 return '"' + name + '"';
};
const pageNumber = (value: number | undefined): number => Number.isSafeInteger(value) && value! > 0 ? Math.min(value!,1000000) : 1;
function rows(values: Record<string,unknown>[]): Row[] {
 return values.map(value => {
  if (typeof value.id !== 'string') throw Error('Invalid record identifier');
  const row: Row = {id:value.id};
  for (const [key, cell] of Object.entries(value)) {
   if (cell === null || typeof cell === 'string' || typeof cell === 'number') row[key] = cell;
   else throw Error('Invalid record value');
  }
  return row;
 });
}
export function createReader(config: AcademyConfig, db: Database) {
 function entity(name: string): AcademyEntity {
  if (!Object.hasOwn(config.entities,name)) throw Error('Unknown entity');
  return config.entities[name]!;
 }
 function labelColumn(name: string): string {
  const fields=entity(name).fields;
  return fields.some(f=>f.name==='name') ? 'name' : fields.some(f=>f.name==='title') ? 'title' : 'id';
 }
 function selection(name: string) {
  const fields=entity(name).fields, joins: string[] = [], columns=['t.*'];
  const searchable=fields.filter(f=>!f.relation).map(f=>'CAST(t.'+quote(f.name)+' AS TEXT)');
  for (const [i,field] of fields.entries()) if (field.relation) {
   const alias='r'+i, label=alias+'.'+quote(labelColumn(field.relation));
   joins.push(`LEFT JOIN ${quote(field.relation)} ${alias} ON ${alias}.id=t.${quote(field.name)}`);
   columns.push(`${label} AS ${quote(field.name+'Label')}`);searchable.push(label);
  }
  if(name==='Pass') columns.push('(t."totalSessions" - (SELECT COUNT(*) FROM "Lesson" l WHERE l."passId"=t.id AND l.status=\'completed\')) AS remaining');
  if(name==='Session') columns.push('(SELECT COUNT(*) FROM "Booking" b WHERE b."sessionId"=t.id AND b.status<>\'cancelled\') AS booked');
  return {from:`${quote(name)} t ${joins.join(' ')}`,columns,searchable};
 }
 async function list(name: string, params: ListParams = {}, size=25): Promise<PageData> {
  const def=entity(name), select=selection(name), values: Scalar[]=[], conditions: string[]=[];
  const bind=(value:Scalar)=>{values.push(value);return '$'+values.length;};
  const q=params.q?.trim().slice(0,200);
  if(q) conditions.push('('+select.searchable.map(column=>`${column} LIKE ${bind('%'+q.replace(/[\\%_]/g,'\\$&')+'%')} ESCAPE '\\'`).join(' OR ')+')');
  if(params.status && def.fields.some(f=>f.name==='status')) conditions.push('t.status='+bind(params.status));
  if(params.studentId && def.fields.some(f=>f.name==='studentId')) conditions.push('t."studentId"='+bind(params.studentId));
  const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
  const page=pageNumber(params.page),pageSize=Math.max(1,Math.min(size,50));
  const order=name==='Session'?'t.date,t.time,t.id':config.timestamps?'t."createdAt" DESC NULLS LAST,t.id DESC':'t.id DESC';
  const [data,count]=await Promise.all([
   db.query(`SELECT ${select.columns.join(',')} FROM ${select.from}${where} ORDER BY ${order} LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,pageSize,(page-1)*pageSize]),
   db.query(`SELECT COUNT(*) AS total FROM ${select.from}${where}`,values),
  ]);
  return {rows:rows(data),total:Number(count[0]?.total??0),page,pageSize};
 }
 async function overview(): Promise<Overview> {
  const metricsPromise=Promise.all(config.metrics.map(async metric=>{
   entity(metric.entity);
   const count=await db.query(`SELECT COUNT(*) AS total FROM ${quote(metric.entity)}${metric.status?' WHERE status=$1':''}`,metric.status?[metric.status]:[]);
   return {label:metric.label,value:Number(count[0]?.total??0)};
  }));
  const [metrics,records]=await Promise.all([metricsPromise,list(config.primary,{},6)]);
  return {metrics,records};
 }
 async function options(name:string, params:ListParams={}):Promise<OptionsPage> {
  const result=await list(name,params,25),key=labelColumn(name);
  return {options:result.rows.map(row=>({id:row.id,label:String(row[key]??row.id)+(name==='Pass'?' · 잔여 '+String(row.remaining)+'회':'')})),hasMore:result.page*result.pageSize<result.total};
 }
 return {list,overview,options};
}
