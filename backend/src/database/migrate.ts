import { db, pool } from './connection';

const createTables = async () => {
  try {
    if (db) {
      // SQLite migrations
      console.log('Creating SQLite tables...');
      
      // Users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'atendente' CHECK (role IN ('admin', 'gestor', 'atendente')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Custom fields table
      db.exec(`
        CREATE TABLE IF NOT EXISTS custom_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'textarea')),
          options TEXT,
          required INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Leads table
      db.exec(`
        CREATE TABLE IF NOT EXISTS leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          status TEXT DEFAULT 'novo_lead' CHECK (status IN (
            'novo_lead',
            'em_contato',
            'proposta_enviada',
            'fechamento',
            'perdido'
          )),
          origin TEXT DEFAULT 'manual',
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          custom_data TEXT DEFAULT '{}',
          tags TEXT DEFAULT '[]',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Lead history table
      db.exec(`
        CREATE TABLE IF NOT EXISTS lead_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          description TEXT,
          old_status TEXT,
          new_status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);

      console.log('✅ SQLite tables created successfully');
    } else if (pool) {
      // PostgreSQL migrations
      console.log('Creating PostgreSQL tables...');
      
      // Users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'atendente' CHECK (role IN ('admin', 'gestor', 'atendente')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Custom fields table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS custom_fields (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'textarea')),
          options TEXT,
          required BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Leads table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255),
          status VARCHAR(50) DEFAULT 'novo_lead' CHECK (status IN (
            'novo_lead',
            'em_contato',
            'proposta_enviada',
            'fechamento',
            'perdido'
          )),
          origin VARCHAR(100) DEFAULT 'manual',
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          custom_data JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Lead history table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_history (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(100) NOT NULL,
          description TEXT,
          old_status VARCHAR(50),
          new_status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);

      console.log('✅ PostgreSQL tables created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

// Run migrations
createTables()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
