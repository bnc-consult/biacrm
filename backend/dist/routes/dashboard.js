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
        if (!req.user || req.user.role !== 'admin') {
            userFilter = 'AND (user_id = ? OR user_id IS NULL)';
            params.push((req.user && req.user.id));
        }
        // Mapeamento dos status do frontend para os do backend
        // O frontend espera: novo_lead, em_contato, visita_concluida, visita_agendada, proposta, venda_ganha
        // O backend tem: novo_lead, em_contato, proposta_enviada, fechamento, perdido
        // Buscar todos os leads para processar
        const allLeadsSql = `SELECT status, custom_data FROM leads WHERE 1=1 ${userFilter}`;
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
            const displayStatus = (customData && customData.displayStatus);
            // Mapear status do backend para status do funil
            if (status === 'novo_lead') {
                counts['novo_lead']++;
            }
            else if (status === 'em_contato') {
                counts['em_contato']++;
            }
            else if (status === 'proposta_enviada') {
                // proposta_enviada pode ser "visita_agendada" ou "proposta" dependendo do contexto
                // Por padrão, vamos considerar como "visita_agendada"
                counts['visita_agendada']++;
            }
            else if (status === 'fechamento') {
                // Usar displayStatus para diferenciar entre visita_concluida e venda_ganha
                if (displayStatus === 'visita_concluida') {
                    counts['visita_concluida']++;
                }
                else {
                    // Por padrão, fechamento vai para venda_ganha
                    counts['venda_ganha']++;
                }
            }
            else if (status === 'perdido') {
                // Mapear "perdido" para "proposta" no funil
                counts['proposta']++;
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
        // Get summary stats
        let summarySql = `
      SELECT 
        SUM(CASE WHEN status = 'novo_lead' AND user_id IS NULL THEN 1 ELSE 0 END) as sem_atendimento,
        SUM(CASE WHEN status = 'fechamento' THEN 1 ELSE 0 END) as vendas_ganhas,
        SUM(CASE WHEN status = 'perdido' THEN 1 ELSE 0 END) as finalizados
      FROM leads
      WHERE 1=1 ${userFilter}
    `;
        const summaryResult = await (0, connection_1.query)(summarySql, params);
        const summary = summaryResult.rows[0];
        res.json({
            funnel: funnelData,
            summary: {
                semAtendimento: parseInt(summary.sem_atendimento || 0),
                vendasGanhas: parseInt(summary.vendas_ganhas || 0),
                finalizados: parseInt(summary.finalizados || 0)
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