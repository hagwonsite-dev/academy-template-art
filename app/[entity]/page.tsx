import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select';
import { Pagination, PaginationContent, PaginationItem } from '../../components/ui/pagination';
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
 return <div id="content"><EditorProvider config={config} readOnly={readOnly()}><div className="section-heading"><div><h2>{entity.label}</h2><p className="description">{entity.description}</p></div><NewRecord name={name}/></div><form className="toolbar" action={'/'+name}><Input type="search" name="q" defaultValue={q} placeholder="이름이나 내용으로 검색" aria-label="기록 검색"/>{entity.fields.find(field=>field.name==='status')?.options?<NativeSelect name="status" defaultValue={status} aria-label="상태 필터"><NativeSelectOption value="">모든 상태</NativeSelectOption>{entity.fields.find(field=>field.name==='status')?.options?.map(option=><NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}</NativeSelect>:null}<Button type="submit" variant="outline">검색</Button><span className="count">{data.total}개 기록</span></form><Records name={name} entity={entity} rows={data.rows} readOnly={readOnly()}/><Pagination className="pagination" aria-label="목록 페이지"><PaginationContent className="w-full justify-between"><PaginationItem><Button variant="outline" asChild disabled={data.page<=1}><Link aria-disabled={data.page<=1} tabIndex={data.page<=1?-1:undefined} className={data.page<=1?'pointer-events-none opacity-50':''} href={href(Math.max(1,data.page-1))}>← 이전</Link></Button></PaginationItem><PaginationItem>{data.page} / {Math.max(1,Math.ceil(data.total/data.pageSize))}</PaginationItem><PaginationItem><Button variant="outline" asChild><Link aria-disabled={data.page*data.pageSize>=data.total} tabIndex={data.page*data.pageSize>=data.total?-1:undefined} className={data.page*data.pageSize>=data.total?'pointer-events-none opacity-50':''} href={href(data.page+1)}>다음 →</Link></Button></PaginationItem></PaginationContent></Pagination></EditorProvider></div>;
}
