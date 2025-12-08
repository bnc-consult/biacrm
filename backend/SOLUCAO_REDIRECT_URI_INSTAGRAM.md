# 🔧 Solução para URL de Redirecionamento do Instagram

## Problema
O Facebook Developers não está aceitando `http://localhost:3000/api/integrations/instagram/callback` como URL de redirecionamento.

## Soluções (escolha uma)

### ✅ Solução 1: Usar 127.0.0.1 ao invés de localhost

Às vezes o Facebook aceita `127.0.0.1` mesmo quando não aceita `localhost`.

**No Facebook Developers:**
- Adicione: `http://127.0.0.1:3000/api/integrations/instagram/callback`

**No arquivo `.env`:**
```env
INSTAGRAM_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/instagram/callback
```

### ✅ Solução 2: Configurar App em Modo de Desenvolvimento

1. No Facebook Developers, vá em **Configurações** → **Básico**
2. Certifique-se de que o **Modo do App** está como **Desenvolvimento**
3. Em **Domínios do App**, adicione:
   - `localhost`
   - `127.0.0.1`
4. Em **Facebook Login** → **Configurações** → **URIs de redirecionamento OAuth válidos**, adicione:
   - `http://localhost:3000/api/integrations/instagram/callback`
   - `http://127.0.0.1:3000/api/integrations/instagram/callback`

### ✅ Solução 3: Usar ngrok (Recomendado para desenvolvimento)

O ngrok cria um túnel público para seu localhost, permitindo que o Facebook acesse sua aplicação local.

#### Passo 1: Instalar ngrok
- Baixe em: https://ngrok.com/download
- Ou use: `choco install ngrok` (Windows) ou `brew install ngrok` (Mac)

#### Passo 2: Iniciar o túnel
```bash
ngrok http 3000
```

Isso vai gerar uma URL como: `https://abc123.ngrok.io`

#### Passo 3: Configurar no Facebook Developers
- Adicione em **URIs de redirecionamento OAuth válidos**:
  - `https://abc123.ngrok.io/api/integrations/instagram/callback`

#### Passo 4: Atualizar o `.env`
```env
INSTAGRAM_REDIRECT_URI=https://abc123.ngrok.io/api/integrations/instagram/callback
FRONTEND_URL=https://abc123.ngrok.io
```

**⚠️ IMPORTANTE:** A URL do ngrok muda a cada vez que você reinicia (na versão gratuita). Você precisará atualizar no Facebook Developers e no `.env` sempre que reiniciar.

**💡 DICA:** Use ngrok com domínio fixo (versão paga) ou use uma solução alternativa.

### ✅ Solução 4: Usar URL de Produção Temporariamente

Se você tem um servidor de produção, pode usar temporariamente:

**No Facebook Developers:**
- Adicione: `https://biacrm.com/api/integrations/instagram/callback`

**No arquivo `.env`:**
```env
INSTAGRAM_REDIRECT_URI=https://biacrm.com/api/integrations/instagram/callback
FRONTEND_URL=https://biacrm.com
```

### ✅ Solução 5: Configurar Domínios Válidos

No Facebook Developers:

1. Vá em **Configurações** → **Básico**
2. Role até **Domínios do App**
3. Adicione:
   - `localhost`
   - `127.0.0.1`
   - Seu domínio de produção (ex: `biacrm.com`)

4. Vá em **Produtos** → **Facebook Login** → **Configurações**
5. Em **Configurações de Cliente OAuth**, adicione em **URIs de redirecionamento OAuth válidos**:
   - `http://localhost:3000/api/integrations/instagram/callback`
   - `http://127.0.0.1:3000/api/integrations/instagram/callback`
   - `https://biacrm.com/api/integrations/instagram/callback`

## ⚠️ Erros Comuns

### Erro: "URL de redirecionamento inválida"
- Certifique-se de que a URL está exatamente igual no Facebook Developers e no `.env`
- Não use espaços extras
- Use `http://` para localhost e `https://` para produção

### Erro: "O domínio da URL não está na lista de domínios do app"
- Adicione o domínio em **Configurações** → **Básico** → **Domínios do App**
- Para localhost, adicione `localhost` e `127.0.0.1`

### Erro: "App não está em modo de desenvolvimento"
- Vá em **Configurações** → **Básico**
- Certifique-se de que o **Modo do App** está como **Desenvolvimento**

## 📝 Checklist de Configuração

- [ ] App do Facebook está em modo **Desenvolvimento**
- [ ] Domínios adicionados: `localhost`, `127.0.0.1`
- [ ] URL de redirecionamento adicionada em **Facebook Login** → **Configurações**
- [ ] URL no `.env` está exatamente igual à configurada no Facebook
- [ ] Servidor backend reiniciado após alterar `.env`
- [ ] Produto **Instagram Graph API** adicionado ao App

## 🔍 Verificação

Após configurar, teste:

1. Reinicie o servidor backend
2. Tente conectar o Instagram novamente
3. Verifique os logs do servidor para erros específicos

Se ainda não funcionar, verifique os logs do servidor e a mensagem de erro específica do Facebook.


