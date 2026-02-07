"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const router = express_1.default.Router();
const TRIAL_DAYS = 7;
const TRIAL_ADMIN_EMAILS = new Set([
    'bnovais@yahoo.com.br',
    'bnovais@yahoo,com.br',
    'ifelipes@gmail.com'
]);
const ARCHITECT_EMAILS = new Set(['bnovais@yahoo.com.br', 'ifelipes@gmail.com']);
const normalizeRole = (role) => (role ? String(role).trim().toLowerCase() : '');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const resolveRole = (role) => normalizeRole(role) || role;
const isArchitectureEmail = (email) => ARCHITECT_EMAILS.has(normalizeEmail(email));
const isTrialExempt = (email, role) => {
    if (role === 'admin')
        return true;
    if (!email)
        return false;
    return TRIAL_ADMIN_EMAILS.has(String(email).trim().toLowerCase());
};
const isTrialExpired = (createdAt, email, role) => {
    if (isTrialExempt(email, role))
        return false;
    if (!createdAt)
        return false;
    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime()))
        return false;
    const expiresAt = createdDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() > expiresAt;
};
const getCompanyById = async (companyId) => {
    if (!companyId)
        return null;
    const result = await (0, connection_1.query)('SELECT id, name, plan_type, plan_active, max_collaborators FROM companies WHERE id = ?', [
        companyId
    ]);
    if (!result.rows || result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
};
const VERIFICATION_CODE_SECONDS = 50;
const generateVerificationCode = () => String((0, crypto_1.randomInt)(100000, 1000000));
const saveVerificationCode = async (email, code, purpose) => {
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_SECONDS * 1000).toISOString();
    await (0, connection_1.query)('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?', [email, purpose]);
    await (0, connection_1.query)('INSERT INTO email_verification_codes (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)', [email, code, purpose, expiresAt]);
};
const verifyCode = async (email, code, purpose) => {
    const result = await (0, connection_1.query)('SELECT code, expires_at FROM email_verification_codes WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1', [email, purpose]);
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
        const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }
        const code = generateVerificationCode();
        await saveVerificationCode(email, code, 'register');
        await (0, email_1.sendVerificationCodeEmail)(email, code);
        res.json({ message: 'Codigo enviado para o email da empresa.' });
    }
    catch (error) {
        console.error('Request code error:', error);
        res.status(500).json({ message: 'Nao foi possivel enviar o codigo. Verifique as configuracoes de email.' });
    }
});
const getInsertedId = async (result, email, table) => {
    let insertedId = 0;
    if (result.rows && result.rows.length > 0) {
        if (result.rows[0].lastInsertRowid) {
            insertedId = result.rows[0].lastInsertRowid;
        }
        else if (result.rows[0].id) {
            insertedId = result.rows[0].id;
        }
    }
    if (!insertedId || insertedId === 0) {
        const byEmail = await (0, connection_1.query)(`SELECT id FROM ${table} WHERE email = ?`, [email]);
        if (byEmail.rows && byEmail.rows.length > 0) {
            insertedId = byEmail.rows[0].id;
        }
    }
    return insertedId;
};
const handleRegister = async (req, res) => {
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
        const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }
        // Create company
        const companyResult = await (0, connection_1.query)('INSERT INTO companies (name, email, plan_type, plan_active, max_collaborators) VALUES (?, ?, ?, ?, ?)', [name, email, 'starter', 1, 2]);
        const companyId = await getInsertedId(companyResult, email, 'companies');
        if (!companyId || companyId === 0) {
            throw new Error('Falha ao criar empresa. Tente novamente.');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const result = await (0, connection_1.query)('INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, role, companyId]);
        const insertedId = await getInsertedId(result, email, 'users');
        if (!insertedId || insertedId === 0) {
            console.error('Failed to get inserted user ID. Result:', result);
            throw new Error('Falha ao criar usuário. Tente novamente.');
        }
        await (0, connection_1.query)('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?', [email, 'register']);
        const userResult = await (0, connection_1.query)('SELECT id, name, email, role, company_id FROM users WHERE id = ?', [insertedId]);
        const user = userResult.rows[0];
        const jwtSecret = process.env.JWT_SECRET || 'secret';
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '7d')
        };
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: resolveRole(user.role) }, jwtSecret, signOptions);
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: resolveRole(user.role),
                isArchitecture: isArchitectureEmail(user.email),
                companyId: user.company_id
            },
            token
        });
    }
    catch (error) {
        console.error('Register error:', error);
        console.error('Error stack:', error.stack);
        let errorMessage = 'Erro ao criar conta';
        const errorMsg = error.message || '';
        if (errorMsg.includes('UNIQUE constraint') || errorMsg.includes('Email já cadastrado')) {
            errorMessage = 'Este email já está cadastrado';
        }
        else if (errorMsg.includes('Falha ao criar usuário')) {
            errorMessage = 'Erro ao salvar usuário no banco de dados';
        }
        else if (error.message) {
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
        const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: 'Email não encontrado' });
        }
        const code = generateVerificationCode();
        await saveVerificationCode(email, code, 'password_reset');
        await (0, email_1.sendPasswordResetCodeEmail)(email, code);
        res.json({ message: 'Codigo enviado para o email da empresa.' });
    }
    catch (error) {
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
    }
    catch (error) {
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
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await (0, connection_1.query)('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [
            hashedPassword,
            email
        ]);
        await (0, connection_1.query)('DELETE FROM email_verification_codes WHERE email = ? AND purpose = ?', [email, 'password_reset']);
        res.json({ message: 'Senha atualizada com sucesso' });
    }
    catch (error) {
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
        const result = await (0, connection_1.query)('SELECT * FROM users WHERE email = ?', [email]);
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
        const isActive = !(user.is_active === 0 || user.is_active === false);
        if (!isActive) {
            return res.status(403).json({ message: 'Usuário inativo. Contate o suporte.' });
        }
        // Check password
        if (!user.password) {
            console.error('User password is missing');
            return res.status(500).json({ message: 'Erro: senha do usuário não encontrada' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        const company = await getCompanyById(user.company_id);
        const companyName = company?.name || null;
        const resolvedRole = resolveRole(user.role);
        if (resolvedRole !== 'admin') {
            if (company && !company.plan_active) {
                return res.status(403).json({
                    message: 'Sua empresa nao possui plano ativo no BIACRM.',
                    code: 'PLAN_INACTIVE'
                });
            }
        }
        if (isTrialExpired(user.created_at, user.email, resolvedRole)) {
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
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '7d')
        };
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: resolvedRole }, jwtSecret, signOptions);
        console.log('Login successful for user:', email);
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: resolvedRole,
                isArchitecture: isArchitectureEmail(user.email),
                companyId: user.company_id,
                companyName
            },
            token
        });
    }
    catch (error) {
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
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const result = await (0, connection_1.query)('SELECT u.id, u.name, u.email, u.role, u.created_at, u.company_id, u.is_active, c.name as company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = ?', [(req.user && req.user.id)]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        const user = result.rows[0];
        const isActive = !(user.is_active === 0 || user.is_active === false);
        if (!isActive) {
            return res.status(403).json({ message: 'Usuário inativo. Contate o suporte.' });
        }
        const resolvedRole = resolveRole(user.role);
        if (isTrialExpired(user.created_at, user.email, resolvedRole)) {
            return res.status(403).json({
                message: 'Seu periodo de trial expirou. Escolha um plano para continuar.',
                code: 'TRIAL_EXPIRED',
                redirectUrl: '/landingpage'
            });
        }
        const company = await getCompanyById(user.company_id);
        if (resolvedRole !== 'admin') {
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
            role: resolvedRole,
            isArchitecture: isArchitectureEmail(user.email),
            companyId: user.company_id,
            companyName: company?.name || user.company_name || null
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map