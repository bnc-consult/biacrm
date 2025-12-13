# 🔧 Solução: URL Bloqueada no Facebook OAuth

## 🔍 Problema

O erro "URL bloqueada" ocorre porque a URI de redirecionamento não está na lista de liberação nas configurações de OAuth do app do Facebook.

## ✅ Solução em 3 Passos

### Passo 1: Configurar Variáveis de Ambiente

Crie ou edite o arquivo `backend/.env` e adicione:

```env
# Facebook OAuth
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/integrations/facebook/callback

# Frontend URL (para desenvolvimento)
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANTE:** Substitua `seu_app_id_aqui` e `seu_app_secret_aqui` pelos valores reais do seu App do Facebook.

---

### Passo 2: Configurar no Facebook Developers

1. **Acesse:** https://developers.facebook.com/
2. **Selecione seu App** (ou crie um novo)
3. **Vá em:** **Produtos** → **Facebook Login** → **Configurações**
4. **Na seção "URIs de redirecionamento OAuth válidos":**
   - Clique em **"Adicionar URI"**
   - Adicione: `http://localhost:3000/api/integrations/facebook/callback`
   - Clique em **"Salvar alterações"**

5. **Configure os Domínios do App:**
   - Vá em **Configurações** → **Básico**
   - Role até **"Domínios do App"**
   - Clique em **"Adicionar domínio"**
   - Adicione: `localhost`
   - Clique em **"Salvar alterações"**

6. **Verifique o Modo do App:**
   - Certifique-se de que o App está em modo **"Desenvolvimento"**
   - Em modo Desenvolvimento, você pode testar com usuários de teste

---

### Passo 3: Reiniciar o Servidor Backend

Após configurar o `.env` e o Facebook Developers:

1. **Pare o servidor backend** (Ctrl+C no terminal)
2. **Inicie novamente:**
   ```bash
   cd backend
   npm run dev
   ```

---

## 🔄 Para Produção

Quando for fazer deploy em produção, atualize:

```env
FACEBOOK_REDIRECT_URI=https://biacrm.com/api/integrations/facebook/callback
FRONTEND_URL=https://biacrm.com
```

E adicione essas URLs também nas configurações do Facebook Developers.

---

## ✅ Checklist

- [ ] Arquivo `backend/.env` criado/atualizado com `FACEBOOK_REDIRECT_URI`
- [ ] URL `http://localhost:3000/api/integrations/facebook/callback` adicionada no Facebook Developers
- [ ] Domínio `localhost` adicionado nos Domínios do App
- [ ] App está em modo "Desenvolvimento"
- [ ] Servidor backend reiniciado
- [ ] Testei a autenticação novamente

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique se a URL está EXATAMENTE igual:**
   - No `.env`: `http://localhost:3000/api/integrations/facebook/callback`
   - No Facebook: `http://localhost:3000/api/integrations/facebook/callback`
   - **Sem espaços extras, sem barras no final**

2. **Verifique se o servidor está rodando na porta 3000:**
   ```bash
   netstat -ano | findstr ":3000"
   ```

3. **Limpe o cache do navegador** e tente novamente

4. **Verifique os logs do backend** para ver qual URL está sendo usada

