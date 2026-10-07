import { Suspense } from 'react';
import Link from 'next/link';
import { config } from '../src/academy-config.ts';
import { reader, readOnly } from '../src/runtime.ts';
import { EditorProvider } from '../components/editor-context.tsx';
import { Records } from '../components/records.tsx';
async function Dashboard(){
 const data=await(await reader()).overview(),entity=config.entities[config.primary]!;
 return <EditorProvider config={config} readOnly={readOnly()}><section className="metrics" aria-label="운영 현황">{data.metrics.map(metric=><div className="metric" key={metric.label}><div className="metric-label">{metric.label}</div><div className="metric-value">{metric.value}<span className="metric-unit">건</span></div></div>)}</section><div className="section-heading"><div><h2>{entity.label}</h2><p className="description">{entity.description}</p></div><Link className="text-button" href={'/'+config.primary}>전체 보기 →</Link></div><Records name={config.primary} entity={entity} rows={data.records.rows}/><div className="quick-note">알림 발송·온라인 결제는 외부 서비스 연결이 필요해요.</div></EditorProvider>;
}
export default function Page(){
 const entity=config.entities[config.primary]!;
 return <div id="content"><section className="hero"><div><div className="eyebrow">{config.eyebrow}</div><h1>{config.tagline}</h1><p className="description">{config.description}</p></div><div className="hero-art" aria-hidden="true"><span className="hero-symbol">{entity.icon}</span><span className="hero-caption">A GOOD DAY</span></div></section><Suspense fallback={<p role="status">운영 현황을 불러오는 중…</p>}><Dashboard/></Suspense></div>;
}
