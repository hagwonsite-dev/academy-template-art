// The legacy isolated checker runs without installing application dependencies.
declare module '@libsql/client' {
    export function createClient(options: { url: string; authToken?: string }): {
        execute(statement: { sql: string; args: import('node:sqlite').SQLInputValue[] }): Promise<{ rows: Record<string, unknown>[] }>;
        close(): void;
    };
}
