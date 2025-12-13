"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Register class
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role = 'atendente' } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Campos obrigatórios: name, email, password' });
        }
        // Check if user exists
        const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const result = await (0, connection_1.query)('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        // Get inserted ID - the connection.ts already returns lastInsertRowid for SQLite
        let insertedId = 0;
        if (result.rows && result.rows.length > 0) {
            // SQLite returns lastInsertRowid in the row
            if (result.rows[0].lastInsertRowid) {
                insertedId = result.rows[0].lastInsertRowid;
            }
            // PostgreSQL returns id directly
            else if (result.rows[0].id) {
                insertedId = result.rows[0].id;
            }
        }
        // If still no ID, try to get it by email (fallback)
        if (!insertedId || insertedId === 0) {
            const userByEmail = await (0, connection_1.query)('SELECT id FROM users WHERE email = ?', [email]);
            if (userByEmail.rows && userByEmail.rows.length > 0) {
                insertedId = userByEmail.rows[0].id;
            }
        }
        if (!insertedId || insertedId === 0) {
            console.error('Failed to get inserted user ID. Result:', result);
            throw new Error('Falha ao criar usuário. Tente novamente.');
        }
        const userResult = await (0, connection_1.query)('SELECT id, name, email, role FROM users WHERE id = ?', [insertedId]);
        const user = userResult.rows[0];
        // Generate token
        const jwtSecret = process.env.JWT_SECRET || 'secret';
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '7d')
        };
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, signOptions);
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        console.error('Register error:', error);
        console.error('Error stack:', error.stack);
        // Mensagens de erro mais amigáveis
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
        // Generate token
        const jwtSecret = process.env.JWT_SECRET || 'secret';
        if (!jwtSecret || jwtSecret === 'secret') {
            console.warn('⚠️ JWT_SECRET está usando valor padrão. Configure um valor seguro!');
        }
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN || '7d')
        };
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, signOptions);
        console.log('Login successful for user:', email);
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
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
        const result = await (0, connection_1.query)('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [(req.user && req.user.id)]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map