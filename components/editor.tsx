'use client';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { AcademyConfig, Option } from '../src/model.ts';
import { parseOptions } from '../src/model.ts';
import type { Field } from '../src/operations.ts';
import { mutate, type EditTask } from './editor-context.tsx';

function Relation({field,value,label,studentId,onChange}:{field:Field;value:string;label:string;studentId?:string;onChange:(value:string)=>void}){
 const [query,setQuery]=useState(''),[page,setPage]=useState(1),[options,setOptions]=useState<Option[]>([]),[more,setMore]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);setError('');
   try{
    const params=new URLSearchParams({q:query,page:String(page)});if(studentId!==undefined)params.set('studentId',studentId||'__none__');
    const response=await fetch(`/api/${field.relation}/options?${params}`,{signal:controller.signal});
    if(!response.ok)throw Error('선택 목록을 불러오지 못했어요');
    const result=parseOptions(await response.json());setOptions(result.options);setMore(result.hasMore);
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'목록 오류');}
   finally{if(!controller.signal.aborted)setLoading(false);}
  },200);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,page,field.relation,studentId]);
 return <div className="relation-field"><label>{field.label} 검색<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="이름으로 검색"/></label><label>{field.label}<select name={field.name} required={field.required} value={value} onChange={e=>onChange(e.target.value)} aria-busy={loading}><option value="">선택하세요</option>{value&&!options.some(item=>item.id===value)?<option value={value}>{label||value}</option>:null}{options.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><div className="option-pages"><button type="button" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>이전</button><span>{page} 페이지</span><button type="button" disabled={!more||loading} onClick={()=>setPage(p=>p+1)}>다음</button></div>{error?<p role="alert">{error}</p>:null}</div>;
}
export default function Editor({config,task,close}:{config:AcademyConfig;task:EditTask;close:()=>void}){
 const entity=config.entities[task.name];
 if(!entity)throw Error('Unknown entity');
 const fields=task.action?.fields??(task.row?entity.fields.filter(f=>entity.editFields?.includes(f.name)):entity.fields.filter(f=>!f.readOnly));
 const dialog=useRef<HTMLDialogElement>(null),router=useRouter();
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>[f.name,String(task.row?.[f.name]??task.prefill?.[f.name]??'')])));
 const [pending,startTransition]=useTransition(),[error,setError]=useState('');
 useEffect(()=>{dialog.current?.showModal();},[]);
 function change(name:string,value:string){setValues(previous=>({...previous,[name]:value,...(task.name==='Lesson'&&name==='studentId'?{passId:''}:{})}));}
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));
  startTransition(async()=>{setError('');try{
   const path=task.action?`${task.name}/${task.row?.id}/${task.action.id}`:task.row?`${task.name}/${task.row.id}`:task.name;
   await mutate(path,task.row&&!task.action?'PATCH':'POST',data);router.refresh();close();
  }catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요');}});
 }
 return <dialog id="editor" ref={dialog} onCancel={event=>{if(pending)event.preventDefault();else close();}} aria-labelledby="editor-title"><form onSubmit={submit} id="edit-form"><div className="dialog-heading"><h2 id="editor-title">{task.action?.label??entity.label+(task.row?' 수정':' 등록')}</h2><button type="button" className="icon-button" disabled={pending} aria-label="닫기" onClick={close}>×</button></div><fieldset disabled={pending} id="form-fields">{fields.map(field=>{
  const value=values[field.name]??'';
  if(field.relation)return <Relation key={field.name} field={field} value={value} label={String(task.row?.[field.name+'Label']??'')} studentId={task.name==='Lesson'&&field.name==='passId'?values.studentId:undefined} onChange={next=>change(field.name,next)}/>;
  const common={name:field.name,required:field.required,value,onChange:(event:{target:{value:string}})=>change(field.name,event.target.value)};
  return <label key={field.name} className={field.type==='textarea'?'wide':undefined}>{field.label}{field.options?<select {...common}><option value="">선택하세요</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:field.type==='textarea'?<textarea {...common} maxLength={4000}/>:<input {...common} type={['number','date','time','url'].includes(field.type)?field.type:'text'} min={field.min} max={field.max} step={field.type==='number'?1:undefined} maxLength={4000}/>}</label>;
 })}</fieldset><p id="form-error" role="alert">{error}</p><div className="dialog-actions"><button type="button" className="secondary" disabled={pending} onClick={close}>취소</button><button type="submit" className="primary" disabled={pending}>{pending?'저장 중…':'저장하기'}</button></div></form></dialog>;
}
