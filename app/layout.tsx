import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import type { ReactNode, CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { config } from '../src/academy-config.ts';
import { readOnly, requireAccess } from '../src/runtime.ts';
import './globals.css';
export const metadata:Metadata={title:config.name+' · 운영 공간',description:config.description};
export const runtime='nodejs';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:ReactNode}){
 await requireAccess();
 const locked=readOnly(),demo=process.env.PUBLIC_DEMO==='1';
 return <html lang="ko"><body style={{'--primary':config.accent,'--ring':config.accent,'--secondary':config.tint,'--accent':config.tint,'--academy-color':config.accent,'--tint':config.tint} as CSSProperties}><div className="shell"><aside><Link className="brand" href="/" aria-label="대시보드"><span className="brand-mark">a.</span><span>{config.name}</span></Link><div className="workspace-label">ACADEMY WORKSPACE</div><Separator className="my-4"/><nav aria-label="주 메뉴"><Button variant="ghost" asChild><Link href="/" prefetch={false} data-feature="overview"><span className="nav-icon">⊞</span>대시보드</Link></Button>{Object.entries(config.entities).map(([name,entity])=><Button key={name} variant="ghost" asChild><Link href={'/'+name} prefetch={false} data-feature={name}><span className="nav-icon">{entity.icon}</span>{entity.label}</Link></Button>)}</nav><div className="sidebar-foot"><span className="online-dot"/>나만의 학원, 나만의 방식<div>작은 시작을 응원합니다.</div></div></aside><main><header><div className="breadcrumb">워크스페이스</div><div className="header-right"><span>{demo?'공개 체험':locked?'둘러보기':'학원 운영'}</span><Avatar><AvatarFallback>원</AvatarFallback></Avatar></div></header>{demo?<Alert className="demo-notice"><AlertDescription>{locked?'공개 예시 · 가상의 샘플 데이터를 둘러보세요.':'공개 체험 · 등록·수정한 내용은 모든 방문자와 공유됩니다. 가상의 정보로 체험해 주세요.'}</AlertDescription></Alert>:null}{children}<footer>내 학원에 맞게 바꾸고, 더 많은 가능성을 만들어 보세요.</footer></main></div></body></html>;
}
