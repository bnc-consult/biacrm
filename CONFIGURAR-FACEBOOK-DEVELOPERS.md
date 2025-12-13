# 📋 Guia Passo a Passo: Configurar Facebook OAuth no Facebook Developers

## 🎯 Objetivo
Adicionar a URL de redirecionamento `http://localhost:3000/api/integrations/facebook/callback` nas configurações do seu App do Facebook.

---

## 📝 Passo a Passo Detalhado

### 1. Acessar o Facebook Developers

1. Abra seu navegador e acesse: **https://developers.facebook.com/**
2. Faça login com sua conta do Facebook
3. No canto superior direito, clique em **"Meus Apps"**
4. Selecione seu App (ou clique em **"Criar App"** se ainda não tiver)

---

### 2. Configurar Facebook Login

1. No menu lateral esquerdo, procure por **"Produtos"**
2. Se **"Facebook Login"** não estiver na lista:
   - Clique em **"+ Adicionar Produto"**
   - Procure por **"Facebook Login"**
   - Clique em **"Configurar"**

3. Se **"Facebook Login"** já estiver na lista:
   - Clique em **"Facebook Login"**
   - Depois clique em **"Configurações"** (ícone de engrenagem)

---

### 3. Adicionar URI de Redirecionamento

1. Role a página até a seção **"URIs de redirecionamento OAuth válidos"**
2. Clique no botão **"Adicionar URI"** ou no campo de texto
3. Digite EXATAMENTE:
   ```
   http://localhost:3000/api/integrations/facebook/callback
   ```
4. Clique em **"Salvar alterações"** (geralmente no canto inferior direito)

**⚠️ IMPORTANTE:**
- A URL deve ser EXATAMENTE igual (sem espaços, sem barras no final)
- Use `http://` (não `https://`) para desenvolvimento local
- A porta `3000` deve corresponder à porta do seu backend

---

### 4. Configurar Domínios do App

1. No menu lateral esquerdo, clique em **"Configurações"** → **"Básico"**
2. Role até a seção **"Domínios do App"**
3. Clique em **"Adicionar domínio"**
4. Digite: `localhost`
5. Clique em **"Salvar alterações"**

---

### 5. Verificar Modo do App

1. Ainda em **"Configurações"** → **"Básico"**
2. Verifique o campo **"Modo do App"**
3. Para desenvolvimento, deve estar em **"Desenvolvimento"**
4. Se estiver em "Produção", você precisará adicionar usuários de teste

---

### 6. Verificar Permissões (Opcional)

1. Vá em **"Produtos"** → **"Facebook Login"** → **"Permissões e Recursos"**
2. Verifique se as seguintes permissões estão disponíveis:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`
   - `leads_retrieval`
   - `pages_read_user_content`
   - `pages_manage_ads`

---

## ✅ Checklist Final

Antes de testar, verifique:

- [ ] URI `http://localhost:3000/api/integrations/facebook/callback` adicionada
- [ ] Domínio `localhost` adicionado
- [ ] App está em modo "Desenvolvimento"
- [ ] Alterações salvas
- [ ] Arquivo `backend/.env` configurado com `FACEBOOK_REDIRECT_URI`
- [ ] Servidor backend reiniciado

---

## 🆘 Problemas Comuns

### "URL bloqueada" mesmo após configurar
- Verifique se a URL está EXATAMENTE igual (copie e cole)
- Certifique-se de que salvou as alterações
- Aguarde alguns minutos para a propagação

### "App não disponível"
- Verifique se o App está em modo "Desenvolvimento"
- Adicione você mesmo como usuário de teste em "Funções" → "Funções do App"

### "Permissão negada"
- Verifique se as permissões necessárias estão solicitadas no código
- Algumas permissões requerem revisão do Facebook (modo Produção)

---

## 📞 Próximos Passos

Após configurar:
1. Reinicie o servidor backend
2. Tente autenticar novamente
3. Se funcionar, você será redirecionado de volta para o app

