import { Skeleton } from '../components/ui/skeleton';
export default function Loading(){return <div id="content" role="status" aria-busy="true" aria-label="학원 공간을 불러오는 중"><Skeleton className="mb-6 h-10 w-48"/><Skeleton className="h-72 w-full"/></div>;}
