const Database = require('better-sqlite3');

const db = new Database('database.sqlite');
const rows = db
  .prepare("SELECT id, email, role, created_at FROM users WHERE lower(email) LIKE 'bnovais%@yahoo.%'")
  .all();
console.log(rows);
