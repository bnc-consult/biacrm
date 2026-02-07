import express from 'express';
import crypto from 'crypto';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = express.Router();

const getPrimaryFunnelId = async (companyId?: number | null) => {
  if (!companyId) return null;
  const primaryResult = await query(
    'SELECT id FROM funnels WHERE company_id = ? AND is_primary = ? ORDER BY id LIMIT 1',
    [companyId, 1]
  );
  if (primaryResult.rows && primaryResult.rows[0]) {
    return Number(primaryResult.rows[0].id);
  }
  const firstResult = await query(
    'SELECT id FROM funnels WHERE company_id = ? ORDER BY id LIMIT 1',
    [companyId]
  );
  return firstResult.rows && firstResult.rows[0] ? Number(firstResult.rows[0].id) : null;
};
const resolveCompanyIdForUser = async (userId?: number | null) => {
  if (!userId) return null;
  const result = await query('SELECT company_id FROM users WHERE id = ?', [userId]);
  const row = result.rows && result.rows[0];
  return row?.company_id ? Number(row.company_id) : null;
};

// Instagram OAuth Configuration
// Nota: Instagram Business API usa Facebook OAuth, então podemos usar as mesmas credenciais do Facebook
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID || '';
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '';
const facebookRedirect = process.env.FACEBOOK_REDIRECT_URI;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || (facebookRedirect && facebookRedirect.replace('/facebook/', '/instagram/')) || 'https://biacrm.com/api/integrations/instagram/callback';
// Instagram usa Facebook Graph API, mas com endpoints específicos
const INSTAGRAM_GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

// Create or update Instagram integration (simplified - accepts username and password)
// NOTA: A API oficial do Instagram requer OAuth através do Facebook.
// Este endpoint simplifica o processo iniciando o OAuth automaticamente.
router.post('/connect-simple', authenticate, async (req: AuthRequest, res) => {
  try {
    const { instagram_username, instagram_password } = req.body;
    const userId = (req.user && req.user.id);

    if (!instagram_username) {
      return res.status(400).json({ message: 'Usuário do Instagram é obrigatório' });
    }

    // Verificar se as credenciais do Instagram/Facebook estão configuradas
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return res.status(500).json({ 
        message: 'Sistema não configurado. Entre em contato com o suporte técnico.',
        requiresOAuth: true
      });
    }

    // Armazenar username temporariamente (será usado após OAuth)
    // Em produção, você pode usar um cache Redis ou banco de dados temporário
    // Por enquanto, vamos incluir no state do OAuth
    
    // Gerar URL de autorização OAuth para o usuário
    const state = crypto.randomBytes(32).toString('hex');
    const stateWithUserId = `${state}_${userId}_${encodeURIComponent(instagram_username)}`;

    // Instagram Graph API: Usar as mesmas permissões básicas do Facebook
    // O Instagram Business API usa o mesmo Facebook App, então precisa das mesmas permissões
    // Permissões básicas que funcionam sem revisão do Facebook
    const scopes: string = [
      'public_profile',      // Perfil público do usuário (sempre válida)
      'pages_show_list'       // Listar páginas do Facebook (necessária para Instagram Business)
    ].join(',');

    // Construir URL OAuth - só adiciona scope se não estiver vazio
    let authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${INSTAGRAM_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&` +
      `state=${stateWithUserId}&` +
      `response_type=code`;
    
    // Adicionar scope apenas se não estiver vazio
    if (scopes && scopes.trim() !== '') {
      authUrl += `&scope=${encodeURIComponent(scopes)}`;
    }
    
    // Log detalhado para debug
    console.log('');
    console.log('=== INSTAGRAM CONNECT-SIMPLE DEBUG ===');
    console.log('App ID:', INSTAGRAM_APP_ID ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
    console.log('');
    console.log('🔗 REDIRECT URI (COPIE ESTA URI EXATA PARA O FACEBOOK):');
    console.log('   ' + INSTAGRAM_REDIRECT_URI);
    console.log('');
    console.log('Scopes:', scopes || '(nenhum - Facebook decidirá permissões básicas)');
    console.log('OAuth URL completa:', authUrl);
    console.log('');
    console.log('⚠️  SE O ERRO "App não está disponível" ou "supported permission" PERSISTIR:');
    console.log('   1. Verifique se o App está ATIVO em: Configurações → Básico');
    console.log('   2. Verifique se "Login do OAuth na Web" está habilitado');
    console.log('   3. Verifique se o App está em modo "Desenvolvimento" ou "Em produção"');
    console.log('   4. Verifique se a categoria do App está configurada');
    console.log('   5. Veja backend/RESOLVER_APP_NAO_DISPONIVEL.md para guia completo');
    console.log('');
    console.log('⚠️  SE O ERRO "URL bloqueada" PERSISTIR:');
    console.log('   1. Copie a URI acima (linha "REDIRECT URI")');
    console.log('   2. No Facebook Developer: Login do Facebook → Configurações');
    console.log('   3. Adicione a URI EXATA em "URIs de redirecionamento OAuth válidos"');
    console.log('   4. Veja backend/RESOLVER_URL_BLOQUEADA.md para guia completo');
    console.log('=======================================');
    console.log('');

    res.json({
      success: true,
      authUrl,
      message: 'Você será redirecionado para autorizar o acesso ao Instagram',
      requiresOAuth: true
    });
  } catch (error: any) {
    console.error('Instagram connect simple error:', error);
    res.status(500).json({ message: error.message || 'Erro ao iniciar conexão com Instagram' });
  }
});

// Create or update Instagram integration
router.post('/connect', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, access_token, instagram_account_id, instagram_username, expires_in } = req.body;
    const userId = (req.user && req.user.id);

    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!access_token) {
      return res.status(400).json({ message: 'Access token é obrigatório' });
    }

    // Para contas pessoais, podemos usar um ID temporário baseado no username
    // Se não forneceu instagram_account_id, criar um baseado no username
    const finalInstagramAccountId = instagram_account_id || (instagram_username ? `personal_${instagram_username}_${Date.now()}` : null);
    
    if (!finalInstagramAccountId) {
      return res.status(400).json({ message: 'Instagram Account ID ou Username são obrigatórios' });
    }

    // Check if integration already exists for this user and account
    const existing = await query(
      'SELECT id FROM instagram_integrations WHERE user_id = ? AND instagram_account_id = ?',
      [userId, instagram_account_id]
    );

    let integrationId: number;

    if (existing.rows.length > 0) {
      // Update existing integration
      integrationId = existing.rows[0].id;
      await query(
        `UPDATE instagram_integrations 
         SET title = ?, access_token = ?, instagram_username = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title,
          access_token,
          instagram_username || null,
          expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
          integrationId
        ]
      );
    } else {
      // Create new integration
      const result = await query(
        `INSERT INTO instagram_integrations 
         (user_id, title, access_token, instagram_account_id, instagram_username, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [
          userId,
          title,
          access_token,
          instagram_account_id,
          instagram_username || null,
          expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
        ]
      );

      integrationId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;
    }

    // Fetch integration details
    const integration = await query(
      'SELECT * FROM instagram_integrations WHERE id = ?',
      [integrationId]
    );

    res.status(201).json({
      success: true,
      integration: integration.rows[0]
    });
  } catch (error: any) {
    console.error('Instagram connect error:', error);
    res.status(500).json({ message: error.message || 'Erro ao conectar conta Instagram' });
  }
});

// Get Instagram OAuth URL
router.get('/oauth/url', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verificar se as credenciais do Instagram/Facebook estão configuradas
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return res.status(500).json({ 
        message: 'Credenciais do Instagram não configuradas.\n\n' +
                 'Para resolver:\n' +
                 '1. Abra o arquivo backend/.env\n' +
                 '2. Adicione as variáveis:\n' +
                 '   FACEBOOK_APP_ID=seu_app_id\n' +
                 '   FACEBOOK_APP_SECRET=seu_app_secret\n' +
                 '   INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/integrations/instagram/callback\n' +
                 '   FRONTEND_URL=http://localhost:5173\n' +
                 '3. Reinicie o servidor\n\n' +
                 'O Instagram usa a mesma aplicação do Facebook.\n' +
                 'Veja o arquivo CONFIGURAR_CREDENCIAIS_INSTAGRAM.md para instruções detalhadas.'
      });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const userId = (req.user && req.user.id);

    // Store state in session/database for verification
    const stateWithUserId = `${state}_${userId}`;

    // Instagram Graph API: Usar as mesmas permissões básicas do Facebook
    // O Instagram Business API usa o mesmo Facebook App, então precisa das mesmas permissões
    // Permissões básicas que funcionam sem revisão do Facebook
    const scopes: string = [
      'public_profile',      // Perfil público do usuário (sempre válida)
      'pages_show_list'       // Listar páginas do Facebook (necessária para Instagram Business)
    ].join(',');

    // Construir URL OAuth - só adiciona scope se não estiver vazio
    let authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${INSTAGRAM_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&` +
      `state=${stateWithUserId}&` +
      `response_type=code`;
    
    // Adicionar scope apenas se não estiver vazio
    if (scopes && scopes.trim() !== '') {
      authUrl += `&scope=${encodeURIComponent(scopes)}`;
    }
    
    // Log detalhado para debug
    console.log('=== INSTAGRAM OAUTH DEBUG ===');
    console.log('App ID:', INSTAGRAM_APP_ID ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
    console.log('Redirect URI:', INSTAGRAM_REDIRECT_URI);
    console.log('Scopes:', scopes || '(nenhum)');
    console.log('OAuth URL completa:', authUrl);
    console.log('');
    console.log('⚠️  Se o erro "supported permission" persistir:');
    console.log('   1. Facebook Login precisa estar configurado para OAuth web');
    console.log('   2. URL de redirecionamento precisa estar configurada no Facebook Login');
    console.log('   3. Veja backend/ENCONTRAR_FACEBOOK_LOGIN_VISUAL.md');
    console.log('================================');
    
    // Log para debug (mantido para compatibilidade)
    console.log('Instagram OAuth URL gerada:', {
      client_id: INSTAGRAM_APP_ID ? 'configurado' : 'NÃO CONFIGURADO',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      scopes: scopes,
      authUrl: authUrl.substring(0, 100) + '...'
    });

    res.json({
      success: true,
      authUrl,
      state: stateWithUserId
    });
  } catch (error: any) {
    console.error('Instagram OAuth URL error:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar URL de autorização' });
  }
});

// Instagram OAuth Callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_reason, error_description } = req.query;

    // Detectar frontend URL (mesma lógica do Facebook callback)
    let frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
    
    if (!frontendUrl) {
      const forwardedProto = req.headers['x-forwarded-proto'] as string;
      const protocol = req.protocol || (forwardedProto ? forwardedProto.split(',')[0] : null) || 'http';
      const host = req.get('host') || req.headers.host || 'localhost:3000';
      
      const isProduction = process.env.NODE_ENV === 'production';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      
      if (isProduction || !isLocalhost) {
        frontendUrl = 'https://biacrm.com';
      } else {
        frontendUrl = 'http://localhost:5173';
      }
    }
    
    // Limpar URL
    frontendUrl = frontendUrl.replace(/\/$/, '').replace(/:443$/, '').replace(/:80$/, '');

    // Verificar se o Facebook retornou um erro (ex: usuário cancelou, domínio não autorizado, etc.)
    if (error || error_reason) {
      console.error('Instagram OAuth error:', { error, error_reason, error_description });
      
      let errorMessage = 'Autenticação falhou. ';
      
      const errorDescriptionStr = typeof error_description === 'string' ? error_description.toLowerCase() : '';
      
      if (errorDescriptionStr.includes('domain') || errorDescriptionStr.includes('domínio')) {
        errorMessage += 'O domínio não está configurado no Facebook App. Verifique se "biacrm.com" está em "Domínios do aplicativo" e se a URL de callback está em "URIs de redirecionamento OAuth válidos".';
      } else if (errorDescriptionStr.includes('redirect_uri') || errorDescriptionStr.includes('redirect')) {
        errorMessage += 'A URL de redirecionamento não está configurada corretamente. Verifique se "https://biacrm.com/api/integrations/instagram/callback" está em "URIs de redirecionamento OAuth válidos".';
      } else if (error === 'access_denied' || error_reason === 'user_denied') {
        errorMessage += 'Você cancelou a autorização.';
      } else if (error_description) {
        errorMessage += String(error_description);
      } else if (error_reason) {
        errorMessage += String(error_reason);
      } else {
        errorMessage += 'Erro desconhecido durante a autorização.';
      }
      
      console.log('Instagram callback - Redirecionando com erro:', errorMessage);
      return res.redirect(`${frontendUrl}/entrada-saida?instagram_error=${encodeURIComponent(errorMessage)}`);
    }

    // Verificar se o código foi fornecido
    if (!code) {
      console.error('Instagram callback - Código não fornecido. Query params:', req.query);
      const errorMessage = 'Código de autorização não fornecido. Verifique se a URL de callback está configurada corretamente no Facebook App.';
      return res.redirect(`${frontendUrl}/entrada-saida?instagram_error=${encodeURIComponent(errorMessage)}`);
    }

    // Extract userId and username from state
    // State format: {random}_{userId} or {random}_{userId}_{username} (simplified flow)
    const stateParts = (state as string) && (state as string).split('_');
    const isSimplifiedFlow = stateParts.length > 2;
    let userId: string | undefined;
    let instagramUsername: string | null = null;
    
    if (isSimplifiedFlow) {
      // Simplified flow: {random}_{userId}_{username}
      userId = stateParts[stateParts.length - 2];
      instagramUsername = decodeURIComponent(stateParts[stateParts.length - 1]);
    } else {
      // Normal flow: {random}_{userId}
      userId = stateParts[stateParts.length - 1];
    }

    // Verificar se as credenciais do Instagram/Facebook estão configuradas
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      throw new Error('Credenciais do Instagram não configuradas. Configure INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET (ou FACEBOOK_APP_ID e FACEBOOK_APP_SECRET) no .env');
    }

    // Exchange code for access token
    let tokenResponse;
    try {
      tokenResponse = await axios.get(
        `${INSTAGRAM_GRAPH_API_BASE}/oauth/access_token`,
        {
          params: {
            client_id: INSTAGRAM_APP_ID,
            client_secret: INSTAGRAM_APP_SECRET,
            redirect_uri: INSTAGRAM_REDIRECT_URI,
            code: code as string
          }
        }
      );
    } catch (error: any) {
      console.error('Error exchanging code for token:', (error.response && error.response.data) || error.message);
      const errorData = error.response && error.response.data;
      const errorMsg = (errorData && errorData.error && errorData.error.message) || error.message;
      throw new Error(`Erro ao trocar código por token: ${errorMsg}`);
    }

    const { access_token, expires_in } = tokenResponse.data;

    if (!access_token) {
      throw new Error('Token de acesso não retornado pelo Instagram');
    }

    // Get user's Instagram Business Accounts
    let accountsResponse;
    try {
      accountsResponse = await axios.get(
        `${INSTAGRAM_GRAPH_API_BASE}/me/accounts`,
        {
          params: {
            access_token: access_token,
            fields: 'id,name,access_token,instagram_business_account'
          }
        }
      );
    } catch (error: any) {
      console.error('Error fetching pages:', (error.response && error.response.data) || error.message);
      const errorData = error.response && error.response.data;
      const errorMsg = (errorData && errorData.error && errorData.error.message) || error.message;
      throw new Error(`Erro ao buscar páginas do Facebook: ${errorMsg}`);
    }

    const pages = accountsResponse.data.data || [];
    const instagramAccounts: any[] = [];

    // Get Instagram accounts for each page
    for (const page of pages) {
      if (page.instagram_business_account) {
        try {
          const igAccountResponse = await axios.get(
            `${INSTAGRAM_GRAPH_API_BASE}/${page.instagram_business_account.id}`,
            {
              params: {
                access_token: page.access_token,
                fields: 'id,username,name,profile_picture_url'
              }
            }
          );

          instagramAccounts.push({
            ...igAccountResponse.data,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token
          });
        } catch (error: any) {
          console.error(`Error fetching Instagram account for page ${page.id}:`, (error.response && error.response.data) || error.message);
          // Continue mesmo se uma página falhar
        }
      }
    }

    // Se não encontrou contas Instagram Business, permitir usar conta pessoal
    if (instagramAccounts.length === 0) {
      console.warn('Nenhuma conta Instagram Business encontrada. Permitindo integração com conta pessoal.');
      
      // Se temos username informado no fluxo simplificado, criar integração pessoal
      if (instagramUsername && userId) {
        // Criar uma integração usando o token do usuário diretamente
        // Para contas pessoais, usamos o próprio token do usuário
        instagramAccounts.push({
          id: `personal_${userId}_${Date.now()}`, // ID temporário para contas pessoais
          username: instagramUsername,
          name: instagramUsername,
          page_id: null,
          page_name: 'Conta Pessoal',
          page_access_token: access_token, // Usar token do usuário diretamente
          is_personal: true // Flag para identificar conta pessoal
        });
      }
    }

    // Se for fluxo simplificado e encontrou contas (Business ou Pessoal), criar integração automaticamente
    if (isSimplifiedFlow && instagramAccounts.length > 0 && userId) {
      try {
        const firstAccount = instagramAccounts[0];
        const tokenToUse = firstAccount.page_access_token || access_token;
        
        // Criar integração automaticamente
        // Para contas pessoais, usar o username informado
        const accountUsername = firstAccount.username || instagramUsername || 'Conta';
        const accountType = firstAccount.is_personal ? 'Pessoal' : 'Business';
        const title = `Instagram ${accountType} - ${accountUsername}`;
        
        // Check if integration already exists (usar username como fallback para contas pessoais)
        const existing = await query(
          'SELECT id FROM instagram_integrations WHERE user_id = ? AND (instagram_account_id = ? OR (instagram_username = ? AND instagram_account_id LIKE ?))',
          [userId, firstAccount.id, accountUsername, 'personal_%']
        );

        if (existing.rows.length > 0) {
          // Update existing
          await query(
            `UPDATE instagram_integrations 
             SET title = ?, access_token = ?, instagram_account_id = ?, instagram_username = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP, status = 'active'
             WHERE id = ?`,
            [
              title,
              tokenToUse,
              firstAccount.id,
              accountUsername,
              expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
              existing.rows[0].id
            ]
          );
        } else {
          // Create new
          await query(
            `INSERT INTO instagram_integrations 
             (user_id, title, access_token, instagram_account_id, instagram_username, expires_at, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [
              userId,
              title,
              tokenToUse,
              firstAccount.id,
              accountUsername,
              expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
            ]
          );
        }
      } catch (error: any) {
        console.error('Error creating integration automatically:', error);
        // Continue with normal flow if auto-creation fails
      }
    }

    // Redirect to frontend with tokens and Instagram accounts
    // frontendUrl já foi detectado no início da função
    
    if (instagramAccounts.length === 0 && !instagramUsername) {
      // Se não encontrou contas Instagram e não há username informado, redireciona com aviso
      const redirectUrl = `${frontendUrl}/entrada-saida?instagram_success=true&access_token=${access_token}&expires_in=${expires_in}&accounts=${encodeURIComponent(JSON.stringify([]))}&warning=${encodeURIComponent('Nenhuma conta Instagram Business encontrada. Você pode conectar uma conta pessoal informando o username.')}&simplified=${isSimplifiedFlow ? 'true' : 'false'}`;
      res.redirect(redirectUrl);
    } else {
      // Redireciona com as contas encontradas (Business ou Pessoal)
      const redirectUrl = `${frontendUrl}/entrada-saida?instagram_success=true&access_token=${access_token}&expires_in=${expires_in}&accounts=${encodeURIComponent(JSON.stringify(instagramAccounts))}&simplified=${isSimplifiedFlow ? 'true' : 'false'}&auto_connected=${isSimplifiedFlow && instagramAccounts.length > 0 ? 'true' : 'false'}`;
      res.redirect(redirectUrl);
    }
  } catch (error: any) {
    console.error('Instagram callback error:', error);
    
    // Detectar frontend URL (mesma lógica do início)
    let frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
    
    if (!frontendUrl) {
      const forwardedProto = req.headers['x-forwarded-proto'] as string;
      const protocol = req.protocol || (forwardedProto ? forwardedProto.split(',')[0] : null) || 'http';
      const host = req.get('host') || req.headers.host || 'localhost:3000';
      
      const isProduction = process.env.NODE_ENV === 'production';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      
      if (isProduction || !isLocalhost) {
        frontendUrl = 'https://biacrm.com';
      } else {
        frontendUrl = 'http://localhost:5173';
      }
    }
    
    // Limpar URL
    frontendUrl = frontendUrl.replace(/\/$/, '').replace(/:443$/, '').replace(/:80$/, '');
    
    const errorData = error.response && error.response.data;
    const errorMessage = (errorData && errorData.error && errorData.error.message) || error.message || 'Erro ao autorizar';
    res.redirect(`${frontendUrl}/entrada-saida?instagram_error=${encodeURIComponent(errorMessage)}`);
  }
});

// Get all Instagram integrations for user
router.get('/list', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user && req.user.id);

    const integrations = await query(
      `SELECT id, title, instagram_account_id, instagram_username, status, created_at, updated_at 
       FROM instagram_integrations 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      integrations: integrations.rows
    });
  } catch (error: any) {
    console.error('Instagram list error:', error);
    res.status(500).json({ message: error.message || 'Erro ao listar integrações Instagram' });
  }
});

// Get Instagram integration details
router.get('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    const integration = await query(
      `SELECT id, title, instagram_account_id, instagram_username, status, created_at, updated_at 
       FROM instagram_integrations 
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
    console.error('Instagram get error:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar integração' });
  }
});

// Update Instagram integration
router.put('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const { title, status } = req.body;
    const userId = (req.user && req.user.id);

    // Verify ownership
    const existing = await query(
      'SELECT id FROM instagram_integrations WHERE id = ? AND user_id = ?',
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
      `UPDATE instagram_integrations 
       SET ${updates.join(', ')} 
       WHERE id = ?`,
      [...values]
    );

    const updated = await query(
      'SELECT * FROM instagram_integrations WHERE id = ?',
      [integrationId]
    );

    res.json({
      success: true,
      integration: updated.rows[0]
    });
  } catch (error: any) {
    console.error('Instagram update error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar integração' });
  }
});

// Delete Instagram integration
router.delete('/:integrationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    // Verify ownership
    const existing = await query(
      'SELECT id FROM instagram_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    await query(
      'DELETE FROM instagram_integrations WHERE id = ?',
      [integrationId]
    );

    res.json({
      success: true,
      message: 'Integração removida com sucesso'
    });
  } catch (error: any) {
    console.error('Instagram delete error:', error);
    res.status(500).json({ message: error.message || 'Erro ao remover integração' });
  }
});

// Refresh Instagram access token
router.post('/:integrationId/refresh', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);

    // Get integration
    const integration = await query(
      'SELECT * FROM instagram_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const { access_token } = integration.rows[0];

    // Verificar se as credenciais do Instagram/Facebook estão configuradas
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      throw new Error('Credenciais do Instagram não configuradas. Configure INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET (ou FACEBOOK_APP_ID e FACEBOOK_APP_SECRET) no .env');
    }

    // Exchange short-lived token for long-lived token
    const tokenResponse = await axios.get(
      `${INSTAGRAM_GRAPH_API_BASE}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          fb_exchange_token: access_token
        }
      }
    );

    const { access_token: new_access_token, expires_in } = tokenResponse.data;

    // Update token in database
    await query(
      `UPDATE instagram_integrations 
       SET access_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        new_access_token,
        expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
        integrationId
      ]
    );

    res.json({
      success: true,
      message: 'Token atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Instagram refresh error:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar token' });
  }
});

// Webhook endpoint for Instagram leads/comments
router.post('/webhook', async (req, res) => {
  try {
    // Instagram webhook verification (same as Facebook)
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
      console.log('Instagram webhook verified');
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
          // Handle Instagram comments
          if (change.field === 'comments') {
            const commentData = change.value;

            if (commentData) {
              // Get integration for this Instagram account
              const instagramAccountId = entryItem.id;
              const integration = await query(
                'SELECT * FROM instagram_integrations WHERE instagram_account_id = ? AND status = ?',
                [instagramAccountId, 'active']
              );

              if (integration.rows.length > 0) {
                const ownerId = integration.rows[0]?.user_id ? Number(integration.rows[0].user_id) : null;
                const companyId = await resolveCompanyIdForUser(ownerId);
                if (!companyId) {
                  console.warn('Instagram comment lead skipped: integration user without company', {
                    instagramAccountId,
                    ownerId
                  });
                  continue;
                }
                // Process comment as potential lead
                const commentText = commentData.text || '';
                const commentFrom = commentData.from || {};

                // Extract contact information from comment
                const leadData = {
                  name: commentFrom.name || 'Lead Instagram',
                  phone: '',
                  email: '',
                  status: 'novo_lead',
                  origin: 'instagram',
                  custom_data: JSON.stringify({
                    instagram_account_id: instagramAccountId,
                    comment_id: commentData.id,
                    media_id: (commentData.media && commentData.media.id),
                    comment_text: commentText,
                    from: commentFrom
                  })
                };

                // Try to extract phone/email from comment text
                const phoneMatch = commentText.match(/(\+?55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})/);
                const emailMatch = commentText.match(/[\w.-]+@[\w.-]+\.\w+/);

                if (phoneMatch) {
                  leadData.phone = phoneMatch[0].replace(/\D/g, '');
                }
                if (emailMatch) {
                  leadData.email = emailMatch[0];
                }

                // Create lead in database if we have contact info
                if (leadData.phone || leadData.email || commentText.length > 10) {
                  const primaryFunnelId = await getPrimaryFunnelId(companyId);
                  const result = await query(
                    `INSERT INTO leads (name, phone, email, status, origin, user_id, company_id, funnel_id, custom_data, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                      leadData.name,
                      leadData.phone || '',
                      leadData.email || null,
                      leadData.status,
                      leadData.origin,
                      ownerId,
                      companyId,
                      primaryFunnelId,
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
                      `Lead criado via Instagram: comentário em ${(commentData.media && commentData.media.id) || 'post'}`
                    ]
                  );
                }
              }
            }
          }

          // Handle Instagram mentions
          if (change.field === 'mentions') {
            const mentionData = change.value;

            if (mentionData) {
              const instagramAccountId = entryItem.id;
              const integration = await query(
                'SELECT * FROM instagram_integrations WHERE instagram_account_id = ? AND status = ?',
                [instagramAccountId, 'active']
              );

              if (integration.rows.length > 0) {
                const ownerId = integration.rows[0]?.user_id ? Number(integration.rows[0].user_id) : null;
                const companyId = await resolveCompanyIdForUser(ownerId);
                if (!companyId) {
                  console.warn('Instagram mention lead skipped: integration user without company', {
                    instagramAccountId,
                    ownerId
                  });
                  continue;
                }
                const mentionFrom = mentionData.from || {};
                const leadData = {
                  name: mentionFrom.username || 'Lead Instagram',
                  phone: '',
                  email: '',
                  status: 'novo_lead',
                  origin: 'instagram',
                  custom_data: JSON.stringify({
                    instagram_account_id: instagramAccountId,
                    mention_id: mentionData.id,
                    media_id: (mentionData.media && mentionData.media.id),
                    from: mentionFrom
                  })
                };

                const primaryFunnelId = await getPrimaryFunnelId(companyId);
                const result = await query(
                  `INSERT INTO leads (name, phone, email, status, origin, user_id, company_id, funnel_id, custom_data, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                  [
                    leadData.name,
                    leadData.phone,
                    leadData.email || null,
                    leadData.status,
                    leadData.origin,
                    ownerId,
                    companyId,
                    primaryFunnelId,
                    leadData.custom_data
                  ]
                );

                const leadId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;

                await query(
                  `INSERT INTO lead_history (lead_id, action, description, created_at)
                   VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                  [
                    leadId,
                    'created',
                    `Lead criado via Instagram: menção em ${(mentionData.media && mentionData.media.id) || 'post'}`
                  ]
                );
              }
            }
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
  }
});

// Get Instagram accounts for user
router.get('/accounts', authenticate, async (req: AuthRequest, res) => {
  try {
    const { access_token } = req.query;

    if (!access_token) {
      return res.status(400).json({ message: 'Access token é obrigatório' });
    }

    // Verificar se as credenciais do Instagram/Facebook estão configuradas
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return res.status(500).json({ message: 'Credenciais do Instagram não configuradas. Configure INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET (ou FACEBOOK_APP_ID e FACEBOOK_APP_SECRET) no .env' });
    }

    // Get user's pages
    const pagesResponse = await axios.get(
      `${INSTAGRAM_GRAPH_API_BASE}/me/accounts`,
      {
        params: {
          access_token: access_token as string,
          fields: 'id,name,access_token,instagram_business_account'
        }
      }
    );

    const pages = pagesResponse.data.data || [];
    const instagramAccounts: any[] = [];

    // Get Instagram accounts for each page
    for (const page of pages) {
      if (page.instagram_business_account) {
        try {
          const igAccountResponse = await axios.get(
            `${INSTAGRAM_GRAPH_API_BASE}/${page.instagram_business_account.id}`,
            {
              params: {
                access_token: page.access_token,
                fields: 'id,username,name,profile_picture_url'
              }
            }
          );

          instagramAccounts.push({
            ...igAccountResponse.data,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token
          });
        } catch (error: any) {
          console.error(`Error fetching Instagram account for page ${page.id}:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      accounts: instagramAccounts
    });
  } catch (error: any) {
    console.error('Instagram accounts error:', error);
    res.status(500).json({
      message: error.message || 'Erro ao buscar contas Instagram',
      error: (error.response && error.response.data) || error.message
    });
  }
});

// Get Instagram insights/analytics
router.get('/:integrationId/insights', authenticate, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const userId = (req.user && req.user.id);
    const { metric, period = 'day', since, until } = req.query;

    // Get integration
    const integration = await query(
      'SELECT * FROM instagram_integrations WHERE id = ? AND user_id = ?',
      [integrationId, userId]
    );

    if (integration.rows.length === 0) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const { access_token, instagram_account_id } = integration.rows[0];

    // Fetch insights from Instagram API
    try {
      const metrics = metric ? (metric as string).split(',') : ['impressions', 'reach', 'profile_views', 'website_clicks'];
      
      const insightsResponse = await axios.get(
        `${INSTAGRAM_GRAPH_API_BASE}/${instagram_account_id}/insights`,
        {
          params: {
            access_token: access_token,
            metric: metrics.join(','),
            period: period as string,
            since: since || Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
            until: until || Math.floor(Date.now() / 1000)
          }
        }
      );

      res.json({
        success: true,
        insights: insightsResponse.data.data || []
      });
    } catch (apiError: any) {
      console.error('Instagram API error:', (apiError.response && apiError.response.data) || apiError.message);
      res.status(500).json({
        message: 'Erro ao buscar insights do Instagram',
        error: (apiError.response && apiError.response.data) || apiError.message
      });
    }
  } catch (error: any) {
    console.error('Instagram insights error:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar insights' });
  }
});

export default router;

