import express from 'express';
import { query, db, pool } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

const DEFAULT_STATUS_ORDER = [
  'novo_lead',
  'em_contato',
  'visita_agendada',
  'visita_concluida',
  'proposta',
  'venda_ganha',
  'perdido'
];

const getUserContext = async (userId?: number | null) => {
  if (!userId) {
    return { isAdmin: false, companyId: null as number | null };
  }
  const result = await query('SELECT id, role, company_id FROM users WHERE id = $1', [userId]);
  const row = result.rows && result.rows[0];
  const normalizedRole = String(row?.role || '').toLowerCase();
  return {
    isAdmin: normalizedRole === 'admin',
    companyId: row?.company_id ? Number(row.company_id) : null
  };
};

const ensureAdmin = (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autenticado' });
    return false;
  }
  const normalizedRole = String(req.user.role || '').toLowerCase();
  if (normalizedRole !== 'admin') {
    res.status(403).json({ message: 'Acesso permitido apenas para administradores.' });
    return false;
  }
  return true;
};

const parseStatusOrder = (value: any) => {
  if (Array.isArray(value)) return value;
  if (!value) return DEFAULT_STATUS_ORDER;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : DEFAULT_STATUS_ORDER;
  } catch (error) {
    return DEFAULT_STATUS_ORDER;
  }
};

const ensureFunnelsTable = async () => {
  if (db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS funnels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        status_order TEXT,
        is_primary INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_funnels_company ON funnels(company_id)`);
    try {
      db.exec(`ALTER TABLE funnels ADD COLUMN is_primary INTEGER DEFAULT 0`);
    } catch (error) {
      // Column already exists
    }
    return;
  }
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS funnels (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status_order JSONB,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_funnels_company ON funnels(company_id)`);
    try {
      await pool.query(`ALTER TABLE funnels ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false`);
    } catch (error) {
      // Column already exists
    }
  }
};

const ensurePrimaryFunnel = async (companyId: number) => {
  const current = await query(
    'SELECT id FROM funnels WHERE company_id = $1 AND is_primary = $2 LIMIT 1',
    [companyId, 1]
  );
  if (current.rows && current.rows[0]) {
    return Number(current.rows[0].id);
  }
  const first = await query(
    'SELECT id FROM funnels WHERE company_id = $1 ORDER BY id LIMIT 1',
    [companyId]
  );
  const firstId = first.rows && first.rows[0] ? Number(first.rows[0].id) : null;
  if (firstId) {
    await query(
      'UPDATE funnels SET is_primary = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3',
      [1, firstId, companyId]
    );
  }
  return firstId;
};

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureFunnelsTable();
    const currentUserId = req.user?.id ? Number(req.user.id) : null;
    const context = await getUserContext(currentUserId);
    if (!context.companyId) {
      return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
    }

    const result = await query(
      'SELECT id, name, status_order, is_primary FROM funnels WHERE company_id = $1 ORDER BY id',
      [context.companyId]
    );
    let rows = result.rows || [];
    if (rows.length === 0) {
      const insert = await query(
        'INSERT INTO funnels (company_id, name, status_order, is_primary) VALUES ($1, $2, $3, $4)',
        [context.companyId, 'Funil 1', JSON.stringify(DEFAULT_STATUS_ORDER), 1]
      );
      const insertedId = insert.rows?.[0]?.lastInsertRowid || insert.rows?.[0]?.id;
      rows = [
        {
          id: insertedId,
          name: 'Funil 1',
          status_order: JSON.stringify(DEFAULT_STATUS_ORDER),
          is_primary: 1
        }
      ];
    } else {
      const hasPrimary = rows.some((row: any) => Number(row.is_primary) === 1);
      if (!hasPrimary) {
        const primaryId = await ensurePrimaryFunnel(context.companyId);
        rows = rows.map((row: any) => ({
          ...row,
          is_primary: Number(row.id) === Number(primaryId) ? 1 : 0
        }));
      }
    }

    const parsed = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      statusOrder: parseStatusOrder(row.status_order),
      isPrimary: Number(row.is_primary) === 1
    }));
    res.json(parsed);
  } catch (error: any) {
    console.error('Get funnels error:', error);
    res.status(500).json({ message: error.message || 'Erro ao carregar funis.' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureFunnelsTable();
    if (!ensureAdmin(req, res)) return;
    const currentUserId = req.user?.id ? Number(req.user.id) : null;
    const context = await getUserContext(currentUserId);
    if (!context.companyId) {
      return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
    }
    const countResult = await query(
      'SELECT COUNT(*) as count FROM funnels WHERE company_id = $1',
      [context.companyId]
    );
    const count = Number(countResult.rows?.[0]?.count || 0);
    const name = `Funil ${count + 1}`;
    const isPrimary = count === 0 ? 1 : 0;
    const insert = await query(
      'INSERT INTO funnels (company_id, name, status_order, is_primary) VALUES ($1, $2, $3, $4)',
      [context.companyId, name, JSON.stringify(DEFAULT_STATUS_ORDER), isPrimary]
    );
    const insertedId = insert.rows?.[0]?.lastInsertRowid || insert.rows?.[0]?.id;
    res.json({
      id: insertedId,
      name,
      statusOrder: DEFAULT_STATUS_ORDER,
      isPrimary: isPrimary === 1
    });
  } catch (error: any) {
    console.error('Create funnel error:', error);
    res.status(500).json({ message: error.message || 'Erro ao criar funil.' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureFunnelsTable();
    if (!ensureAdmin(req, res)) return;
    const currentUserId = req.user?.id ? Number(req.user.id) : null;
    const context = await getUserContext(currentUserId);
    console.info('Set primary funnel request', {
      userId: currentUserId,
      companyId: context.companyId,
      funnelId: req.params.id,
      body: req.body
    });
    if (!context.companyId) {
      return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
    }
    const { id } = req.params;
    const statusOrder = Array.isArray(req.body?.statusOrder)
      ? req.body.statusOrder
      : undefined;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const isPrimaryRaw = req.body?.isPrimary ?? req.body?.is_primary;
    const isPrimary = isPrimaryRaw === true || isPrimaryRaw === 'true' || isPrimaryRaw === 1 || isPrimaryRaw === '1'
      ? true
      : undefined;
    if (isPrimary === true) {
      const updateSql = db
        ? 'UPDATE funnels SET is_primary = CASE WHEN id = $1 THEN 1 ELSE 0 END, updated_at = CURRENT_TIMESTAMP WHERE company_id = $2'
        : 'UPDATE funnels SET is_primary = CASE WHEN id = $1 THEN true ELSE false END, updated_at = CURRENT_TIMESTAMP WHERE company_id = $2';
      await query(updateSql, [id, context.companyId]);
    }
    if (name && statusOrder) {
      await query(
        'UPDATE funnels SET name = $1, status_order = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND company_id = $4',
        [name, JSON.stringify(statusOrder), id, context.companyId]
      );
      res.json({ id, name, statusOrder, isPrimary: isPrimary === true ? true : undefined });
      return;
    }
    if (name) {
      await query(
        'UPDATE funnels SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3',
        [name, id, context.companyId]
      );
      res.json({ id, name, isPrimary: isPrimary === true ? true : undefined });
      return;
    }
    const nextOrder = statusOrder || DEFAULT_STATUS_ORDER;
    await query(
      'UPDATE funnels SET status_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3',
      [JSON.stringify(nextOrder), id, context.companyId]
    );
    res.json({ id, statusOrder: nextOrder, isPrimary: isPrimary === true ? true : undefined });
  } catch (error: any) {
    console.error('Update funnel error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar funil.' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureFunnelsTable();
    if (!ensureAdmin(req, res)) return;
    const currentUserId = req.user?.id ? Number(req.user.id) : null;
    const context = await getUserContext(currentUserId);
    if (!context.companyId) {
      return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
    }
    const { id } = req.params;
    await query(
      'DELETE FROM leads WHERE funnel_id = $1 AND (company_id = $2 OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $3)))',
      [id, context.companyId, context.companyId]
    );
    await query(
      'DELETE FROM funnels WHERE id = $1 AND company_id = $2',
      [id, context.companyId]
    );
    await ensurePrimaryFunnel(context.companyId);
    res.json({ message: 'Funil excluído com sucesso.' });
  } catch (error: any) {
    console.error('Delete funnel error:', error);
    res.status(500).json({ message: error.message || 'Erro ao excluir funil.' });
  }
});

export default router;
