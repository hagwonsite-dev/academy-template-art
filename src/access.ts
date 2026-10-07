import { timingSafeEqual, createHash } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
export function authorize(headers: IncomingHttpHeaders, method: string, env: NodeJS.ProcessEnv = process.env): number {
    if (env.PUBLIC_DEMO === '1' && env.READ_ONLY === '1') return ['GET', 'HEAD', 'OPTIONS'].includes(method) ? 200 : 403;
    if (!env.APP_PASSWORD && env.VERCEL !== '1') return 200;
    if (!env.APP_PASSWORD) return 503;
    const expected = 'Basic ' + Buffer.from('admin:' + env.APP_PASSWORD).toString('base64');
    const digest = (value: string) => createHash('sha256').update(value).digest();
    if (!timingSafeEqual(digest(headers.authorization || ''), digest(expected))) return 401;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && headers.origin) {
        try { if (new URL(headers.origin).host !== headers.host) return 403; } catch { return 403; }
    }
    return 200;
}
