import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get funnel data
router.get('/funnel', authenticate, async (req: AuthRequest, res) => {
  try {
    let userFilter = '';
    const params: any[] = [];
    
    if (!req.user || req.user.role !== 'admin') {
      userFilter = 'AND (user_id = ? OR user_id IS NULL)';
      params.push((req.user && req.user.id));
    }

    // Mapeamento dos status do frontend para os do backend
    // O frontend espera: novo_lead, em_contato, visita_concluida, visita_agendada, proposta, venda_ganha
    // O backend tem: novo_lead, em_contato, proposta_enviada, fechamento, perdido
    
    // Buscar todos os leads para processar
    const allLeadsSql = `SELECT status, custom_data FROM leads WHERE 1=1 ${userFilter}`;
    const allLeadsResult = await query(allLeadsSql, params);
    
    // Processar leads e contar por status do funil
    // Ordem correta do funil: Sem Atendimento -> Em Atendimento -> Visita Agendada -> Visita Concluída -> Proposta -> Venda Ganha
    const funnelStatuses = ['novo_lead', 'em_contato', 'visita_agendada', 'visita_concluida', 'proposta', 'venda_ganha'];
    const counts: Record<string, number> = {
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
        } catch (e) {
          customData = {};
        }
      } else if (row.custom_data) {
        customData = row.custom_data;
      }

      const displayStatus = ((customData as any) && (customData as any).displayStatus);

      // Mapear status do backend para status do funil
      if (status === 'novo_lead') {
        counts['novo_lead']++;
      } else if (status === 'em_contato') {
        counts['em_contato']++;
      } else if (status === 'proposta_enviada') {
        // proposta_enviada pode ser "visita_agendada" ou "proposta" dependendo do contexto
        // Por padrão, vamos considerar como "visita_agendada"
        counts['visita_agendada']++;
      } else if (status === 'fechamento') {
        // Usar displayStatus para diferenciar entre visita_concluida e venda_ganha
        if (displayStatus === 'visita_concluida') {
          counts['visita_concluida']++;
        } else {
          // Por padrão, fechamento vai para venda_ganha
          counts['venda_ganha']++;
        }
      } else if (status === 'perdido') {
        // Mapear "perdido" para "proposta" no funil
        counts['proposta']++;
      }
    }

    // Construir dados do funil com percentuais
    const funnelData: any[] = [];
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
        } else {
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

    const summaryResult = await query(summarySql, params);
    const summary = summaryResult.rows[0];

    res.json({
      funnel: funnelData,
      summary: {
        semAtendimento: parseInt(summary.sem_atendimento || 0),
        vendasGanhas: parseInt(summary.vendas_ganhas || 0),
        finalizados: parseInt(summary.finalizados || 0)
      }
    });
  } catch (error: any) {
    console.error('Get funnel error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get leads by origin
router.get('/leads-by-origin', authenticate, async (req: AuthRequest, res) => {
  try {
    let userFilter = '';
    const params: any[] = [];
    
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

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get leads by origin error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get leads by date
router.get('/leads-by-date', authenticate, async (req: AuthRequest, res) => {
  try {
    const { days = 30 } = req.query;
    let userFilter = '';
    const params: any[] = [];
    
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

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get leads by date error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

