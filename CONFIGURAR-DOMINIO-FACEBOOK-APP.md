# 🔧 Configurar Domínio no Facebook App - Passo a Passo

## ❌ Erro Atual

Você está vendo o erro:
> **"O domínio dessa URL não está incluído nos domínios do app. Para carregar essa URL, adicione todos os domínios e subdomínios ao campo Domínios do app nas configurações do app."**

---

## ✅ Solução: Configurar Domínio no Facebook App

### Passo 1: Acessar o Facebook App

1. Acesse: **https://developers.facebook.com/apps**
2. Faça login com sua conta do Facebook
3. **Selecione seu app** (o mesmo usado para Facebook e Instagram)

---

### Passo 2: Adicionar Domínio do App

1. No menu lateral, clique em **"Configurações"** → **"Básico"**
2. Role até a seção **"Domínios do aplicativo"** (App Domains)
3. Clique no botão **"+ Adicionar domínio"** ou clique no campo de texto
4. Digite exatamente:
   ```
   biacrm.com
   ```
5. Clique em **"Salvar alterações"** ou pressione Enter

⚠️ **IMPORTANTE:**
- ✅ Adicione apenas: `biacrm.com`
- ❌ **NÃO** adicione `http://` ou `https://`
- ❌ **NÃO** adicione `www.biacrm.com` (a menos que você use www)
- ❌ **NÃO** adicione caminhos como `/api/integrations/instagram/callback`

---

### Passo 3: Configurar URLs de Redirecionamento OAuth

1. No menu lateral, clique em **"Produtos"** → **"Login do Facebook"**
2. Se não aparecer "Login do Facebook", clique em **"+ Adicionar Produto"** e adicione "Login do Facebook"
3. Clique em **"Configurações"** (Settings)
4. Role até a seção **"URIs de redirecionamento OAuth válidos"** (Valid OAuth Redirect URIs)
5. Clique em **"+ Adicionar URI"** ou clique no campo de texto
6. Adicione **cada uma** das URLs abaixo (uma por linha):

```
https://biacrm.com/api/integrations/facebook/callback
https://biacrm.com/api/integrations/instagram/callback
```

⚠️ **IMPORTANTE:**
- ✅ Use `https://` (não `http://`)
- ✅ Inclua o caminho completo: `/api/integrations/facebook/callback` e `/api/integrations/instagram/callback`
- ❌ **NÃO** adicione barra final `/` no final das URLs
- ✅ Adicione **ambas** as URLs (Facebook e Instagram)

---

### Passo 4: Salvar e Aguardar

1. Clique em **"Salvar alterações"** no final da página
2. **Aguarde 2-5 minutos** para as alterações serem propagadas pelo Facebook
3. Tente novamente a integração do Instagram

---

## 📋 Checklist Completo

Antes de testar novamente, verifique:

- [ ] **Domínio do app** configurado: `biacrm.com` (sem `http://` ou `https://`)
- [ ] **URL de callback do Facebook** configurada: `https://biacrm.com/api/integrations/facebook/callback`
- [ ] **URL de callback do Instagram** configurada: `https://biacrm.com/api/integrations/instagram/callback`
- [ ] Todas as URLs usam `https://` (não `http://`)
- [ ] Não há barras finais `/` nas URLs
- [ ] Alterações foram salvas
- [ ] Aguardou alguns minutos após salvar

---

## 🔍 Como Verificar se Está Configurado Corretamente

### Verificar Domínio do App:
1. Vá em: **Configurações → Básico**
2. Procure por **"Domínios do aplicativo"**
3. Deve aparecer: `biacrm.com`

### Verificar URLs de Redirecionamento:
1. Vá em: **Produtos → Login do Facebook → Configurações**
2. Procure por **"URIs de redirecionamento OAuth válidos"**
3. Deve aparecer ambas as URLs:
   - `https://biacrm.com/api/integrations/facebook/callback`
   - `https://biacrm.com/api/integrations/instagram/callback`

---

## ⚠️ Erros Comuns e Soluções

### Erro: "Domínio não autorizado"
- **Causa**: Domínio não está em "Domínios do aplicativo"
- **Solução**: Adicione `biacrm.com` (sem `http://` ou `https://`)

### Erro: "URL de redirecionamento inválida"
- **Causa**: URL não está em "URIs de redirecionamento OAuth válidos"
- **Solução**: Adicione `https://biacrm.com/api/integrations/instagram/callback` exatamente como mostrado

### Erro: "URL bloqueada"
- **Causa**: URL tem formato incorreto (barra final, protocolo errado, etc.)
- **Solução**: Use exatamente: `https://biacrm.com/api/integrations/instagram/callback` (sem barra final)

### Erro persiste após configurar:
- **Solução**: Aguarde alguns minutos e tente novamente. O Facebook pode levar até 5 minutos para propagar as alterações.

---

## 📸 Onde Encontrar no Facebook Developer

### Domínios do App:
```
Facebook Developer → Seu App → Configurações → Básico → Domínios do aplicativo
```

### URLs de Redirecionamento:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Configurações → URIs de redirecionamento OAuth válidos
```

---

## 🚀 Após Configurar

1. ✅ **Salve todas as alterações**
2. ✅ **Aguarde 2-5 minutos**
3. ✅ **Teste novamente** a integração do Instagram
4. ✅ Se ainda der erro, verifique os logs do backend para ver a URL exata sendo usada

---

## 📝 Notas Importantes

- O Instagram usa o **mesmo Facebook App** que o Facebook
- Você precisa configurar apenas **um app** para ambos
- As URLs de callback são diferentes, mas o domínio é o mesmo
- O Instagram Business API requer que você tenha uma **Página do Facebook** conectada a uma **Conta Instagram Business**

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Documentação do Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Configuração de OAuth do Facebook](https://developers.facebook.com/docs/facebook-login/web)

---

## ✅ Resumo Rápido

**O que fazer:**
1. Acesse https://developers.facebook.com/apps
2. Selecione seu app
3. **Configurações → Básico**: Adicione `biacrm.com` em "Domínios do aplicativo"
4. **Produtos → Login do Facebook → Configurações**: Adicione ambas as URLs de callback
5. Salve e aguarde alguns minutos
6. Teste novamente

**URLs para adicionar:**
- `https://biacrm.com/api/integrations/facebook/callback`
- `https://biacrm.com/api/integrations/instagram/callback`





