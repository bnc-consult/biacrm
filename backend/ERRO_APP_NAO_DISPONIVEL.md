# 🔧 Resolver: "Este app precisa pelo menos do supported permission"

## ⚠️ Erro Encontrado

```
Parece que esse app não está disponível
Este app precisa pelo menos do supported permission.
```

## 🔍 Possíveis Causas

Este erro geralmente indica que:

1. **O App não tem permissões configuradas** no Facebook Developers
2. **O produto Instagram Graph API não está adicionado**
3. **O App está em modo incorreto** (pode estar bloqueado)
4. **As permissões solicitadas não estão disponíveis** para o tipo de App

## ✅ Soluções

### Solução 1: Verificar Configuração do App

1. **Acesse:** https://developers.facebook.com/
2. **Vá em:** Meus Apps → Seu App
3. **Verifique:**

   **a) Modo do App:**
   - Vá em **Configurações** → **Básico**
   - Certifique-se de que está em modo **"Desenvolvimento"**
   - Se estiver bloqueado ou em revisão, isso pode causar o erro

   **b) Produtos Adicionados:**
   - Vá em **Produtos**
   - Verifique se **Facebook Login** está adicionado
   - Verifique se **Instagram Graph API** está adicionado
   - Se não estiver, adicione:
     - Clique em **"+ Adicionar Produto"**
     - Procure por **"Instagram Graph API"**
     - Clique em **"Configurar"**

### Solução 2: Configurar Permissões Básicas

1. **Vá em:** Login do Facebook → Permissões
2. **Adicione pelo menos uma permissão básica:**
   - `public_profile` (sempre disponível)
   - OU `pages_show_list` (se disponível)

3. **Salve as alterações**

### Solução 3: Verificar Status do App

1. **Vá em:** Configurações → Básico
2. **Verifique:**
   - **Status do App:** Deve estar "Ativo" ou "Em Desenvolvimento"
   - **Se estiver "Bloqueado"** ou "Em Revisão", isso pode causar o erro

### Solução 4: Verificar Tipo de App

1. **Vá em:** Configurações → Básico
2. **Verifique o tipo de App:**
   - Deve ser **"Negócios"** ou **"Outro"**
   - Alguns tipos de App têm restrições de permissões

### Solução 5: Tentar Sem Permissões Específicas

Se nada funcionar, podemos tentar **sem solicitar permissões**:

```javascript
const scopes = ''; // Sem permissões - apenas token básico
```

Mas isso pode limitar o acesso às páginas.

## 🔍 Diagnóstico Detalhado

### Verificar se o App está Funcionando:

1. **Teste o App ID:**
   - Vá em **Configurações** → **Básico**
   - Copie o **App ID**
   - Tente acessar: `https://developers.facebook.com/apps/SEU_APP_ID`
   - Se não carregar, o App pode estar bloqueado

2. **Verificar Logs do Facebook:**
   - Vá em **Ferramentas** → **Logs de Erros**
   - Veja se há erros relacionados ao App

3. **Verificar Revisão:**
   - Vá em **Revisão de Aplicativo**
   - Veja se há solicitações pendentes ou rejeitadas

## 📋 Checklist de Verificação

Marque cada item:

- [ ] App está em modo **Desenvolvimento**
- [ ] App está **Ativo** (não bloqueado)
- [ ] **Facebook Login** está adicionado como produto
- [ ] **Instagram Graph API** está adicionado como produto
- [ ] Pelo menos uma permissão está configurada
- [ ] URL de redirecionamento está configurada corretamente
- [ ] Domínios do App estão configurados

## 🆘 Se Nada Funcionar

### Opção 1: Criar Novo App

1. Crie um novo App no Facebook Developers
2. Configure desde o início:
   - Tipo: **Negócios**
   - Adicione **Facebook Login**
   - Adicione **Instagram Graph API**
   - Configure domínios e redirect URI
3. Use as credenciais do novo App

### Opção 2: Verificar com Suporte do Facebook

Se o App está bloqueado ou com problemas:
1. Acesse: https://developers.facebook.com/support/
2. Entre em contato com o suporte
3. Explique o erro específico

## 💡 Dica Importante

**O erro "supported permission" geralmente significa:**
- O App não tem nenhuma permissão configurada
- OU o App está bloqueado/em revisão
- OU o produto necessário não está adicionado

**Verifique primeiro:**
1. Se o App está ativo
2. Se Instagram Graph API está adicionado
3. Se pelo menos uma permissão básica está configurada

## 🔄 Próximos Passos

Após verificar tudo:

1. ✅ Certifique-se de que Instagram Graph API está adicionado
2. ✅ Adicione pelo menos `public_profile` nas permissões
3. ✅ Reinicie o servidor backend
4. ✅ Tente conectar novamente

Se ainda não funcionar, pode ser necessário criar um novo App ou entrar em contato com o suporte do Facebook.


