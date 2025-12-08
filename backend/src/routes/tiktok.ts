import express from 'express';
import crypto from 'crypto';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = express.Router();

// TikTok OAuth Configuration
const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://biacrm.com/api/integrations/tiktok/callback';
const TIKTOK_API_BASE = 'https://business-api.tiktok.com';

// Create or update TikTok integration
router.post('/connect', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, access_token, refresh_token, expires_in, advertiser_id } = req.body;
    const userId = (req.user && req.user.id);

    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!access_token || !advertiser_id) {
      return res.status(400).json({ message: 'Access token e Advertiser ID são obrigatórios' });
    }

    // Check if integration already exists for this user
    const existing = await query(
      'SELECT id FROM tiktok_integrations WHERE user_id = ? AND advertiser_id = ?',
      [userId, advertiser_id]
    );

    let integrationId: number;

    if (existing.rows.length > 0) {
      // Update existing integration
      integrationId = existing.rows[0].id;
      await query(
        `UPDATE tiktok_integrations 
         SET title = ?, access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title,
          access_token,
          refresh_token || null,
          expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
          integrationId
        ]
      );
    } else {
      // Create new integration
      const result = await query(
        `INSERT INTO tiktok_integrations 
         (user_id, title, access_token, refresh_token, advertiser_id, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [
          userId,
          title,
          access_token,
          refresh_token || null,
          advertiser_id,
          expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
        ]
      );

      integrationId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;
    }

    // Fetch integration details
    const integration = await query(
      'SELECT * FROM tiktok_integrations WHERE id = ?',
      [integrationId]
    );

    res.status(201).json({
      success: true,
      integration: integration.rows[0]
    });
  } catch (error: any) {
    console.error('TikTok connect error:', error);
    res.status(500).json({ message: error.message || 'Erro ao conectar conta TikTok' });
  }
});

// Get TikTok OAuth URL
router.get('/oauth/url', authenticate, async (req: AuthRequest, res) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    const userId = (req.user && req.user.id);

    // Store state in session/database for verification
    // For now, we'll include userId in state
    const stateWithUserId = `${state}_${userId}`;

    const scopes = [
      'ads.leads.read',
      'ads.leads.write',
      'business.leads.read',
      'business.leads.write'
    ].join(',');

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
      `client_key=${TIKTOK_CLIENT_ID}&` +
      `scope=${scopes}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}&` +
      `state=${stateWithUserId}`;

    res.json({
      success: true,
      authUrl,
      state: stateWithUserId
    });
  } catch (error: any) {
    console.error('TikTok OAuth URL error:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar URL de autorização' });
  }
});

// TikTok OAuth Callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Código de autorização não fornecido' });
    }

    // Extract userId from state
    const stateParts = (state as string) && (state as string).split('_');
    const userId = (stateParts && stateParts[stateParts.length - 1]);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.tiktok.com/v2/auth/token/',
      null,
      {
        params: {
          client_key: TIKTOK_CLIENT_ID,
          client_secret: TIKTOK_CLIENT_SECRET,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: TIKTOK_REDIRECT_URI
        }
      }
    );

    const { access_token, refresh_token, expires_in, advertiser_id } = tokenResponse.data.data || tokenResponse.data;

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'https://biacrm.com';
    const redirectUrl = `${frontendUrl}/entrada-saida?tiktok_success=true&access_token=${access_token}&advertiser_id=${advertiser_id}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('TikTok callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://biacrm.com';
    res.redirect(`${frontendUrl}/entrada-saida?tiktok_error=${encodeURIComponent(error.message || 'Erro ao autorizar')}`);
  }
});

// Get all TikTok integrations for user
router.get('/list', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id);

    const integrations = await query(
      `SELECT id, title, advertiser_id, status, created_at, updated_at 
       FROM tiktok_integrations 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      integrations: integrations.rows
    });
  } catch (error: any) {
    console.error('TikTok list error:', error);
    res.status(500).json({ message: error.message || 'Erro ao listar integrações TikTok' });
  }
});

// Get TikTok integration details
router.get('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    const integration = await query(
      `SELECT id, title, advertiser_id, status, created_at, updated_at 
       FROM tiktok_integrations 
       WHERE id = ? AND user_id = ?`,
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    res.json({
      success: true,
      integration: integration.rows[0]
    });
  } catch (error: any) {
    console.error('TikTok get error:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar integração' });
  }
});

// Update TikTok integration
router.put('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const { title, status } = req.body;
    const userId = (req.user && req.user.id);

    // Verify ownership
    const existing = await query(
      'SELECT id FROM tiktok_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(integrationId);

    await query(
      `UPDATE tiktok_integrations 
       SET ${updates.join(', ')} 
       WHERE id = ?`,
      [...values]
    );

    const updated = await query(
      'SELECT * FROM tiktok_integrations WHERE id = ?',
      [integrationId]
    );

    res.json({
      success: true,
      integration: updated.rows[0]
    });
  } catch (error: any) {
    console.error('TikTok update error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar integração' });
  }
});

// Delete TikTok integration
router.delete('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    // Verify ownership
    const existing = await query(
      'SELECT id FROM tiktok_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    await query(
      'DELETE FROM tiktok_integrations WHERE id = ?',
      [integrationId]
    );

    res.json({
      success: true,
      message: 'Integração removida com sucesso'
    });
  } catch (error: any) {
    console.error('TikTok delete error:', error);
    res.status(500).json({ message: error.message || 'Erro ao remover integração' });
  }
});

// Refresh TikTok access token
router.post('/:integrationId/refresh', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    // Get integration with refresh token
    const integration = await query(
      'SELECT * FROM tiktok_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const { refresh_token } = integration.rows[0];

    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token não disponível' });
    }

    // Refresh access token
    const tokenResponse = await axios.post(
      'https://www.tiktok.com/v2/auth/token/',
      null,
      {
        params: {
          client_key: TIKTOK_CLIENT_ID,
          client_secret: TIKTOK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        }
      }
    );

    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data.data || tokenResponse.data;

    // Update tokens in database
    await query(
      `UPDATE tiktok_integrations 
       SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        access_token,
        new_refresh_token || refresh_token,
        expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
        integrationId
      ]
    );

    res.json({
      success: true,
      message: 'Token atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('TikTok refresh error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar token' });
  }
});

// Webhook endpoint for TikTok leads
router.post('/webhook/leads', async (req, res) => {
  try {
    const signature = req.headers['x-tiktok-signature'] as string;
    const timestamp = req.headers['x-tiktok-timestamp'] as string;

    // Verify webhook signature (implement signature verification)
    // For now, we'll process the webhook

    const { event_type, data } = req.body;

    if (event_type === 'LEAD') {
      // Process lead data
      const leadData = {
        name: (data && data.contact_name) || (data && data.name) || '',
        phone: (data && data.contact_phone) || (data && data.phone) || '',
        email: (data && data.contact_email) || (data && data.email) || '',
        status: 'novo_lead',
        origin: 'tiktok',
        custom_data: JSON.stringify({
          tiktok_ad_id: (data && data.ad_id),
          tiktok_adgroup_id: (data && data.adgroup_id),
          tiktok_campaign_id: (data && data.campaign_id),
          tiktok_form_id: (data && data.form_id),
          tiktok_lead_id: (data && data.lead_id),
          ...data
        })
      };

      // Create lead in database
      const result = await query(
        `INSERT INTO leads (name, phone, email, status, origin, custom_data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          leadData.name,
          leadData.phone,
          leadData.email || null,
          leadData.status,
          leadData.origin,
          leadData.custom_data
        ]
      );

      const leadId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;

      // Log webhook event
      await query(
        `INSERT INTO lead_history (lead_id, action, description, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          leadId,
          'created',
          `Lead criado via TikTok: ${(data && data.ad_name) || 'Anúncio TikTok'}`
        ]
      );

      res.json({
        success: true,
        message: 'Lead processado com sucesso',
        leadId
      });
    } else {
      res.json({
        success: true,
        message: 'Evento recebido mas não processado',
        event_type
      });
    }
  } catch (error: any) {
    console.error('TikTok webhook error:', error);
    res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
  }
});

// Get TikTok leads (from TikTok API)
router.get('/:integrationId/leads', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);
    const { start_date, end_date, page = 1, page_size = 20 } = req.query;

    // Get integration
    const integration = await query(
      'SELECT * FROM tiktok_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const { access_token, advertiser_id } = integration.rows[0];

    // Check if token is expired and refresh if needed
    // (Implement token refresh logic here)

    // Fetch leads from TikTok API
    try {
      const leadsResponse = await axios.get(
        `${TIKTOK_API_BASE}/open_api/v1.3/lead/list/`,
        {
          headers: {
            'Access-Token': access_token
          },
          params: {
            advertiser_id,
            start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: end_date || new Date().toISOString().split('T')[0],
            page: parseInt(page as string),
            page_size: parseInt(page_size as string)
          }
        }
      );

      res.json({
        success: true,
        leads: (leadsResponse.data.data && leadsResponse.data.data.list) || [],
        pagination: (leadsResponse.data.data && leadsResponse.data.data.page_info) || {}
      });
    } catch (apiError: any) {
      console.error('TikTok API error:', (apiError.response && apiError.response.data) || apiError.message);
      res.status(500).json({
        message: 'Erro ao buscar leads do TikTok',
        error: (apiError.response && apiError.response.data) || apiError.message
      });
    }
  } catch (error: any) {
    console.error('TikTok leads error:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar leads' });
  }
});

export default router;




