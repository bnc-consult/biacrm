import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendVerificationCodeEmail, sendPasswordResetCodeEmail } from '../services/email';

const router = express.Router();
const TRIAL_DAYS = 7;
const TRIAL_ADMIN_EMAILS = new Set([
  'bnovais@yahoo.com.br',
  'bnovais@yahoo,com.br',
  'ifelipes@gmail.com'
]);

const isTrialExempt = (email?: string, role?: string) => {
  if (role === 'admin') return true;
  if (!email) return false;
  return TRIAL_ADMIN_EMAILS.has(String(email).trim().toLowerCase());
};

const isTrialExpired = (createdAt?: string, email?: string, role?: string) => {
  if (isTrialExempt(email, role)) return false;
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;
  const expiresAt = createdDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > expiresAt;
};

const getCompanyById = async (companyId?: number | null) => {
  if (!companyId) return null;
  const result = await query('SELECT id, name, plan_type, plan_active, max_collaborators FROM companies WHERE id = ?', [
    companyId
  ]);
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

const VERIFICATION_CODE_SECONDS = 50;

const generateVerificationCode = () => String(randomInt(100000, 1000000));

const saveVerificationCode = async (email: string, code: string, purpose: 'register' | 'password_reset') => {
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_SECONDS * 1000).toISOString();
  await query('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?', [email, purpose]);
  await query(
    'INSERT INTO email_verification_codes (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, code, purpose, expiresAt]
  );
};

const verifyCode = async (email: string, code: string, purpose: 'register' | 'password_reset') => {
  const result = await query(
    'SELECT code, expires_at FROM email_verification_codes WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
    [email, purpose]
  );
  if (!result.rows || result.rows.length === 0) {
    return false;
  }
  const stored = result.rows[0];
  const expiresAt = new Date(stored.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || Date.now() > expiresAt.getTime()) {
    return false;
  }
  return String(stored.code) === String(code);
};

// Request verification code
router.post('/register/request-code', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Campos obrigatórios: name, email' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const code = generateVerificationCode();
    await saveVerificationCode(email, code, 'register');
    await sendVerificationCodeEmail(email, code);

    res.json({ message: 'Codigo enviado para o email da empresa.' });
  } catch (error: any) {
    console.error('Request code error:', error);
    res.status(500).json({ message: 'Nao foi possivel enviar o codigo. Verifique as configuracoes de email.' });
  }
});

const getInsertedId = async (result: any, email: string, table: string) => {
  let insertedId: number = 0;
  if (result.rows && result.rows.length > 0) {
    if (result.rows[0].lastInsertRowid) {
      insertedId = result.rows[0].lastInsertRowid;
    } else if (result.rows[0].id) {
      insertedId = result.rows[0].id;
    }
  }
  if (!insertedId || insertedId === 0) {
    const byEmail = await query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
    if (byEmail.rows && byEmail.rows.length > 0) {
      insertedId = byEmail.rows[0].id;
    }
  }
  return insertedId;
};

const handleRegister = async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, password, role = 'gestor', verificationCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Campos obrigatórios: name, email, password' });
    }

    if (!verificationCode) {
      return res.status(400).json({ message: 'Codigo de verificacao obrigatorio' });
    }

    const isValidCode = await verifyCode(email, verificationCode, 'register');
    if (!isValidCode) {
      return res.status(400).json({ message: 'Codigo incorreto ou expirado' });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Create company
    const companyResult = await query(
      'INSERT INTO companies (name, email, plan_type, plan_active, max_collaborators) VALUES (?, ?, ?, ?, ?)',
      [name, email, 'starter', 1, 2]
    );
    const companyId = await getInsertedId(companyResult, email, 'companies');
    if (!companyId || companyId === 0) {
      throw new Error('Falha ao criar empresa. Tente novamente.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, companyId]
    );

    const insertedId = await getInsertedId(result, email, 'users');

    if (!insertedId || insertedId === 0) {
      console.error('Failed to get inserted user ID. Result:', result);
      throw new Error('Falha ao criar usuário. Tente novamente.');
    }

    await query('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?', [email, 'register']);

    const userResult = await query('SELECT id, name, email, role, company_id FROM users WHERE id = ?', [insertedId]);
    const user = userResult.rows[0];

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    };
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      signOptions
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id
      },
      token
    });
  } catch (error: any) {
    console.error('Register error:', error);
    console.error('Error stack:', error.stack);

    let errorMessage = 'Erro ao criar conta';
    const errorMsg = error.message || '';
    if (errorMsg.includes('UNIQUE constraint') || errorMsg.includes('Email já cadastrado')) {
      errorMessage = 'Este email já está cadastrado';
    } else if (errorMsg.includes('Falha ao criar usuário')) {
      errorMessage = 'Erro ao salvar usuário no banco de dados';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ message: errorMessage });
  }
};

router.post('/register', handleRegister);
router.post('/register/confirm', handleRegister);

// Request password reset code
router.post('/password/reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }

    const code = generateVerificationCode();
    await saveVerificationCode(email, code, 'password_reset');
    await sendPasswordResetCodeEmail(email, code);

    res.json({ message: 'Codigo enviado para o email da empresa.' });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Nao foi possivel enviar o codigo. Verifique as configuracoes de email.' });
  }
});

// Verify password reset code
router.post('/password/reset/verify', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    if (!email || !verificationCode) {
      return res.status(400).json({ message: 'Email e codigo são obrigatórios' });
    }

    const isValidCode = await verifyCode(email, verificationCode, 'password_reset');
    if (!isValidCode) {
      return res.status(400).json({ message: 'Codigo incorreto' });
    }

    return res.json({ message: 'Codigo valido' });
  } catch (error: any) {
    console.error('Password reset verify error:', error);
    return res.status(500).json({ message: 'Erro ao validar codigo' });
  }
});

// Confirm password reset
router.post('/password/reset/confirm', async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;
    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ message: 'Email, codigo e nova senha são obrigatórios' });
    }

    const isValidCode = await verifyCode(email, verificationCode, 'password_reset');
    if (!isValidCode) {
      return res.status(400).json({ message: 'Codigo incorreto' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [
      hashedPassword,
      email
    ]);
    await query('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?', [email, 'password_reset']);

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({ message: 'Erro ao atualizar senha' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    console.log('Login attempt for email:', email);

    // Find user
    const result = await query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!result || !result.rows) {
      console.error('Query result is invalid:', result);
      return res.status(500).json({ message: 'Erro ao consultar banco de dados' });
    }

    if (result.rows.length === 0) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });

    // Check password
    if (!user.password) {
      console.error('User password is missing');
      return res.status(500).json({ message: 'Erro: senha do usuário não encontrada' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const company = await getCompanyById(user.company_id);
    const companyName = company?.name || null;
    if (user.role !== 'admin') {
      if (company && !company.plan_active) {
        return res.status(403).json({
          message: 'Sua empresa nao possui plano ativo no BIACRM.',
          code: 'PLAN_INACTIVE'
        });
      }
    }

    if (isTrialExpired(user.created_at, user.email, user.role)) {
      return res.status(403).json({
        message: 'Seu periodo de trial expirou. Escolha um plano para continuar.',
        code: 'TRIAL_EXPIRED',
        redirectUrl: '/landingpage'
      });
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    if (!jwtSecret || jwtSecret === 'secret') {
      console.warn('⚠️ JWT_SECRET está usando valor padrão. Configure um valor seguro!');
    }
    
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    };
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      signOptions
    );

    console.log('Login successful for user:', email);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        companyName
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Mensagem de erro mais detalhada para debug
    const errorMessage = error.message || 'Erro interno do servidor';
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT u.id, u.name, u.email, u.role, u.created_at, u.company_id, c.name as company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = ?',
      [(req.user && req.user.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    if (isTrialExpired(user.created_at, user.email, user.role)) {
      return res.status(403).json({
        message: 'Seu periodo de trial expirou. Escolha um plano para continuar.',
        code: 'TRIAL_EXPIRED',
        redirectUrl: '/landingpage'
      });
    }

    const company = await getCompanyById(user.company_id);
    if (user.role !== 'admin') {
      if (company && !company.plan_active) {
        return res.status(403).json({
          message: 'Sua empresa nao possui plano ativo no BIACRM.',
          code: 'PLAN_INACTIVE'
        });
      }
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      companyName: company?.name || user.company_name || null
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

