'use client';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
export default function ErrorPage({reset}:{reset:()=>void}){return <div id="content"><Alert variant="destructive"><AlertTitle>불러오지 못했어요</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription></Alert><Button className="mt-4" onClick={reset}>다시 시도</Button></div>;}
