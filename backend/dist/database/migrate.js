"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
const createTables = async () => {
    try {
        if (connection_1.db) {
            // SQLite migrations
            console.log('Creating SQLite tables...');
            // Users table
            connection_1.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'scale')),
        plan_active INTEGER DEFAULT 1,
        max_collaborators INTEGER DEFAULT 2,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
            connection_1.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'atendente' CHECK (role IN ('admin', 'gestor', 'atendente')),
        company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
            try {
                connection_1.db.exec(`ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL`);
            }
            catch (error) {
                // Column already exists
            }
            connection_1.db.exec(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        purpose TEXT NOT NULL DEFAULT 'register',
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
            try {
                connection_1.db.exec(`ALTER TABLE email_verification_codes ADD COLUMN purpose TEXT NOT NULL DEFAULT 'register'`);
            }
            catch (error) {
                // Column already exists
            }
            // Custom fields table
            connection_1.db.exec(`
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
            connection_1.db.exec(`
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
          company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
          custom_data TEXT DEFAULT '{}',
          tags TEXT DEFAULT '[]',
          notes TEXT,
          deleted_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            try {
                connection_1.db.exec(`ALTER TABLE leads ADD COLUMN deleted_at DATETIME`);
            }
            catch (error) {
                // Column already exists
            }
            try {
                connection_1.db.exec(`ALTER TABLE leads ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL`);
            }
            catch (error) {
                // Column already exists
            }
            try {
                connection_1.db.exec(`ALTER TABLE leads ADD COLUMN funnel_id INTEGER REFERENCES funnels(id) ON DELETE SET NULL`);
            }
            catch (error) {
                // Column already exists
            }
            try {
                connection_1.db.exec(`
          UPDATE leads
          SET company_id = (
            SELECT company_id FROM users WHERE users.id = leads.user_id
          )
          WHERE company_id IS NULL AND user_id IS NOT NULL
        `);
            }
            catch (error) {
                // Best-effort backfill
            }
            // Lead whitelist table
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS lead_whitelist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name TEXT,
          phone TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_lead_whitelist_company ON lead_whitelist(company_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_lead_whitelist_user ON lead_whitelist(user_id)`);
            connection_1.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_whitelist_company_phone ON lead_whitelist(company_id, phone)`);
            connection_1.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_whitelist_user_phone ON lead_whitelist(user_id, phone)`);
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS funnels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          status_order TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_funnels_company ON funnels(company_id)`);
            // Lead history table
            connection_1.db.exec(`
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
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_funnel_id ON leads(funnel_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS openai_integrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          api_key TEXT NOT NULL,
          model TEXT,
          provider TEXT DEFAULT 'openai',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_openai_integrations_user_id ON openai_integrations(user_id)`);
            try {
                connection_1.db.exec(`ALTER TABLE openai_integrations ADD COLUMN provider TEXT DEFAULT 'openai'`);
            }
            catch (error) {
                // Column already exists
            }
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
          phone TEXT NOT NULL,
          message TEXT NOT NULL,
          scheduled_for DATETIME NOT NULL,
          status TEXT DEFAULT 'pending',
          sent_at DATETIME,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(user_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for)`);
            try {
                connection_1.db.exec(`ALTER TABLE scheduled_messages ADD COLUMN error_message TEXT`);
            }
            catch (error) {
                // Column already exists
            }
            console.log('✅ SQLite tables created successfully');
        }
        else if (connection_1.pool) {
            // PostgreSQL migrations
            console.log('Creating PostgreSQL tables...');
            // Users table
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          plan_type VARCHAR(20) NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'scale')),
          plan_active BOOLEAN DEFAULT true,
          max_collaborators INTEGER DEFAULT 2,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'atendente' CHECK (role IN ('admin', 'gestor', 'atendente')),
          company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            try {
                await connection_1.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL`);
            }
            catch (error) {
                // Column already exists
            }
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS email_verification_codes (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(20) NOT NULL,
          purpose VARCHAR(30) NOT NULL DEFAULT 'register',
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            try {
                await connection_1.pool.query(`ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS purpose VARCHAR(30) NOT NULL DEFAULT 'register'`);
            }
            catch (error) {
                // Column already exists
            }
            // Custom fields table
            await connection_1.pool.query(`
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
            await connection_1.pool.query(`
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
          company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
          custom_data JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          notes TEXT,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            try {
                await connection_1.pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
            }
            catch (error) {
                // Column already exists or table not created yet
            }
            try {
                await connection_1.pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL`);
            }
            catch (error) {
                // Column already exists or table not created yet
            }
            try {
                await connection_1.pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS funnel_id INTEGER REFERENCES funnels(id) ON DELETE SET NULL`);
            }
            catch (error) {
                // Column already exists or table not created yet
            }
            try {
                await connection_1.pool.query(`
          UPDATE leads
          SET company_id = users.company_id
          FROM users
          WHERE leads.company_id IS NULL AND leads.user_id = users.id
        `);
            }
            catch (error) {
                // Best-effort backfill
            }
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS lead_whitelist (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255),
          phone VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_lead_whitelist_company ON lead_whitelist(company_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_lead_whitelist_user ON lead_whitelist(user_id)`);
            await connection_1.pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_whitelist_company_phone ON lead_whitelist(company_id, phone)`);
            await connection_1.pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_whitelist_user_phone ON lead_whitelist(user_id, phone)`);
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS funnels (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          status_order JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_funnels_company ON funnels(company_id)`);
            // Lead history table
            await connection_1.pool.query(`
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
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_funnel_id ON leads(funnel_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS openai_integrations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          api_key TEXT NOT NULL,
          model VARCHAR(100),
          provider VARCHAR(50) DEFAULT 'openai',
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_openai_integrations_user_id ON openai_integrations(user_id)`);
            try {
                await connection_1.pool.query(`ALTER TABLE openai_integrations ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'openai'`);
            }
            catch (error) {
                // Column already exists or table not created yet
            }
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
          phone VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          scheduled_for TIMESTAMP NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          sent_at TIMESTAMP,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(user_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for)`);
            try {
                await connection_1.pool.query(`ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS error_message TEXT`);
            }
            catch (error) {
                // Column already exists or table not created yet
            }
            console.log('✅ PostgreSQL tables created successfully');
        }
    }
    catch (error) {
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
//# sourceMappingURL=migrate.js.map