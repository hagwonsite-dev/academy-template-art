// The isolated legacy checker supplies TypeScript without installing app dependencies.
// Keep the narrow driver contract available there; standalone deployment installs the package.
declare module '@neondatabase/serverless' {
    export function neon(uri: string): { query(text: string, values?: unknown[]): Promise<Record<string, unknown>[]> };
}
