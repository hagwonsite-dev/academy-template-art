import { randomUUID } from 'node:crypto';
export interface Field { name: string; label: string; type: string; required?: boolean; readOnly?: boolean; min?: number; max?: number; relation?: string; options?: { value: string; label: string }[] }
export interface Action { id: string; label: string; from: string[]; to: string; fields?: Field[] }
export interface Entity { label: string; description: string; icon: string; layout: string; fields: Field[]; editFields?: string[]; initialStatus?: string; actions?: Action[] }
export interface Config { id: string; name: string; primary: string; entities: Record<string, Entity>; metrics: {entity: string; label: string; status?: string}[]; [key: string]: unknown }
type Value = string | number | null;
export interface Database { query(sql: string, args?: Value[]): Promise<Record<string, unknown>[]> }
class InputError extends Error { status: number; constructor(message: string, status=400) { super(message); this.status=status; } }
function object(value: unknown): Record<string, unknown> { if (!value || typeof value!=='object' || Array.isArray(value)) throw new InputError('입력 내용을 확인하세요'); return value as Record<string, unknown>; }
export function validate(fields: Field[], input: unknown, partial=false) {
    const data=object(input), output: Record<string,Value>={};
    if (Object.keys(data).some(key=>!fields.some(f=>f.name===key))) throw new InputError('허용되지 않은 항목입니다');
    for (const f of fields) {
        if (partial && !Object.hasOwn(data,f.name)) continue;
        const raw=data[f.name];
        if (raw===undefined || raw===null || raw==='') { if(f.required) throw new InputError(f.label+'을 입력하세요'); output[f.name]=null; continue; }
        if(f.type==='number') {
            if ((typeof raw!=='number' && typeof raw!=='string') || String(raw).trim()==='') throw new InputError(f.label+'을 확인하세요');
            const n=Number(raw); if(!Number.isSafeInteger(n)||n<(f.min??0)||n>(f.max??10000000)) throw new InputError(f.label+'의 범위를 확인하세요'); output[f.name]=n; continue;
        }
        if(typeof raw!=='string'||raw.length>4000) throw new InputError(f.label+'을 확인하세요');
        const value=raw.trim(); if(f.required&&!value) throw new InputError(f.label+'을 입력하세요');
        if(f.type==='date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)) throw new InputError('올바른 날짜를 입력하세요');
        if(f.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new InputError('올바른 시간을 입력하세요');
        if(f.type==='url' && value) { try {const u=new URL(value); if(u.protocol!=='https:'||u.username||u.password) throw Error();} catch {throw new InputError('HTTPS 이미지 주소를 입력하세요');} }
        if(f.options&&!f.options.some(o=>o.value===value)) throw new InputError('선택 항목을 확인하세요');
        output[f.name]=value||null;
    }
    return output;
}
export function createApp(config: Config, db: Database) {
    const quote=(value: string)=>{if(!/^[A-Za-z][A-Za-z0-9]*$/.test(value)) throw Error('Invalid schema identifier'); return '"'+value+'"';};
    for(const [key,entity] of Object.entries(config.entities)) {quote(key);for(const f of entity.fields) quote(f.name);}
    async function relations(entity: Entity, data: Record<string,Value>) {
        for(const f of entity.fields) if(f.relation && data[f.name]!==undefined && data[f.name]!==null && !(await db.query(`SELECT id FROM ${quote(f.relation)} WHERE id=?`,[data[f.name]])).length) throw new InputError(f.label+'을 다시 선택하세요');
    }
    async function list(entity: string) {
        if(entity==='Pass') return db.query('SELECT p.*, p.totalSessions - (SELECT COUNT(*) FROM Lesson l WHERE l.passId=p.id AND l.status=?) AS remaining FROM Pass p ORDER BY p.rowid DESC',['completed']);
        if(entity==='Session') return db.query('SELECT s.*, (SELECT COUNT(*) FROM Booking b WHERE b.sessionId=s.id AND b.status<>?) AS booked FROM Session s ORDER BY s.date,s.time',['cancelled']);
        return db.query(`SELECT * FROM ${quote(entity)} ORDER BY rowid DESC`);
    }
    return async (path: string, method='GET', body?: unknown, readOnly=false): Promise<{status: number; data: unknown}> => {
        try {
            if(path==='/health'&&method==='GET') return {status:200,data:{ok:true}};
            if(path==='/api/config'&&method==='GET') return {status:200,data:{...config,features:Object.keys(config.entities),readOnly}};
            if(path==='/api/overview'&&method==='GET') {
                const needed=[...new Set([...config.metrics.map(m=>m.entity),config.primary,'Student'])];
                const lists: Record<string,Record<string,unknown>[]>=Object.fromEntries(await Promise.all(needed.map(async e=>[e,await list(e)])));
                return {status:200,data:{metrics:config.metrics.map(m=>({label:m.label,value:lists[m.entity].filter(row=>!m.status||row.status===m.status).length})),lists}};
            }
            const match=path.match(/^\/api\/([A-Za-z]+)(?:\/([\w-]+))?(?:\/([a-z]+))?$/);
            if(!match || !Object.hasOwn(config.entities,match[1])) return {status:404,data:{error:'페이지를 찾을 수 없습니다'}};
            const [,name,id,actionId]=match, entity=config.entities[name], table=quote(name);
            if(method==='GET'&&!id) return {status:200,data:await list(name)};
            if(!['POST','PATCH'].includes(method)) return {status:405,data:{error:'지원하지 않는 요청입니다'}};
            if(readOnly) return {status:403,data:{error:'공개 예시는 조회만 가능해요. 내 앱에서는 등록과 변경을 할 수 있어요.'}};
            if(method==='POST'&&!id) {
                const data=validate(entity.fields.filter(f=>!f.readOnly),body); await relations(entity,data);
                if(name==='Membership' && String(data.endDate)<String(data.startDate)) throw new InputError('종료일은 시작일 이후여야 합니다');
                if(name==='Lesson' && !(await db.query('SELECT id FROM Pass WHERE id=? AND studentId=?',[data.passId,data.studentId])).length) throw new InputError('해당 원생의 회차권을 선택하세요');
                if(entity.initialStatus) data.status=entity.initialStatus;
                const row={id:randomUUID(),...data}, keys=Object.keys(row);
                let condition=''; const args: Value[]=Object.values(row);
                if(name==='Booking') {condition=' WHERE (SELECT COUNT(*) FROM Booking WHERE sessionId=? AND status<>?) < (SELECT capacity FROM Session WHERE id=?) AND NOT EXISTS (SELECT 1 FROM Booking WHERE sessionId=? AND studentId=? AND status<>?)';args.push(data.sessionId,'cancelled',data.sessionId,data.sessionId,data.studentId,'cancelled');}
                const inserted=await db.query(`INSERT INTO ${table} (${keys.map(quote).join(',')}) SELECT ${keys.map(()=>'?').join(',')}${condition} RETURNING *`,args);
                if(!inserted.length) throw new InputError('정원이 찼거나 이미 예약한 클래스예요',409);
                return {status:201,data:inserted[0]};
            }
            if(!id) throw new InputError('대상을 선택하세요',404);
            const existing=(await db.query(`SELECT * FROM ${table} WHERE id=?`,[id]))[0];
            if(!existing) throw new InputError('기록을 찾을 수 없습니다',404);
            if(method==='PATCH'&&!actionId) {
                const data=validate(entity.fields.filter(f=>entity.editFields?.includes(f.name)),body,true);
                if(!Object.keys(data).length) throw new InputError('변경할 항목이 없습니다');
                await relations(entity,data);
                const changed=await db.query(`UPDATE ${table} SET ${Object.keys(data).map(k=>quote(k)+'=?').join(',')} WHERE id=? RETURNING *`,[...Object.values(data),id]);
                return {status:200,data:changed[0]};
            }
            const action=method==='POST'&&entity.actions?.find(a=>a.id===actionId);
            if(!action) throw new InputError('지원하지 않는 변경입니다',404);
            const data=validate(action.fields??[],body); data.status=action.to;
            if(name==='Tuition'&&action.id==='pay') data.paidDate=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
            let guard=`id=? AND status IN (${action.from.map(()=>'?').join(',')})`; const args: Value[]=[...Object.values(data),id,...action.from];
            if(name==='Lesson'&&action.id==='complete') {guard+=' AND (SELECT COUNT(*) FROM Lesson used WHERE used.passId=Lesson.passId AND used.status=?) < (SELECT totalSessions FROM Pass WHERE id=Lesson.passId)';args.push('completed');}
            const updated=await db.query(`UPDATE ${table} SET ${Object.keys(data).map(k=>quote(k)+'=?').join(',')} WHERE ${guard} RETURNING *`,args);
            if(!updated.length) throw new InputError('이미 처리되었거나 남은 회차가 없어요. 새로고침 후 확인하세요.',409);
            return {status:200,data:updated[0]};
        } catch(error) {
            if(error instanceof InputError) return {status:error.status,data:{error:error.message}};
            return {status:500,data:{error:'저장소 요청을 처리하지 못했어요. 잠시 후 다시 시도하세요.'}};
        }
    };
}
