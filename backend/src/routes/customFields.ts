import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all custom fields
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM custom_fields ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create custom field
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, type, options, required = false } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
    }

    await query(
      'INSERT INTO custom_fields (name, type, options, required) VALUES (?, ?, ?, ?)',
      [name, type, options ? JSON.stringify(options) : null, required ? 1 : 0]
    );
    const result = await query('SELECT * FROM custom_fields ORDER BY created_at DESC LIMIT 1');

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create custom field error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update custom field
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, options, required } = req.body;

    await query(
      'UPDATE custom_fields SET name = ?, type = ?, options = ?, required = ? WHERE id = ?',
      [name, type, options ? JSON.stringify(options) : null, required ? 1 : 0, id]
    );
    const result = await query('SELECT * FROM custom_fields WHERE id = ?', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Campo personalizado não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update custom field error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete custom field
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM custom_fields WHERE id = ?', [id]);
    await query('DELETE FROM custom_fields WHERE id = ?', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Campo personalizado não encontrado' });
    }

    res.json({ message: 'Campo personalizado deletado com sucesso' });
  } catch (error: any) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

