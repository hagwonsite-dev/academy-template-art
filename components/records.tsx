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
 const field=entity.fields.find(f=>f.name==='status');return field?<span className={'pill'+(['cancelled','absent','unpaid'].includes(String(row.status))?' muted':'')}>{label(row,field)}</span>:null;
}
function Controls({name,entity,row}:{name:string;entity:AcademyEntity;row:Row}){
 return <RecordActions name={name} row={row} editable={Boolean(entity.editFields?.length)} actions={entity.actions?.filter(action=>action.from.includes(String(row.status)))??[]} reserve={name==='Session'}/>;
}
function Progress({value,total,label}:{value:number;total:number;label:string}){
 return <><div className="remaining"><span>{label}</span><strong>{value} / {total}</strong></div><div className="progress-track" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={total}><div className="progress-fill" style={{width:Math.max(0,Math.min(100,total?value/total*100:0))+'%'}}/></div></>;
}
function Card({name,entity,row}:{name:string;entity:AcademyEntity;row:Row}){
 const student=entity.fields.find(field=>field.relation==='Student');
 const title=String(row.title??row.name??(student?label(row,student)+' · '+String(row.teacher??'레슨'):entity.label));
 const hidden=new Set(['title','name','status','imageUrl','studentId','totalSessions','capacity',...(entity.layout==='schedule'?['date','time']:[])]);
 return <article className="record-card">{entity.layout==='gallery'?<div className="artwork">{typeof row.imageUrl==='string'&&row.imageUrl.startsWith('https://')?<img src={row.imageUrl} alt={title} loading="lazy" width={480} height={320} referrerPolicy="no-referrer"/>:<div className="artwork-placeholder"/>}</div>:null}{entity.layout==='schedule'?<div className="schedule-time">{String(row.time??String(row.date??'').slice(5))}<small>{String(row.time?row.date:'수업 예정')}</small></div>:null}<div className="card-body"><div className="card-top"><span>{student?label(row,student):String(row.date??row.dueDate??entity.label)}</span><State entity={entity} row={row}/></div><h3>{title}</h3>{entity.fields.filter(field=>!hidden.has(field.name)&&row[field.name]!=null).map(field=><p key={field.name} className="card-detail">{field.label} · {label(row,field)}</p>)}{name==='Pass'?<Progress value={Number(row.remaining)} total={Number(row.totalSessions)} label="남은 레슨"/>:null}{name==='Session'?<Progress value={Number(row.booked)} total={Number(row.capacity)} label="예약 현황"/>:null}<Controls name={name} entity={entity} row={row}/></div></article>;
}
export function Records({name,entity,rows}:{name:string;entity:AcademyEntity;rows:Row[]}){
 if(!rows.length)return <div className="empty">조건에 맞는 기록이 없어요. 검색을 바꾸거나 첫 기록을 등록해 보세요.</div>;
 if(entity.layout==='table')return <div className="table-wrap"><table><thead><tr>{entity.fields.map(field=><th key={field.name} scope="col">{field.label}</th>)}<th scope="col">관리</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{entity.fields.map(field=><td key={field.name}>{field.name==='status'?<State entity={entity} row={row}/>:label(row,field)}</td>)}<td><Controls name={name} entity={entity} row={row}/></td></tr>)}</tbody></table></div>;
 if(entity.layout==='board')return <div className="board">{entity.fields.find(field=>field.name==='status')?.options?.map(state=>{
  const group=rows.filter(row=>row.status===state.value);
  return <section key={state.value} className="board-column"><h3 className="board-heading">{state.label} · {group.length}</h3>{group.length?group.map(row=><Card key={row.id} name={name} entity={entity} row={row}/>):<p className="card-detail">기록이 없어요</p>}</section>;
 })}</div>;
 return <div className={entity.layout==='schedule'?'schedule':entity.layout==='gallery'?'gallery':'cards'}>{rows.map(row=><Card key={row.id} name={name} entity={entity} row={row}/>)}</div>;
}
