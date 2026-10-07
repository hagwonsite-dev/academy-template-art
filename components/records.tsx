import { Card as UICard, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress as UIProgress } from './ui/progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { actionRow } from '../src/model.ts';
import type { AcademyEntity, Row } from '../src/model.ts';
import type { Field } from '../src/operations.ts';
import { RecordActions } from './editor-context.tsx';
function label(row:Row,field:Field):string {
 const value=row[field.name];
 if(field.relation)return String(row[field.name+'Label']??'미지정');
 if(field.options)return field.options.find(option=>option.value===value)?.label??String(value??'—');
 if(field.name==='amount'&&typeof value==='number')return value.toLocaleString('ko-KR')+'원';
 return String(value??'—');
}
function State({entity,row}:{entity:AcademyEntity;row:Row}){
 const field=entity.fields.find(f=>f.name==='status');return field?<Badge className="pill" variant={['cancelled','absent','unpaid'].includes(String(row.status))?'outline':'secondary'}>{label(row,field)}</Badge>:null;
}
function Controls({name,entity,row,readOnly}:{name:string;entity:AcademyEntity;row:Row;readOnly:boolean}){
 return <RecordActions name={name} row={actionRow(entity,row,readOnly)} editable={Boolean(entity.editFields?.length)} actions={entity.actions?.filter(action=>action.from.includes(String(row.status)))??[]} reserve={name==='Session'}/>;
}
function Progress({value,total,label}:{value:number;total:number;label:string}){
 return <><div className="remaining"><span>{label}</span><strong>{value} / {total}</strong></div><UIProgress className="progress-track" value={Math.max(0,Math.min(100,total?value/total*100:0))} aria-label={label} aria-valuetext={`${value} / ${total}`}/></>;
}
function Card({name,entity,row,readOnly}:{name:string;entity:AcademyEntity;row:Row;readOnly:boolean}){
 const student=entity.fields.find(field=>field.relation==='Student');
 const title=String(row.title??row.name??(student?label(row,student)+' · '+String(row.teacher??'레슨'):entity.label));
 const hidden=new Set(['title','name','status','imageUrl','studentId','totalSessions','capacity',...(entity.layout==='schedule'?['date','time']:[])]);
 return <UICard className="record-card gap-0 overflow-hidden py-0">{entity.layout==='gallery'?<div className="artwork">{typeof row.imageUrl==='string'&&row.imageUrl.startsWith('https://')?<img src={row.imageUrl} alt={title} loading="lazy" width={480} height={320} referrerPolicy="no-referrer"/>:<div className="artwork-placeholder"/>}</div>:null}{entity.layout==='schedule'?<div className="schedule-time">{String(row.time??String(row.date??'').slice(5))}<small>{String(row.time?row.date:'수업 예정')}</small></div>:null}<CardContent className="card-body"><div className="card-top"><span>{student?label(row,student):String(row.date??row.dueDate??entity.label)}</span><State entity={entity} row={row}/></div><h3>{title}</h3>{entity.fields.filter(field=>!hidden.has(field.name)&&row[field.name]!=null).map(field=><p key={field.name} className="card-detail">{field.label} · {label(row,field)}</p>)}{name==='Pass'?<Progress value={Number(row.remaining)} total={Number(row.totalSessions)} label="남은 레슨"/>:null}{name==='Session'?<Progress value={Number(row.booked)} total={Number(row.capacity)} label="예약 현황"/>:null}<Controls name={name} entity={entity} row={row} readOnly={readOnly}/></CardContent></UICard>;
}
export function Records({name,entity,rows,readOnly}:{name:string;entity:AcademyEntity;rows:Row[];readOnly:boolean}){
 if(!rows.length)return <Alert className="empty"><AlertDescription>조건에 맞는 기록이 없어요. 검색을 바꾸거나 첫 기록을 등록해 보세요.</AlertDescription></Alert>;
 if(entity.layout==='table')return <div className="table-wrap"><Table><TableHeader><TableRow>{entity.fields.map(field=><TableHead key={field.name} scope="col">{field.label}</TableHead>)}<TableHead scope="col">관리</TableHead></TableRow></TableHeader><TableBody>{rows.map(row=><TableRow key={row.id}>{entity.fields.map(field=><TableCell key={field.name}>{field.name==='status'?<State entity={entity} row={row}/>:label(row,field)}</TableCell>)}<TableCell><Controls name={name} entity={entity} row={row} readOnly={readOnly}/></TableCell></TableRow>)}</TableBody></Table></div>;
 if(entity.layout==='board')return <div className="board">{entity.fields.find(field=>field.name==='status')?.options?.map(state=>{
  const group=rows.filter(row=>row.status===state.value);
  return <section key={state.value} className="board-column"><h3 className="board-heading">{state.label} · {group.length}</h3>{group.length?group.map(row=><Card key={row.id} name={name} entity={entity} row={row} readOnly={readOnly}/>):<p className="card-detail">기록이 없어요</p>}</section>;
 })}</div>;
 return <div className={entity.layout==='schedule'?'schedule':entity.layout==='gallery'?'gallery':'cards'}>{rows.map(row=><Card key={row.id} name={name} entity={entity} row={row} readOnly={readOnly}/>)}</div>;
}
