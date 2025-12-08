# 🔧 Solução Definitiva: Erro "supported permission"

## ⚠️ Erro Persistente

```
Parece que esse app não está disponível
Este app precisa pelo menos do supported permission.
```

Este erro persiste mesmo sem permissões específicas, indicando um problema na **configuração fundamental do App**.

## 🔍 Diagnóstico Completo

### O Que Este Erro Realmente Significa

O erro "supported permission" significa que o Facebook **não consegue encontrar nenhuma permissão básica disponível** para o seu App. Isso acontece quando:

1. ❌ O App não tem permissões básicas configuradas
2. ❌ O Facebook Login não está totalmente configurado
3. ❌ O App está bloqueado ou restrito
4. ❌ O tipo de App não suporta OAuth web
5. ❌ Falta alguma configuração obrigatória

## ✅ Solução Passo a Passo

### Passo 1: Verificar Tipo e Status do App

1. **Acesse:** https://developers.facebook.com/apps/
2. **Selecione seu App**
3. **Vá em:** Configurações → Básico
4. **Verifique TODOS estes itens:**

   ✅ **ID do App:** Deve estar presente
   ✅ **Chave secreta do App:** Deve estar presente
   ✅ **Modo do App:** Deve estar "Desenvolvimento" ou "Em produção"
   ✅ **Status:** Deve estar "Ativo" (não "Desativado" ou "Bloqueado")
   ✅ **Categoria:** Deve estar configurada (ex: "Negócios", "Entretenimento")
   ✅ **Email de contato:** Deve estar configurado
   ✅ **URL do site:** Pode estar vazio, mas se preenchido, deve ser válido

### Passo 2: Verificar Facebook Login COMPLETO

1. **Vá em:** Login do Facebook → Configurações

2. **Verifique TODAS estas configurações:**

   ✅ **"Login no OAuth do cliente":** Deve estar **Sim** (habilitado)
   ✅ **"Login do OAuth na Web":** Deve estar **Sim** (habilitado)
   ✅ **"Forçar HTTPS":** Pode estar Sim ou Não (recomendado Sim)
   ✅ **"Usar modo estrito para URIs de redirecionamento":** Pode estar Sim ou Não

3. **Na seção "URIs de redirecionamento do OAuth válidos":**
   - Deve ter pelo menos uma URI configurada
   - A URI deve corresponder EXATAMENTE à usada no código
   - Exemplo: `https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback`

### Passo 3: Verificar Domínios do App

1. **Vá em:** Configurações → Básico
2. **Na seção "Domínios do App":**
   - Adicione o domínio do ngrok: `phraseological-curmudgeonly-trudi.ngrok-free.dev` (sem `https://`)
   - Clique em "Adicionar"
   - Salve

### Passo 4: Verificar Casos de Uso

1. **Vá em:** Casos de uso
2. **Verifique se está adicionado:**
   - ✅ "Gerenciar mensagens e conteúdo no Instagram"
   - ✅ Se possível, também "Login do Facebook" (pode estar listado separadamente)

### Passo 5: Tentar Adicionar Permissões Básicas Manualmente

Se o erro persistir, pode ser necessário adicionar permissões básicas manualmente:

1. **Vá em:** Login do Facebook → Configurações
2. **Procure por:** "Permissões" ou "Permissions" ou "Scopes"
3. **Se encontrar uma lista de permissões:**
   - Adicione: `public_profile`
   - Adicione: `email`
   - Salve

### Passo 6: Verificar Se o App Está Bloqueado

1. **Vá em:** Configurações → Básico
2. **Procure por:** "Status do App" ou "App Status"
3. **Se houver avisos ou bloqueios:**
   - Leia as mensagens
   - Resolva os problemas indicados
   - Pode ser necessário verificar identidade ou completar revisão

### Passo 7: Verificar Revisão do App (Se Disponível)

1. **Procure por:** "Revisão do App" ou "App Review" no menu
2. **Se encontrar:**
   - Verifique se há permissões pendentes de revisão
   - Verifique se há bloqueios ou restrições

## 🔧 Solução Alternativa: Criar Novo App

Se NADA funcionar, pode ser necessário criar um novo App do zero:

### Passo 1: Criar Novo App

1. **Acesse:** https://developers.facebook.com/apps/
2. **Clique em:** "Criar App" ou "Create App"
3. **Escolha:** Tipo "Negócios" ou "Business"
4. **Preencha:**
   - Nome do App: BIA CRM (ou outro nome)
   - Email de contato: seu email
   - Categoria: Negócios

### Passo 2: Configurar Imediatamente

**IMEDIATAMENTE após criar:**

1. **Vá em:** Login do Facebook → Configurações
2. **Habilite:**
   - "Login no OAuth do cliente": Sim
   - "Login do OAuth na Web": Sim
3. **Adicione URI de redirecionamento:**
   - `https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback`
4. **Salve**

### Passo 3: Adicionar Casos de Uso

1. **Vá em:** Casos de uso
2. **Adicione:** "Gerenciar mensagens e conteúdo no Instagram"
3. **Clique em:** "Personalizar" se necessário

### Passo 4: Atualizar Variáveis de Ambiente

1. **Copie o novo App ID e Secret**
2. **Atualize o `.env`:**
   ```env
   FACEBOOK_APP_ID=novo_app_id
   FACEBOOK_APP_SECRET=novo_app_secret
   INSTAGRAM_REDIRECT_URI=https://phraseological-curmudgeonly-trudi.ngrok-free.dev/api/integrations/instagram/callback
   ```
3. **Reinicie o servidor**

## 📋 Checklist Completo

- [ ] App está em modo "Desenvolvimento" ou "Em produção"
- [ ] App está "Ativo" (não bloqueado)
- [ ] Categoria do App está configurada
- [ ] Email de contato está configurado
- [ ] "Login no OAuth do cliente" está habilitado
- [ ] "Login do OAuth na Web" está habilitado
- [ ] URI de redirecionamento está configurada corretamente
- [ ] Domínio do App está adicionado
- [ ] Caso de uso do Instagram está adicionado
- [ ] Não há avisos ou bloqueios no App
- [ ] Testei com novo App (se necessário)

## 🆘 Se Ainda Não Funcionar

### Verificar Logs do Backend

Quando tentar conectar, verifique o console do backend. Você verá:

```
=== INSTAGRAM CONNECT-SIMPLE DEBUG ===
App ID: ✅ Configurado
Redirect URI: https://...
Scopes: (nenhum - Facebook decidirá permissões básicas)
```

**Verifique:**
- O App ID está correto?
- A Redirect URI está correta?
- Há algum erro adicional nos logs?

### Contatar Suporte do Facebook

Se nada funcionar, pode ser um problema específico do seu App ou conta:

1. **Acesse:** https://developers.facebook.com/support/
2. **Crie um ticket** explicando o erro "supported permission"
3. **Inclua:**
   - App ID
   - Screenshots das configurações
   - Descrição do problema

## 💡 Por Que Isso Acontece?

O erro "supported permission" geralmente acontece quando:

1. O App foi criado mas o Facebook Login não foi configurado imediatamente
2. O App está em um estado intermediário ou bloqueado
3. Há alguma configuração obrigatória faltando
4. O tipo de App não suporta OAuth web corretamente

**A solução mais comum é criar um novo App e configurar o Facebook Login IMEDIATAMENTE após a criação.**


