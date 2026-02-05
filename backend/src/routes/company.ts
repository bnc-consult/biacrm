import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

const PLAN_LIMITS: Record<string, number> = {
  starter: 2,
  pro: 5,
  scale: 15
};

router.get('/plan', authenticate, async (req: AuthRequest, res) => {
  try {
    const userResult = await query('SELECT company_id, role FROM users WHERE id = ?', [(req.user && req.user.id)]);
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const user = userResult.rows[0];
    if (!user.company_id) {
      return res.json({ planType: null, planActive: true, maxCollaborators: 0 });
    }
    const companyResult = await query(
      'SELECT plan_type, plan_active, max_collaborators FROM companies WHERE id = ?',
      [user.company_id]
    );
    if (!companyResult.rows || companyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    const company = companyResult.rows[0];
    const countResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = 'atendente'",
      [user.company_id]
    );
    const currentCount = Number(countResult.rows[0]?.count || 0);
    res.json({
      planType: company.plan_type,
      planActive: !!company.plan_active,
      maxCollaborators: company.max_collaborators,
      currentCollaborators: currentCount
    });
  } catch (error: any) {
    console.error('Get company plan error:', error);
    res.status(500).json({ message: 'Erro ao buscar plano' });
  }
});

router.get('/collaborators', authenticate, async (req: AuthRequest, res) => {
  try {
    const userResult = await query('SELECT id, role, company_id FROM users WHERE id = ?', [(req.user && req.user.id)]);
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const currentUser = userResult.rows[0];
    if (!currentUser.company_id) {
      return res.status(400).json({ message: 'Usuário não possui empresa associada' });
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'gestor') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const collaboratorsResult = await query(
      "SELECT id, name, email, created_at FROM users WHERE company_id = ? AND role = 'atendente' ORDER BY id",
      [currentUser.company_id]
    );
    const collaborators = collaboratorsResult.rows || [];
    res.json({ collaborators, count: collaborators.length });
  } catch (error: any) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ message: 'Erro ao buscar colaboradores' });
  }
});

router.post('/collaborators', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Campos obrigatórios: name, email, password' });
    }

    const userResult = await query('SELECT id, role, company_id, email, name FROM users WHERE id = ?', [
      (req.user && req.user.id)
    ]);
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const currentUser = userResult.rows[0];
    if (!currentUser.company_id) {
      return res.status(400).json({ message: 'Usuário não possui empresa associada' });
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'gestor') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const companyResult = await query(
      'SELECT plan_type, plan_active, max_collaborators FROM companies WHERE id = ?',
      [currentUser.company_id]
    );
    if (!companyResult.rows || companyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }
    const company = companyResult.rows[0];
    if (!company.plan_active) {
      return res.status(403).json({ message: 'Plano inativo', code: 'PLAN_INACTIVE' });
    }

    const limit = company.max_collaborators || PLAN_LIMITS[String(company.plan_type)] || 0;
    const countResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = 'atendente'",
      [currentUser.company_id]
    );
    const currentCount = Number(countResult.rows[0]?.count || 0);
    if (limit > 0 && currentCount >= limit) {
      return res.status(400).json({ message: 'Limite de colaboradores atingido' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'atendente', currentUser.company_id]
    );

    res.status(201).json({
      message: 'Colaborador cadastrado com sucesso',
      maxCollaborators: limit,
      currentCollaborators: currentCount + 1
    });
  } catch (error: any) {
    console.error('Create collaborator error:', error);
    res.status(500).json({ message: 'Erro ao cadastrar colaborador' });
  }
});

router.put('/collaborators/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name && !email && !password) {
      return res.status(400).json({ message: 'Informe nome, email ou senha para atualizar' });
    }

    const userResult = await query('SELECT id, role, company_id FROM users WHERE id = ?', [(req.user && req.user.id)]);
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const currentUser = userResult.rows[0];
    if (!currentUser.company_id) {
      return res.status(400).json({ message: 'Usuário não possui empresa associada' });
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'gestor') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const collaboratorId = Number(req.params.id);
    if (!collaboratorId) {
      return res.status(400).json({ message: 'Colaborador inválido' });
    }

    const existingResult = await query(
      "SELECT id, email FROM users WHERE id = ? AND company_id = ? AND role = 'atendente'",
      [collaboratorId, currentUser.company_id]
    );
    if (!existingResult.rows || existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Colaborador não encontrado' });
    }
    const existing = existingResult.rows[0];

    if (email && email !== existing.email) {
      const emailInUse = await query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, collaboratorId]);
      if (emailInUse.rows.length > 0) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nenhuma alteração informada' });
    }

    params.push(collaboratorId, currentUser.company_id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ? AND role = 'atendente'`,
      params
    );
    const changes = result.rows[0]?.changes ?? 0;
    if (!changes) {
      return res.status(404).json({ message: 'Colaborador não encontrado' });
    }

    res.json({ message: 'Colaborador atualizado com sucesso' });
  } catch (error: any) {
    console.error('Update collaborator error:', error);
    res.status(500).json({ message: 'Erro ao atualizar colaborador' });
  }
});

router.delete('/collaborators/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userResult = await query('SELECT id, role, company_id FROM users WHERE id = ?', [(req.user && req.user.id)]);
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const currentUser = userResult.rows[0];
    if (!currentUser.company_id) {
      return res.status(400).json({ message: 'Usuário não possui empresa associada' });
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'gestor') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const collaboratorId = Number(req.params.id);
    if (!collaboratorId) {
      return res.status(400).json({ message: 'Colaborador inválido' });
    }

    const result = await query(
      "DELETE FROM users WHERE id = ? AND company_id = ? AND role = 'atendente'",
      [collaboratorId, currentUser.company_id]
    );
    const changes = result.rows[0]?.changes ?? 0;
    if (!changes) {
      return res.status(404).json({ message: 'Colaborador não encontrado' });
    }
    res.json({ message: 'Colaborador excluído com sucesso' });
  } catch (error: any) {
    console.error('Delete collaborator error:', error);
    res.status(500).json({ message: 'Erro ao excluir colaborador' });
  }
});

export default router;
