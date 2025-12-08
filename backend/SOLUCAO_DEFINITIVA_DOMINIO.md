# 🔧 Solução Definitiva para Erro de Domínio Facebook

## Se o erro persistir após configurar domínios, tente estas soluções:

### ✅ Solução 1: Verificar Configuração Completa (Passo a Passo Detalhado)

#### 1.1 Verificar Modo do App
```
Facebook Developers → Seu App → Configurações → Básico
```
- **Modo do App**: Deve estar como **"Desenvolvimento"**
- Se estiver em "Produção", mude para "Desenvolvimento"
- Clique em **"Salvar alterações"**

#### 1.2 Adicionar Domínios (Método Correto)
```
Facebook Developers → Seu App → Configurações → Básico → Domínios do App
```

**IMPORTANTE:**
- NÃO use `http://` ou `https://`
- NÃO use porta `:3000`
- Use APENAS o domínio puro

**Adicione EXATAMENTE assim (um por linha):**
```
localhost
127.0.0.1
biacrm.com
```

**NÃO adicione assim (ERRADO):**
```
http://localhost
localhost:3000
http://127.0.0.1:3000
```

#### 1.3 Configurar URLs de Redirecionamento
```
Facebook Developers → Seu App → Produtos → Facebook Login → Configurações
```

**Em "URIs de redirecionamento OAuth válidos", adicione:**
```
http://127.0.0.1:3000/api/integrations/instagram/callback
http://localhost:3000/api/integrations/instagram/callback
```

**IMPORTANTE:**
- Use `http://` (não `https://`) para localhost
- Inclua a porta `:3000`
- Inclua o caminho completo `/api/integrations/instagram/callback`

#### 1.4 Verificar Arquivo .env
Abra `backend/.env` e verifique:

```env
INSTAGRAM_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/instagram/callback
```

**OU**

```env
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/integrations/instagram/callback
```

**Certifique-se de que:**
- A URL está exatamente igual à configurada no Facebook
- Não há espaços extras
- Não há aspas ao redor

### ✅ Solução 2: Usar ngrok (Recomendado se localhost não funcionar)

O ngrok cria um túnel público para seu localhost, resolvendo problemas de domínio.

#### Passo 1: Instalar ngrok
- Windows: Baixe de https://ngrok.com/download
- Ou use: `choco install ngrok` (se tiver Chocolatey)
- Ou use: `winget install ngrok` (Windows 11)

#### Passo 2: Iniciar o servidor backend
```bash
cd backend
npm run dev
```

#### Passo 3: Em outro terminal, iniciar ngrok
```bash
ngrok http 3000
```

Você verá algo como:
```
Forwarding  https://abc123def456.ngrok.io -> http://localhost:3000
```

#### Passo 4: Configurar no Facebook Developers

**Domínios do App:**
```
abc123def456.ngrok.io
```
(Sem `https://`, apenas o domínio)

**URIs de redirecionamento OAuth válidos:**
```
https://abc123def456.ngrok.io/api/integrations/instagram/callback
```
(Com `https://` e caminho completo)

#### Passo 5: Atualizar .env
```env
INSTAGRAM_REDIRECT_URI=https://abc123def456.ngrok.io/api/integrations/instagram/callback
FRONTEND_URL=https://abc123def456.ngrok.io
```

#### Passo 6: Reiniciar servidor backend
```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

**⚠️ IMPORTANTE:** A URL do ngrok muda a cada vez que você reinicia (versão gratuita). 
Você precisará atualizar no Facebook e no `.env` sempre que reiniciar.

**💡 DICA:** Use ngrok com domínio fixo (versão paga) para evitar isso.

### ✅ Solução 3: Usar Domínio de Produção

Se você tem um servidor de produção configurado:

#### No Facebook Developers:
**Domínios do App:**
```
biacrm.com
www.biacrm.com
```

**URIs de redirecionamento OAuth válidos:**
```
https://biacrm.com/api/integrations/instagram/callback
```

#### No arquivo .env:
```env
INSTAGRAM_REDIRECT_URI=https://biacrm.com/api/integrations/instagram/callback
FRONTEND_URL=https://biacrm.com
```

### ✅ Solução 4: Verificar Permissões e Produtos

#### Verificar se Instagram Graph API está adicionado:
```
Facebook Developers → Seu App → Produtos
```
- Deve ter **Instagram Graph API** listado
- Se não tiver, clique em **+ Adicionar Produto** → **Instagram Graph API** → **Configurar**

#### Verificar Permissões:
```
Facebook Developers → Seu App → Permissões e Recursos
```

Deve ter:
- `instagram_basic`
- `instagram_content_publish`
- `instagram_manage_comments`
- `instagram_manage_insights`
- `pages_show_list`
- `pages_read_engagement`

### ✅ Solução 5: Limpar Cache e Tentar Novamente

1. **Limpar cache do navegador:**
   - Chrome/Edge: Ctrl+Shift+Delete
   - Selecione "Cookies e outros dados do site"
   - Limpar dados

2. **Usar modo anônimo/privado:**
   - Abra uma janela anônima
   - Tente conectar novamente

3. **Aguardar propagação:**
   - Alterações no Facebook podem levar 5-10 minutos para propagar
   - Aguarde e tente novamente

### ✅ Solução 6: Verificar Logs e Debug

#### Verificar logs do servidor backend:
```bash
cd backend
npm run dev
```

Procure por erros relacionados a:
- `redirect_uri`
- `invalid domain`
- `OAuth`

#### Verificar console do navegador:
1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Tente conectar o Instagram
4. Veja se há erros específicos

#### Verificar Network no navegador:
1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Tente conectar o Instagram
4. Veja a requisição para o Facebook
5. Verifique a URL de redirecionamento sendo usada

### ✅ Solução 7: Testar URL de Redirecionamento Manualmente

Teste se a URL está acessível:

1. **Com servidor rodando**, acesse no navegador:
   ```
   http://127.0.0.1:3000/api/integrations/instagram/callback
   ```

2. **Deve aparecer:**
   - Erro sobre "Código de autorização não fornecido" ✅ (isso significa que está funcionando)
   - OU erro 404 ❌ (endpoint não encontrado - problema no backend)

### ✅ Solução 8: Verificar Versão da API do Facebook

O código usa `v18.0`. Verifique se essa versão ainda está disponível:

1. Acesse: https://developers.facebook.com/tools/explorer/
2. Selecione seu App
3. Verifique a versão da API disponível
4. Se necessário, atualize no código:

```typescript
// backend/src/routes/instagram.ts
const INSTAGRAM_GRAPH_API_BASE = 'https://graph.facebook.com/v19.0'; // ou versão mais recente
```

## Checklist Completo de Troubleshooting

Marque cada item:

### Configuração Facebook Developers
- [ ] App está em modo **Desenvolvimento**
- [ ] Domínios adicionados corretamente (sem http://, sem porta)
- [ ] URLs de redirecionamento adicionadas (com http://, com porta, com caminho)
- [ ] Instagram Graph API está adicionado como produto
- [ ] Permissões necessárias estão configuradas
- [ ] Alterações foram salvas
- [ ] Aguardou 5-10 minutos para propagação

### Configuração Backend
- [ ] Arquivo `.env` existe e está configurado
- [ ] `INSTAGRAM_REDIRECT_URI` está correto
- [ ] `FACEBOOK_APP_ID` está configurado
- [ ] `FACEBOOK_APP_SECRET` está configurado
- [ ] Servidor backend está rodando
- [ ] URL de redirecionamento no `.env` está EXATAMENTE igual ao Facebook

### Teste
- [ ] Cache do navegador foi limpo
- [ ] Tentou em modo anônimo
- [ ] Verificou logs do servidor
- [ ] Verificou console do navegador
- [ ] Testou URL de callback manualmente

## Se Nada Funcionar

1. **Use ngrok** (Solução 2) - é a mais confiável para desenvolvimento
2. **Use domínio de produção** (Solução 3) - se disponível
3. **Entre em contato com suporte** do Facebook Developers
4. **Verifique se o App não está bloqueado** ou em revisão

## Comandos Úteis

### Verificar se servidor está rodando:
```bash
curl http://127.0.0.1:3000/health
```

### Testar endpoint de callback:
```bash
curl http://127.0.0.1:3000/api/integrations/instagram/callback
```

### Ver variáveis de ambiente:
```bash
# Windows PowerShell
cd backend
Get-Content .env | Select-String "INSTAGRAM|FACEBOOK"
```


