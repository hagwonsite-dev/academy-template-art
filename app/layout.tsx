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
 const locked=readOnly();
 return <html lang="ko"><body style={{'--accent':config.accent,'--tint':config.tint} as CSSProperties}><div className="shell"><aside><Link className="brand" href="/" aria-label="대시보드"><span className="brand-mark">a.</span><span>{config.name}</span></Link><div className="workspace-label">ACADEMY WORKSPACE</div><nav aria-label="주 메뉴"><Link href="/" prefetch={false} data-feature="overview"><span className="nav-icon">⊞</span>대시보드</Link>{Object.entries(config.entities).map(([name,entity])=><Link key={name} href={'/'+name} prefetch={false} data-feature={name}><span className="nav-icon">{entity.icon}</span>{entity.label}</Link>)}</nav><div className="sidebar-foot"><span className="online-dot"/>나만의 학원, 나만의 방식<div>작은 시작을 응원합니다.</div></div></aside><main><header><div className="breadcrumb">워크스페이스</div><div className="header-right"><span>{locked?'샘플 둘러보기':'학원 운영'}</span><span className="avatar">원</span></div></header>{locked?<div className="demo-notice">공개 예시 · 가상의 샘플 데이터입니다. 내 학원으로 가져가면 등록·변경 기능을 사용할 수 있어요.</div>:null}{children}<footer>내 학원에 맞게 바꾸고, 더 많은 가능성을 만들어 보세요.</footer></main></div></body></html>;
}
