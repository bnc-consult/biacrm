"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all custom fields
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const result = await (0, connection_1.query)('SELECT * FROM custom_fields ORDER BY created_at DESC');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get custom fields error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Create custom field
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { name, type, options, required = false } = req.body;
        if (!name || !type) {
            return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
        }
        await (0, connection_1.query)('INSERT INTO custom_fields (name, type, options, required) VALUES (?, ?, ?, ?)', [name, type, options ? JSON.stringify(options) : null, required ? 1 : 0]);
        const result = await (0, connection_1.query)('SELECT * FROM custom_fields ORDER BY created_at DESC LIMIT 1');
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create custom field error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Update custom field
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, options, required } = req.body;
        await (0, connection_1.query)('UPDATE custom_fields SET name = ?, type = ?, options = ?, required = ? WHERE id = ?', [name, type, options ? JSON.stringify(options) : null, required ? 1 : 0, id]);
        const result = await (0, connection_1.query)('SELECT * FROM custom_fields WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Campo personalizado não encontrado' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Update custom field error:', error);
        res.status(500).json({ message: error.message });
    }
});
// Delete custom field
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('SELECT * FROM custom_fields WHERE id = ?', [id]);
        await (0, connection_1.query)('DELETE FROM custom_fields WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Campo personalizado não encontrado' });
        }
        res.json({ message: 'Campo personalizado deletado com sucesso' });
    }
    catch (error) {
        console.error('Delete custom field error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=customFields.js.map