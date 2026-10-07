const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
let config,current='overview',version=0,search='',statusFilter='',activeRows=[],lookups={},dialogTask;
async function api(path,method='GET',body) {
    const response=await fetch('/api/'+path,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
    let data;try{data=await response.json();}catch{throw Error('서버 응답을 읽지 못했어요. 잠시 후 다시 시도하세요.');}
    if(!response.ok)throw Error(data.error||'요청을 처리하지 못했어요');return data;
}
function button(text,cls,handler){const b=el('button',text,cls);b.type='button';b.onclick=handler;return b;}
function labelFor(name,row,field){const value=row[field.name];if(field.relation)return lookups[field.relation]?.find(r=>r.id===value)?.name||lookups[field.relation]?.find(r=>r.id===value)?.title||'미지정';if(field.options)return field.options.find(o=>o.value===value)?.label||value;if(field.name==='amount'&&value!==null)return Number(value).toLocaleString('ko-KR')+'원';return value??'—';}
function pill(entity,row){const f=entity.fields.find(f=>f.name==='status');return f?el('span',labelFor('',row,f),'pill'+(['cancelled','absent','unpaid'].includes(row.status)?' muted':'')):null;}
function controls(name,row){const entity=config.entities[name],bar=el('div',undefined,'card-footer');
    if(entity.editFields?.length){const b=button('수정','action',()=>openEditor(name,row));b.disabled=config.readOnly;bar.append(b);}
    for(const action of entity.actions||[])if(action.from.includes(row.status)){const b=button(action.label,'action',async()=>{
        if(action.fields?.length){openEditor(name,row,action);return;}
        b.disabled=true;try{await api(`${name}/${row.id}/${action.id}`,'POST',{});await load(current);}catch(e){$('message').textContent=e.message;}finally{b.disabled=config.readOnly;}
    });b.disabled=config.readOnly;bar.append(b);}
    return bar;
}
function progress(parent,value,total,label){const remain=el('div',undefined,'remaining');remain.append(el('span',label),el('strong',`${value} / ${total}`));parent.append(remain);const track=el('div',undefined,'progress-track'),fill=el('div',undefined,'progress-fill');fill.style.width=Math.max(0,Math.min(100,Number(value)/Number(total)*100))+'%';track.append(fill);parent.append(track);}
function card(name,row){const entity=config.entities[name],article=el('article',undefined,'record-card');
    if(entity.layout==='gallery'){const cover=el('div',undefined,'artwork');if(row.imageUrl){const img=el('img');img.src=row.imageUrl;img.alt=row.title;img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>cover.replaceChildren(el('div',undefined,'artwork-placeholder'));cover.append(img);}else cover.append(el('div',undefined,'artwork-placeholder'));article.append(cover);}
    if(entity.layout==='schedule'){const time=el('div',row.time||row.date?.slice(5),'schedule-time');time.append(el('small',row.time?row.date:'수업 예정'));article.append(time);}
    const body=el('div',undefined,'card-body'),top=el('div',undefined,'card-top');
    const student=entity.fields.find(f=>f.relation==='Student');top.append(el('span',student?labelFor(name,row,student):row.date||row.dueDate||entity.label));const state=pill(entity,row);if(state)top.append(state);body.append(top);
    const title=row.title||row.name||(student?labelFor(name,row,student)+' · '+(row.teacher||'레슨'):entity.label);body.append(el('h3',title));
    const hide=new Set(['title','name','status','imageUrl','studentId']);if(entity.layout==='schedule'){hide.add('date');hide.add('time');}
    for(const f of entity.fields){if(hide.has(f.name)||row[f.name]===null||row[f.name]===undefined||f.name==='totalSessions'||f.name==='capacity')continue;body.append(el('p',f.label+' · '+labelFor(name,row,f),'card-detail'));}
    if(name==='Pass')progress(body,row.remaining,row.totalSessions,'남은 레슨');
    if(name==='Session'){progress(body,row.booked,row.capacity,'예약 현황');const reserve=button('이 클래스 예약','action',()=>openEditor('Booking',undefined,undefined,{sessionId:row.id}));reserve.disabled=config.readOnly;body.append(reserve);}
    const buttons=controls(name,row);if(buttons.childNodes.length)body.append(buttons);article.append(body);return article;
}
function renderRecords(target,name,rows){const entity=config.entities[name];target.replaceChildren();
    if(!rows.length){target.append(el('div',search||statusFilter?'조건에 맞는 기록이 없어요. 검색어나 필터를 바꿔보세요.':'아직 기록이 없어요. 첫 기록을 등록해 보세요.','empty'));return;}
    if(entity.layout==='table'){const wrap=el('div',undefined,'table-wrap'),table=el('table'),head=el('thead'),tr=el('tr');entity.fields.forEach(f=>tr.append(el('th',f.label)));tr.append(el('th','관리'));head.append(tr);const body=el('tbody');for(const row of rows){const tr=el('tr');for(const f of entity.fields){const td=el('td');if(f.name==='status')td.append(pill(entity,row));else td.textContent=labelFor(name,row,f);tr.append(td);}const td=el('td');td.append(controls(name,row));tr.append(td);body.append(tr);}table.append(head,body);wrap.append(table);target.append(wrap);return;}
    if(entity.layout==='board'){const board=el('div',undefined,'board');for(const state of entity.fields.find(f=>f.name==='status').options){const col=el('section',undefined,'board-column'),group=rows.filter(r=>r.status===state.value);col.append(el('h3',state.label+' · '+group.length,'board-heading'));for(const row of group)col.append(card(name,row));if(!group.length)col.append(el('p','기록이 없어요','card-detail'));board.append(col);}target.append(board);return;}
    const grid=el('div',undefined,entity.layout==='schedule'?'schedule':entity.layout==='gallery'?'gallery':'cards');rows.forEach(row=>grid.append(card(name,row)));target.append(grid);
}
function heading(title,description,name){const wrapper=el('div',undefined,'section-heading'),copy=el('div');copy.append(el('h2',title));if(description)copy.append(el('p',description,'description'));wrapper.append(copy);if(name){const b=button('+ 새로 등록','primary',()=>openEditor(name));b.disabled=config.readOnly;wrapper.append(b);}return wrapper;}
async function load(feature){const request=++version;current=feature;search='';statusFilter='';$('message').textContent='불러오는 중…';$('content').setAttribute('aria-busy','true');
    try{const name=feature==='overview'?config.primary:feature,entity=config.entities[name];
        const relations=[...new Set(entity.fields.filter(f=>f.relation).map(f=>f.relation))];
        const [result,...related]=await Promise.all([api(feature),...relations.map(r=>api(r))]);
        if(request!==version)return;lookups=Object.fromEntries(relations.map((r,i)=>[r,related[i]]));
        const content=el('div');
        if(feature==='overview'){
            Object.assign(lookups,result.lists);const hero=el('section',undefined,'hero'),copy=el('div');copy.append(el('div',config.eyebrow,'eyebrow'),el('h1',config.tagline),el('p',config.description,'description'));const art=el('div',undefined,'hero-art');art.setAttribute('aria-hidden','true');art.append(el('span',entity.icon,'hero-symbol'),el('span','A GOOD DAY','hero-caption'));hero.append(copy,art);content.append(hero);
            const metrics=el('section',undefined,'metrics');metrics.setAttribute('aria-label','운영 현황');for(const metric of result.metrics){const c=el('div',undefined,'metric');c.append(el('div',metric.label,'metric-label'));const n=el('div',String(metric.value),'metric-value');n.append(el('span','건','metric-unit'));c.append(n);metrics.append(c);}content.append(metrics);
            const h=heading(entity.label,entity.description);h.append(button('전체 보기 →','text-button',()=>load(name)));content.append(h);const records=el('div');renderRecords(records,name,result.lists[name].slice(0,6));content.append(records,el('div',config.readOnly?'이 공간의 이름과 데이터는 모두 샘플입니다. 내 학원으로 가져가면 직접 등록하고 운영할 수 있어요.':'메뉴에서 기록을 추가하고 운영 흐름을 이어가세요. 알림 발송·온라인 결제는 외부 서비스 연결이 필요해요.','quick-note'));
        }else{
            content.append(heading(entity.label,entity.description,name));activeRows=result;
            const toolbar=el('div',undefined,'toolbar'),input=el('input');input.type='search';input.placeholder='이름이나 내용으로 검색';input.setAttribute('aria-label','기록 검색');toolbar.append(input);const state=entity.fields.find(f=>f.name==='status');let select;
            if(state){select=el('select');select.setAttribute('aria-label','상태 필터');select.append(new Option('모든 상태',''));state.options.forEach(o=>select.append(new Option(o.label,o.value)));toolbar.append(select);}
            const count=el('span',undefined,'count'),records=el('div');toolbar.append(count);content.append(toolbar,records);
            const filter=()=>{const rows=activeRows.filter(row=>(!statusFilter||row.status===statusFilter)&&entity.fields.some(f=>String(labelFor(name,row,f)).toLowerCase().includes(search.toLowerCase())));count.textContent=rows.length+'개 기록';renderRecords(records,name,rows);};input.oninput=()=>{search=input.value.trim();filter();};if(select)select.onchange=()=>{statusFilter=select.value;filter();};filter();
        }
        $('content').replaceChildren(content);$('message').textContent='';$('breadcrumb').textContent='워크스페이스 / '+(feature==='overview'?'대시보드':entity.label);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.feature===feature));
    }catch(e){if(request===version){$('message').replaceChildren(el('span',e.message),button('다시 시도','text-button',()=>load(feature)));}}
    finally{if(request===version)$('content').setAttribute('aria-busy','false');}
}
async function openEditor(name,row,action,prefill={}){if(config.readOnly)return;
    const entity=config.entities[name],fields=action?.fields||(row?entity.fields.filter(f=>entity.editFields?.includes(f.name)):entity.fields.filter(f=>!f.readOnly));
    try{const relations=[...new Set(fields.filter(f=>f.relation).map(f=>f.relation))],data=await Promise.all(relations.map(r=>api(r)));const options=Object.fromEntries(relations.map((r,i)=>[r,data[i]]));
        $('editor-title').textContent=action?.label||entity.label+(row?' 수정':' 등록');$('form-error').textContent='';$('form-fields').replaceChildren();const inputs={};
        for(const f of fields){const label=el('label',f.label,f.type==='textarea'?'wide':undefined),input=el(f.relation||f.options?'select':f.type==='textarea'?'textarea':'input');input.name=f.name;input.required=Boolean(f.required);if(input.tagName==='INPUT')input.type=f.type==='number'?'number':f.type==='date'?'date':f.type==='time'?'time':f.type==='url'?'url':'text';
            if(f.type==='number'){input.min=String(f.min??0);input.max=String(f.max??10000000);input.step='1';}
            if(f.relation||f.options){input.append(new Option('선택하세요',''));for(const item of f.relation?options[f.relation]:f.options)input.append(new Option(item.label||item.name||item.title,item.value||item.id));}
            input.value=row?.[f.name]??prefill[f.name]??'';inputs[f.name]=input;label.append(input);$('form-fields').append(label);
        }
        if(name==='Lesson'&&inputs.passId&&inputs.studentId){const update=()=>{const previous=inputs.passId.value;inputs.passId.replaceChildren(new Option('회차권 선택',''));for(const pass of options.Pass.filter(p=>p.studentId===inputs.studentId.value))inputs.passId.append(new Option(pass.title+' · 잔여 '+pass.remaining+'회',pass.id));inputs.passId.value=previous;};inputs.studentId.onchange=update;update();}
        dialogTask={path:action?`${name}/${row.id}/${action.id}`:row?`${name}/${row.id}`:name,method:row&&!action?'PATCH':'POST',fields};$('save').disabled=false;$('editor').showModal();
    }catch(e){$('message').textContent=e.message;}
}
$('close-editor').onclick=$('cancel-editor').onclick=()=>$('editor').close();
$('edit-form').onsubmit=async event=>{event.preventDefault();if(!dialogTask)return;const task=dialogTask;$('save').disabled=true;$('form-error').textContent='';try{const values=Object.fromEntries(new FormData($('edit-form')));await api(task.path,task.method,values);$('editor').close();await load(current);}catch(e){$('form-error').textContent=e.message;}finally{$('save').disabled=false;}};
async function boot(){try{config=await api('config');document.title=config.name+' · 운영 공간';document.documentElement.style.setProperty('--accent',config.accent);document.documentElement.style.setProperty('--tint',config.tint);$('brand-name').textContent=config.name;if(config.readOnly){$('mode').textContent='샘플 둘러보기';$('notice').hidden=false;$('notice').textContent='공개 예시 · 가상의 샘플 데이터입니다. 내 학원으로 가져가면 등록·변경 기능을 사용할 수 있어요.';}const items=[['overview',{label:'대시보드',icon:'⊞'}],...Object.entries(config.entities)];$('nav').replaceChildren();for(const [id,item]of items){const b=button('','',()=>load(id));b.dataset.feature=id;b.append(el('span',item.icon,'nav-icon'),el('span',item.label));$('nav').append(b);}await load('overview');}catch(e){$('message').replaceChildren(el('span',e.message),button('다시 시도','text-button',boot));$('content').setAttribute('aria-busy','false');}}
await boot();
