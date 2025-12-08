# 🔍 Diferença Entre Graph API Explorer e OAuth Web

## ✅ Graph API Explorer Funciona

Você conseguiu testar no Graph API Explorer e funcionou. Isso é importante porque significa:

- ✅ O App está configurado corretamente
- ✅ As credenciais (App ID e Secret) estão corretas
- ✅ O App pode acessar a API

## ❌ Mas OAuth Web Não Funciona

O erro "Este app precisa pelo menos do supported permission" no OAuth web indica:

- ❌ **Facebook Login não está configurado para OAuth web**
- ❌ **URL de redirecionamento não está configurada**
- ❌ **Facebook Login não está ativado para uso web**

## 🔍 Diferença Entre Graph API Explorer e OAuth Web

### Graph API Explorer:
- ✅ Gera token **diretamente** no próprio Facebook
- ✅ Não precisa de URL de redirecionamento
- ✅ Não precisa de Facebook Login configurado para web
- ✅ Funciona apenas para testes

### OAuth Web (Nosso App):
- ❌ Precisa de **Facebook Login configurado**
- ❌ Precisa de **URL de redirecionamento configurada**
- ❌ Precisa de **domínios configurados**
- ❌ Precisa estar **ativado para uso web**

## ✅ Solução: Configurar Facebook Login para Web

### Passo 1: Adicionar Facebook Login (Se Não Estiver)

1. **No seu App**, vá em **"Casos de uso"** ou **"Produtos"**
2. **Procure por "Facebook Login"**
3. **Se não estiver**, adicione:
   - Clique em **"Adicionar casos de uso"**
   - OU **"+ Adicionar Produto"**
   - Procure **"Facebook Login"**
   - Clique em **"Configurar"**

### Passo 2: Configurar para Uso Web

1. **Clique em "Facebook Login"**
2. **Vá em "Configurações"**
3. **Configure:**

   **a) URIs de redirecionamento OAuth válidos:**
   - Adicione sua URL de callback:
     - Se usando ngrok: `https://sua-url-ngrok.ngrok-free.app/api/integrations/instagram/callback`
     - Se usando localhost: `http://127.0.0.1:3000/api/integrations/instagram/callback`
     - Se usando produção: `https://biacrm.com/api/integrations/instagram/callback`

   **b) Configurações de Cliente OAuth:**
   - Certifique-se de que está configurado para **"Web"**
   - Não apenas para "Mobile" ou outros

4. **Salve as alterações**

### Passo 3: Verificar Se Está Ativado

1. **No Facebook Login**, verifique se há um switch ou botão para **"Ativar"**
2. **Se houver**, certifique-se de que está **ativado**

## 🔍 Verificação Específica

### No Graph API Explorer que Funcionou:

1. **Qual tipo de token você usou?**
   - "Token do usuário" ✅ (correto para OAuth web)
   - "Token do aplicativo" ❌ (não funciona para OAuth web)

2. **Quais permissões aparecem?**
   - Anote todas as permissões que estão marcadas
   - Essas são as que funcionam

### No Nosso App:

O código está tentando usar OAuth web, que requer:
- Facebook Login configurado para web
- URL de redirecionamento configurada
- Domínios configurados

## 📋 Checklist Específico

- [ ] Facebook Login está **adicionado** como caso de uso?
- [ ] Facebook Login está **ativado/habilitado**?
- [ ] Facebook Login está configurado para **"Web"** (não apenas Mobile)?
- [ ] URL de redirecionamento está **configurada** em Facebook Login → Configurações?
- [ ] Domínios do App estão **configurados**?
- [ ] App está em modo **Desenvolvimento**?

## 💡 Dica Importante

**O Graph API Explorer funciona porque:**
- Ele gera tokens diretamente no Facebook
- Não precisa de OAuth web configurado
- É apenas para testes

**Mas para OAuth web funcionar:**
- Facebook Login **DEVE** estar configurado para web
- URL de redirecionamento **DEVE** estar configurada
- Domínios **DEVEM** estar configurados

## 🔄 Próximos Passos

1. ✅ Verifique se Facebook Login está adicionado e configurado para web
2. ✅ Configure a URL de redirecionamento
3. ✅ Reinicie o servidor backend
4. ✅ Tente conectar Instagram novamente

O problema não é das permissões - é que o **Facebook Login não está configurado para uso web** no seu App!


