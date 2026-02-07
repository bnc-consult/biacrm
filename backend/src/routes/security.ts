import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const ARCHITECT_EMAILS = new Set(['bnovais@yahoo.com.br', 'ifelipes@gmail.com']);

const normalizeEmail = (email?: string) => String(email || '').trim().toLowerCase();

const ensureArchitecture = (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autenticado' });
    return false;
  }
  const email = normalizeEmail(req.user.email);
  if (!ARCHITECT_EMAILS.has(email)) {
    res.status(403).json({ message: 'Acesso permitido apenas para arquitetura.' });
    return false;
  }
  return true;
};

router.get('/admins', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id, u.is_active, c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE LOWER(u.role) IN ('admin', 'gestor', 'atendente')
       ORDER BY u.name`
    );
    res.json(
      (result.rows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: String(row.role || '').toLowerCase(),
        companyId: row.company_id ?? null,
        companyName: row.company_name ?? null,
        isActive: row.is_active === 0 || row.is_active === false ? false : true
      }))
    );
  } catch (error: any) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: error.message || 'Erro ao carregar administradores.' });
  }
});

router.get('/companies', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const result = await query(
      `SELECT id, name, email, plan_type, plan_active, created_at
       FROM companies
       ORDER BY name`
    );
    res.json(
      (result.rows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email ?? null,
        planType: row.plan_type ?? null,
        planActive: row.plan_active === 0 || row.plan_active === false ? false : true,
        createdAt: row.created_at ?? null
      }))
    );
  } catch (error: any) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: error.message || 'Erro ao carregar empresas.' });
  }
});

router.patch('/admins/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const { id } = req.params;
    const isActive = req.body?.isActive;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Informe o status ativo/inativo.' });
    }
    await query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'admin'`,
      [isActive ? 1 : 0, id]
    );
    res.json({ message: 'Status atualizado com sucesso.' });
  } catch (error: any) {
    console.error('Update admin status error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar status.' });
  }
});

router.delete('/admins/:id/company', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const { id } = req.params;
    await query(
      `UPDATE users
       SET company_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'admin'`,
      [id]
    );
    res.json({ message: 'Administrador removido da empresa.' });
  } catch (error: any) {
    console.error('Remove admin company error:', error);
    res.status(500).json({ message: error.message || 'Erro ao remover administrador.' });
  }
});

router.delete('/admins/:id/leads', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const { id } = req.params;
    const userResult = await query(
      'SELECT id, role, company_id FROM users WHERE id = $1',
      [id]
    );
    const userRow = userResult.rows && userResult.rows[0];
    if (!userRow) {
      return res.status(404).json({ message: 'Administrador não encontrado.' });
    }
    const role = String(userRow.role || '').toLowerCase();
    if (role !== 'admin') {
      return res.status(400).json({ message: 'Usuário informado não é administrador.' });
    }
    const companyId = userRow.company_id ? Number(userRow.company_id) : null;
    if (!companyId) {
      return res.status(400).json({ message: 'Empresa não vinculada ao administrador.' });
    }

    const leadCountResult = await query(
      `SELECT COUNT(*) as count
       FROM leads
       WHERE (company_id = $1
         OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))`,
      [companyId, companyId]
    );
    const leadCount = Number(leadCountResult.rows?.[0]?.count || 0);

    await query(
      `DELETE FROM lead_history
       WHERE lead_id IN (
         SELECT id FROM leads
         WHERE (company_id = $1
           OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))
       )`,
      [companyId, companyId]
    );
    await query(
      `DELETE FROM scheduled_messages
       WHERE lead_id IN (
         SELECT id FROM leads
         WHERE (company_id = $1
           OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))
       )
       OR user_id IN (SELECT id FROM users WHERE company_id = $3)`,
      [companyId, companyId, companyId]
    );
    await query(
      `DELETE FROM whatsapp_messages
       WHERE user_id IN (SELECT id FROM users WHERE company_id = $1)`,
      [companyId]
    );
    await query(
      `DELETE FROM leads
       WHERE (company_id = $1
         OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))`,
      [companyId, companyId]
    );

    res.json({
      message: 'Leads da empresa removidos com sucesso.',
      deletedLeads: leadCount
    });
  } catch (error: any) {
    console.error('Delete company leads error:', error);
    res.status(500).json({ message: error.message || 'Erro ao excluir leads da empresa.' });
  }
});

router.delete('/companies/:id/leads', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const { id } = req.params;
    const companyId = Number(id);
    if (!companyId || Number.isNaN(companyId)) {
      return res.status(400).json({ message: 'Empresa inválida.' });
    }

    const leadCountResult = await query(
      `SELECT COUNT(*) as count
       FROM leads
       WHERE (company_id = $1
         OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))`,
      [companyId, companyId]
    );
    const leadCount = Number(leadCountResult.rows?.[0]?.count || 0);

    await query(
      `DELETE FROM lead_history
       WHERE lead_id IN (
         SELECT id FROM leads
         WHERE (company_id = $1
           OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))
       )`,
      [companyId, companyId]
    );
    await query(
      `DELETE FROM scheduled_messages
       WHERE lead_id IN (
         SELECT id FROM leads
         WHERE (company_id = $1
           OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))
       )
       OR user_id IN (SELECT id FROM users WHERE company_id = $3)`,
      [companyId, companyId, companyId]
    );
    await query(
      `DELETE FROM whatsapp_messages
       WHERE user_id IN (SELECT id FROM users WHERE company_id = $1)`,
      [companyId]
    );
    await query(
      `DELETE FROM leads
       WHERE (company_id = $1
         OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))`,
      [companyId, companyId]
    );

    res.json({
      message: 'Leads da empresa removidos com sucesso.',
      deletedLeads: leadCount
    });
  } catch (error: any) {
    console.error('Delete company leads error:', error);
    res.status(500).json({ message: error.message || 'Erro ao excluir leads da empresa.' });
  }
});

router.delete('/companies/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!ensureArchitecture(req, res)) return;
    const { id } = req.params;
    const companyId = Number(id);
    if (!companyId || Number.isNaN(companyId)) {
      return res.status(400).json({ message: 'Empresa inválida.' });
    }

    await query(
      `DELETE FROM lead_history
       WHERE lead_id IN (
         SELECT id FROM leads
         WHERE (company_id = $1
           OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))
       )`,
      [companyId, companyId]
    );
    await query(
      `DELETE FROM scheduled_messages
       WHERE lead_id IN (
         SELECT id FROM leads
         WHERE (company_id = $1
           OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))
       )
       OR user_id IN (SELECT id FROM users WHERE company_id = $3)`,
      [companyId, companyId, companyId]
    );
    await query(
      `DELETE FROM whatsapp_messages
       WHERE user_id IN (SELECT id FROM users WHERE company_id = $1)`,
      [companyId]
    );
    await query(
      `DELETE FROM leads
       WHERE (company_id = $1
         OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $2)))`,
      [companyId, companyId]
    );
    await query('DELETE FROM lead_whitelist WHERE company_id = $1', [companyId]);
    await query('DELETE FROM funnels WHERE company_id = $1', [companyId]);
    await query('DELETE FROM companies WHERE id = $1', [companyId]);

    res.json({ message: 'Empresa removida com sucesso.' });
  } catch (error: any) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: error.message || 'Erro ao excluir empresa.' });
  }
});

export default router;
