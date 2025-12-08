import express from 'express';
import crypto from 'crypto';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = express.Router();

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'https://biacrm.com/api/integrations/facebook/callback';
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

// Create or update Facebook integration
router.post('/connect', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, access_token, page_id, page_name, expires_in } = req.body;
    const userId = (req.user && req.user.id);

    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!access_token || !page_id) {
      return res.status(400).json({ message: 'Access token e Page ID são obrigatórios' });
    }

    // Check if integration already exists for this user and page
    const existing = await query(
      'SELECT id FROM facebook_integrations WHERE user_id = ? AND page_id = ?',
      [userId, page_id]
    );

    let integrationId: number;

    if (existing.rows.length > 0) {
      // Update existing integration
      integrationId = existing.rows[0].id;
      await query(
        `UPDATE facebook_integrations 
         SET title = ?, access_token = ?, page_name = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title,
          access_token,
          page_name || null,
          expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
          integrationId
        ]
      );
    } else {
      // Create new integration
      const result = await query(
        `INSERT INTO facebook_integrations 
         (user_id, title, access_token, page_id, page_name, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [
          userId,
          title,
          access_token,
          page_id,
          page_name || null,
          expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
        ]
      );

      integrationId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;
    }

    // Fetch integration details
    const integration = await query(
      'SELECT * FROM facebook_integrations WHERE id = ?',
      [integrationId]
    );

    res.status(201).json({
      success: true,
      integration: integration.rows[0]
    });
  } catch (error: any) {
    console.error('Facebook connect error:', error);
    res.status(500).json({ message: error.message || 'Erro ao conectar conta Facebook' });
  }
});

// Get Facebook OAuth URL
router.get('/oauth/url', authenticate, async (req: AuthRequest, res) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    const userId = (req.user && req.user.id);

    // Store state in session/database for verification
    const stateWithUserId = `${state}_${userId}`;

    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'leads_retrieval',
      'pages_read_user_content',
      'pages_manage_ads'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&` +
      `scope=${scopes}&` +
      `state=${stateWithUserId}&` +
      `response_type=code`;

    res.json({
      success: true,
      authUrl,
      state: stateWithUserId
    });
  } catch (error: any) {
    console.error('Facebook OAuth URL error:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar URL de autorização' });
  }
});

// Facebook OAuth Callback
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
    const tokenResponse = await axios.get(
      `${FACEBOOK_API_BASE}/oauth/access_token`,
      {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: FACEBOOK_REDIRECT_URI,
          code: code as string
        }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user's pages
    const pagesResponse = await axios.get(
      `${FACEBOOK_API_BASE}/me/accounts`,
      {
        params: {
          access_token: access_token,
          fields: 'id,name,access_token'
        }
      }
    );

    const pages = pagesResponse.data.data || [];

    // Redirect to frontend with tokens and pages
    const frontendUrl = process.env.FRONTEND_URL || 'https://biacrm.com';
    const redirectUrl = `${frontendUrl}/entrada-saida?facebook_success=true&access_token=${access_token}&expires_in=${expires_in}&pages=${encodeURIComponent(JSON.stringify(pages))}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Facebook callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://biacrm.com';
    res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(error.message || 'Erro ao autorizar')}`);
  }
});

// Get all Facebook integrations for user
router.get('/list', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id);

    const integrations = await query(
      `SELECT id, title, page_id, page_name, status, created_at, updated_at 
       FROM facebook_integrations 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      integrations: integrations.rows
    });
  } catch (error: any) {
    console.error('Facebook list error:', error);
    res.status(500).json({ message: error.message || 'Erro ao listar integrações Facebook' });
  }
});

// Get Facebook integration details
router.get('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    const integration = await query(
      `SELECT id, title, page_id, page_name, status, created_at, updated_at 
       FROM facebook_integrations 
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
    console.error('Facebook get error:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar integração' });
  }
});

// Update Facebook integration
router.put('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const { title, status } = req.body;
    const userId = (req.user && req.user.id);

    // Verify ownership
    const existing = await query(
      'SELECT id FROM facebook_integrations WHERE id = ? AND user_id = ?',
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
      `UPDATE facebook_integrations 
       SET ${updates.join(', ')} 
       WHERE id = ?`,
      [...values]
    );

    const updated = await query(
      'SELECT * FROM facebook_integrations WHERE id = ?',
      [integrationId]
    );

    res.json({
      success: true,
      integration: updated.rows[0]
    });
  } catch (error: any) {
    console.error('Facebook update error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar integração' });
  }
});

// Delete Facebook integration
router.delete('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    // Verify ownership
    const existing = await query(
      'SELECT id FROM facebook_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    await query(
      'DELETE FROM facebook_integrations WHERE id = ?',
      [integrationId]
    );

    res.json({
      success: true,
      message: 'Integração removida com sucesso'
    });
  } catch (error: any) {
    console.error('Facebook delete error:', error);
    res.status(500).json({ message: error.message || 'Erro ao remover integração' });
  }
});

// Refresh Facebook access token
router.post('/:integrationId/refresh', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    // Get integration
    const integration = await query(
      'SELECT * FROM facebook_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const { access_token, page_id } = integration.rows[0];

    // Exchange short-lived token for long-lived token
    const tokenResponse = await axios.get(
      `${FACEBOOK_API_BASE}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          fb_exchange_token: access_token
        }
      }
    );

    const { access_token: new_access_token, expires_in } = tokenResponse.data;

    // Get page access token
    const pagesResponse = await axios.get(
      `${FACEBOOK_API_BASE}/me/accounts`,
      {
        params: {
          access_token: new_access_token,
          fields: 'id,name,access_token'
        }
      }
    );

    const pages = pagesResponse.data.data || [];
    const page = pages.find((p: any) => p.id === page_id);
    const page_access_token = (page && page.access_token) || new_access_token;

    // Update token in database
    await query(
      `UPDATE facebook_integrations 
       SET access_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        page_access_token,
        expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
        integrationId
      ]
    );

    res.json({
      success: true,
      message: 'Token atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Facebook refresh error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar token' });
  }
});

// Webhook endpoint for Facebook leads
router.post('/webhook/leads', async (req, res) => {
  try {
    // Facebook webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
      console.log('Facebook webhook verified');
      return res.status(200).send(challenge);
    }

    // Process webhook event
    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.status(400).json({ message: 'Formato de webhook inválido' });
    }

    for (const entryItem of entry) {
      const { changes } = entryItem;

      if (changes && Array.isArray(changes)) {
        for (const change of changes) {
          if (change.field === 'leadgen') {
            const leadgenId = (change.value && change.value.leadgen_id);

            if (leadgenId) {
              // Get integration for this page
              const pageId = entryItem.id;
              const integration = await query(
                'SELECT * FROM facebook_integrations WHERE page_id = ? AND status = ?',
                [pageId, 'active']
              );

              if (integration.rows.length > 0) {
                const { access_token } = integration.rows[0];

                // Fetch lead details from Facebook
                try {
                  const leadResponse = await axios.get(
                    `${FACEBOOK_API_BASE}/${leadgenId}`,
                    {
                      params: {
                        access_token: access_token,
                        fields: 'id,created_time,field_data'
                      }
                    }
                  );

                  const leadData = leadResponse.data;
                  const fieldData = leadData.field_data || [];

                  // Extract lead information
                  const leadInfo: any = {
                    name: '',
                    phone: '',
                    email: '',
                    custom_data: {}
                  };

                  fieldData.forEach((field: any) => {
                    const fieldName = (field.name && field.name.toLowerCase)() || '';
                    const fieldValue = (field.values && field.values[0]) || '';

                    if (fieldName.includes('first_name') || fieldName.includes('full_name')) {
                      leadInfo.name = fieldValue;
                    } else if (fieldName.includes('phone') || fieldName.includes('phone_number')) {
                      leadInfo.phone = fieldValue;
                    } else if (fieldName.includes('email')) {
                      leadInfo.email = fieldValue;
                    } else {
                      leadInfo.custom_data[fieldName] = fieldValue;
                    }
                  });

                  // Create lead in database
                  if (leadInfo.name || leadInfo.phone || leadInfo.email) {
                    const result = await query(
                      `INSERT INTO leads (name, phone, email, status, origin, custom_data, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                      [
                        leadInfo.name || 'Lead Facebook',
                        leadInfo.phone || '',
                        leadInfo.email || null,
                        'novo_lead',
                        'facebook',
                        JSON.stringify({
                          facebook_leadgen_id: leadgenId,
                          facebook_page_id: pageId,
                          created_time: leadData.created_time,
                          ...leadInfo.custom_data
                        })
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
                        `Lead criado via Facebook: ${pageId}`
                      ]
                    );
                  }
                } catch (apiError: any) {
                  console.error('Error fetching Facebook lead:', (apiError.response && apiError.response.data) || apiError.message);
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Facebook webhook error:', error);
    res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
  }
});

// Get Facebook leads (from Facebook API)
router.get('/:integrationId/leads', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);
    const { start_date, end_date, limit = 25 } = req.query;

    // Get integration
    const integration = await query(
      'SELECT * FROM facebook_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const { access_token, page_id } = integration.rows[0];

    // Fetch leads from Facebook API
    try {
      const formResponse = await axios.get(
        `${FACEBOOK_API_BASE}/${page_id}/leadgen_forms`,
        {
          params: {
            access_token: access_token,
            fields: 'id,name'
          }
        }
      );

      const forms = formResponse.data.data || [];
      const allLeads: any[] = [];

      // Fetch leads from each form
      for (const form of forms) {
        try {
          const leadsResponse = await axios.get(
            `${FACEBOOK_API_BASE}/${form.id}/leads`,
            {
              params: {
                access_token: access_token,
                fields: 'id,created_time,field_data',
                limit: parseInt(limit as string)
              }
            }
          );

          const leads = leadsResponse.data.data || [];
          allLeads.push(...leads.map((lead: any) => ({
            ...lead,
            form_id: form.id,
            form_name: form.name
          })));
        } catch (formError: any) {
          console.error(`Error fetching leads from form ${form.id}:`, formError.message);
        }
      }

      // Filter by date if provided
      let filteredLeads = allLeads;
      if (start_date || end_date) {
        filteredLeads = allLeads.filter((lead: any) => {
          const leadDate = new Date(lead.created_time);
          if (start_date && leadDate < new Date(start_date as string)) return false;
          if (end_date && leadDate > new Date(end_date as string)) return false;
          return true;
        });
      }

      res.json({
        success: true,
        leads: filteredLeads,
        total: filteredLeads.length
      });
    } catch (apiError: any) {
      console.error('Facebook API error:', (apiError.response && apiError.response.data) || apiError.message);
      res.status(500).json({
        message: 'Erro ao buscar leads do Facebook',
        error: (apiError.response && apiError.response.data) || apiError.message
      });
    }
  } catch (error: any) {
    console.error('Facebook leads error:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar leads' });
  }
});

// Get Facebook pages for user
router.get('/pages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { access_token } = req.query;

    if (!access_token) {
      return res.status(400).json({ message: 'Access token é obrigatório' });
    }

    // Get user's pages
    const pagesResponse = await axios.get(
      `${FACEBOOK_API_BASE}/me/accounts`,
      {
        params: {
          access_token: access_token as string,
          fields: 'id,name,access_token,category,picture'
        }
      }
    );

    res.json({
      success: true,
      pages: pagesResponse.data.data || []
    });
  } catch (error: any) {
    console.error('Facebook pages error:', error);
    res.status(500).json({
      message: error.message || 'Erro ao buscar páginas',
      error: (error.response && error.response.data) || error.message
    });
  }
});

export default router;




