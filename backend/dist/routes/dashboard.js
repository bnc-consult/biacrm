"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get funnel data
router.get('/funnel', auth_1.authenticate, async (req, res) => {
    try {
        let userFilter = '';
        const params = [];
        const { startDate, endDate, origin, status: statusFilter, userId, product } = req.query;
        if (!req.user || req.user.role !== 'admin') {
            userFilter = 'AND (user_id = ? OR user_id IS NULL)';
            params.push((req.user && req.user.id));
        }
        let dateFilter = '';
        if (startDate) {
            dateFilter += ' AND DATE(created_at) >= DATE(?)';
            params.push(startDate);
        }
        if (endDate) {
            dateFilter += ' AND DATE(created_at) <= DATE(?)';
            params.push(endDate);
        }
        if (origin) {
            dateFilter += ' AND origin = ?';
            params.push(origin);
        }
        if (userId) {
            if (userId === 'unassigned') {
                dateFilter += ' AND user_id IS NULL';
            }
            else {
                const parsedUserId = Number(userId);
                if (!Number.isNaN(parsedUserId)) {
                    dateFilter += ' AND user_id = ?';
                    params.push(parsedUserId);
                }
            }
        }
        // Mapeamento dos status do frontend para os do backend
        // O frontend espera: novo_lead, em_contato, visita_concluida, visita_agendada, proposta, venda_ganha
        // O backend tem: novo_lead, em_contato, proposta_enviada, fechamento, perdido
        const getDisplayStatus = (status, customData) => {
            if (status === 'fechamento') {
                const displayStatus = customData?.displayStatus;
                if (displayStatus === 'visita_concluida') {
                    return 'visita_concluida';
                }
                if (displayStatus === 'venda_ganha') {
                    return 'venda_ganha';
                }
                return 'venda_ganha';
            }
            if (status === 'perdido') {
                const displayStatus = customData?.displayStatus;
                if (displayStatus === 'proposta') {
                    return 'proposta';
                }
                return 'finalizado';
            }
            const statusMap = {
                novo_lead: 'sem_atendimento',
                em_contato: 'em_atendimento',
                proposta_enviada: 'visita_agendada',
            };
            return statusMap[status] || status;
        };
        const getFunnelStatus = (displayStatus) => {
            if (displayStatus === 'sem_atendimento')
                return 'novo_lead';
            if (displayStatus === 'em_atendimento')
                return 'em_contato';
            if (displayStatus === 'visita_agendada')
                return 'visita_agendada';
            if (displayStatus === 'visita_concluida')
                return 'visita_concluida';
            if (displayStatus === 'proposta')
                return 'proposta';
            if (displayStatus === 'venda_ganha')
                return 'venda_ganha';
            return null;
        };
        // Buscar todos os leads para processar
        const allLeadsSql = `SELECT status, custom_data FROM leads WHERE deleted_at IS NULL ${userFilter} ${dateFilter}`;
        const allLeadsResult = await (0, connection_1.query)(allLeadsSql, params);
        // Processar leads e contar por status do funil
        // Ordem correta do funil: Sem Atendimento -> Em Atendimento -> Visita Agendada -> Visita Concluída -> Proposta -> Venda Ganha
        const funnelStatuses = ['novo_lead', 'em_contato', 'visita_agendada', 'visita_concluida', 'proposta', 'venda_ganha'];
        const counts = {
            'novo_lead': 0,
            'em_contato': 0,
            'visita_concluida': 0,
            'visita_agendada': 0,
            'proposta': 0,
            'venda_ganha': 0
        };
        let semAtendimentoCount = 0;
        let vendasGanhasCount = 0;
        let finalizadosCount = 0;
        // Contar leads por status do funil
        for (const row of allLeadsResult.rows) {
            const status = row.status;
            let customData = {};
            // Parse custom_data se for string
            if (row.custom_data && typeof row.custom_data === 'string') {
                try {
                    customData = JSON.parse(row.custom_data);
                }
                catch (e) {
                    customData = {};
                }
            }
            else if (row.custom_data) {
                customData = row.custom_data;
            }
            const displayStatus = getDisplayStatus(status, customData);
            const productValue = customData?.product || customData?.produto || '';
            if (product && String(productValue).toLowerCase() !== String(product).toLowerCase()) {
                continue;
            }
            const funnelStatus = getFunnelStatus(displayStatus);
            if (statusFilter && funnelStatus !== statusFilter) {
                continue;
            }
            if (funnelStatus) {
                counts[funnelStatus]++;
            }
            if (displayStatus === 'sem_atendimento') {
                semAtendimentoCount++;
            }
            if (displayStatus === 'venda_ganha') {
                vendasGanhasCount++;
            }
            if (displayStatus === 'finalizado') {
                finalizadosCount++;
            }
        }
        // Construir dados do funil com percentuais
        const funnelData = [];
        for (let i = 0; i < funnelStatuses.length; i++) {
            const status = funnelStatuses[i];
            const count = counts[status] || 0;
            // Calculate conversion rate from previous stage
            // Para a primeira etapa (novo_lead), não há porcentagem em relação à anterior
            let conversionRate = 0;
            if (i > 0) {
                const prevStatus = funnelStatuses[i - 1];
                const prevCount = counts[prevStatus] || 0;
                // Calcular porcentagem em relação à etapa anterior
                // Se a etapa anterior tem 0, a porcentagem é 0
                if (prevCount > 0) {
                    conversionRate = (count / prevCount) * 100;
                }
                else {
                    // Se a etapa anterior tem 0, não faz sentido calcular porcentagem
                    conversionRate = 0;
                }
            }
            // Primeira etapa (i === 0): conversionRate permanece 0
            // O frontend tratará isso e mostrará 100% quando calcular em relação ao total
            funnelData.push({
                status,
                count,
                conversionRate: conversionRate.toFixed(2)
            });
        }
        res.json({
            funnel: funnelData,
            summary: {
                semAtendimento: semAtendimentoCount,
                vendasGanhas: vendasGanhasCount,
                finalizados: finalizadosCount
            }
        });
    }
    catch (error) {
        console.error('Get funnel error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get leads by origin
router.get('/leads-by-origin', auth_1.authenticate, async (req, res) => {
    try {
        let userFilter = '';
        const params = [];
        if (!req.user || req.user.role !== 'admin') {
            userFilter = 'WHERE (user_id = ? OR user_id IS NULL)';
            params.push((req.user && req.user.id));
        }
        const sql = `
      SELECT origin, COUNT(*) as count
      FROM leads
      ${userFilter}
      GROUP BY origin
      ORDER BY count DESC
    `;
        const result = await (0, connection_1.query)(sql, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get leads by origin error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get products for filters
router.get('/products', auth_1.authenticate, async (req, res) => {
    try {
        let userFilter = '';
        const params = [];
        if (!req.user || req.user.role !== 'admin') {
            userFilter = 'AND (user_id = ? OR user_id IS NULL)';
            params.push((req.user && req.user.id));
        }
        const sql = `SELECT custom_data FROM leads WHERE deleted_at IS NULL ${userFilter}`;
        const result = await (0, connection_1.query)(sql, params);
        const products = new Set();
        for (const row of result.rows) {
            let customData = {};
            if (row.custom_data && typeof row.custom_data === 'string') {
                try {
                    customData = JSON.parse(row.custom_data);
                }
                catch (e) {
                    customData = {};
                }
            }
            else if (row.custom_data) {
                customData = row.custom_data;
            }
            const productValue = customData?.product || customData?.produto;
            if (productValue && String(productValue).trim()) {
                products.add(String(productValue).trim());
            }
        }
        res.json(Array.from(products).sort((a, b) => a.localeCompare(b)));
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get users for filters
router.get('/users', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        if (req.user.role !== 'admin') {
            const result = await (0, connection_1.query)('SELECT id, name FROM users WHERE id = ?', [req.user.id]);
            return res.json(result.rows);
        }
        const result = await (0, connection_1.query)('SELECT id, name FROM users ORDER BY name');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get leads by date
router.get('/leads-by-date', auth_1.authenticate, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        let userFilter = '';
        const params = [];
        if (!req.user || req.user.role !== 'admin') {
            userFilter = 'AND (user_id = ? OR user_id IS NULL)';
            params.push((req.user && req.user.id));
        }
        const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM leads
      WHERE created_at >= datetime('now', '-${days} days')
      ${userFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
        const result = await (0, connection_1.query)(sql, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get leads by date error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map