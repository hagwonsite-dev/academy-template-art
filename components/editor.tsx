'use client';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { NativeSelect, NativeSelectOption } from './ui/native-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
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
 return <div className="relation-field"><Label>{field.label} 검색<Input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="이름으로 검색"/></Label><Label>{field.label}<NativeSelect name={field.name} required={field.required} value={value} onChange={e=>onChange(e.target.value)} aria-busy={loading}><NativeSelectOption value="">선택하세요</NativeSelectOption>{value&&!options.some(item=>item.id===value)?<NativeSelectOption value={value}>{label||value}</NativeSelectOption>:null}{options.map(item=><NativeSelectOption key={item.id} value={item.id}>{item.label}</NativeSelectOption>)}</NativeSelect></Label><div className="option-pages"><Button type="button" variant="ghost" size="sm" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>이전</Button><span>{page} 페이지</span><Button type="button" variant="ghost" size="sm" disabled={!more||loading} onClick={()=>setPage(p=>p+1)}>다음</Button></div>{error?<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>:null}</div>;
}
export default function Editor({config,task,close}:{config:AcademyConfig;task:EditTask;close:()=>void}){
 const entity=config.entities[task.name];
 if(!entity)throw Error('Unknown entity');
 const fields=task.action?.fields??(task.row?entity.fields.filter(f=>entity.editFields?.includes(f.name)):entity.fields.filter(f=>!f.readOnly));
 const router=useRouter();
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>[f.name,String(task.row?.[f.name]??task.prefill?.[f.name]??'')])));
 const [pending,startTransition]=useTransition(),[error,setError]=useState('');
 function change(name:string,value:string){setValues(previous=>({...previous,[name]:value,...(task.name==='Lesson'&&name==='studentId'?{passId:''}:{})}));}
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));
  startTransition(async()=>{setError('');try{
   const path=task.action?`${task.name}/${task.row?.id}/${task.action.id}`:task.row?`${task.name}/${task.row.id}`:task.name;
   await mutate(path,task.row&&!task.action?'PATCH':'POST',data);router.refresh();close();
  }catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요');}});
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!pending)close();}}><DialogContent id="editor" aria-labelledby="editor-title" onCloseAutoFocus={event=>{event.preventDefault();task.returnFocus?.focus();}} showCloseButton={false} className="max-h-[90dvh] overflow-y-auto sm:max-w-[540px]" onEscapeKeyDown={event=>{if(pending)event.preventDefault();}} onInteractOutside={event=>event.preventDefault()}><form onSubmit={submit} id="edit-form"><DialogHeader className="mb-6 text-left"><div className="flex items-center justify-between gap-4"><DialogTitle id="editor-title">{task.action?.label??entity.label+(task.row?' 수정':' 등록')}</DialogTitle><Button type="button" variant="ghost" size="icon" disabled={pending} aria-label="닫기" onClick={close}>×</Button></div><DialogDescription>내용을 입력한 뒤 저장해 주세요.</DialogDescription></DialogHeader><fieldset disabled={pending} id="form-fields">{fields.map(field=>{
  const value=values[field.name]??'';
  if(field.relation)return <Relation key={field.name} field={field} value={value} label={String(task.row?.[field.name+'Label']??'')} studentId={task.name==='Lesson'&&field.name==='passId'?values.studentId:undefined} onChange={next=>change(field.name,next)}/>;
  const common={name:field.name,required:field.required,value,onChange:(event:{target:{value:string}})=>change(field.name,event.target.value)};
  return <Label key={field.name} className={field.type==='textarea'?'wide':undefined}>{field.label}{field.options?<NativeSelect {...common}><NativeSelectOption value="">선택하세요</NativeSelectOption>{field.options.map(option=><NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}</NativeSelect>:field.type==='textarea'?<Textarea {...common} maxLength={4000}/>:<Input {...common} type={['number','date','time','url'].includes(field.type)?field.type:'text'} min={field.min} max={field.max} step={field.type==='number'?1:undefined} maxLength={4000}/>}</Label>;
 })}</fieldset>{error?<Alert id="form-error" variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>:null}<DialogFooter className="mt-6"><Button type="button" variant="outline" disabled={pending} onClick={close}>취소</Button><Button type="submit"  disabled={pending}>{pending?'저장 중…':'저장하기'}</Button></DialogFooter></form></DialogContent></Dialog>;
}
