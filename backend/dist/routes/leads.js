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
    'nome completo',
    'lead título',
    'nome',
    'pessoa de contato',
    'contato da empresa',
    'contato principal',
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
    const name = getField(row, [
        ...NAME_KEYS,
    ]);
    const phone = getField(row, [
        ...PHONE_KEYS,
    ]);
    const email = getField(row, [
        ...EMAIL_KEYS,
    ]);
    const origin = getField(row, [
        ...ORIGIN_KEYS,
    ]) || 'manual';
    const tags = parseTags(getField(row, TAGS_KEYS));
    const custom_data = {
        ...(row['etapa do lead'] ? { lead_stage: row['etapa do lead'] } : {}),
        ...(row['funil de vendas'] ? { funnel: row['funil de vendas'] } : {}),
        ...(row['lead usuário responsável'] ? { lead_owner: row['lead usuário responsável'] } : {}),
        ...(row['empresa do contato'] ? { contact_company: row['empresa do contato'] } : {}),
        ...(row["empresa lead 's"] ? { lead_company: row["empresa lead 's"] } : {}),
        ...(row['próxima tarefa'] ? { next_task: row['próxima tarefa'] } : {}),
        ...(row['fechada em'] ? { closed_at: row['fechada em'] } : {}),
        ...(row['obs'] ? { notes: row['obs'] } : {}),
        ...(row['etapa'] ? { stage: row['etapa'] } : {}),
        ...(row['local_interesse'] ? { local_interesse: row['local_interesse'] } : {}),
        ...(row['local_intersse'] ? { local_intersse: row['local_intersse'] } : {}),
        ...(row['tipo_imovel'] ? { tipo_imovel: row['tipo_imovel'] } : {}),
        ...(row['interesse'] ? { interesse: row['interesse'] } : {}),
        ...(row['posição (contato)'] ? { contact_position: row['posição (contato)'] } : {}),
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
        let sql = 'SELECT l.*, u.name as user_name FROM leads l LEFT JOIN users u ON l.user_id = u.id WHERE l.deleted_at IS NULL';
        const params = [];
        let isAdmin = false;
        let companyUserIds = [];
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        if (currentUserId) {
            const userResult = await (0, connection_1.query)('SELECT id, role, company_id FROM users WHERE id = ?', [currentUserId]);
            const currentUser = userResult.rows && userResult.rows[0];
            isAdmin = currentUser?.role === 'admin';
            if (!isAdmin && currentUser?.company_id) {
                const companyUsers = await (0, connection_1.query)('SELECT id FROM users WHERE company_id = ?', [currentUser.company_id]);
                companyUserIds = (companyUsers.rows || []).map((row) => Number(row.id)).filter(Boolean);
            }
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
        // If user is not admin, filter by company users (or own leads if no company)
        if (!isAdmin) {
            if (companyUserIds.length > 0) {
                const placeholders = companyUserIds.map(() => '?').join(', ');
                sql += ` AND l.user_id IN (${placeholders})`;
                params.push(...companyUserIds);
            }
            else if (currentUserId) {
                sql += ' AND l.user_id = ?';
                params.push(currentUserId);
            }
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
        if (isAdmin) {
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
// Get single lead
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
        let isAdmin = false;
        let companyUserIds = [];
        if (currentUserId) {
            const userResult = await (0, connection_1.query)('SELECT id, role, company_id FROM users WHERE id = ?', [currentUserId]);
            const currentUser = userResult.rows && userResult.rows[0];
            isAdmin = currentUser?.role === 'admin';
            if (!isAdmin && currentUser?.company_id) {
                const companyUsers = await (0, connection_1.query)('SELECT id FROM users WHERE company_id = ?', [currentUser.company_id]);
                companyUserIds = (companyUsers.rows || []).map((row) => Number(row.id)).filter(Boolean);
            }
        }
        const leadResult = await (0, connection_1.query)('SELECT l.*, u.name as user_name FROM leads l LEFT JOIN users u ON l.user_id = u.id WHERE l.id = ? AND l.deleted_at IS NULL', [id]);
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lead não encontrado' });
        }
        const lead = leadResult.rows[0];
        if (!isAdmin) {
            const leadUserId = lead.user_id ? Number(lead.user_id) : null;
            if (companyUserIds.length > 0) {
                if (!leadUserId || !companyUserIds.includes(leadUserId)) {
                    return res.status(403).json({ message: 'Acesso negado' });
                }
            }
            else if (currentUserId && leadUserId !== currentUserId) {
                return res.status(403).json({ message: 'Acesso negado' });
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
        if (!name || !phone) {
            return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
        }
        const result = await (0, connection_1.query)(`INSERT INTO leads (name, phone, email, status, origin, user_id, custom_data, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, phone, email, status, origin, (req.user && req.user.id), JSON.stringify(custom_data), JSON.stringify(tags), notes]);
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
            if (actorId) {
                updateFields.push('user_id = ?');
                values.push(actorId);
            }
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
        // Add to history if status changed
        if (status && status !== currentLead.status) {
            const oldLabel = getDisplayLabel(currentLead.status, currentCustomData);
            const newLabel = getDisplayLabel(status, nextCustomData);
            await (0, connection_1.query)('INSERT INTO lead_history (lead_id, user_id, action, description, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?)', [
                id,
                actorId,
                'status_changed',
                `Status alterado de ${oldLabel} para ${newLabel} por ${actorName}`,
                currentLead.status,
                status
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
            for (const leadData of leads) {
                if (leadData.name && leadData.phone) {
                    const result = await (0, connection_1.query)(`INSERT INTO leads (name, phone, email, status, origin, user_id, custom_data, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [leadData.name, leadData.phone, leadData.email, leadData.status, leadData.origin, (req.user && req.user.id), JSON.stringify(leadData.custom_data), JSON.stringify(leadData.tags)]);
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
            const headerValidation = validateHeaders(Object.keys(rows[0] || {}));
            if (!headerValidation.ok) {
                return res.status(400).json({
                    message: `Arquivo inválido. Colunas obrigatórias ausentes: ${headerValidation.missing.join(', ')}.`,
                });
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