import express from 'express';
import crypto from 'crypto';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = express.Router();

// Facebook OAuth Configuration
// APP_ID e SECRET fixos no código - configurados pelo desenvolvedor/admin
// O usuário final não precisa conhecer ou configurar essas credenciais
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

// Validar se as credenciais estão configuradas antes de usar
const validateFacebookConfig = () => {
  if (!FACEBOOK_APP_ID || FACEBOOK_APP_ID.trim() === '') {
    throw new Error('Facebook App ID não está configurado. Entre em contato com o administrador do sistema para configurar a integração com Facebook.');
  }
  if (!FACEBOOK_APP_SECRET || FACEBOOK_APP_SECRET.trim() === '') {
    throw new Error('Facebook App Secret não está configurado. Entre em contato com o administrador do sistema para configurar a integração com Facebook.');
  }
};

// Função para obter o URI de redirecionamento baseado na requisição
const getRedirectUri = (req: express.Request): string => {
  // Se estiver definido no .env, usa ele
  if (process.env.FACEBOOK_REDIRECT_URI) {
    return process.env.FACEBOOK_REDIRECT_URI;
  }
  
  // Detecta automaticamente baseado na requisição
  const protocol = req.protocol || (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'http';
  const host = req.get('host') || req.headers.host || 'localhost:3000';
  
  // Se for localhost, usa http
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://${host}/api/integrations/facebook/callback`;
  }
  
  // Caso contrário, assume produção com https
  return `https://${host}/api/integrations/facebook/callback`;
};

// Create or update Facebook integration
router.post('/connect', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, access_token, page_id, page_name, expires_in } = req.body;
    const userId = (req.user && req.user.id);

    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!access_token) {
      return res.status(400).json({ message: 'Access token é obrigatório' });
    }

    // Se não houver page_id, usar o ID do usuário do Facebook como fallback
    let finalPageId = page_id;
    let finalPageName = page_name;

    // Validar o token com a API do Facebook antes de salvar
    try {
      const tokenValidation = await axios.get(
        `${FACEBOOK_API_BASE}/me`,
        {
          params: {
            access_token: access_token,
            fields: 'id,name'
          }
        }
      );

      const userData = tokenValidation.data;
      
      // Se não houver page_id fornecido, usar o ID do usuário
      if (!finalPageId || finalPageId === 'user_account') {
        finalPageId = `user_${userData.id}`;
        finalPageName = finalPageName || userData.name || 'Conta Pessoal';
      } else {
        // Verificar se a página pertence ao usuário (se page_id foi fornecido)
        try {
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
          const pageExists = pages.some((p: any) => p.id === page_id);

          if (!pageExists && page_id !== `user_${userData.id}`) {
            // Se a página não existe, usar o ID do usuário como fallback
            console.warn(`Página ${page_id} não encontrada, usando conta do usuário`);
            finalPageId = `user_${userData.id}`;
            finalPageName = userData.name || 'Conta Pessoal';
          }
        } catch (pagesError: any) {
          // Se não conseguir buscar páginas, usar conta do usuário
          console.warn('Não foi possível buscar páginas, usando conta do usuário:', pagesError.message);
          finalPageId = `user_${userData.id}`;
          finalPageName = userData.name || 'Conta Pessoal';
        }
      }
    } catch (validationError: any) {
      console.error('Facebook token validation error:', validationError.response?.data || validationError.message);
      
      // Se o erro for de autenticação, retornar erro específico
      if (validationError.response?.data?.error) {
        const fbError = validationError.response.data.error;
        return res.status(401).json({ 
          message: `Token do Facebook inválido: ${fbError.message || 'Credenciais inválidas'}. Por favor, autorize novamente.`,
          error: 'INVALID_TOKEN',
          facebookError: fbError
        });
      }

      return res.status(401).json({ 
        message: 'Não foi possível validar o token do Facebook. Por favor, autorize novamente.',
        error: 'TOKEN_VALIDATION_FAILED'
      });
    }

    // Check if integration already exists for this user and page
    const existing = await query(
      'SELECT id FROM facebook_integrations WHERE user_id = ? AND page_id = ?',
      [userId, finalPageId]
    );

    let integrationId: number;

    if (existing.rows.length > 0) {
      // Update existing integration
      integrationId = existing.rows[0].id;
      await query(
        `UPDATE facebook_integrations 
         SET title = ?, access_token = ?, page_id = ?, page_name = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title,
          access_token,
          finalPageId,
          finalPageName || null,
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
          finalPageId,
          finalPageName || null,
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
    // Validar configuração antes de continuar
    validateFacebookConfig();

    const state = crypto.randomBytes(32).toString('hex');
    const userId = (req.user && req.user.id);

    // Store state in session/database for verification
    const stateWithUserId = `${state}_${userId}`;

    // Obter URI de redirecionamento dinamicamente
    const redirectUri = getRedirectUri(req);

    // Usar apenas permissões válidas do Facebook
    // Permissões básicas que funcionam sem revisão do Facebook
    // Nota: 'email' pode não estar disponível dependendo da configuração do app
    const scopes = [
      'public_profile',      // Perfil público do usuário (sempre válida)
      'pages_show_list'       // Listar páginas do Facebook (válida e necessária)
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
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
    res.status(500).json({ 
      message: error.message || 'Erro ao gerar URL de autorização',
      error: 'FACEBOOK_CONFIG_ERROR'
    });
  }
});

// Facebook OAuth Callback
router.get('/callback', async (req, res) => {
  try {
    // Validar configuração antes de continuar
    validateFacebookConfig();

    const { code, state, error, error_reason, error_description } = req.query;

    // Verificar se o Facebook retornou um erro (ex: usuário cancelou ou senha incorreta)
    if (error || error_reason) {
      console.error('Facebook OAuth error:', { error, error_reason, error_description });
      
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        const protocol = req.protocol || (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'http';
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          frontendUrl = 'http://localhost:5173';
        } else {
          frontendUrl = `https://biacrm.com`;
        }
      }

      let errorMessage = 'Autenticação falhou. ';
      
      if (error_reason === 'user_denied' || error === 'access_denied') {
        errorMessage += 'Você cancelou a autorização. Por favor, tente novamente e autorize o acesso.';
      } else if (error_description && error_description.toLowerCase().includes('password')) {
        errorMessage += 'Login ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.';
      } else {
        errorMessage += 'Por favor, verifique seu login e senha do Facebook e tente novamente.';
      }

      return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
    }

    if (!code) {
      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        const protocol = req.protocol || (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'http';
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          frontendUrl = 'http://localhost:5173';
        } else {
          frontendUrl = `https://biacrm.com`;
        }
      }
      
      return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent('Código de autorização não fornecido. Por favor, verifique seu login e senha do Facebook e tente novamente.')}`);
    }

    // Extract userId from state
    const stateParts = (state as string) && (state as string).split('_');
    const userId = (stateParts && stateParts[stateParts.length - 1]);

    // Obter URI de redirecionamento dinamicamente (deve ser o mesmo usado na URL de autorização)
    const redirectUri = getRedirectUri(req);

    // Detectar URL do frontend automaticamente
    let frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      const protocol = req.protocol || (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'http';
      const host = req.get('host') || req.headers.host || 'localhost:3000';
      
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        frontendUrl = 'http://localhost:5173';
      } else {
        frontendUrl = `https://biacrm.com`;
      }
    }

    // Exchange code for access token
    let tokenResponse;
    try {
      tokenResponse = await axios.get(
        `${FACEBOOK_API_BASE}/oauth/access_token`,
        {
          params: {
            client_id: FACEBOOK_APP_ID,
            client_secret: FACEBOOK_APP_SECRET,
            redirect_uri: redirectUri,
            code: code as string
          }
        }
      );
    } catch (tokenError: any) {
      console.error('Facebook token exchange error:', tokenError.response?.data || tokenError.message);
      
      const fbError = tokenError.response?.data?.error;
      let errorMessage = 'Autenticação falhou. ';
      
      // Verificar tipos específicos de erro do Facebook
      if (fbError) {
        const errorCode = fbError.code;
        const errorType = fbError.type;
        const fbErrorMessage = fbError.message || '';
        
        // Erros relacionados a credenciais inválidas
        if (errorCode === 100 || errorCode === 190 || 
            fbErrorMessage.toLowerCase().includes('invalid') ||
            fbErrorMessage.toLowerCase().includes('expired') ||
            fbErrorMessage.toLowerCase().includes('password') ||
            fbErrorMessage.toLowerCase().includes('login')) {
          errorMessage += 'Login ou senha incorretos. Por favor, verifique suas credenciais do Facebook e tente novamente.';
        } else if (errorType === 'OAuthException') {
          errorMessage += 'Erro na autorização. Por favor, verifique seu login e senha do Facebook e tente novamente.';
        } else {
          errorMessage += fbErrorMessage || 'Por favor, verifique seu login e senha do Facebook e tente novamente.';
        }
      } else {
        errorMessage += 'Não foi possível autenticar. Por favor, verifique seu login e senha do Facebook e tente novamente.';
      }
      
      return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
    }

    const { access_token, expires_in } = tokenResponse.data;

    // Validar se o token foi recebido
    if (!access_token) {
      return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent('Token de acesso não recebido do Facebook. Por favor, verifique seu login e senha e tente novamente.')}`);
    }

    // Get user's pages - validar token ao mesmo tempo
    let pagesResponse;
    try {
      pagesResponse = await axios.get(
        `${FACEBOOK_API_BASE}/me/accounts`,
        {
          params: {
            access_token: access_token,
            fields: 'id,name,access_token'
          }
        }
      );
    } catch (pagesError: any) {
      console.error('Facebook pages fetch error:', pagesError.response?.data || pagesError.message);
      
      const fbError = pagesError.response?.data?.error;
      let errorMessage = 'Erro ao validar acesso. ';
      
      // Verificar se é erro de autenticação
      if (fbError) {
        const errorCode = fbError.code;
        const fbErrorMessage = fbError.message || '';
        
        if (errorCode === 190 || errorCode === 102 || 
            fbErrorMessage.toLowerCase().includes('invalid') ||
            fbErrorMessage.toLowerCase().includes('expired') ||
            fbErrorMessage.toLowerCase().includes('token')) {
          errorMessage += 'Token inválido ou expirado. Por favor, verifique seu login e senha do Facebook e tente novamente.';
        } else {
          errorMessage += fbErrorMessage || 'Por favor, verifique seu login e senha do Facebook e tente novamente.';
        }
      } else {
        errorMessage += 'Não foi possível validar o acesso. Por favor, verifique seu login e senha do Facebook e tente novamente.';
      }
      
      return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
    }

    const pages = pagesResponse.data.data || [];
    
    // Log para debug
    console.log('Facebook pages response:', {
      hasData: !!pagesResponse.data.data,
      pagesCount: pages?.length || 0,
      pages: pages?.map((p: any) => ({ id: p.id, name: p.name })) || []
    });
    
    // Se não houver páginas, ainda permitir continuar mas avisar o usuário
    // O usuário pode criar uma integração mesmo sem páginas (para uso futuro)
    if (!pages || pages.length === 0) {
      console.warn('Nenhuma página do Facebook encontrada para o usuário');
      
      // Redirecionar com sucesso mas sem páginas - o frontend vai tratar isso
      const redirectUrl = `${frontendUrl}/entrada-saida?facebook_success=true&access_token=${access_token}&expires_in=${expires_in}&pages=${encodeURIComponent(JSON.stringify([]))}&warning=${encodeURIComponent('Nenhuma página do Facebook encontrada. Você pode criar a integração mesmo assim.')}`;
      
      return res.redirect(redirectUrl);
    }
    
    // Redirecionar para o frontend com os dados válidos
    const redirectUrl = `${frontendUrl}/entrada-saida?facebook_success=true&access_token=${access_token}&expires_in=${expires_in}&pages=${encodeURIComponent(JSON.stringify(pages))}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Facebook callback error:', error);
    
    // Detectar URL do frontend automaticamente
    let frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      const protocol = req.protocol || (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'http';
      const host = req.get('host') || req.headers.host || 'localhost:3000';
      
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        frontendUrl = 'http://localhost:5173';
      } else {
        frontendUrl = `https://biacrm.com`;
      }
    }
    
    const errorMessage = error.message || 'Erro ao processar autorização do Facebook. Por favor, verifique seu login e senha e tente novamente.';
    return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
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




