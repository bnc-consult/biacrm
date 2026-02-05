import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user && req.user.id ? Number(req.user.id) : null;
    const isAdmin = req.user?.role === 'admin';
    if (!userId && !isAdmin) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { startDate, endDate, status } = req.query as {
      startDate?: string;
      endDate?: string;
      status?: string;
    };

    let sql = `
      SELECT
        s.id,
        s.lead_id,
        s.phone,
        s.message,
        s.scheduled_for,
        s.status as schedule_status,
        s.sent_at,
        s.error_message,
        s.created_at as scheduled_created_at,
        l.name as lead_name,
        l.status as lead_status,
        l.custom_data as lead_custom_data,
        l.user_id as lead_user_id,
        u.name as user_name
      FROM scheduled_messages s
      LEFT JOIN leads l ON l.id = s.lead_id
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (!isAdmin) {
      sql += ' AND s.user_id = $1';
      params.push(userId);
    }
    if (status) {
      sql += ` AND s.status = $${params.length + 1}`;
      params.push(status);
    }
    if (startDate) {
      sql += ` AND s.scheduled_for >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND s.scheduled_for <= $${params.length + 1}`;
      params.push(endDate);
    }

    sql += ' ORDER BY s.scheduled_for DESC';

    const result = await query(sql, params);
    const rows = result.rows.map((row: any) => {
      if (row.lead_custom_data && typeof row.lead_custom_data === 'string') {
        try {
          row.lead_custom_data = JSON.parse(row.lead_custom_data);
        } catch (e) {
          row.lead_custom_data = {};
        }
      }
      return row;
    });

    return res.json({ appointments: rows });
  } catch (error: any) {
    console.error('Appointments fetch failed:', error?.message || error);
    return res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
  }
});

export default router;
