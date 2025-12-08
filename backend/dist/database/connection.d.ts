import { Pool } from 'pg';
import Database from 'better-sqlite3';
declare let db: Database.Database | null;
declare let pool: Pool | null;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any> | {
    rows: any[];
}>;
export { pool };
export { db };
//# sourceMappingURL=connection.d.ts.map