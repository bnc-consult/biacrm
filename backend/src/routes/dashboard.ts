import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get funnel data
router.get('/funnel', authenticate, async (req: AuthRequest, res) => {
  try {
    let userFilter = '';
    const params: any[] = [];
    const { startDate, endDate, origin, status: statusFilter, userId, product } = req.query as {
      startDate?: string;
      endDate?: string;
      origin?: string;
      status?: string;
      userId?: string;
      product?: string;
    };
    
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
      } else {
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
    
    const getDisplayStatus = (status: string, customData: any) => {
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

      const statusMap: Record<string, string> = {
        novo_lead: 'sem_atendimento',
        em_contato: 'em_atendimento',
        proposta_enviada: 'visita_agendada',
      };

      return statusMap[status] || status;
    };

    const getFunnelStatus = (displayStatus: string | undefined) => {
      if (displayStatus === 'sem_atendimento') return 'novo_lead';
      if (displayStatus === 'em_atendimento') return 'em_contato';
      if (displayStatus === 'visita_agendada') return 'visita_agendada';
      if (displayStatus === 'visita_concluida') return 'visita_concluida';
      if (displayStatus === 'proposta') return 'proposta';
      if (displayStatus === 'venda_ganha') return 'venda_ganha';
      return null;
    };

    // Buscar todos os leads para processar
    const allLeadsSql = `SELECT status, custom_data FROM leads WHERE deleted_at IS NULL ${userFilter} ${dateFilter}`;
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
        } catch (e) {
          customData = {};
        }
      } else if (row.custom_data) {
        customData = row.custom_data;
      }

      const displayStatus = getDisplayStatus(status, customData);
      const productValue = (customData as any)?.product || (customData as any)?.produto || '';
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

    res.json({
      funnel: funnelData,
      summary: {
        semAtendimento: semAtendimentoCount,
        vendasGanhas: vendasGanhasCount,
        finalizados: finalizadosCount
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

// Get products for filters
router.get('/products', authenticate, async (req: AuthRequest, res) => {
  try {
    let userFilter = '';
    const params: any[] = [];

    if (!req.user || req.user.role !== 'admin') {
      userFilter = 'AND (user_id = ? OR user_id IS NULL)';
      params.push((req.user && req.user.id));
    }

    const sql = `SELECT custom_data FROM leads WHERE deleted_at IS NULL ${userFilter}`;
    const result = await query(sql, params);
    const products = new Set<string>();
    for (const row of result.rows) {
      let customData = {};
      if (row.custom_data && typeof row.custom_data === 'string') {
        try {
          customData = JSON.parse(row.custom_data);
        } catch (e) {
          customData = {};
        }
      } else if (row.custom_data) {
        customData = row.custom_data;
      }
      const productValue = (customData as any)?.product || (customData as any)?.produto;
      if (productValue && String(productValue).trim()) {
        products.add(String(productValue).trim());
      }
    }
    res.json(Array.from(products).sort((a, b) => a.localeCompare(b)));
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get users for filters
router.get('/users', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    if (req.user.role !== 'admin') {
      const result = await query('SELECT id, name FROM users WHERE id = ?', [req.user.id]);
      return res.json(result.rows);
    }

    const result = await query('SELECT id, name FROM users ORDER BY name');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get users error:', error);
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

