"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Generate integration token and endpoint
router.post('/generate-token', auth_1.authenticate, async (req, res) => {
    try {
        const { title } = req.body;
        const userId = (req.user && req.user.id);
        if (!title) {
            return res.status(400).json({ message: 'Título é obrigatório' });
        }
        // Generate integration ID
        const integrationId = `int_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        // Generate a valid JWT token using the same secret as the auth system
        const tokenPayload = {
            uuid: crypto_1.default.randomBytes(16).toString('hex'),
            iat: Math.floor(Date.now() / 1000),
            userId: userId || null,
            integrationId: integrationId,
            type: 'integration'
        };
        // Create a valid JWT token that can be verified
        const token = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET || 'secret', { expiresIn: '365d' } // Token válido por 1 ano
        );
        // Get base URL from environment or use default
        // Use a production-like URL format similar to the image
        const baseUrl = process.env.INTEGRATION_BASE_URL ||
            process.env.API_BASE_URL ||
            `https://integration.biacrm.me`;
        // Endpoint format similar to the image: with {LeadId} placeholder
        const endpoint = `${baseUrl}/v1/primelead-integration-webhook/callback/{LeadId}`;
        // Store integration in database (if you have a table for this)
        // For now, we'll just return the token and endpoint
        // In production, you should store this in the database
        res.status(201).json({
            success: true,
            integration: {
                id: integrationId,
                title,
                endpoint,
                token,
                createdAt: new Date().toISOString(),
                userId
            }
        });
    }
    catch (error) {
        console.error('Error generating integration token:', error);
        res.status(500).json({ message: error.message || 'Erro ao gerar token de integração' });
    }
});
// Webhook endpoint for external integrations
// Supports both formats: /webhook/:integrationId and /v1/primelead-integration-webhook/callback/:leadId
router.post('/v1/primelead-integration-webhook/callback/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const authHeader = req.headers.authorization;
        const token = (authHeader && authHeader.replace('Bearer ', '')) || req.headers['x-api-token'];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        // Verify the JWT token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            // Check if it's an integration token
            if (decoded.type !== 'integration') {
                return res.status(401).json({ message: 'Token inválido para integração' });
            }
        }
        catch (error) {
            return res.status(401).json({ message: 'Token inválido ou expirado' });
        }
        const { observacao, nome_acao, ...otherData } = req.body;
        // Process the webhook data
        // Update lead in database
        // This is a placeholder - implement your actual logic here
        // Example: await updateLead(leadId, { observacao, nome_acao, ...otherData });
        res.json({
            success: true,
            message: 'Lead atualizado com sucesso',
            leadId,
            data: {
                observacao,
                nome_acao,
                ...otherData
            },
            processedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
    }
});
// Legacy endpoint for backward compatibility
router.post('/webhook/:integrationId', async (req, res) => {
    try {
        const { integrationId } = req.params;
        const authHeader = req.headers.authorization;
        const token = (authHeader && authHeader.replace('Bearer ', '')) || req.headers['x-api-token'];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        const { leadId, data } = req.body;
        if (!leadId) {
            return res.status(400).json({ message: 'leadId é obrigatório' });
        }
        res.json({
            success: true,
            message: 'Lead atualizado com sucesso',
            integrationId,
            leadId,
            processedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
    }
});
// Get integration details
router.get('/:integrationId', auth_1.authenticate, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const userId = (req.user && req.user.id);
        // In production, fetch from database
        // For now, return a mock response
        res.json({
            success: true,
            integration: {
                id: integrationId,
                userId,
                // Add other fields as needed
            }
        });
    }
    catch (error) {
        console.error('Error fetching integration:', error);
        res.status(500).json({ message: error.message || 'Erro ao buscar integração' });
    }
});
exports.default = router;
//# sourceMappingURL=integrations.js.map