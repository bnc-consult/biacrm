"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const whatsapp_1 = require("../services/whatsapp");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});
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
// Generate WhatsApp QR Code for sync
router.get('/whatsapp/qr', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        const { status, qr } = await (0, whatsapp_1.getWhatsAppQr)(String(userId));
        if (status === 'connected') {
            return res.json({
                success: true,
                status: 'connected',
                message: 'WhatsApp já conectado'
            });
        }
        if (!qr) {
            return res.json({
                success: false,
                status,
                message: 'QR Code indisponível no momento. Tente novamente.'
            });
        }
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qr)}`;
        res.json({
            success: true,
            status,
            qr: {
                data: qr,
                qrUrl,
                expiresAt: new Date(Date.now() + 60 * 1000).toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating WhatsApp QR:', error);
        res.status(500).json({ message: error.message || 'Erro ao gerar QR Code do WhatsApp' });
    }
});
router.post('/whatsapp/disconnect', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        await (0, whatsapp_1.disconnectWhatsApp)(String(userId));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error disconnecting WhatsApp:', error);
        res.status(500).json({ message: error.message || 'Erro ao desconectar WhatsApp' });
    }
});
router.post('/whatsapp/send', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ message: 'Telefone e mensagem são obrigatórios' });
        }
        await (0, whatsapp_1.sendWhatsAppMessage)(String(userId), String(phone), String(message));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({ message: error.message || 'Erro ao enviar mensagem no WhatsApp' });
    }
});
router.post('/whatsapp/send-media', auth_1.authenticate, upload.single('file'), async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        const { phone, message } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Telefone é obrigatório' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Arquivo não fornecido' });
        }
        await (0, whatsapp_1.sendWhatsAppMedia)(String(userId), String(phone), req.file, message ? String(message) : undefined);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error sending WhatsApp media:', error);
        res.status(500).json({ message: error.message || 'Erro ao enviar mídia no WhatsApp' });
    }
});
router.get('/whatsapp/messages', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        const phone = String(req.query.phone || '');
        if (!phone) {
            return res.status(400).json({ message: 'Telefone é obrigatório' });
        }
        const messages = await (0, whatsapp_1.getWhatsAppMessages)(String(userId), phone);
        res.json({ success: true, messages });
    }
    catch (error) {
        console.error('Error fetching WhatsApp messages:', error);
        res.status(500).json({ message: error.message || 'Erro ao buscar mensagens do WhatsApp' });
    }
});
router.get('/whatsapp/conversations', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        const conversations = await (0, whatsapp_1.getWhatsAppConversations)(String(userId));
        res.json({ success: true, conversations });
    }
    catch (error) {
        console.error('Error fetching WhatsApp conversations:', error);
        res.status(500).json({ message: error.message || 'Erro ao buscar conversas do WhatsApp' });
    }
});
router.post('/whatsapp/mark-read', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id) || 'anon';
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Telefone é obrigatório' });
        }
        await (0, whatsapp_1.markWhatsAppMessagesRead)(String(userId), String(phone));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error marking WhatsApp messages as read:', error);
        res.status(500).json({ message: error.message || 'Erro ao marcar mensagens como lidas' });
    }
});
router.get('/whatsapp/stream', async (req, res) => {
    try {
        const token = String(req.query.token || '');
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = decoded?.id || decoded?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
        });
        res.write('event: connected\ndata: {}\n\n');
        const unsubscribe = (0, whatsapp_1.subscribeWhatsAppMessages)(String(userId), (event) => {
            res.write(`event: message\ndata: ${JSON.stringify(event)}\n\n`);
        });
        req.on('close', () => {
            unsubscribe();
        });
    }
    catch (error) {
        console.error('Error opening WhatsApp stream:', error);
        res.status(401).json({ message: 'Token inválido' });
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