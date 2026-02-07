"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const xlsx_1 = __importDefault(require("xlsx"));
const stream_1 = require("stream");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');
const getPhoneVariants = (digits) => {
    const variants = new Set();
    if (!digits)
        return variants;
    const addWithAndWithoutNinth = (localDigits) => {
        if (!localDigits)
            return;
        variants.add(localDigits);
        variants.add(`55${localDigits}`);
        if (localDigits.length === 11 && localDigits[2] === '9') {
            const withoutNinth = `${localDigits.slice(0, 2)}${localDigits.slice(3)}`;
            variants.add(withoutNinth);
            variants.add(`55${withoutNinth}`);
        }
        else if (localDigits.length === 10) {
            const withNinth = `${localDigits.slice(0, 2)}9${localDigits.slice(2)}`;
            variants.add(withNinth);
            variants.add(`55${withNinth}`);
        }
    };
    variants.add(digits);
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        addWithAndWithoutNinth(digits.slice(2));
    }
    else if (digits.length === 10 || digits.length === 11) {
        addWithAndWithoutNinth(digits);
    }
    return variants;
};
const isSameLead = (storedPhone, leadPhone) => {
    const storedDigits = normalizePhone(storedPhone);
    const leadDigits = normalizePhone(leadPhone);
    if (!storedDigits || !leadDigits)
        return false;
    if (storedDigits === leadDigits)
        return true;
    const minLen = Math.min(storedDigits.length, leadDigits.length);
    if (minLen < 10)
        return false;
    const storedVariants = getPhoneVariants(storedDigits);
    const leadVariants = getPhoneVariants(leadDigits);
    for (const a of storedVariants) {
        for (const b of leadVariants) {
            if (a === b)
                return true;
            if (a.endsWith(b) || b.endsWith(a))
                return true;
        }
    }
    return false;
};
const normalizeHeader = (header) => (header || '').replace(/^\uFEFF/, '').trim();
const normalizeHeaderKey = (header) => normalizeHeader(header).toLowerCase();
const getField = (row, keys) => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }
    return '';
};
const getCurrentUserContext = async (userId) => {
    if (!userId) {
        return { isAdmin: false, companyId: null };
    }
    const result = await (0, connection_1.query)('SELECT id, role, company_id FROM users WHERE id = ?', [userId]);
    const row = result.rows && result.rows[0];
    const normalizedRole = String(row?.role || '').toLowerCase();
    return {
        isAdmin: normalizedRole === 'admin',
        companyId: row?.company_id ? Number(row.company_id) : null
    };
};
const resolveCompanyIdForUser = async (userId) => {
    if (!userId)
        return null;
    const result = await (0, connection_1.query)('SELECT company_id FROM users WHERE id = ?', [userId]);
    const row = result.rows && result.rows[0];
    return row?.company_id ? Number(row.company_id) : null;
};
const getPrimaryFunnelId = async (companyId) => {
    if (!companyId)
        return null;
    const primaryResult = await (0, connection_1.query)('SELECT id FROM funnels WHERE company_id = ? AND is_primary = ? ORDER BY id LIMIT 1', [companyId, 1]);
    if (primaryResult.rows && primaryResult.rows[0]) {
        return Number(primaryResult.rows[0].id);
    }
    const firstResult = await (0, connection_1.query)('SELECT id FROM funnels WHERE company_id = ? ORDER BY id LIMIT 1', [companyId]);
    return firstResult.rows && firstResult.rows[0] ? Number(firstResult.rows[0].id) : null;
};
const ensureAdmin = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Não autenticado' });
        return false;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Acesso permitido apenas para administradores.' });
        return false;
    }
    return true;
};
const parseTags = (value) => {
    if (!value)
        return [];
    if (Array.isArray(value))
        return value;
    return String(value)
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
};
const NAME_KEYS = [
    'contato principal',
    'nome completo',
    'nome',
    'pessoa de contato',
    'contato da empresa',
    'lead título',
    "empresa lead 's",
    'empresa do contato',
];
const PHONE_KEYS = [
    'celular',
    'celular (contato)',
    'telefone comercial',
    'telefone comercial (contato)',
    'tel. direto com.',
    'tel. direto com. (contato)',
    'telefone residencial',
    'telefone residencial (contato)',
    'outro telefone',
    'outro telefone (contato)',
    'whatsapp',
    'telefone',
    'phone',
];
const EMAIL_KEYS = [
    'email comercial',
    'email comercial (contato)',
    'email pessoal',
    'email pessoal (contato)',
    'outro email',
    'outro email (contato)',
    'e-mail',
    'email',
];
const TAGS_KEYS = ['tags', 'lead tags'];
const ORIGIN_KEYS = ['fonte do lead', 'utm_source'];
const validateHeaders = (headers) => {
    const normalized = headers.map(normalizeHeaderKey);
    const missing = [];
    if (!normalized.some((header) => NAME_KEYS.includes(header))) {
        missing.push('Nome');
    }
    if (!normalized.some((header) => PHONE_KEYS.includes(header))) {
        missing.push('Telefone');
    }
    return { ok: missing.length === 0, missing };
};
const mapRowToLead = (row) => {
    const rowObject = Array.isArray(row) ? {} : row;
    const rowArray = Array.isArray(row) ? row : null;
    const readArrayValue = (index) => rowArray && rowArray[index] !== undefined && rowArray[index] !== null
        ? String(rowArray[index]).trim()
        : '';
    const findPhoneFromArray = () => {
        if (!rowArray)
            return '';
        for (const value of rowArray) {
            const digits = String(value || '').replace(/\D/g, '');
            if (digits.length >= 10) {
                return String(value).trim();
            }
        }
        return '';
    };
    const findEmailFromArray = () => {
        if (!rowArray)
            return '';
        const found = rowArray.find((value) => String(value || '').includes('@'));
        return found ? String(found).trim() : '';
    };
    let name = getField(rowObject, [
        ...NAME_KEYS,
    ]);
    if (rowArray) {
        name = readArrayValue(2) || readArrayValue(3) || name;
    }
    let phone = getField(rowObject, [
        ...PHONE_KEYS,
    ]);
    if (rowArray) {
        phone = readArrayValue(4) || phone || findPhoneFromArray();
    }
    let email = getField(rowObject, [
        ...EMAIL_KEYS,
    ]);
    if (rowArray) {
        email = readArrayValue(5) || email || findEmailFromArray();
    }
    const origin = getField(rowObject, [
        ...ORIGIN_KEYS,
    ]) || 'manual';
    const tags = parseTags(getField(rowObject, TAGS_KEYS));
    const custom_data = {
        ...(rowObject['etapa do lead'] ? { lead_stage: rowObject['etapa do lead'] } : {}),
        ...(rowObject['funil de vendas'] ? { funnel: rowObject['funil de vendas'] } : {}),
        ...(rowObject['lead usuário responsável'] ? { lead_owner: rowObject['lead usuário responsável'] } : {}),
        ...(rowObject['usuário responsável'] ? { lead_owner: rowObject['usuário responsável'] } : {}),
        ...(rowObject['usuario responsavel'] ? { lead_owner: rowObject['usuario responsavel'] } : {}),
        ...(rowObject['empresa do contato'] ? { contact_company: rowObject['empresa do contato'] } : {}),
        ...(rowObject["empresa lead 's"] ? { lead_company: rowObject["empresa lead 's"] } : {}),
        ...(rowObject['cidade'] ? { cidade: rowObject['cidade'] } : {}),
        ...(rowObject['interesse'] ? { interesse: rowObject['interesse'] } : {}),
        ...(rowObject['tipo de negócio'] ? { interesse: rowObject['tipo de negócio'] } : {}),
        ...(rowObject['tipo de negocio'] ? { interesse: rowObject['tipo de negocio'] } : {}),
        ...(rowObject['tipo de negócio:'] ? { interesse: rowObject['tipo de negócio:'] } : {}),
        ...(rowObject['tipo de negocio:'] ? { interesse: rowObject['tipo de negocio:'] } : {}),
        ...(rowObject['próxima tarefa'] ? { next_task: rowObject['próxima tarefa'] } : {}),
        ...(rowObject['fechada em'] ? { closed_at: rowObject['fechada em'] } : {}),
        ...(rowObject['obs'] ? { notes: rowObject['obs'] } : {}),
        ...(rowObject['etapa'] ? { stage: rowObject['etapa'] } : {}),
        ...(rowObject['local_interesse'] ? { local_interesse: rowObject['local_interesse'] } : {}),
        ...(rowObject['local_intersse'] ? { local_intersse: rowObject['local_intersse'] } : {}),
        ...(rowObject['tipo_imovel'] ? { tipo_imovel: rowObject['tipo_imovel'] } : {}),
        ...(rowObject['interesse'] ? { interesse: rowObject['interesse'] } : {}),
        ...(rowObject['posição (contato)'] ? { contact_position: rowObject['posição (contato)'] } : {}),
        raw_import: row,
    };
    return {
        name: name || phone,
        phone,
        email,
        origin,
        status: 'novo_lead',
        custom_data,
        tags
    };
};
const buildRowsFromXlsx = (buffer) => {
    const workbook = xlsx_1.default.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName)
        return [];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx_1.default.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length)
        return [];
    const headers = (rows[0] || []).map((header) => normalizeHeaderKey(String(header)));
    const headerValidation = validateHeaders(headers);
    if (!headerValidation.ok) {
        return rows.reduce((acc, row) => {
            if (!row || row.every((cell) => String(cell || '').trim() === '')) {
                return acc;
            }
            acc.push(row);
            return acc;
        }, []);
    }
    return rows.slice(1).reduce((acc, row) => {
        if (!row || row.every((cell) => String(cell || '').trim() === '')) {
            return acc;
        }
        const mapped = {};
        headers.forEach((header, index) => {
            if (header) {
                mapped[header] = row[index];
            }
        });
        acc.push(mapped);
        return acc;
    }, []);
};
// Get all leads
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { status, search, origin } = req.query;
        let sql = 'SELECT l.*, u.name as user_name, f.name as funnel_name FROM leads l LEFT JOIN users u ON l.user_id = u.id LEFT JOIN funnels f ON l.funnel_id = f.id WHERE l.deleted_at IS NULL';
        const params = [];
        let isAdmin = false;
        let companyUserIds = [];
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        const userContext = await getCurrentUserContext(currentUserId);
        isAdmin = userContext.isAdmin;
        if (userContext.companyId) {
            sql += ' AND (l.company_id = ? OR (l.company_id IS NULL AND l.user_id IN (SELECT id FROM users WHERE company_id = ?)))';
            params.push(userContext.companyId, userContext.companyId);
            const companyUsers = await (0, connection_1.query)('SELECT id FROM users WHERE company_id = ?', [userContext.companyId]);
            companyUserIds = (companyUsers.rows || []).map((row) => Number(row.id)).filter(Boolean);
        }
        else if (currentUserId) {
            sql += ' AND l.user_id = ?';
            params.push(currentUserId);
        }
        if (status) {
            sql += ' AND l.status = ?';
            params.push(status);
        }
        if (origin) {
            sql += ' AND l.origin = ?';
            params.push(origin);
        }
        if (search) {
            sql += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        sql += ' ORDER BY l.created_at DESC';
        const result = await (0, connection_1.query)(sql, params);
        // Parse JSON fields from SQLite
        const parsedRows = result.rows.map((row) => {
            if (row.custom_data && typeof row.custom_data === 'string') {
                try {
                    row.custom_data = JSON.parse(row.custom_data);
                }
                catch (e) {
                    row.custom_data = {};
                }
            }
            if (row.tags && typeof row.tags === 'string') {
                try {
                    row.tags = JSON.parse(row.tags);
                }
                catch (e) {
                    row.tags = [];
                }
            }
            return row;
        });
        let unreadRows = [];
        if (isAdmin && !userContext.companyId) {
            const userIds = Array.from(new Set(parsedRows.map((row) => Number(row.user_id)).filter(Boolean)));
            if (userIds.length > 0) {
                const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
                const unreadResult = await (0, connection_1.query)(`SELECT phone, user_id, COUNT(*) as count
           FROM whatsapp_messages
           WHERE user_id IN (${placeholders})
             AND direction = 'in'
             AND (is_read = 0 OR is_read IS NULL)
           GROUP BY user_id, phone`, userIds);
                unreadRows = unreadResult.rows || [];
            }
        }
        else if (companyUserIds.length > 0) {
            const placeholders = companyUserIds.map((_, index) => `$${index + 1}`).join(', ');
            const unreadResult = await (0, connection_1.query)(`SELECT phone, user_id, COUNT(*) as count
         FROM whatsapp_messages
         WHERE user_id IN (${placeholders})
           AND direction = 'in'
           AND (is_read = 0 OR is_read IS NULL)
         GROUP BY user_id, phone`, companyUserIds);
            unreadRows = unreadResult.rows || [];
        }
        else if (currentUserId) {
            const unreadResult = await (0, connection_1.query)(`SELECT phone, user_id, COUNT(*) as count
         FROM whatsapp_messages
         WHERE user_id = $1
           AND direction = 'in'
           AND (is_read = 0 OR is_read IS NULL)
         GROUP BY user_id, phone`, [currentUserId]);
            unreadRows = unreadResult.rows || [];
        }
        const unreadByUser = new Map();
        unreadRows.forEach((row) => {
            const userId = Number(row.user_id);
            if (!unreadByUser.has(userId)) {
                unreadByUser.set(userId, []);
            }
            unreadByUser.get(userId)?.push(row);
        });
        const enrichedRows = parsedRows.map((row) => {
            const rowUserId = row.user_id ? Number(row.user_id) : currentUserId;
            const candidates = rowUserId ? (unreadByUser.get(rowUserId) || []) : [];
            let unreadCount = 0;
            candidates.forEach((messageRow) => {
                if (isSameLead(messageRow.phone || '', row.phone || '')) {
                    unreadCount += Number(messageRow.count || 0);
                }
            });
            return { ...row, unread_count: unreadCount };
        });
        res.json(enrichedRows);
    }
    catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ message: error.message });
    }
});
// White list (números que não devem gerar leads)
router.get('/whitelist', auth_1.authenticate, async (req, res) => {
    try {
        if (!ensureAdmin(req, res))
            return;
        const currentUserId = Number(req.user?.id);
        const userContext = await getCurrentUserContext(currentUserId);
        if (!userContext.companyId) {
            return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
        }
        const result = await (0, connection_1.query)('SELECT id, name, phone FROM lead_whitelist WHERE company_id = $1 ORDER BY created_at DESC', [userContext.companyId]);
        return res.json(result.rows || []);
    }
    catch (error) {
        console.error('Get whitelist error:', error);
        res.status(500).json({ message: error.message || 'Erro ao carregar white list.' });
    }
});
router.post('/whitelist', auth_1.authenticate, async (req, res) => {
    try {
        if (!ensureAdmin(req, res))
            return;
        const currentUserId = Number(req.user?.id);
        const userContext = await getCurrentUserContext(currentUserId);
        if (!userContext.companyId) {
            return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
        }
        const phone = normalizePhone(req.body?.phone || '');
        const name = String(req.body?.name || '').trim();
        if (!phone) {
            return res.status(400).json({ message: 'Informe um número de celular válido.' });
        }
        const existing = await (0, connection_1.query)('SELECT id, phone FROM lead_whitelist WHERE company_id = $1', [userContext.companyId]);
        const list = existing.rows || [];
        const alreadyExists = list.some((row) => isSameLead(row.phone || '', phone));
        if (alreadyExists) {
            return res.status(409).json({ message: 'Número já cadastrado na white list.' });
        }
        const result = await (0, connection_1.query)('INSERT INTO lead_whitelist (company_id, user_id, name, phone) VALUES ($1, $2, $3, $4)', [userContext.companyId, currentUserId, name || null, phone]);
        const insertedId = result.rows?.[0]?.lastInsertRowid || result.rows?.[0]?.id;
        res.json({
            id: insertedId,
            name: name || null,
            phone
        });
    }
    catch (error) {
        console.error('Create whitelist error:', error);
        res.status(500).json({ message: error.message || 'Erro ao salvar número.' });
    }
});
router.delete('/whitelist/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!ensureAdmin(req, res))
            return;
        const currentUserId = Number(req.user?.id);
        const userContext = await getCurrentUserContext(currentUserId);
        const { id } = req.params;
        if (!userContext.companyId) {
            return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
        }
        await (0, connection_1.query)('DELETE FROM lead_whitelist WHERE id = $1 AND company_id = $2', [id, userContext.companyId]);
        res.json({ message: 'Número removido da white list.' });
    }
    catch (error) {
        console.error('Delete whitelist error:', error);
        res.status(500).json({ message: error.message || 'Erro ao remover número.' });
    }
});
// Assign funnel in bulk
router.post('/bulk-funnel', auth_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Apenas administradores podem atribuir funil em massa' });
        }
        const funnelIdRaw = req.body?.funnelId ?? req.body?.funnel_id ?? null;
        const funnelId = funnelIdRaw !== null && funnelIdRaw !== undefined && funnelIdRaw !== ''
            ? Number(funnelIdRaw)
            : null;
        if (!funnelId || Number.isNaN(funnelId)) {
            return res.status(400).json({ message: 'Informe um funil válido.' });
        }
        const leadIdsRaw = Array.isArray(req.body?.leadIds) ? req.body.leadIds : [];
        const leadIds = leadIdsRaw
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
        if (leadIds.length === 0) {
            return res.status(400).json({ message: 'Informe os leads para atribuição.' });
        }
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        const userContext = await getCurrentUserContext(currentUserId);
        const placeholders = leadIds.map((_, index) => `$${index + 2}`).join(', ');
        if (req.user?.role === 'admin') {
            await (0, connection_1.query)(`UPDATE leads
         SET funnel_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE deleted_at IS NULL
           AND id IN (${placeholders})`, [funnelId, ...leadIds]);
        }
        else if (!userContext.companyId) {
            await (0, connection_1.query)(`UPDATE leads
         SET funnel_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE deleted_at IS NULL
           AND id IN (${placeholders})`, [funnelId, ...leadIds]);
        }
        else {
            await (0, connection_1.query)(`UPDATE leads
         SET funnel_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE deleted_at IS NULL
           AND id IN (${placeholders})
           AND (company_id = $2 OR (company_id IS NULL AND user_id IN (SELECT id FROM users WHERE company_id = $3)))`, [funnelId, userContext.companyId, userContext.companyId, ...leadIds]);
        }
        res.json({ message: 'Funil atribuído em massa com sucesso.' });
    }
    catch (error) {
        console.error('Bulk funnel assignment error:', error);
        res.status(500).json({ message: error.message || 'Erro ao atribuir funil em massa.' });
    }
});
// Get single lead
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        const userContext = await getCurrentUserContext(currentUserId);
        const isAdmin = userContext.isAdmin;
        const leadResult = await (0, connection_1.query)('SELECT l.*, u.name as user_name, f.name as funnel_name FROM leads l LEFT JOIN users u ON l.user_id = u.id LEFT JOIN funnels f ON l.funnel_id = f.id WHERE l.id = ? AND l.deleted_at IS NULL', [id]);
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lead não encontrado' });
        }
        const lead = leadResult.rows[0];
        if (!isAdmin) {
            if (userContext.companyId) {
                const leadCompanyId = lead.company_id ? Number(lead.company_id) : null;
                if (leadCompanyId !== userContext.companyId) {
                    if (!lead.user_id) {
                        return res.status(403).json({ message: 'Acesso negado' });
                    }
                    const companyMatch = await (0, connection_1.query)('SELECT 1 FROM users WHERE id = ? AND company_id = ?', [lead.user_id, userContext.companyId]);
                    if (!companyMatch.rows || companyMatch.rows.length === 0) {
                        return res.status(403).json({ message: 'Acesso negado' });
                    }
                }
            }
            else if (currentUserId) {
                const leadUserId = lead.user_id ? Number(lead.user_id) : null;
                if (leadUserId !== currentUserId) {
                    return res.status(403).json({ message: 'Acesso negado' });
                }
            }
        }
        // Parse JSON fields from SQLite
        if (lead.custom_data && typeof lead.custom_data === 'string') {
            try {
                lead.custom_data = JSON.parse(lead.custom_data);
            }
            catch (e) {
                lead.custom_data = {};
            }
        }
        if (lead.tags && typeof lead.tags === 'string') {
            try {
                lead.tags = JSON.parse(lead.tags);
            }
            catch (e) {
                lead.tags = [];
            }
        }
        // Get history
        res.json(lead);
    }
    catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ message: error.message });
    }
});
router.get('/:id/history', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const historyResult = await (0, connection_1.query)('SELECT h.id, h.created_at as date, h.description, u.name as source FROM lead_history h LEFT JOIN users u ON h.user_id = u.id WHERE h.lead_id = ? ORDER BY h.created_at DESC', [id]);
        const rows = (historyResult.rows || []).map((row) => ({
            ...row,
            source: row.source || 'SISTEMA'
        }));
        res.json(rows);
    }
    catch (error) {
        console.error('Get lead history error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Create lead
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { name, phone, email, status = 'novo_lead', origin = 'manual', custom_data = {}, tags = [], notes } = req.body;
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        const userContext = await getCurrentUserContext(currentUserId);
        const resolvedCompanyId = userContext.companyId ?? (await resolveCompanyIdForUser(currentUserId));
        if (!name || !phone) {
            return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
        }
        if (!resolvedCompanyId) {
            return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
        }
        const primaryFunnelId = await getPrimaryFunnelId(resolvedCompanyId);
        const result = await (0, connection_1.query)(`INSERT INTO leads (name, phone, email, status, origin, user_id, company_id, funnel_id, custom_data, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            name,
            phone,
            email,
            status,
            origin,
            currentUserId,
            resolvedCompanyId,
            primaryFunnelId,
            JSON.stringify(custom_data),
            JSON.stringify(tags),
            notes
        ]);
        const insertedId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id);
        const leadResult = await (0, connection_1.query)('SELECT * FROM leads WHERE id = ?', [insertedId]);
        const lead = leadResult.rows[0];
        // Parse JSON fields from SQLite
        if (lead.custom_data && typeof lead.custom_data === 'string') {
            try {
                lead.custom_data = JSON.parse(lead.custom_data);
            }
            catch (e) {
                lead.custom_data = {};
            }
        }
        if (lead.tags && typeof lead.tags === 'string') {
            try {
                lead.tags = JSON.parse(lead.tags);
            }
            catch (e) {
                lead.tags = [];
            }
        }
        // Add to history
        await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)', [lead.id, (req.user && req.user.id), 'created', 'Lead criado']);
        res.status(201).json(lead);
    }
    catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Update lead
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, status, origin, custom_data, tags, notes } = req.body;
        const requestedUserIdRaw = req.body?.user_id ?? req.body?.userId ?? null;
        const requestedUserId = requestedUserIdRaw !== null && requestedUserIdRaw !== undefined && requestedUserIdRaw !== ''
            ? Number(requestedUserIdRaw)
            : null;
        const hasFunnelId = Object.prototype.hasOwnProperty.call(req.body || {}, 'funnel_id')
            || Object.prototype.hasOwnProperty.call(req.body || {}, 'funnelId');
        const requestedFunnelIdRaw = req.body?.funnel_id ?? req.body?.funnelId ?? null;
        const requestedFunnelId = requestedFunnelIdRaw !== null && requestedFunnelIdRaw !== undefined && requestedFunnelIdRaw !== ''
            ? Number(requestedFunnelIdRaw)
            : null;
        const actorId = req.user && req.user.id ? Number(req.user.id) : null;
        let actorName = 'Usuário';
        if (actorId) {
            const actorResult = await (0, connection_1.query)('SELECT name FROM users WHERE id = ?', [actorId]);
            actorName = actorResult.rows[0]?.name || actorName;
        }
        // Get current lead
        const currentResult = await (0, connection_1.query)('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL', [id]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lead não encontrado' });
        }
        const currentLead = currentResult.rows[0];
        const parseCustomData = (value) => {
            if (!value)
                return {};
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                }
                catch (e) {
                    return {};
                }
            }
            return value;
        };
        const currentCustomData = parseCustomData(currentLead.custom_data);
        const nextCustomData = custom_data !== undefined ? parseCustomData(custom_data) : currentCustomData;
        const getDisplayLabel = (statusValue, customDataValue) => {
            if (statusValue === 'fechamento') {
                const display = customDataValue?.displayStatus;
                if (display === 'visita_concluida')
                    return 'Visita Concluída';
                if (display === 'venda_ganha')
                    return 'Venda Ganha';
                return 'Venda Ganha';
            }
            if (statusValue === 'perdido') {
                const display = customDataValue?.displayStatus;
                if (display === 'proposta')
                    return 'Proposta';
                return 'Finalizado';
            }
            const map = {
                novo_lead: 'Sem Atendimento',
                em_contato: 'Em Atendimento',
                proposta_enviada: 'Visita Agendada'
            };
            return map[statusValue] || statusValue;
        };
        if (requestedUserId !== null && !Number.isNaN(requestedUserId)) {
            const normalizedRole = String(req.user?.role || '').toLowerCase();
            if (normalizedRole !== 'admin' && normalizedRole !== 'gestor') {
                return res.status(403).json({ message: 'Apenas administradores ou gestores podem atribuir responsável' });
            }
        }
        if (hasFunnelId) {
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ message: 'Apenas administradores podem alterar funil' });
            }
        }
        // Update lead
        const updateFields = [];
        const values = [];
        if (name !== undefined) {
            updateFields.push('name = ?');
            values.push(name);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            values.push(phone);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            values.push(email);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            values.push(status);
            if (actorId && requestedUserId === null) {
                updateFields.push('user_id = ?');
                values.push(actorId);
            }
        }
        if (requestedUserId !== null && !Number.isNaN(requestedUserId)) {
            updateFields.push('user_id = ?');
            values.push(requestedUserId);
        }
        if (hasFunnelId) {
            updateFields.push('funnel_id = ?');
            values.push(requestedFunnelId);
        }
        if (origin !== undefined) {
            updateFields.push('origin = ?');
            values.push(origin);
        }
        if (custom_data !== undefined) {
            updateFields.push('custom_data = ?');
            values.push(JSON.stringify(custom_data));
        }
        if (tags !== undefined) {
            updateFields.push('tags = ?');
            values.push(JSON.stringify(tags));
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            values.push(notes);
        }
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await (0, connection_1.query)(`UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`, values);
        const result = await (0, connection_1.query)('SELECT l.*, u.name as user_name FROM leads l LEFT JOIN users u ON l.user_id = u.id WHERE l.id = ?', [id]);
        const updatedLead = result.rows[0];
        // Parse JSON fields from SQLite
        if (updatedLead.custom_data && typeof updatedLead.custom_data === 'string') {
            try {
                updatedLead.custom_data = JSON.parse(updatedLead.custom_data);
            }
            catch (e) {
                updatedLead.custom_data = {};
            }
        }
        if (updatedLead.tags && typeof updatedLead.tags === 'string') {
            try {
                updatedLead.tags = JSON.parse(updatedLead.tags);
            }
            catch (e) {
                updatedLead.tags = [];
            }
        }
        const nextUserId = requestedUserId !== null && !Number.isNaN(requestedUserId)
            ? requestedUserId
            : (status !== undefined && actorId ? actorId : currentLead.user_id);
        const userChanged = requestedUserId !== null
            && !Number.isNaN(requestedUserId)
            && Number(currentLead.user_id || 0) !== requestedUserId;
        // Add to history if status changed
        if (status && status !== currentLead.status) {
            const oldLabel = getDisplayLabel(currentLead.status, currentCustomData);
            const newLabel = getDisplayLabel(status, nextCustomData);
            await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?)', [
                id,
                nextUserId,
                'status_changed',
                `Status alterado de ${oldLabel} para ${newLabel} por ${actorName}`,
                currentLead.status,
                status
            ]);
        }
        else if (userChanged) {
            const newUserResult = await (0, connection_1.query)('SELECT name FROM users WHERE id = ?', [requestedUserId]);
            const newUserName = newUserResult.rows[0]?.name || 'Usuário';
            await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)', [
                id,
                nextUserId,
                'responsible_changed',
                `Responsável alterado para ${newUserName} por ${actorName}`
            ]);
        }
        else {
            await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)', [id, actorId, 'updated', `Lead atualizado por ${actorName}`]);
        }
        res.json(updatedLead);
    }
    catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Delete lead
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Apenas administradores podem excluir leads' });
        }
        const { id } = req.params;
        const result = await (0, connection_1.query)('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lead não encontrado' });
        }
        try {
            await (0, connection_1.query)('UPDATE leads SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        }
        catch (error) {
            await (0, connection_1.query)('UPDATE leads SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        }
        await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)', [id, (req.user && req.user.id), 'deleted', 'Lead excluído (lógico)']);
        res.json({ message: 'Lead excluído com sucesso' });
    }
    catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Hard delete lead (for tests)
router.delete('/:id/hard-delete', auth_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Apenas administradores podem excluir leads' });
        }
        const { id } = req.params;
        const result = await (0, connection_1.query)('SELECT * FROM leads WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lead não encontrado' });
        }
        await (0, connection_1.query)('DELETE FROM leads WHERE id = ?', [id]);
        res.json({ message: 'Lead removido do banco com sucesso' });
    }
    catch (error) {
        console.error('Hard delete lead error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Import CSV
router.post('/import', auth_1.authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Arquivo não fornecido' });
        }
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        const userContext = await getCurrentUserContext(currentUserId);
        const resolvedCompanyId = userContext.companyId ?? (await resolveCompanyIdForUser(currentUserId));
        if (!resolvedCompanyId) {
            return res.status(400).json({ message: 'Empresa não vinculada ao usuário.' });
        }
        const leads = [];
        const stream = stream_1.Readable.from(req.file.buffer.toString());
        const isExcel = /\.(xlsx|xls)$/i.test(req.file.originalname || '')
            || ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
                .includes(req.file.mimetype || '');
        const finalizeImport = async () => {
            if (!leads.length) {
                return res.status(400).json({ message: 'Nenhum lead válido encontrado no arquivo' });
            }
            const insertedLeads = [];
            const primaryFunnelId = await getPrimaryFunnelId(resolvedCompanyId);
            for (const leadData of leads) {
                if (leadData.name && leadData.phone) {
                    const result = await (0, connection_1.query)(`INSERT INTO leads (name, phone, email, status, origin, user_id, company_id, funnel_id, custom_data, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        leadData.name,
                        leadData.phone,
                        leadData.email,
                        leadData.status,
                        leadData.origin,
                        currentUserId,
                        resolvedCompanyId,
                        primaryFunnelId,
                        JSON.stringify(leadData.custom_data),
                        JSON.stringify(leadData.tags)
                    ]);
                    const insertedId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id);
                    const leadResult = await (0, connection_1.query)('SELECT * FROM leads WHERE id = ?', [insertedId]);
                    const insertedLead = leadResult.rows[0];
                    // Parse JSON fields from SQLite
                    if (insertedLead.custom_data && typeof insertedLead.custom_data === 'string') {
                        try {
                            insertedLead.custom_data = JSON.parse(insertedLead.custom_data);
                        }
                        catch (e) {
                            insertedLead.custom_data = {};
                        }
                    }
                    if (insertedLead.tags && typeof insertedLead.tags === 'string') {
                        try {
                            insertedLead.tags = JSON.parse(insertedLead.tags);
                        }
                        catch (e) {
                            insertedLead.tags = [];
                        }
                    }
                    insertedLeads.push(insertedLead);
                    // Add to history
                    await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)', [insertedId, (req.user && req.user.id), 'imported', 'Lead importado via CSV/XLSX']);
                }
            }
            if (insertedLeads.length === 0) {
                return res.status(400).json({ message: 'Nenhum lead válido encontrado no arquivo' });
            }
            res.json({
                message: `${insertedLeads.length} leads importados com sucesso`,
                leads: insertedLeads,
                total: insertedLeads.length
            });
        };
        if (isExcel) {
            const rows = buildRowsFromXlsx(req.file.buffer);
            if (!rows.length) {
                return res.status(400).json({ message: 'Arquivo inválido ou vazio.' });
            }
            if (!Array.isArray(rows[0])) {
                const headerValidation = validateHeaders(Object.keys(rows[0] || {}));
                if (!headerValidation.ok) {
                    return res.status(400).json({
                        message: `Arquivo inválido. Colunas obrigatórias ausentes: ${headerValidation.missing.join(', ')}.`,
                    });
                }
            }
            rows.forEach((row) => {
                leads.push(mapRowToLead(row));
            });
            await finalizeImport();
            return;
        }
        stream
            .pipe((0, csv_parser_1.default)({
            mapHeaders: ({ header }) => normalizeHeaderKey(header),
        }))
            .on('headers', (headers) => {
            const headerValidation = validateHeaders(headers);
            if (!headerValidation.ok) {
                res.status(400).json({
                    message: `Arquivo inválido. Colunas obrigatórias ausentes: ${headerValidation.missing.join(', ')}.`,
                });
                stream.destroy(new Error('invalid_headers'));
            }
        })
            .on('data', (row) => {
            if (res.headersSent)
                return;
            leads.push(mapRowToLead(row));
        })
            .on('end', async () => {
            try {
                if (res.headersSent)
                    return;
                await finalizeImport();
            }
            catch (error) {
                console.error('Import error:', error);
                res.status(500).json({ message: error.message || 'Erro ao importar leads' });
            }
        })
            .on('error', (error) => {
            if (res.headersSent)
                return;
            console.error('CSV parse error:', error);
            res.status(500).json({ message: 'Erro ao processar arquivo CSV' });
        });
    }
    catch (error) {
        console.error('Import leads error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=leads.js.map