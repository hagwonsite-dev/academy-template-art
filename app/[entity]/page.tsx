import Link from 'next/link';
import { notFound } from 'next/navigation';
import { config } from '../../src/academy-config.ts';
import { reader,readOnly } from '../../src/runtime.ts';
import { EditorProvider,NewRecord } from '../../components/editor-context.tsx';
import { Records } from '../../components/records.tsx';
export default async function Page({params,searchParams}:{params:Promise<{entity:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [{entity:name},query]=await Promise.all([params,searchParams]);
 if(!Object.hasOwn(config.entities,name))notFound();
 const entity=config.entities[name]!;
 const q=typeof query.q==='string'?query.q:'',status=typeof query.status==='string'?query.status:'';
 const data=await(await reader()).list(name,{page:Number(query.page??1),q,status});
 const href=(page:number)=>'/'+name+'?'+new URLSearchParams({q,status,page:String(page)});
 return <div id="content"><EditorProvider config={config} readOnly={readOnly()}><div className="section-heading"><div><h2>{entity.label}</h2><p className="description">{entity.description}</p></div><NewRecord name={name}/></div><form className="toolbar" action={'/'+name}><input type="search" name="q" defaultValue={q} placeholder="이름이나 내용으로 검색" aria-label="기록 검색"/>{entity.fields.find(field=>field.name==='status')?.options?<select name="status" defaultValue={status} aria-label="상태 필터"><option value="">모든 상태</option>{entity.fields.find(field=>field.name==='status')?.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:null}<button type="submit" className="secondary">검색</button><span className="count">{data.total}개 기록</span></form><Records name={name} entity={entity} rows={data.rows} readOnly={readOnly()}/><div className="pagination" aria-label="목록 페이지">{data.page>1?<Link href={href(data.page-1)}>← 이전</Link>:<span/>}<span>{data.page} / {Math.max(1,Math.ceil(data.total/data.pageSize))}</span>{data.page*data.pageSize<data.total?<Link href={href(data.page+1)}>다음 →</Link>:<span/>}</div></EditorProvider></div>;
}
