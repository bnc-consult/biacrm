import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, db, pool } from './database/connection';
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import dashboardRoutes from './routes/dashboard';
import customFieldRoutes from './routes/customFields';
import integrationRoutes from './routes/integrations';
import tiktokRoutes from './routes/tiktok';
import facebookRoutes from './routes/facebook';
import instagramRoutes from './routes/instagram';

dotenv.config();

// Initialize database tables on startup
const initializeDatabase = async () => {
  try {
    if (db) {
      // SQLite - create tables if they don't exist
      console.log('Initializing SQLite database...');
      
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

      db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);

      // TikTok Integrations table
      db.exec(`
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

      db.exec(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_user_id ON tiktok_integrations(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_advertiser_id ON tiktok_integrations(advertiser_id)`);

      // Facebook Integrations table
      db.exec(`
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

      db.exec(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_user_id ON facebook_integrations(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_page_id ON facebook_integrations(page_id)`);

      // Instagram Integrations table
      db.exec(`
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

      db.exec(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_user_id ON instagram_integrations(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_account_id ON instagram_integrations(instagram_account_id)`);

      // WhatsApp Messages table
      db.exec(`
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          wa_message_id TEXT,
          phone TEXT NOT NULL,
          text TEXT NOT NULL,
          media_url TEXT,
          media_type TEXT,
          direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone)`);
      try {
        db.exec(`ALTER TABLE whatsapp_messages ADD COLUMN media_url TEXT`);
      } catch (error) {
        // Column already exists
      }
      try {
        db.exec(`ALTER TABLE whatsapp_messages ADD COLUMN media_type TEXT`);
      } catch (error) {
        // Column already exists
      }
      try {
        db.exec(`ALTER TABLE whatsapp_messages ADD COLUMN is_read INTEGER DEFAULT 0`);
      } catch (error) {
        // Column already exists
      }

      console.log('✅ SQLite database initialized');
    } else if (pool) {
      // PostgreSQL - create tables if they don't exist
      console.log('Initializing PostgreSQL database...');
      
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

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id)`);

      // TikTok Integrations table
      await pool.query(`
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

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_user_id ON tiktok_integrations(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_tiktok_integrations_advertiser_id ON tiktok_integrations(advertiser_id)`);

      // Facebook Integrations table
      await pool.query(`
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

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_user_id ON facebook_integrations(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_facebook_integrations_page_id ON facebook_integrations(page_id)`);

      // Instagram Integrations table
      await pool.query(`
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

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_user_id ON instagram_integrations(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_instagram_integrations_account_id ON instagram_integrations(instagram_account_id)`);

      // WhatsApp Messages table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          wa_message_id VARCHAR(255),
          phone VARCHAR(50) NOT NULL,
          text TEXT NOT NULL,
          media_url TEXT,
          media_type TEXT,
          direction VARCHAR(10) NOT NULL CHECK (direction IN ('in', 'out')),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone)`);
      try {
        await pool.query(`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS media_url TEXT`);
        await pool.query(`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS media_type TEXT`);
      } catch (error) {
        // Column already exists or table not created yet
      }
      try {
        await pool.query(`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
      } catch (error) {
        // Column already exists or table not created yet
      }

      console.log('✅ PostgreSQL database initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    // Don't throw - let the server start anyway
  }
};

const app = express();
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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin) || corsOrigins.some(allowed => origin && origin.includes(allowed))) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todas as origens em produção por enquanto
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/media/whatsapp', express.static(path.join(process.cwd(), 'whatsapp_media')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/integrations/tiktok', tiktokRoutes);
app.use('/api/integrations/facebook', facebookRoutes);
app.use('/api/integrations/instagram', instagramRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

