import { Pool } from 'pg';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:./database.sqlite';

// Check if using SQLite
let db: Database.Database | null = null;
let pool: Pool | null = null;

if (DATABASE_URL.startsWith('sqlite:') || !DATABASE_URL || DATABASE_URL === '') {
  // Use SQLite
  const dbPath = DATABASE_URL && DATABASE_URL !== '' ? DATABASE_URL.replace('sqlite:', '') : './database.sqlite';
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('✅ SQLite database connected:', dbPath);
  } catch (error: any) {
    console.error('❌ Error creating SQLite database:', error.message);
    console.error('Database path:', dbPath);
    console.error('Current working directory:', process.cwd());
    // Try to create parent directory if needed
    const path = require('path');
    const fs = require('fs');
    const fullPath = path.resolve(dbPath);
    const dir = path.dirname(fullPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('Created directory:', dir);
      }
      // Try again
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      console.log('✅ SQLite database created successfully:', dbPath);
    } catch (retryError: any) {
      console.error('❌ Failed to create database after retry:', retryError.message);
      throw retryError;
    }
  }
} else {
  // Use PostgreSQL
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.on('connect', () => {
    console.log('✅ PostgreSQL database connected');
  });

  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
  });
}

// Convert PostgreSQL placeholders ($1, $2) to SQLite placeholders (?)
const convertPlaceholders = (sql: string): string => {
  if (db) {
    // SQLite - convert $1, $2, etc to ?
    let converted = sql;
    let paramIndex = 1;
    while (converted.includes(`$${paramIndex}`)) {
      converted = converted.replace(new RegExp(`\\$${paramIndex}`, 'g'), '?');
      paramIndex++;
    }
    return converted;
  }
  return sql;
};

// Export a unified query function
export const query = async (text: string, params?: any[]) => {
  const sql = convertPlaceholders(text);
  
  if (db) {
    // SQLite
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(params || []);
        return { rows: rows as any[] };
      } else {
        const stmt = db.prepare(sql);
        const result = stmt.run(params || []);
        // For INSERT, return the inserted row
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
          const lastId = result.lastInsertRowid;
          if (lastId) {
            const match = sql.match(/INSERT INTO\s+(\w+)/i);
            const tableName = match && match[1];
            if (tableName) {
              const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
              const insertedRow = selectStmt.get(lastId);
              return { rows: [{ ...(result as any), ...(insertedRow as any), lastInsertRowid: lastId }] };
            }
          }
        }
        return { rows: [{ ...result }] };
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  } else if (pool) {
    // PostgreSQL
    return await pool.query(sql, params);
  } else {
    throw new Error('No database connection available');
  }
};

// Export for compatibility
export { pool };

// Export SQLite db for migrations
export { db };
