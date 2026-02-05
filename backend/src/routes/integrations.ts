import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { disconnectWhatsApp, getWhatsAppConversations, getWhatsAppMessages, getWhatsAppProfilePicture, getWhatsAppQr, markWhatsAppMessagesRead, sendWhatsAppMedia, sendWhatsAppMessage, setWhatsAppSyncWindow, subscribeWhatsAppMessages } from '../services/whatsapp';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});

// Generate integration token and endpoint
router.post('/generate-token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title } = req.body;
    const userId = (req.user && req.user.id);

    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    // Generate integration ID
    const integrationId = `int_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // Generate a valid JWT token using the same secret as the auth system
    const tokenPayload = {
      uuid: crypto.randomBytes(16).toString('hex'),
      iat: Math.floor(Date.now() / 1000),
      userId: userId || null,
      integrationId: integrationId,
      type: 'integration'
    };
    
    // Create a valid JWT token that can be verified
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '365d' } // Token válido por 1 ano
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
  } catch (error: any) {
    console.error('Error generating integration token:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar token de integração' });
  }
});

// Generate WhatsApp QR Code for sync
router.get('/whatsapp/qr', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const syncDaysValue = Number(req.query.syncDays);
    if (Number.isFinite(syncDaysValue)) {
      setWhatsAppSyncWindow(String(userId), syncDaysValue);
    }
    const { status, qr } = await getWhatsAppQr(String(userId));

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
  } catch (error: any) {
    console.error('Error generating WhatsApp QR:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar QR Code do WhatsApp' });
  }
});

router.post('/whatsapp/disconnect', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    await disconnectWhatsApp(String(userId));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ message: error.message || 'Erro ao desconectar WhatsApp' });
  }
});

router.post('/whatsapp/send', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ message: 'Telefone e mensagem são obrigatórios' });
    }
    await sendWhatsAppMessage(String(userId), String(phone), String(message));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ message: error.message || 'Erro ao enviar mensagem no WhatsApp' });
  }
});

router.post('/whatsapp/schedule', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const { leadId, phone, message, scheduled_for } = req.body;
    if (!phone || !message || !scheduled_for) {
      return res.status(400).json({ message: 'Telefone, mensagem e data são obrigatórios' });
    }
    const scheduledFor = new Date(String(scheduled_for));
    if (Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ message: 'Data inválida' });
    }
    await query(
      `INSERT INTO scheduled_messages (user_id, lead_id, phone, message, scheduled_for, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        Number(userId),
        leadId ? Number(leadId) : null,
        String(phone),
        String(message),
        scheduledFor.toISOString(),
        'pending'
      ]
    );
    if (leadId) {
      await query(
        'INSERT INTO lead_history (lead_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [Number(leadId), Number(userId), 'scheduled_message', 'Mensagem automática agendada']
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error scheduling WhatsApp message:', error);
    res.status(500).json({ message: error.message || 'Erro ao agendar mensagem' });
  }
});

router.get('/whatsapp/scheduled', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const leadId = req.query.leadId ? Number(req.query.leadId) : null;
    if (!leadId) {
      return res.status(400).json({ message: 'Lead é obrigatório' });
    }
    const result = await query(
      `SELECT id, message, scheduled_for
       FROM scheduled_messages
       WHERE user_id = $1 AND lead_id = $2 AND status = $3
       ORDER BY scheduled_for DESC
       LIMIT 1`,
      [Number(userId), leadId, 'pending']
    );
    const row = (result.rows || [])[0] || null;
    res.json({ success: true, scheduled: row });
  } catch (error: any) {
    console.error('Error fetching scheduled message:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar agendamento' });
  }
});

router.get('/whatsapp/scheduled-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const leadId = req.query.leadId ? Number(req.query.leadId) : null;
    if (!leadId) {
      return res.status(400).json({ message: 'Lead é obrigatório' });
    }
    const result = await query(
      `SELECT id, message, scheduled_for, status
       FROM scheduled_messages
       WHERE user_id = $1 AND lead_id = $2
       ORDER BY scheduled_for DESC`,
      [Number(userId), leadId]
    );
    res.json({ success: true, scheduled: result.rows || [] });
  } catch (error: any) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar agendamentos' });
  }
});

router.delete('/whatsapp/scheduled/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const scheduledId = Number(req.params.id);
    if (!scheduledId) {
      return res.status(400).json({ message: 'Agendamento inválido' });
    }
    await query(
      `DELETE FROM scheduled_messages WHERE id = $1 AND user_id = $2`,
      [scheduledId, Number(userId)]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting scheduled message:', error);
    res.status(500).json({ message: error.message || 'Erro ao excluir agendamento' });
  }
});

router.delete('/whatsapp/scheduled', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const leadId = req.query.leadId ? Number(req.query.leadId) : null;
    if (!leadId) {
      return res.status(400).json({ message: 'Lead é obrigatório' });
    }
    await query(
      `DELETE FROM scheduled_messages WHERE lead_id = $1 AND user_id = $2`,
      [leadId, Number(userId)]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting scheduled messages:', error);
    res.status(500).json({ message: error.message || 'Erro ao excluir agendamentos' });
  }
});

router.post('/whatsapp/send-media', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Telefone é obrigatório' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo não fornecido' });
    }
    await sendWhatsAppMedia(String(userId), String(phone), req.file, message ? String(message) : undefined);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending WhatsApp media:', error);
    res.status(500).json({ message: error.message || 'Erro ao enviar mídia no WhatsApp' });
  }
});

router.get('/whatsapp/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const phone = String(req.query.phone || '');
    if (!phone) {
      return res.status(400).json({ message: 'Telefone é obrigatório' });
    }
    const messages = await getWhatsAppMessages(String(userId), phone);
    res.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error fetching WhatsApp messages:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar mensagens do WhatsApp' });
  }
});

router.get('/whatsapp/profile-picture', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const phone = String(req.query.phone || '');
    if (!phone) {
      return res.status(400).json({ message: 'Telefone é obrigatório' });
    }
    const url = await getWhatsAppProfilePicture(String(userId), phone);
    res.json({ success: true, url });
  } catch (error: any) {
    console.error('Error fetching WhatsApp profile picture:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar foto do WhatsApp' });
  }
});

router.get('/whatsapp/conversations', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const conversations = await getWhatsAppConversations(String(userId));
    res.json({ success: true, conversations });
  } catch (error: any) {
    console.error('Error fetching WhatsApp conversations:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar conversas do WhatsApp' });
  }
});

router.post('/whatsapp/mark-read', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id) || 'anon';
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Telefone é obrigatório' });
    }
    await markWhatsAppMessagesRead(String(userId), String(phone));
    res.json({ success: true });
  } catch (error: any) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
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

    const unsubscribe = subscribeWhatsAppMessages(String(userId), (event) => {
      res.write(`event: message\ndata: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  } catch (error: any) {
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
    const token = (authHeader && authHeader.replace('Bearer ', '')) || req.headers['x-api-token'] as string;

    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verify the JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      // Check if it's an integration token
      if (decoded.type !== 'integration') {
        return res.status(401).json({ message: 'Token inválido para integração' });
      }
    } catch (error) {
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
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
  }
});

// Legacy endpoint for backward compatibility
router.post('/webhook/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.replace('Bearer ', '')) || req.headers['x-api-token'] as string;

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
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
  }
});

// Get integration details
router.get('/:integrationId', authenticate, async (req: AuthRequest, res) => {
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
  } catch (error: any) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar integração' });
  }
});

export default router;

