import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Suspense } from 'react';
import Link from 'next/link';
import { config } from '../src/academy-config.ts';
import { reader, readOnly } from '../src/runtime.ts';
import { EditorProvider } from '../components/editor-context.tsx';
import { Records } from '../components/records.tsx';
async function Dashboard(){
 const data=await(await reader()).overview(),entity=config.entities[config.primary]!;
 return <EditorProvider config={config} readOnly={readOnly()}><section className="metrics" aria-label="운영 현황">{data.metrics.map(metric=><Card className="metric" key={metric.label}><CardContent><div className="metric-label">{metric.label}</div><div className="metric-value">{metric.value}<span className="metric-unit">건</span></div></CardContent></Card>)}</section><div className="section-heading"><div><h2>{entity.label}</h2><p className="description">{entity.description}</p></div><Button variant="ghost" asChild><Link href={'/'+config.primary}>전체 보기 →</Link></Button></div><Records name={config.primary} entity={entity} rows={data.records.rows} readOnly={readOnly()}/><Alert className="quick-note"><AlertDescription>알림 발송·온라인 결제는 외부 서비스 연결이 필요해요.</AlertDescription></Alert></EditorProvider>;
}
export default function Page(){
 const entity=config.entities[config.primary]!;
 return <div id="content"><section className="hero"><div><div className="eyebrow">{config.eyebrow}</div><h1>{config.tagline}</h1><p className="description">{config.description}</p></div><div className="hero-art" aria-hidden="true"><span className="hero-symbol">{entity.icon}</span><span className="hero-caption">A GOOD DAY</span></div></section><Suspense fallback={<div role="status" aria-label="운영 현황을 불러오는 중"><Skeleton className="h-28 w-full"/></div>}><Dashboard/></Suspense></div>;
}
