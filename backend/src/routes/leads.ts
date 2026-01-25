import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const normalizePhone = (phone: string) => String(phone || '').replace(/\D/g, '');
const getPhoneVariants = (digits: string) => {
  const variants = new Set<string>();
  if (!digits) return variants;
  variants.add(digits);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    variants.add(digits.slice(2));
  }
  if (digits.length === 10 || digits.length === 11) {
    variants.add(`55${digits}`);
  }
  if (digits.length === 11 && digits[2] === '9') {
    variants.add(`${digits.slice(0, 2)}${digits.slice(3)}`);
  } else if (digits.length === 10) {
    variants.add(`${digits.slice(0, 2)}9${digits.slice(2)}`);
  }
  return variants;
};
const isSameLead = (storedPhone: string, leadPhone: string) => {
  const storedDigits = normalizePhone(storedPhone);
  const leadDigits = normalizePhone(leadPhone);
  if (!storedDigits || !leadDigits) return false;
  if (storedDigits === leadDigits) return true;
  const minLen = Math.min(storedDigits.length, leadDigits.length);
  if (minLen < 10) return false;
  const storedVariants = getPhoneVariants(storedDigits);
  const leadVariants = getPhoneVariants(leadDigits);
  for (const a of storedVariants) {
    for (const b of leadVariants) {
      if (a === b) return true;
      if (a.endsWith(b) || b.endsWith(a)) return true;
    }
  }
  return false;
};

// Get all leads
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, search, origin } = req.query;
    let sql = 'SELECT l.*, u.name as user_name FROM leads l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1';
    const params: any[] = [];

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

    // If user is not admin, filter by user_id
    if (!req.user || req.user.role !== 'admin') {
      sql += ' AND (l.user_id = ? OR l.user_id IS NULL)';
      params.push((req.user && req.user.id));
    }

    sql += ' ORDER BY l.created_at DESC';

    const result = await query(sql, params);
    // Parse JSON fields from SQLite
    const parsedRows = result.rows.map((row: any) => {
      if (row.custom_data && typeof row.custom_data === 'string') {
        try {
          row.custom_data = JSON.parse(row.custom_data);
        } catch (e) {
          row.custom_data = {};
        }
      }
      if (row.tags && typeof row.tags === 'string') {
        try {
          row.tags = JSON.parse(row.tags);
        } catch (e) {
          row.tags = [];
        }
      }
      return row;
    });

    const currentUserId = req.user && req.user.id ? Number(req.user.id) : null;
    let unreadRows: any[] = [];
    if (req.user && req.user.role === 'admin') {
      const userIds = Array.from(new Set(parsedRows.map((row: any) => Number(row.user_id)).filter(Boolean)));
      if (userIds.length > 0) {
        const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
        const unreadResult = await query(
          `SELECT phone, user_id, COUNT(*) as count
           FROM whatsapp_messages
           WHERE user_id IN (${placeholders})
             AND direction = 'in'
             AND (is_read = 0 OR is_read IS NULL)
           GROUP BY user_id, phone`,
          userIds
        );
        unreadRows = unreadResult.rows || [];
      }
    } else if (currentUserId) {
      const unreadResult = await query(
        `SELECT phone, user_id, COUNT(*) as count
         FROM whatsapp_messages
         WHERE user_id = $1
           AND direction = 'in'
           AND (is_read = 0 OR is_read IS NULL)
         GROUP BY user_id, phone`,
        [currentUserId]
      );
      unreadRows = unreadResult.rows || [];
    }

    const unreadByUser = new Map<number, any[]>();
    unreadRows.forEach((row: any) => {
      const userId = Number(row.user_id);
      if (!unreadByUser.has(userId)) {
        unreadByUser.set(userId, []);
      }
      unreadByUser.get(userId)?.push(row);
    });

    const enrichedRows = parsedRows.map((row: any) => {
      const rowUserId = row.user_id ? Number(row.user_id) : currentUserId;
      const candidates = rowUserId ? (unreadByUser.get(rowUserId) || []) : [];
      let unreadCount = 0;
      candidates.forEach((messageRow: any) => {
        if (isSameLead(messageRow.phone || '', row.phone || '')) {
          unreadCount += Number(messageRow.count || 0);
        }
      });
      return { ...row, unread_count: unreadCount };
    });
    res.json(enrichedRows);
  } catch (error: any) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single lead
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const leadResult = await query(
      'SELECT l.*, u.name as user_name FROM leads l LEFT JOIN users u ON l.user_id = u.id WHERE l.id = ?',
      [id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lead não encontrado' });
    }

    const lead = leadResult.rows[0];
    
    // Parse JSON fields from SQLite
    if (lead.custom_data && typeof lead.custom_data === 'string') {
      try {
        lead.custom_data = JSON.parse(lead.custom_data);
      } catch (e) {
        lead.custom_data = {};
      }
    }
    if (lead.tags && typeof lead.tags === 'string') {
      try {
        lead.tags = JSON.parse(lead.tags);
      } catch (e) {
        lead.tags = [];
      }
    }

    // Get history
    const historyResult = await query(
      'SELECT h.*, u.name as user_name FROM lead_history h LEFT JOIN users u ON h.user_id = u.id WHERE h.lead_id = ? ORDER BY h.created_at DESC',
      [id]
    );

    lead.history = historyResult.rows;

    res.json(lead);
  } catch (error: any) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create lead
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, phone, email, status = 'novo_lead', origin = 'manual', custom_data = {}, tags = [], notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO leads (name, phone, email, status, origin, user_id, custom_data, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email, status, origin, (req.user && req.user.id), JSON.stringify(custom_data), JSON.stringify(tags), notes]
    );
    const insertedId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id);
    const leadResult = await query('SELECT * FROM leads WHERE id = ?', [insertedId]);
    const lead = leadResult.rows[0];
    
    // Parse JSON fields from SQLite
    if (lead.custom_data && typeof lead.custom_data === 'string') {
      try {
        lead.custom_data = JSON.parse(lead.custom_data);
      } catch (e) {
        lead.custom_data = {};
      }
    }
    if (lead.tags && typeof lead.tags === 'string') {
      try {
        lead.tags = JSON.parse(lead.tags);
      } catch (e) {
        lead.tags = [];
      }
    }

    // Add to history
    await query(
      'INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)',
      [lead.id, (req.user && req.user.id), 'created', 'Lead criado']
    );

    res.status(201).json(lead);
  } catch (error: any) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update lead
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, status, origin, custom_data, tags, notes } = req.body;

    // Get current lead
    const currentResult = await query('SELECT * FROM leads WHERE id = ?', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lead não encontrado' });
    }

    const currentLead = currentResult.rows[0];

    // Update lead
    const updateFields: string[] = [];
    const values: any[] = [];

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

    await query(
      `UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    const result = await query('SELECT * FROM leads WHERE id = ?', [id]);
    const updatedLead = result.rows[0];
    
    // Parse JSON fields from SQLite
    if (updatedLead.custom_data && typeof updatedLead.custom_data === 'string') {
      try {
        updatedLead.custom_data = JSON.parse(updatedLead.custom_data);
      } catch (e) {
        updatedLead.custom_data = {};
      }
    }
    if (updatedLead.tags && typeof updatedLead.tags === 'string') {
      try {
        updatedLead.tags = JSON.parse(updatedLead.tags);
      } catch (e) {
        updatedLead.tags = [];
      }
    }

    // Add to history if status changed
    if (status && status !== currentLead.status) {
      await query(
        'INSERT INTO lead_history (lead_id, user_id, action, description, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, (req.user && req.user.id), 'status_changed', `Status alterado de ${currentLead.status} para ${status}`, currentLead.status, status]
      );
    } else {
      await query(
        'INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)',
        [id, (req.user && req.user.id), 'updated', 'Lead atualizado']
      );
    }

    res.json(updatedLead);
  } catch (error: any) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete lead
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM leads WHERE id = ?', [id]);
    await query('DELETE FROM leads WHERE id = ?', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lead não encontrado' });
    }

    res.json({ message: 'Lead deletado com sucesso' });
  } catch (error: any) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Import CSV
router.post('/import', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo não fornecido' });
    }

    const leads: any[] = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row) => {
        leads.push({
          name: row.name || row.nome || '',
          phone: row.phone || row.telefone || row.phone || '',
          email: row.email || '',
          origin: row.origin || row.origem || 'manual',
          status: 'novo_lead',
          custom_data: {},
          tags: []
        });
      })
      .on('end', async () => {
        try {
          const insertedLeads = [];

          for (const leadData of leads) {
            if (leadData.name && leadData.phone) {
              const result = await query(
                `INSERT INTO leads (name, phone, email, status, origin, user_id, custom_data, tags)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [leadData.name, leadData.phone, leadData.email, leadData.status, leadData.origin, (req.user && req.user.id), JSON.stringify(leadData.custom_data), JSON.stringify(leadData.tags)]
              );
              const insertedId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id);
              const leadResult = await query('SELECT * FROM leads WHERE id = ?', [insertedId]);
              const insertedLead = leadResult.rows[0];
              
              // Parse JSON fields from SQLite
              if (insertedLead.custom_data && typeof insertedLead.custom_data === 'string') {
                try {
                  insertedLead.custom_data = JSON.parse(insertedLead.custom_data);
                } catch (e) {
                  insertedLead.custom_data = {};
                }
              }
              if (insertedLead.tags && typeof insertedLead.tags === 'string') {
                try {
                  insertedLead.tags = JSON.parse(insertedLead.tags);
                } catch (e) {
                  insertedLead.tags = [];
                }
              }
              
              insertedLeads.push(insertedLead);

              // Add to history
              await query(
                'INSERT INTO lead_history (lead_id, user_id, action, description) VALUES (?, ?, ?, ?)',
                [insertedId, (req.user && req.user.id), 'imported', 'Lead importado via CSV']
              );
            }
          }

          if (insertedLeads.length === 0) {
            return res.status(400).json({ message: 'Nenhum lead válido encontrado no arquivo CSV' });
          }
          
          res.json({ 
            message: `${insertedLeads.length} leads importados com sucesso`, 
            leads: insertedLeads,
            total: insertedLeads.length
          });
        } catch (error: any) {
          console.error('Import error:', error);
          res.status(500).json({ message: error.message || 'Erro ao importar leads' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parse error:', error);
        res.status(500).json({ message: 'Erro ao processar arquivo CSV' });
      });
  } catch (error: any) {
    console.error('Import leads error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

