# 🔧 Como Configurar as Credenciais do Instagram

## Problema
Se você está vendo a mensagem: *"Para conectar o Instagram, é necessário configurar as credenciais OAuth no servidor"*, significa que as variáveis de ambiente não estão configuradas no arquivo `.env`.

## Solução Rápida

### Passo 1: Abrir o arquivo `.env`
Abra o arquivo `backend/.env` no editor de texto.

### Passo 2: Adicionar as variáveis
Adicione as seguintes linhas no final do arquivo `.env`:

```env
# Facebook OAuth (usado também para Instagram)
FACEBOOK_APP_ID=seu_facebook_app_id_aqui
FACEBOOK_APP_SECRET=seu_facebook_app_secret_aqui
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/integrations/facebook/callback

# Instagram OAuth (opcional - usa Facebook se não configurado)
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/integrations/instagram/callback
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio_seguro_aqui

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**NOTA IMPORTANTE:** 
- Se você não configurar `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET`, o sistema usará automaticamente `FACEBOOK_APP_ID` e `FACEBOOK_APP_SECRET`
- O Instagram Business usa a mesma aplicação do Facebook, então você pode usar as mesmas credenciais

### Passo 3: Obter as credenciais do Facebook

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Faça login com sua conta do Facebook
3. Vá em **Meus Apps** → **Criar App** (ou selecione um app existente)
4. Adicione o produto **Instagram Graph API**:
   - Vá em **Produtos** → **+ Adicionar Produto**
   - Procure por **Instagram Graph API** e clique em **Configurar**
5. Configure as configurações básicas:
   - **App ID**: Encontre em **Configurações** → **Básico**
   - **App Secret**: Clique em **Mostrar** ao lado de "Chave Secreta do App"
6. **Configure os Domínios do App (CRÍTICO):**
   - Vá em **Configurações** → **Básico**
   - Role até **Domínios do App**
   - Adicione os seguintes domínios (um por vez, sem http://):
     - `localhost`
     - `127.0.0.1`
     - `biacrm.com`
     - `www.biacrm.com`
   - **Salve as alterações**
   
   ⚠️ **ERRO COMUM:** Se você ver o erro "Domínio não incluído nos domínios do app", 
   significa que esqueceu este passo! Veja `RESOLVER_ERRO_DOMINIO_FACEBOOK.md` para ajuda detalhada.

7. Configure o OAuth Redirect URI:
   - Vá em **Produtos** → **Facebook Login** → **Configurações**
   - Em **Configurações de Cliente OAuth**, adicione em **URIs de redirecionamento OAuth válidos**:
     - `http://127.0.0.1:3000/api/integrations/instagram/callback` (recomendado para desenvolvimento)
     - `http://localhost:3000/api/integrations/instagram/callback` (alternativa)
     - `https://biacrm.com/api/integrations/instagram/callback` (para produção)
   - **Salve as alterações**
   
   **⚠️ IMPORTANTE:** 
   - Certifique-se de que o App está em modo **Desenvolvimento** (Configurações → Básico)
   - Os domínios devem estar configurados ANTES de adicionar as URLs de redirecionamento
   
   Veja o arquivo `RESOLVER_ERRO_DOMINIO_FACEBOOK.md` se encontrar erros de domínio.

### Passo 4: Substituir os valores no .env
Substitua `seu_facebook_app_id_aqui` e `seu_facebook_app_secret_aqui` pelos valores reais do seu App do Facebook.

### Passo 5: Reiniciar o servidor
Após salvar o arquivo `.env`, reinicie o servidor backend:

```bash
cd backend
npm run dev
```

## Exemplo de arquivo .env completo

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:./database.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Facebook OAuth (usado também para Instagram)
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/integrations/facebook/callback

# Instagram OAuth
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/integrations/instagram/callback
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=meu_token_secreto_aleatorio_12345

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Verificação

Após configurar, teste novamente a integração do Instagram. Se ainda houver problemas:

1. Verifique se o servidor foi reiniciado
2. Verifique se não há espaços extras nas variáveis
3. Verifique se os valores estão entre aspas (não é necessário, mas pode ajudar)
4. Verifique os logs do servidor para mensagens de erro mais detalhadas

## Permissões Necessárias no Facebook App

Certifique-se de que seu App do Facebook tem as seguintes permissões:

- `pages_show_list` - Listar páginas do Facebook
- `pages_read_engagement` - Ler engajamento das páginas
- `pages_manage_metadata` - Gerenciar metadados das páginas
- `business_management` - Gerenciar negócios (necessário para Instagram Business)

**NOTA:** As permissões específicas do Instagram (`instagram_basic`, `instagram_content_publish`, etc.) não são mais válidas. O Instagram Graph API funciona através das páginas do Facebook.

Essas permissões são solicitadas automaticamente durante o fluxo OAuth.

