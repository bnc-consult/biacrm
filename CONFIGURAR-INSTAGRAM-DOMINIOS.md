# 🔧 Configurar Domínios do Instagram no Facebook App

## ❌ Erro Atual

Você está vendo o erro:
> **"Não é possível carregar a URL. O domínio dessa URL não está incluído nos domínios do app."**

Isso acontece porque o domínio do callback do Instagram não está configurado no Facebook App.

---

## ✅ Solução: Configurar Domínios no Facebook App

### Passo 1: Acessar Configurações do App

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu app (o mesmo usado para Facebook)
3. Vá em **Configurações → Básico**

### Passo 2: Adicionar Domínios do App

Na seção **"Domínios do aplicativo"** (App Domains), adicione:

```
biacrm.com
```

⚠️ **IMPORTANTE:**
- Adicione apenas o domínio raiz: `biacrm.com`
- **NÃO** adicione `http://` ou `https://`
- **NÃO** adicione caminhos como `/api/integrations/instagram/callback`
- Adicione apenas o domínio base

### Passo 3: Configurar URLs de Redirecionamento OAuth

1. Vá em **Produtos → Login do Facebook → Configurações**
2. Na seção **"URIs de redirecionamento OAuth válidos"** (Valid OAuth Redirect URIs), adicione:

```
https://biacrm.com/api/integrations/instagram/callback
```

⚠️ **IMPORTANTE:**
- Use `https://` (não `http://`)
- Inclua o caminho completo: `/api/integrations/instagram/callback`
- **NÃO** adicione barra final `/` no final
- Adicione uma URL por linha

### Passo 4: Verificar Configuração Completa

Certifique-se de que você tem:

#### Em "Domínios do aplicativo":
```
biacrm.com
```

#### Em "URIs de redirecionamento OAuth válidos":
```
https://biacrm.com/api/integrations/facebook/callback
https://biacrm.com/api/integrations/instagram/callback
```

---

## 📋 Checklist Completo

Antes de testar novamente, verifique:

- [ ] **Domínio do app** configurado: `biacrm.com`
- [ ] **URL de callback do Facebook** configurada: `https://biacrm.com/api/integrations/facebook/callback`
- [ ] **URL de callback do Instagram** configurada: `https://biacrm.com/api/integrations/instagram/callback`
- [ ] Todas as URLs usam `https://` (não `http://`)
- [ ] Não há barras finais `/` nas URLs
- [ ] O domínio não tem `http://` ou `https://` no campo "Domínios do aplicativo"

---

## 🔍 Como Verificar a URL Correta

A URL de callback do Instagram está definida no código como:

```typescript
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 
  (facebookRedirect && facebookRedirect.replace('/facebook/', '/instagram/')) || 
  'https://biacrm.com/api/integrations/instagram/callback';
```

**URL padrão em produção:** `https://biacrm.com/api/integrations/instagram/callback`

---

## ⚠️ Erros Comuns

### Erro: "Domínio não autorizado"
- **Causa**: Domínio não está em "Domínios do aplicativo"
- **Solução**: Adicione `biacrm.com` (sem `http://` ou `https://`)

### Erro: "URL de redirecionamento inválida"
- **Causa**: URL não está em "URIs de redirecionamento OAuth válidos"
- **Solução**: Adicione `https://biacrm.com/api/integrations/instagram/callback` exatamente como mostrado

### Erro: "URL bloqueada"
- **Causa**: URL tem formato incorreto (barra final, protocolo errado, etc.)
- **Solução**: Use exatamente: `https://biacrm.com/api/integrations/instagram/callback` (sem barra final)

---

## 🚀 Após Configurar

1. **Salve todas as alterações** no Facebook Developer
2. **Aguarde alguns minutos** para as alterações serem propagadas
3. **Teste novamente** a integração do Instagram
4. Se ainda der erro, verifique os logs do backend para ver a URL exata sendo usada

---

## 📝 Notas Importantes

- O Instagram usa o **mesmo Facebook App** que o Facebook
- Você precisa configurar apenas **um app** para ambos
- As URLs de callback são diferentes, mas o domínio é o mesmo
- O Instagram Business API requer que você tenha uma **Página do Facebook** conectada a uma **Conta Instagram Business**

---

## 🔗 Links Úteis

- [Documentação do Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Configuração de OAuth do Facebook](https://developers.facebook.com/docs/facebook-login/web)
- [Troubleshooting OAuth](https://developers.facebook.com/docs/facebook-login/troubleshooting)

---

## ✅ Próximos Passos

Após configurar os domínios:

1. ✅ Teste a integração do Instagram novamente
2. ✅ Verifique se o callback está funcionando
3. ✅ Se ainda houver erros, verifique os logs do backend para ver a URL exata sendo usada





