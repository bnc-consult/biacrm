# 🔧 Resolver Erro "URL Bloqueada" - Instagram

## ❌ Erro Atual

Você está vendo o erro:
> **"URL bloqueada - O redirecionamento falhou porque o URI usado não está na lista de liberação nas configurações de OAuth do cliente do app."**

Este erro significa que:
- ✅ O domínio `biacrm.com` provavelmente já está configurado
- ❌ A URL de callback específica não está na lista de URIs válidos
- ❌ Ou o OAuth do cliente/Web não está ativado

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar e Ativar OAuth do Cliente e Web

1. Acesse: **https://developers.facebook.com/apps**
2. Selecione seu app
3. Vá em: **Produtos → Login do Facebook → Configurações**

#### Verificar se OAuth está ativado:

1. Na seção **"Configurações de Cliente OAuth"** (Client OAuth Settings):
   - ✅ Certifique-se de que **"Login de OAuth do Cliente"** está **ATIVADO**
   - ✅ Certifique-se de que **"Login de OAuth na Web"** está **ATIVADO**

2. Se não estiverem ativados:
   - Clique nos botões de toggle para **ativar** ambos
   - Clique em **"Salvar alterações"**

---

### Passo 2: Adicionar URI de Redirecionamento Exata

1. Ainda em **Produtos → Login do Facebook → Configurações**
2. Role até a seção **"URIs de redirecionamento OAuth válidos"** (Valid OAuth Redirect URIs)
3. Clique em **"+ Adicionar URI"** ou no campo de texto
4. Adicione **exatamente** esta URL (uma por vez):

```
https://biacrm.com/api/integrations/instagram/callback
```

5. Pressione **Enter** ou clique em **"Adicionar"**
6. Adicione também a URL do Facebook (se ainda não tiver):

```
https://biacrm.com/api/integrations/facebook/callback
```

⚠️ **IMPORTANTE:**
- ✅ Use `https://` (não `http://`)
- ✅ Inclua o caminho completo: `/api/integrations/instagram/callback`
- ❌ **NÃO** adicione barra final `/` no final
- ✅ Adicione **exatamente** como mostrado acima (sem espaços extras)
- ✅ Certifique-se de que ambas as URLs estão na lista

---

### Passo 3: Verificar Domínio do App

1. Vá em: **Configurações → Básico**
2. Na seção **"Domínios do aplicativo"** (App Domains), verifique se está:
   ```
   biacrm.com
   ```
3. Se não estiver, adicione `biacrm.com` (sem `http://` ou `https://`)
4. Clique em **"Salvar alterações"**

---

### Passo 4: Verificar Configurações de Segurança

1. Ainda em **Configurações → Básico**
2. Verifique se há alguma configuração de **"Restrições de URL"** ou **"Whitelist de Domínios"**
3. Se houver, certifique-se de que `biacrm.com` está incluído

---

### Passo 5: Salvar e Aguardar

1. **Salve todas as alterações** em todas as páginas que você modificou
2. **Aguarde 3-5 minutos** para as alterações serem propagadas
3. **Feche e abra novamente** a página de configurações para verificar se as URLs foram salvas
4. **Teste novamente** a integração do Instagram

---

## 📋 Checklist Completo

Antes de testar novamente, verifique:

- [ ] **OAuth do Cliente** está **ATIVADO** em Login do Facebook → Configurações
- [ ] **OAuth na Web** está **ATIVADO** em Login do Facebook → Configurações
- [ ] **Domínio do app** configurado: `biacrm.com` (sem `http://` ou `https://`)
- [ ] **URL de callback do Facebook** está na lista: `https://biacrm.com/api/integrations/facebook/callback`
- [ ] **URL de callback do Instagram** está na lista: `https://biacrm.com/api/integrations/instagram/callback`
- [ ] Todas as URLs usam `https://` (não `http://`)
- [ ] Não há barras finais `/` nas URLs
- [ ] Não há espaços extras nas URLs
- [ ] Alterações foram salvas
- [ ] Aguardou 3-5 minutos após salvar

---

## 🔍 Como Verificar se Está Configurado Corretamente

### Verificar OAuth:
1. Vá em: **Produtos → Login do Facebook → Configurações**
2. Procure por **"Configurações de Cliente OAuth"**
3. Deve mostrar:
   - ✅ Login de OAuth do Cliente: **ATIVADO**
   - ✅ Login de OAuth na Web: **ATIVADO**

### Verificar URLs de Redirecionamento:
1. Ainda em **Login do Facebook → Configurações**
2. Procure por **"URIs de redirecionamento OAuth válidos"**
3. Deve aparecer **ambas** as URLs:
   - `https://biacrm.com/api/integrations/facebook/callback`
   - `https://biacrm.com/api/integrations/instagram/callback`

### Verificar Domínio:
1. Vá em: **Configurações → Básico**
2. Procure por **"Domínios do aplicativo"**
3. Deve aparecer: `biacrm.com`

---

## ⚠️ Erros Comuns e Soluções

### Erro: "URL bloqueada" persiste após adicionar
- **Causa**: URL pode ter sido adicionada incorretamente ou com espaços extras
- **Solução**: 
  1. Remova a URL da lista
  2. Adicione novamente **exatamente** como: `https://biacrm.com/api/integrations/instagram/callback`
  3. Certifique-se de não ter espaços antes ou depois
  4. Aguarde alguns minutos e teste novamente

### Erro: "OAuth não está ativado"
- **Causa**: OAuth do cliente ou Web não está ativado
- **Solução**: Ative ambos em **Login do Facebook → Configurações → Configurações de Cliente OAuth**

### Erro: URLs não aparecem na lista após salvar
- **Causa**: Pode ter havido um erro ao salvar
- **Solução**: 
  1. Recarregue a página
  2. Verifique se as URLs aparecem
  3. Se não aparecerem, adicione novamente
  4. Certifique-se de clicar em "Salvar alterações" após adicionar

---

## 🎯 Resumo Rápido

**O que fazer:**
1. ✅ Ativar **OAuth do Cliente** e **OAuth na Web**
2. ✅ Adicionar `biacrm.com` em **Domínios do aplicativo**
3. ✅ Adicionar ambas as URLs em **URIs de redirecionamento OAuth válidos**:
   - `https://biacrm.com/api/integrations/facebook/callback`
   - `https://biacrm.com/api/integrations/instagram/callback`
4. ✅ Salvar todas as alterações
5. ✅ Aguardar 3-5 minutos
6. ✅ Testar novamente

---

## 📸 Onde Encontrar no Facebook Developer

### Ativar OAuth:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Configurações → Configurações de Cliente OAuth
```

### Adicionar URLs:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Configurações → URIs de redirecionamento OAuth válidos
```

### Adicionar Domínio:
```
Facebook Developer → Seu App → Configurações → Básico → Domínios do aplicativo
```

---

## 🚀 Após Configurar

1. ✅ **Salve todas as alterações**
2. ✅ **Aguarde 3-5 minutos** para propagação
3. ✅ **Teste novamente** a integração do Instagram
4. ✅ Se ainda der erro, verifique os logs do backend para ver a URL exata sendo usada

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Configuração de OAuth do Facebook](https://developers.facebook.com/docs/facebook-login/web)
- [Troubleshooting OAuth](https://developers.facebook.com/docs/facebook-login/troubleshooting)





