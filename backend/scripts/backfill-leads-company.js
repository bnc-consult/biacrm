const Database = require('better-sqlite3');
const { Client } = require('pg');

const getDatabaseUrl = () => {
  const raw = process.env.DATABASE_URL || '';
  if (raw && raw.trim()) return raw.trim();
  return 'sqlite:./database.sqlite';
};

const isSqliteUrl = (url) => url.startsWith('sqlite:');
const getSqlitePath = (url) => {
  const rawPath = url.replace(/^sqlite:/, '');
  return rawPath && rawPath.trim() ? rawPath : './database.sqlite';
};

const backfillSqlite = (dbPath) => {
  const db = new Database(dbPath);
  try {
    const update = db.prepare(
      `UPDATE leads
       SET company_id = (
         SELECT company_id FROM users WHERE users.id = leads.user_id
       )
       WHERE company_id IS NULL AND user_id IS NOT NULL`
    );
    const result = update.run();
    const remaining = db
      .prepare('SELECT COUNT(*) as count FROM leads WHERE company_id IS NULL')
      .get();
    const total = db.prepare('SELECT COUNT(*) as count FROM leads').get();
    console.log('Backfill concluído (SQLite).');
    console.log({
      database: dbPath,
      updated: result.changes || 0,
      remaining_without_company: remaining ? remaining.count : 0,
      total_leads: total ? total.count : 0
    });
  } finally {
    db.close();
  }
};

const backfillPostgres = async (url) => {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const update = await client.query(
      `UPDATE leads
       SET company_id = users.company_id
       FROM users
       WHERE leads.company_id IS NULL
         AND leads.user_id = users.id`
    );
    const remaining = await client.query('SELECT COUNT(*) as count FROM leads WHERE company_id IS NULL');
    const total = await client.query('SELECT COUNT(*) as count FROM leads');
    console.log('Backfill concluído (PostgreSQL).');
    console.log({
      database: 'postgres',
      updated: update.rowCount || 0,
      remaining_without_company: Number(remaining.rows?.[0]?.count || 0),
      total_leads: Number(total.rows?.[0]?.count || 0)
    });
  } finally {
    await client.end();
  }
};

const run = async () => {
  const databaseUrl = getDatabaseUrl();
  if (isSqliteUrl(databaseUrl)) {
    const dbPath = getSqlitePath(databaseUrl);
    backfillSqlite(dbPath);
    return;
  }
  await backfillPostgres(databaseUrl);
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro no backfill:', error);
    process.exit(1);
  });
