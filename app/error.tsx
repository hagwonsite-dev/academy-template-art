'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div id="content" role="alert"><h2>불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p><button className="primary" onClick={reset}>다시 시도</button></div>;}
