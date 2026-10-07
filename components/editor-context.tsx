'use client';
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { Action } from '../src/operations.ts';
import type { AcademyConfig, Row } from '../src/model.ts';
import { isRecord } from '../src/model.ts';
const Editor=dynamic(()=>import('./editor.tsx'));
export interface EditTask { name:string; row?:Row; action?:Action; prefill?:Record<string,string> }
const Context=createContext<{open:(task:EditTask)=>void;readOnly:boolean}|null>(null);
export async function mutate(path:string,method:string,body:unknown):Promise<void> {
 const response=await fetch('/api/'+path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok){const data:unknown=await response.json();throw Error(isRecord(data)&&typeof data.error==='string'?data.error:'저장하지 못했어요');}
}
function useEditor(){const context=useContext(Context);if(!context)throw Error('Missing editor provider');return context;}
export function EditorProvider({config,readOnly,children}:{config:AcademyConfig;readOnly:boolean;children:ReactNode}){
 const [task,setTask]=useState<EditTask>();
 return <Context.Provider value={{open:setTask,readOnly}}>{children}{task?<Editor config={config} task={task} close={()=>setTask(undefined)}/>:null}</Context.Provider>;
}
export function NewRecord({name}:{name:string}){
 const {open,readOnly}=useEditor();return <button type="button" className="primary" disabled={readOnly} onClick={()=>open({name})}>+ 새로 등록</button>;
}
export function RecordActions({name,row,editable,actions,reserve=false}:{name:string;row:Row;editable:boolean;actions:Action[];reserve?:boolean}){
 const {open,readOnly}=useEditor(),router=useRouter();
 const [pending,startTransition]=useTransition(),[error,setError]=useState('');
 function perform(action:Action){
  if(action.fields?.length){open({name,row,action});return;}
  startTransition(async()=>{setError('');try{await mutate(`${name}/${row.id}/${action.id}`,'POST',{});router.refresh();}catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요');}});
 }
 return <><div className="card-footer">{editable?<button className="action" disabled={readOnly||pending} onClick={()=>open({name,row})}>수정</button>:null}{actions.map(action=><button key={action.id} className="action" disabled={readOnly||pending} onClick={()=>perform(action)}>{action.label}</button>)}{reserve?<button className="action" disabled={readOnly||pending} onClick={()=>open({name:'Booking',prefill:{sessionId:row.id}})}>이 클래스 예약</button>:null}</div>{error?<p role="alert">{error}</p>:null}</>;
}
