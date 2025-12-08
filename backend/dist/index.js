"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./database/connection");
const auth_1 = __importDefault(require("./routes/auth"));
const leads_1 = __importDefault(require("./routes/leads"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const customFields_1 = __importDefault(require("./routes/customFields"));
const integrations_1 = __importDefault(require("./routes/integrations"));
const tiktok_1 = __importDefault(require("./routes/tiktok"));
const facebook_1 = __importDefault(require("./routes/facebook"));
const instagram_1 = __importDefault(require("./routes/instagram"));
dotenv_1.default.config();
// Initialize database tables on startup
const initializeDatabase = async () => {
    try {
        if (connection_1.db) {
            // SQLite - create tables if they don't exist
            console.log('Initializing SQLite database...');
            connection_1.db.exec(`
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
          custom_data TEXT DEFAULT '{}',
          tags TEXT DEFAULT '[]',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
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
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);
            // TikTok Integrations table
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS tiktok_integrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          advertiser_id TEXT NOT NULL,
          expires_at DATETIME,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_user_id ON tiktok_integrations(user_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_advertiser_id ON tiktok_integrations(advertiser_id)`);
            // Facebook Integrations table
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS facebook_integrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          access_token TEXT NOT NULL,
          page_id TEXT NOT NULL,
          page_name TEXT,
          expires_at DATETIME,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_user_id ON facebook_integrations(user_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_page_id ON facebook_integrations(page_id)`);
            // Instagram Integrations table
            connection_1.db.exec(`
        CREATE TABLE IF NOT EXISTS instagram_integrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          access_token TEXT NOT NULL,
          instagram_account_id TEXT NOT NULL,
          instagram_username TEXT,
          expires_at DATETIME,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_user_id ON instagram_integrations(user_id)`);
            connection_1.db.exec(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_account_id ON instagram_integrations(instagram_account_id)`);
            console.log('✅ SQLite database initialized');
        }
        else if (connection_1.pool) {
            // PostgreSQL - create tables if they don't exist
            console.log('Initializing PostgreSQL database...');
            await connection_1.pool.query(`
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
          custom_data JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
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
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);
            // TikTok Integrations table
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS tiktok_integrations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          advertiser_id VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_user_id ON tiktok_integrations(user_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_advertiser_id ON tiktok_integrations(advertiser_id)`);
            // Facebook Integrations table
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS facebook_integrations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL,
          page_id VARCHAR(255) NOT NULL,
          page_name VARCHAR(255),
          expires_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_user_id ON facebook_integrations(user_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_page_id ON facebook_integrations(page_id)`);
            // Instagram Integrations table
            await connection_1.pool.query(`
        CREATE TABLE IF NOT EXISTS instagram_integrations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL,
          instagram_account_id VARCHAR(255) NOT NULL,
          instagram_username VARCHAR(255),
          expires_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_user_id ON instagram_integrations(user_id)`);
            await connection_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_account_id ON instagram_integrations(instagram_account_id)`);
            console.log('✅ PostgreSQL database initialized');
        }
    }
    catch (error) {
        console.error('❌ Error initializing database:', error);
        // Don't throw - let the server start anyway
    }
};
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Initialize database before starting server (aguardar conclusao)
initializeDatabase().catch(err => {
    console.error('❌ Failed to initialize database:', err);
});
// Middleware - CORS configurado para aceitar requisições do domínio de produção
const corsOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'https://biacrm.com',
    'http://biacrm.com',
    'https://www.biacrm.com',
    'http://www.biacrm.com'
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (corsOrigins.includes(origin) || corsOrigins.some(allowed => origin && origin.includes(allowed))) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permitir todas as origens em produção por enquanto
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', async (req, res) => {
    try {
        await (0, connection_1.query)('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    }
    catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/custom-fields', customFields_1.default);
app.use('/api/integrations', integrations_1.default);
app.use('/api/integrations/tiktok', tiktok_1.default);
app.use('/api/integrations/facebook', facebook_1.default);
app.use('/api/integrations/instagram', instagram_1.default);
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map