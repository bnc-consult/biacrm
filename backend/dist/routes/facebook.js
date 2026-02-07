"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
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
const getRedirectUri = (req) => {
    // Se estiver definido no .env, usa ele (deve ser HTTPS em produção)
    if (process.env.FACEBOOK_REDIRECT_URI) {
        // Garantir que em produção sempre use HTTPS
        const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
        const isProduction = process.env.NODE_ENV === 'production';
        // Se não for localhost e não estiver usando HTTPS, forçar HTTPS
        if (!isLocalhost && !redirectUri.startsWith('https://')) {
            console.warn('Facebook redirect URI não usa HTTPS em produção, forçando HTTPS');
            return redirectUri.replace(/^http:\/\//, 'https://');
        }
        return redirectUri;
    }
    // Detecta automaticamente baseado na requisição
    const forwardedProto = req.headers['x-forwarded-proto'];
    const host = req.get('host') || req.headers.host || 'localhost:3000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isProduction = process.env.NODE_ENV === 'production';
    // Se for localhost, usa http
    if (isLocalhost) {
        return `http://${host}/api/integrations/facebook/callback`;
    }
    // IMPORTANTE: Em produção, SEMPRE usar HTTPS (mesmo que o protocolo detectado seja HTTP)
    // O Facebook requer HTTPS para conexões seguras
    if (isProduction || !isLocalhost) {
        // Forçar HTTPS removendo porta se necessário
        const cleanHost = host.replace(/:80$/, '').replace(/:443$/, '');
        return `https://${cleanHost}/api/integrations/facebook/callback`;
    }
    // Fallback: detectar protocolo
    const protocol = req.protocol || (forwardedProto ? forwardedProto.split(',')[0] : null) || 'https';
    return `${protocol}://${host}/api/integrations/facebook/callback`;
};
// Create or update Facebook integration
router.post('/connect', auth_1.authenticate, async (req, res) => {
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
        // Usar apenas validação básica que não requer permissões especiais
        try {
            const tokenValidation = await axios_1.default.get(`${FACEBOOK_API_BASE}/me`, {
                params: {
                    access_token: access_token,
                    fields: 'id,name'
                }
            });
            const userData = tokenValidation.data;
            // Se não houver page_id fornecido, usar o ID do usuário
            if (!finalPageId || finalPageId === 'user_account' || finalPageId === '') {
                finalPageId = `user_${userData.id}`;
                finalPageName = finalPageName || userData.name || 'Conta Pessoal';
            }
            else {
                // Tentar verificar se a página pertence ao usuário (OPCIONAL - não bloquear se falhar)
                // Esta validação pode falhar se não tiver permissões especiais, então não é crítica
                try {
                    const pagesResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me/accounts`, {
                        params: {
                            access_token: access_token,
                            fields: 'id,name'
                        }
                    });
                    const pages = pagesResponse.data.data || [];
                    const pageExists = pages.some((p) => p.id === page_id);
                    if (!pageExists && page_id !== `user_${userData.id}`) {
                        // Se a página não existe, usar o ID do usuário como fallback
                        console.warn(`Página ${page_id} não encontrada, usando conta do usuário`);
                        finalPageId = `user_${userData.id}`;
                        finalPageName = userData.name || 'Conta Pessoal';
                    }
                }
                catch (pagesError) {
                    // Se não conseguir buscar páginas (por falta de permissões), usar conta do usuário
                    // NÃO bloquear a criação da integração - apenas usar a conta do usuário
                    const pagesErrorData = pagesError.response && pagesError.response.data;
                    const errorCode = pagesErrorData && pagesErrorData.error && pagesErrorData.error.code;
                    console.warn('Não foi possível buscar páginas do Facebook (pode ser falta de permissões). Usando conta do usuário:', {
                        error: pagesErrorData && pagesErrorData.error ? pagesErrorData.error.message : pagesError.message,
                        code: errorCode
                    });
                    // Usar conta do usuário como fallback
                    finalPageId = `user_${userData.id}`;
                    finalPageName = userData.name || 'Conta Pessoal';
                }
            }
        }
        catch (validationError) {
            const errorData = validationError.response && validationError.response.data;
            console.error('Facebook token validation error:', errorData || validationError.message);
            // Se o erro for de autenticação básica (token inválido), retornar erro
            if (errorData && errorData.error) {
                const fbError = errorData.error;
                const errorCode = fbError.code;
                // Erro 190 ou 102 = token inválido/expirado - bloquear
                if (errorCode === 190 || errorCode === 102) {
                    return res.status(401).json({
                        message: `Token do Facebook inválido ou expirado. Por favor, autorize novamente.`,
                        error: 'INVALID_TOKEN',
                        facebookError: fbError
                    });
                }
                // Outros erros (como falta de permissões) - não bloquear, usar conta do usuário
                console.warn('Erro ao validar token, mas continuando com conta do usuário:', fbError.message);
                finalPageId = `user_unknown`;
                finalPageName = finalPageName || 'Conta Pessoal';
            }
            else {
                // Se não conseguir validar, ainda assim permitir criar a integração
                console.warn('Não foi possível validar o token completamente, mas continuando:', validationError.message);
                if (!finalPageId) {
                    finalPageId = `user_unknown`;
                    finalPageName = finalPageName || 'Conta Pessoal';
                }
            }
        }
        // Check if integration already exists for this user and page
        const existing = await (0, connection_1.query)('SELECT id FROM facebook_integrations WHERE user_id = ? AND page_id = ?', [userId, finalPageId]);
        let integrationId;
        if (existing.rows.length > 0) {
            // Update existing integration
            integrationId = existing.rows[0].id;
            await (0, connection_1.query)(`UPDATE facebook_integrations 
         SET title = ?, access_token = ?, page_id = ?, page_name = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`, [
                title,
                access_token,
                finalPageId,
                finalPageName || null,
                expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
                integrationId
            ]);
        }
        else {
            // Create new integration
            const result = await (0, connection_1.query)(`INSERT INTO facebook_integrations 
         (user_id, title, access_token, page_id, page_name, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`, [
                userId,
                title,
                access_token,
                finalPageId,
                finalPageName || null,
                expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null
            ]);
            integrationId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;
        }
        // Fetch integration details
        const integration = await (0, connection_1.query)('SELECT * FROM facebook_integrations WHERE id = ?', [integrationId]);
        res.status(201).json({
            success: true,
            integration: integration.rows[0]
        });
    }
    catch (error) {
        console.error('Facebook connect error:', error);
        res.status(500).json({ message: error.message || 'Erro ao conectar conta Facebook' });
    }
});
// Get Facebook OAuth URL
router.get('/oauth/url', auth_1.authenticate, async (req, res) => {
    try {
        // Validar configuração antes de continuar
        validateFacebookConfig();
        const state = crypto_1.default.randomBytes(32).toString('hex');
        const userId = (req.user && req.user.id);
        // Store state in session/database for verification
        const stateWithUserId = `${state}_${userId}`;
        // Obter URI de redirecionamento dinamicamente
        const redirectUri = getRedirectUri(req);
        // Usar apenas permissões válidas do Facebook
        // Permissões básicas que funcionam sem revisão do Facebook
        // Nota: O token da página obtido de /me/accounts já inclui as permissões necessárias
        // para acessar leadgen_forms se o usuário for admin da página
        const scopes = [
            'public_profile', // Perfil público do usuário (sempre válida)
            'pages_show_list' // Listar páginas do Facebook (válida e necessária)
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
    }
    catch (error) {
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
            // Usar FRONTEND_URL ou CORS_ORIGIN do .env, ou detectar automaticamente
            let frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
            if (!frontendUrl) {
                const forwardedProto = req.headers['x-forwarded-proto'];
                const protocol = req.protocol || (forwardedProto ? forwardedProto.split(',')[0] : null) || 'http';
                const host = req.get('host') || req.headers.host || 'localhost:3000';
                // Em produção (NODE_ENV=production) ou quando não for localhost, sempre usar biacrm.com
                // Verificar também se o host da requisição não é localhost
                const isProduction = process.env.NODE_ENV === 'production';
                const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
                if (isProduction || !isLocalhost) {
                    // Em produção ou quando não for localhost, usar biacrm.com
                    frontendUrl = 'https://biacrm.com';
                }
                else {
                    // Apenas em desenvolvimento local usar localhost
                    frontendUrl = 'http://localhost:5173';
                }
                console.log('Facebook callback - Fallback URL detection:', {
                    NODE_ENV: process.env.NODE_ENV,
                    isProduction,
                    host,
                    isLocalhost,
                    selectedUrl: frontendUrl
                });
            }
            // Limpar URL
            frontendUrl = frontendUrl.replace(/\/$/, '').replace(/:443$/, '').replace(/:80$/, '');
            let errorMessage = 'Autenticação falhou. ';
            const errorDescriptionStr = typeof error_description === 'string' ? error_description : '';
            if (error_reason === 'user_denied' || error === 'access_denied') {
                errorMessage += 'Você cancelou a autorização. Por favor, tente novamente e autorize o acesso.';
            }
            else if (errorDescriptionStr && errorDescriptionStr.toLowerCase().includes('password')) {
                errorMessage += 'Login ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.';
            }
            else {
                errorMessage += 'Por favor, verifique seu login e senha do Facebook e tente novamente.';
            }
            return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
        }
        // Verificar se o código foi fornecido
        if (!code) {
            console.error('Facebook callback - Código não fornecido. Query params:', req.query);
            // Detectar frontend URL (mesma lógica do início)
            let frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
            if (!frontendUrl) {
                const host = req.get('host') || req.headers.host || 'localhost:3000';
                const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
                const isProduction = process.env.NODE_ENV === 'production';
                if (isProduction || !isLocalhost) {
                    frontendUrl = 'https://biacrm.com';
                }
                else {
                    frontendUrl = 'http://localhost:5173';
                }
            }
            // Limpar URL
            frontendUrl = frontendUrl.replace(/\/$/, '').replace(/:443$/, '').replace(/:80$/, '');
            // Mensagem de erro mais específica
            let errorMessage = 'Código de autorização não fornecido. ';
            // Verificar se há parâmetros de erro que não foram capturados
            if (req.query.error || req.query.error_reason) {
                errorMessage += 'O Facebook retornou um erro durante a autorização. ';
            }
            else {
                errorMessage += 'A URL de callback pode não estar configurada corretamente no Facebook App. ';
            }
            errorMessage += 'Por favor, tente novamente ou verifique as configurações do app.';
            return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
        }
        // Extract userId from state
        const stateParts = state && state.split('_');
        const userId = (stateParts && stateParts[stateParts.length - 1]);
        // Obter URI de redirecionamento dinamicamente (deve ser o mesmo usado na URL de autorização)
        const redirectUri = getRedirectUri(req);
        // Detectar host da requisição primeiro
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
        const isProduction = process.env.NODE_ENV === 'production';
        // Usar FRONTEND_URL ou CORS_ORIGIN do .env
        let frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
        // Log para debug
        console.log('Facebook callback - Frontend URL detection:', {
            FRONTEND_URL: process.env.FRONTEND_URL || 'não definido',
            CORS_ORIGIN: process.env.CORS_ORIGIN || 'não definido',
            detected: frontendUrl || 'não detectado',
            host: host,
            isLocalhost: isLocalhost,
            NODE_ENV: process.env.NODE_ENV,
            isProduction: isProduction
        });
        // IMPORTANTE: Se não for localhost, SEMPRE usar biacrm.com (mesmo que variáveis não estejam definidas)
        if (!isLocalhost) {
            frontendUrl = 'https://biacrm.com';
            console.log('Facebook callback - Forçando uso de https://biacrm.com (host não é localhost)');
        }
        else if (!frontendUrl) {
            // Apenas se for localhost E não houver variáveis definidas, usar localhost:5173
            frontendUrl = 'http://localhost:5173';
            console.log('Facebook callback - Usando localhost:5173 (desenvolvimento local)');
        }
        // Garantir que não há trailing slash e remover porta se for padrão
        frontendUrl = frontendUrl.replace(/\/$/, ''); // Remove trailing slash
        frontendUrl = frontendUrl.replace(/:443$/, ''); // Remove porta 443 padrão HTTPS
        frontendUrl = frontendUrl.replace(/:80$/, ''); // Remove porta 80 padrão HTTP
        // Log final da URL que será usada
        console.log('Facebook callback - URL final de redirecionamento:', frontendUrl);
        // Exchange code for access token
        let tokenResponse;
        try {
            tokenResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/oauth/access_token`, {
                params: {
                    client_id: FACEBOOK_APP_ID,
                    client_secret: FACEBOOK_APP_SECRET,
                    redirect_uri: redirectUri,
                    code: code
                }
            });
        }
        catch (tokenError) {
            const tokenErrorData = tokenError.response && tokenError.response.data;
            console.error('Facebook token exchange error:', tokenErrorData || tokenError.message);
            const fbError = tokenErrorData && tokenErrorData.error;
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
                }
                else if (errorType === 'OAuthException') {
                    errorMessage += 'Erro na autorização. Por favor, verifique seu login e senha do Facebook e tente novamente.';
                }
                else {
                    errorMessage += fbErrorMessage || 'Por favor, verifique seu login e senha do Facebook e tente novamente.';
                }
            }
            else {
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
            // IMPORTANTE: Solicitar o access_token da página explicitamente
            // O token da página tem permissões para acessar leadgen_forms se o usuário for admin
            pagesResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me/accounts`, {
                params: {
                    access_token: access_token,
                    fields: 'id,name,access_token,tasks' // tasks mostra permissões da página
                }
            });
        }
        catch (pagesError) {
            const pagesErrorData = pagesError.response && pagesError.response.data;
            console.error('Facebook pages fetch error:', pagesErrorData || pagesError.message);
            const fbError = pagesErrorData && pagesErrorData.error;
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
                }
                else {
                    errorMessage += fbErrorMessage || 'Por favor, verifique seu login e senha do Facebook e tente novamente.';
                }
            }
            else {
                errorMessage += 'Não foi possível validar o acesso. Por favor, verifique seu login e senha do Facebook e tente novamente.';
            }
            return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
        }
        const pages = pagesResponse.data.data || [];
        // Log para debug - verificar se os tokens da página estão sendo retornados
        console.log('Facebook pages response:', {
            hasData: !!pagesResponse.data.data,
            pagesCount: pages && pages.length ? pages.length : 0,
            userTokenPreview: access_token ? access_token.substring(0, 20) + '...' : 'null',
            pages: pages && pages.length ? pages.map((p) => {
                const pageTokenPreview = p.access_token ? p.access_token.substring(0, 20) + '...' : 'null';
                const isDifferentFromUserToken = p.access_token && access_token ? p.access_token !== access_token : false;
                return {
                    id: p.id,
                    name: p.name,
                    hasAccessToken: !!p.access_token,
                    accessTokenLength: p.access_token ? p.access_token.length : 0,
                    accessTokenPreview: pageTokenPreview,
                    isDifferentFromUserToken: isDifferentFromUserToken,
                    tasks: p.tasks || []
                };
            }) : []
        });
        // IMPORTANTE: Garantir que cada página tenha seu access_token
        // O token da página é necessário para acessar leadgen_forms
        pages.forEach((page) => {
            if (!page.access_token) {
                console.warn(`⚠️ Página ${page.id} (${page.name}) não tem access_token!`);
            }
            else if (page.access_token === access_token) {
                console.warn(`⚠️ Página ${page.id} (${page.name}) tem o mesmo token do usuário! Isso pode causar problemas de permissão.`);
            }
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
    }
    catch (error) {
        console.error('Facebook callback error:', error);
        // Detectar host da requisição primeiro - CRÍTICO para determinar URL correta
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
        // Usar FRONTEND_URL ou CORS_ORIGIN do .env
        let frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
        // IMPORTANTE: Se não for localhost, SEMPRE usar biacrm.com
        if (!isLocalhost) {
            frontendUrl = 'https://biacrm.com';
            console.log('Facebook callback error - Forçando uso de https://biacrm.com (host não é localhost)');
        }
        else if (!frontendUrl) {
            // Apenas se for localhost E não houver variáveis definidas, usar localhost:5173
            frontendUrl = 'http://localhost:5173';
        }
        // Garantir que não há trailing slash e remover porta se for padrão
        frontendUrl = frontendUrl.replace(/\/$/, ''); // Remove trailing slash
        frontendUrl = frontendUrl.replace(/:443$/, ''); // Remove porta 443 padrão HTTPS
        frontendUrl = frontendUrl.replace(/:80$/, ''); // Remove porta 80 padrão HTTP
        // Log final da URL que será usada
        console.log('Facebook callback error - URL final de redirecionamento:', frontendUrl);
        const errorMessage = error.message || 'Erro ao processar autorização do Facebook. Por favor, verifique seu login e senha e tente novamente.';
        return res.redirect(`${frontendUrl}/entrada-saida?facebook_error=${encodeURIComponent(errorMessage)}`);
    }
});
// Get all Facebook integrations for user
router.get('/list', auth_1.authenticate, async (req, res) => {
    try {
        const userId = (req.user && req.user.id);
        const integrations = await (0, connection_1.query)(`SELECT id, title, page_id, page_name, status, created_at, updated_at 
       FROM facebook_integrations 
       WHERE user_id = ? 
       ORDER BY created_at DESC`, [userId]);
        res.json({
            success: true,
            integrations: integrations.rows
        });
    }
    catch (error) {
        console.error('Facebook list error:', error);
        res.status(500).json({ message: error.message || 'Erro ao listar integrações Facebook' });
    }
});
// IMPORTANTE: Rotas específicas DEVEM vir ANTES das rotas com parâmetros
// Caso contrário, Express interpreta "/forms" como "/:integrationId" com integrationId="forms"
// Get Facebook pages for user
router.get('/pages', auth_1.authenticate, async (req, res) => {
    try {
        const { access_token } = req.query;
        if (!access_token) {
            return res.status(400).json({ message: 'Access token é obrigatório' });
        }
        // Get user's pages
        // IMPORTANTE: Solicitar o access_token da página explicitamente
        // O token da página tem permissões para acessar leadgen_forms se o usuário for admin
        const pagesResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me/accounts`, {
            params: {
                access_token: access_token,
                fields: 'id,name,access_token,category,picture,tasks' // tasks mostra permissões da página
            }
        });
        // Log para verificar se os tokens da página estão sendo retornados
        const pages = pagesResponse.data.data || [];
        console.log('📄 Páginas obtidas com tokens:', {
            count: pages.length,
            pages: pages.map((p) => ({
                id: p.id,
                name: p.name,
                hasAccessToken: !!p.access_token,
                accessTokenLength: p.access_token ? p.access_token.length : 0,
                tasks: p.tasks || []
            }))
        });
        res.json({
            success: true,
            pages: pagesResponse.data.data || []
        });
    }
    catch (error) {
        console.error('Facebook pages error:', error);
        res.status(500).json({
            message: error.message || 'Erro ao buscar páginas',
            error: (error.response && error.response.data) || error.message
        });
    }
});
// Get Facebook forms for a page
router.get('/forms', auth_1.authenticate, async (req, res) => {
    try {
        const { access_token, page_id, user_access_token } = req.query;
        console.log('🔍 Buscando formulários do Facebook:', {
            page_id: page_id,
            hasAccessToken: !!access_token,
            hasUserAccessToken: !!user_access_token,
            accessTokenLength: access_token ? access_token.length : 0
        });
        if (!page_id) {
            return res.status(400).json({ message: 'Page ID é obrigatório' });
        }
        // Estratégia: Tentar com o token fornecido primeiro
        // Se falhar com erro de permissão, tentar obter o token da página usando o token do usuário
        let tokenToUse = access_token;
        let tokenSource = 'provided';
        // Se o token fornecido falhar com erro de permissão, tentar obter o token da página
        if (!tokenToUse && user_access_token) {
            console.log('⚠️ Token da página não fornecido. Tentando obter do token do usuário...');
            try {
                const pagesResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me/accounts`, {
                    params: {
                        access_token: user_access_token,
                        fields: 'id,name,access_token'
                    }
                });
                const pages = pagesResponse.data.data || [];
                const page = pages.find((p) => p.id === page_id);
                if (page && page.access_token) {
                    tokenToUse = page.access_token;
                    tokenSource = 'fetched_from_user_token';
                    console.log('✅ Token da página obtido:', {
                        page_id: page.id,
                        page_name: page.name,
                        token_length: tokenToUse.length
                    });
                }
                else {
                    return res.status(400).json({
                        message: 'Token da página não encontrado. Certifique-se de que você é administrador da página.'
                    });
                }
            }
            catch (pagesError) {
                console.error('❌ Erro ao buscar token da página:', pagesError.message);
                return res.status(400).json({
                    message: 'Não foi possível obter o token da página. Certifique-se de que você é administrador da página.'
                });
            }
        }
        if (!tokenToUse) {
            return res.status(400).json({ message: 'Access token é obrigatório' });
        }
        console.log('🔑 Token sendo usado:', {
            source: tokenSource,
            page_id: page_id,
            token_length: tokenToUse.length,
            token_preview: tokenToUse.substring(0, 20) + '...'
        });
        // Tentar buscar formulários
        let formsResponse;
        try {
            formsResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${page_id}/leadgen_forms`, {
                params: {
                    access_token: tokenToUse,
                    fields: 'id,name,status,leads_count,created_time'
                }
            });
        }
        catch (formsError) {
            const formsErrorData = formsError.response && formsError.response.data ? formsError.response.data : null;
            const formsErrorObj = formsErrorData && formsErrorData.error ? formsErrorData.error : null;
            const errorCode = formsErrorObj && formsErrorObj.code ? formsErrorObj.code : null;
            const errorMessage = formsErrorObj && formsErrorObj.message ? formsErrorObj.message : formsError.message;
            console.error('❌ Erro ao buscar leadgen_forms:', {
                message: errorMessage,
                code: errorCode,
                page_id: page_id,
                token_source: tokenSource,
                fullError: formsErrorData
            });
            // Se o erro for de permissão e temos o token do usuário, tentar obter o token da página novamente
            if ((errorCode === 200 || errorCode === 100) && user_access_token && tokenSource === 'provided') {
                console.log('⚠️ Erro de permissão detectado. Tentando obter token da página usando token do usuário...');
                try {
                    const pagesResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me/accounts`, {
                        params: {
                            access_token: user_access_token,
                            fields: 'id,name,access_token'
                        }
                    });
                    const pages = pagesResponse.data.data || [];
                    const page = pages.find((p) => p.id === page_id);
                    console.log('🔍 Página encontrada para retry:', {
                        page_id: page_id,
                        found: !!page,
                        hasAccessToken: page && page.access_token ? true : false,
                        accessTokenLength: page && page.access_token ? page.access_token.length : 0,
                        accessTokenPreview: page && page.access_token ? page.access_token.substring(0, 20) + '...' : 'null',
                        userTokenPreview: user_access_token ? user_access_token.substring(0, 20) + '...' : 'null',
                        areTokensDifferent: page && page.access_token && user_access_token ? page.access_token !== user_access_token : false
                    });
                    if (page && page.access_token) {
                        // Verificar se o token da página é diferente do token do usuário
                        const isDifferentToken = page.access_token !== user_access_token;
                        console.log('🔑 Comparação de tokens no retry:', {
                            pageTokenLength: page.access_token.length,
                            userTokenLength: user_access_token.length,
                            areDifferent: isDifferentToken,
                            pageTokenPreview: page.access_token.substring(0, 20) + '...',
                            userTokenPreview: user_access_token.substring(0, 20) + '...'
                        });
                        // Tentar verificar permissões do token usando debug_token
                        try {
                            const debugResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/debug_token`, {
                                params: {
                                    input_token: page.access_token,
                                    access_token: FACEBOOK_APP_ID + '|' + FACEBOOK_APP_SECRET
                                }
                            });
                            const debugData = debugResponse.data && debugResponse.data.data ? debugResponse.data.data : null;
                            const grantedScopes = debugData && debugData.scopes ? debugData.scopes : [];
                            console.log('🔐 Permissões do token da página:', {
                                scopes: grantedScopes,
                                hasPagesManageAds: grantedScopes.includes('pages_manage_ads'),
                                hasLeadsRetrieval: grantedScopes.includes('leads_retrieval'),
                                hasPagesReadEngagement: grantedScopes.includes('pages_read_engagement')
                            });
                        }
                        catch (debugError) {
                            console.warn('⚠️ Não foi possível verificar permissões do token:', debugError.message);
                        }
                        console.log('✅ Tentando novamente com token da página obtido...');
                        // Tentar novamente com o token da página
                        formsResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${page_id}/leadgen_forms`, {
                            params: {
                                access_token: page.access_token,
                                fields: 'id,name,status,leads_count,created_time'
                            }
                        });
                    }
                    else {
                        throw new Error('Token da página não encontrado');
                    }
                }
                catch (retryError) {
                    // Se ainda falhar, retornar erro original
                    throw formsError;
                }
            }
            else {
                // Se não temos token do usuário ou já tentamos, retornar erro
                throw formsError;
            }
        }
        const forms = formsResponse.data.data || [];
        console.log('✅ Formulários encontrados:', {
            count: forms.length,
            forms: forms.map((f) => ({ id: f.id, name: f.name }))
        });
        res.json({
            success: true,
            forms: forms
        });
    }
    catch (error) {
        const errorResponse = error.response || {};
        const errorData = errorResponse.data || {};
        const errorObj = errorData.error || {};
        const errorMessage = errorObj.message || error.message || 'Erro ao buscar formulários';
        const errorCode = errorObj.code;
        const errorType = errorObj.type;
        console.error('❌ Facebook forms error:', {
            message: errorMessage,
            code: errorCode,
            type: errorType,
            page_id: req.query.page_id,
            fullError: errorData
        });
        // Retornar erro detalhado para o frontend
        res.status(errorResponse.status || 500).json({
            success: false,
            message: errorMessage,
            error: {
                code: errorCode,
                type: errorType,
                message: errorMessage,
                full: errorData
            },
            forms: []
        });
    }
});
// Get Facebook users/admins for a page
router.get('/users', auth_1.authenticate, async (req, res) => {
    try {
        const { access_token, page_id } = req.query;
        if (!access_token) {
            return res.status(400).json({ message: 'Access token é obrigatório' });
        }
        if (!page_id) {
            return res.status(400).json({ message: 'Page ID é obrigatório' });
        }
        // Get users/admins for the page
        try {
            const usersResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${page_id}/roles`, {
                params: {
                    access_token: access_token
                }
            });
            const roles = usersResponse.data.data || [];
            const users = [];
            // Fetch user details for each role
            for (const role of roles) {
                try {
                    const userResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${role.user}`, {
                        params: {
                            access_token: access_token,
                            fields: 'id,name,email'
                        }
                    });
                    users.push({
                        ...userResponse.data,
                        role: role.role
                    });
                }
                catch (userError) {
                    // Se não conseguir buscar detalhes, adicionar apenas o ID
                    users.push({
                        id: role.user,
                        role: role.role
                    });
                }
            }
            // Remove duplicates
            const uniqueUsers = users.filter((user, index, self) => index === self.findIndex((u) => u.id === user.id));
            res.json({
                success: true,
                users: uniqueUsers
            });
        }
        catch (rolesError) {
            // Se não conseguir buscar roles, tentar buscar informações do usuário atual
            console.warn('Erro ao buscar roles da página, tentando buscar informações do usuário:', rolesError.message);
            try {
                const meResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me`, {
                    params: {
                        access_token: access_token,
                        fields: 'id,name,email'
                    }
                });
                res.json({
                    success: true,
                    users: [meResponse.data]
                });
            }
            catch (meError) {
                console.error('Facebook users error:', meError);
                res.status(500).json({
                    message: meError.message || 'Erro ao buscar usuários',
                    error: (meError.response && meError.response.data) || meError.message
                });
            }
        }
    }
    catch (error) {
        console.error('Facebook users error:', error);
        res.status(500).json({
            message: error.message || 'Erro ao buscar usuários',
            error: (error.response && error.response.data) || error.message
        });
    }
});
// Get Facebook integration details
router.get('/:integrationId', auth_1.authenticate, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const userId = (req.user && req.user.id);
        const integration = await (0, connection_1.query)(`SELECT id, title, page_id, page_name, status, created_at, updated_at 
       FROM facebook_integrations 
       WHERE id = ? AND user_id = ?`, [integrationId, userId]);
        if (integration.rows.length === 0) {
            return res.status(404).json({ message: 'Integração não encontrada' });
        }
        res.json({
            success: true,
            integration: integration.rows[0]
        });
    }
    catch (error) {
        console.error('Facebook get error:', error);
        res.status(500).json({ message: error.message || 'Erro ao buscar integração' });
    }
});
// Update Facebook integration
router.put('/:integrationId', auth_1.authenticate, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const { title, status } = req.body;
        const userId = (req.user && req.user.id);
        // Verify ownership
        const existing = await (0, connection_1.query)('SELECT id FROM facebook_integrations WHERE id = ? AND user_id = ?', [integrationId, userId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Integração não encontrada' });
        }
        const updates = [];
        const values = [];
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
        await (0, connection_1.query)(`UPDATE facebook_integrations 
       SET ${updates.join(', ')} 
       WHERE id = ?`, [...values]);
        const updated = await (0, connection_1.query)('SELECT * FROM facebook_integrations WHERE id = ?', [integrationId]);
        res.json({
            success: true,
            integration: updated.rows[0]
        });
    }
    catch (error) {
        console.error('Facebook update error:', error);
        res.status(500).json({ message: error.message || 'Erro ao atualizar integração' });
    }
});
// Delete Facebook integration
router.delete('/:integrationId', auth_1.authenticate, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const userId = (req.user && req.user.id);
        // Verify ownership
        const existing = await (0, connection_1.query)('SELECT id FROM facebook_integrations WHERE id = ? AND user_id = ?', [integrationId, userId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Integração não encontrada' });
        }
        await (0, connection_1.query)('DELETE FROM facebook_integrations WHERE id = ?', [integrationId]);
        res.json({
            success: true,
            message: 'Integração removida com sucesso'
        });
    }
    catch (error) {
        console.error('Facebook delete error:', error);
        res.status(500).json({ message: error.message || 'Erro ao remover integração' });
    }
});
// Refresh Facebook access token
router.post('/:integrationId/refresh', auth_1.authenticate, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const userId = (req.user && req.user.id);
        // Get integration
        const integration = await (0, connection_1.query)('SELECT * FROM facebook_integrations WHERE id = ? AND user_id = ?', [integrationId, userId]);
        if (integration.rows.length === 0) {
            return res.status(404).json({ message: 'Integração não encontrada' });
        }
        const { access_token, page_id } = integration.rows[0];
        // Exchange short-lived token for long-lived token
        const tokenResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                fb_exchange_token: access_token
            }
        });
        const { access_token: new_access_token, expires_in } = tokenResponse.data;
        // Get page access token
        const pagesResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/me/accounts`, {
            params: {
                access_token: new_access_token,
                fields: 'id,name,access_token'
            }
        });
        const pages = pagesResponse.data.data || [];
        const page = pages.find((p) => p.id === page_id);
        const page_access_token = (page && page.access_token) || new_access_token;
        // Update token in database
        await (0, connection_1.query)(`UPDATE facebook_integrations 
       SET access_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [
            page_access_token,
            expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
            integrationId
        ]);
        res.json({
            success: true,
            message: 'Token atualizado com sucesso'
        });
    }
    catch (error) {
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
                            const integration = await (0, connection_1.query)('SELECT * FROM facebook_integrations WHERE page_id = ? AND status = ?', [pageId, 'active']);
                            if (integration.rows.length > 0) {
                                const { access_token, user_id } = integration.rows[0];
                                const ownerId = user_id ? Number(user_id) : null;
                                let companyId = null;
                                if (ownerId) {
                                    const companyResult = await (0, connection_1.query)('SELECT company_id FROM users WHERE id = ?', [ownerId]);
                                    companyId = companyResult.rows[0]?.company_id ? Number(companyResult.rows[0].company_id) : null;
                                }
                                // Fetch lead details from Facebook
                                try {
                                    const leadResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${leadgenId}`, {
                                        params: {
                                            access_token: access_token,
                                            fields: 'id,created_time,field_data'
                                        }
                                    });
                                    const leadData = leadResponse.data;
                                    const fieldData = leadData.field_data || [];
                                    // Extract lead information
                                    const leadInfo = {
                                        name: '',
                                        phone: '',
                                        email: '',
                                        custom_data: {}
                                    };
                                    fieldData.forEach((field) => {
                                        const fieldName = (field.name && field.name.toLowerCase)() || '';
                                        const fieldValue = (field.values && field.values[0]) || '';
                                        if (fieldName.includes('first_name') || fieldName.includes('full_name')) {
                                            leadInfo.name = fieldValue;
                                        }
                                        else if (fieldName.includes('phone') || fieldName.includes('phone_number')) {
                                            leadInfo.phone = fieldValue;
                                        }
                                        else if (fieldName.includes('email')) {
                                            leadInfo.email = fieldValue;
                                        }
                                        else {
                                            leadInfo.custom_data[fieldName] = fieldValue;
                                        }
                                    });
                                    // Create lead in database
                                    if (leadInfo.name || leadInfo.phone || leadInfo.email) {
                                        const result = await (0, connection_1.query)(`INSERT INTO leads (name, phone, email, status, origin, user_id, company_id, custom_data, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
                                            leadInfo.name || 'Lead Facebook',
                                            leadInfo.phone || '',
                                            leadInfo.email || null,
                                            'novo_lead',
                                            'facebook',
                                            ownerId,
                                            companyId,
                                            JSON.stringify({
                                                facebook_leadgen_id: leadgenId,
                                                facebook_page_id: pageId,
                                                created_time: leadData.created_time,
                                                ...leadInfo.custom_data
                                            })
                                        ]);
                                        const leadId = (result.rows[0] && result.rows[0].lastInsertRowid) || (result.rows[0] && result.rows[0].id) || 0;
                                        // Log webhook event
                                        await (0, connection_1.query)(`INSERT INTO lead_history (lead_id, action, description, created_at)
                       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, [
                                            leadId,
                                            'created',
                                            `Lead criado via Facebook: ${pageId}`
                                        ]);
                                    }
                                }
                                catch (apiError) {
                                    console.error('Error fetching Facebook lead:', (apiError.response && apiError.response.data) || apiError.message);
                                }
                            }
                        }
                    }
                }
            }
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Facebook webhook error:', error);
        res.status(500).json({ message: error.message || 'Erro ao processar webhook' });
    }
});
// Get Facebook leads (from Facebook API)
router.get('/:integrationId/leads', auth_1.authenticate, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const userId = (req.user && req.user.id);
        const { start_date, end_date, limit = 25 } = req.query;
        // Get integration
        const integration = await (0, connection_1.query)('SELECT * FROM facebook_integrations WHERE id = ? AND user_id = ?', [integrationId, userId]);
        if (integration.rows.length === 0) {
            return res.status(404).json({ message: 'Integração não encontrada' });
        }
        const { access_token, page_id } = integration.rows[0];
        // Fetch leads from Facebook API
        try {
            const formResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${page_id}/leadgen_forms`, {
                params: {
                    access_token: access_token,
                    fields: 'id,name'
                }
            });
            const forms = formResponse.data.data || [];
            const allLeads = [];
            // Fetch leads from each form
            for (const form of forms) {
                try {
                    const leadsResponse = await axios_1.default.get(`${FACEBOOK_API_BASE}/${form.id}/leads`, {
                        params: {
                            access_token: access_token,
                            fields: 'id,created_time,field_data',
                            limit: parseInt(limit)
                        }
                    });
                    const leads = leadsResponse.data.data || [];
                    allLeads.push(...leads.map((lead) => ({
                        ...lead,
                        form_id: form.id,
                        form_name: form.name
                    })));
                }
                catch (formError) {
                    console.error(`Error fetching leads from form ${form.id}:`, formError.message);
                }
            }
            // Filter by date if provided
            let filteredLeads = allLeads;
            if (start_date || end_date) {
                filteredLeads = allLeads.filter((lead) => {
                    const leadDate = new Date(lead.created_time);
                    if (start_date && leadDate < new Date(start_date))
                        return false;
                    if (end_date && leadDate > new Date(end_date))
                        return false;
                    return true;
                });
            }
            res.json({
                success: true,
                leads: filteredLeads,
                total: filteredLeads.length
            });
        }
        catch (apiError) {
            console.error('Facebook API error:', (apiError.response && apiError.response.data) || apiError.message);
            res.status(500).json({
                message: 'Erro ao buscar leads do Facebook',
                error: (apiError.response && apiError.response.data) || apiError.message
            });
        }
    }
    catch (error) {
        console.error('Facebook leads error:', error);
        res.status(500).json({ message: error.message || 'Erro ao buscar leads' });
    }
});
exports.default = router;
//# sourceMappingURL=facebook.js.map