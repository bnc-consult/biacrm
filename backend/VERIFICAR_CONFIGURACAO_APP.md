# 🔍 Verificar Configuração do App - Erro "supported permission"

## ⚠️ Problema

O erro "Este app precisa pelo menos do supported permission" persiste mesmo sem permissões específicas.

**Isso indica que o problema NÃO é das permissões, mas sim da CONFIGURAÇÃO DO APP.**

## 🔍 Diagnóstico Completo

### O Que Este Erro Significa

Este erro específico geralmente significa:

1. **Facebook Login não está configurado corretamente**
2. **O App não tem nenhuma permissão básica disponível**
3. **O App está bloqueado ou restrito**
4. **A URL de redirecionamento não está configurada**

## ✅ Verificações Necessárias

### 1. Facebook Login Está Adicionado?

**No menu lateral do seu App:**

1. Procure por **"Login do Facebook"** ou **"Facebook Login"**
2. **Se encontrar:**
   - Clique nele
   - Verifique se está **ativado/habilitado**
   - Vá em **"Configurações"**
   - Verifique se a URL de redirecionamento está configurada

3. **Se NÃO encontrar:**
   - Vá em **"Casos de uso"** ou **"Produtos"**
   - Procure por **"Facebook Login"**
   - Se não estiver listado, você precisa adicionar:
     - Clique em **"Adicionar casos de uso"** (botão no canto superior direito)
     - OU vá em **"Produtos"** → **"+ Adicionar Produto"**
     - Procure por **"Facebook Login"**
     - Clique em **"Configurar"** ou **"Adicionar"**

### 2. URL de Redirecionamento Está Configurada?

**No Facebook Login → Configurações:**

1. Procure por **"URIs de redirecionamento OAuth válidos"** ou **"Valid OAuth Redirect URIs"**
2. **Adicione sua URL:**
   - Se usando ngrok: `https://sua-url-ngrok.ngrok-free.app/api/integrations/instagram/callback`
   - Se usando localhost: `http://127.0.0.1:3000/api/integrations/instagram/callback`
   - Se usando produção: `https://biacrm.com/api/integrations/instagram/callback`

3. **Salve as alterações**

### 3. App Está em Modo Correto?

**Configurações → Básico:**

- ✅ **Modo do App:** Deve estar "Desenvolvimento"
- ✅ **Status:** Deve estar "Ativo" (não bloqueado)
- ✅ **Categoria:** Deve estar configurada

### 4. Domínios Estão Configurados?

**Configurações → Básico → Domínios do App:**

- Adicione:
  - `localhost`
  - `127.0.0.1`
  - Seu domínio de produção (se aplicável)

## 🔧 Solução Passo a Passo

### Passo 1: Adicionar Facebook Login (Se Não Estiver)

1. **Acesse:** https://developers.facebook.com/
2. **Meus Apps** → Seu App
3. **No menu lateral**, procure por:
   - **"Casos de uso"** → Clique
   - **OU "Produtos"** → Clique
4. **Procure por "Facebook Login"**
5. **Se não encontrar:**
   - Clique em **"Adicionar casos de uso"** (botão no canto superior direito)
   - Procure por **"Facebook Login"**
   - Clique em **"Adicionar"** ou **"Configurar"**

### Passo 2: Configurar Facebook Login

1. **Clique em "Facebook Login"** (no menu ou lista de casos de uso)
2. **Vá em "Configurações"**
3. **Configure:**
   - **URIs de redirecionamento OAuth válidos:**
     - Adicione sua URL de callback
   - **Salve as alterações**

### Passo 3: Verificar se Está Ativado

1. **No Facebook Login**, verifique se há um botão ou switch para **"Ativar"** ou **"Habilitar"**
2. **Se houver**, certifique-se de que está **ativado**

## 🆘 Se Ainda Não Funcionar

### Opção 1: Criar Novo App

Se o App atual está com problemas:

1. **Crie um novo App:**
   - Vá em **Meus Apps** → **Criar App**
   - Tipo: **Negócios**
   - Nome: **BIA CRM** (ou outro nome)

2. **Configure desde o início:**
   - Adicione **Facebook Login** imediatamente
   - Configure URL de redirecionamento
   - Configure domínios
   - Use as credenciais do novo App no `.env`

### Opção 2: Verificar Logs

1. **Vá em:** Ferramentas → Logs de Erros
2. **Veja se há erros específicos** sobre o App
3. **Isso pode indicar o problema exato**

### Opção 3: Verificar Status do App

1. **Vá em:** Configurações → Básico
2. **Procure por:**
   - Mensagens de erro ou avisos
   - Status do App
   - Restrições ou bloqueios

## 📋 Checklist Final

- [ ] Facebook Login está **adicionado** como caso de uso/produto?
- [ ] Facebook Login está **ativado/habilitado**?
- [ ] URL de redirecionamento está **configurada**?
- [ ] Domínios do App estão **configurados**?
- [ ] App está em modo **Desenvolvimento**?
- [ ] App está **Ativo** (não bloqueado)?
- [ ] Categoria do App está **configurada**?

## 💡 Dica Importante

**O erro "supported permission" quando não há permissões específicas geralmente significa:**

- ❌ Facebook Login não está adicionado
- ❌ Facebook Login não está ativado
- ❌ URL de redirecionamento não está configurada
- ❌ App está bloqueado ou restrito

**Verifique primeiro se o Facebook Login está realmente adicionado e configurado!**

## 🔄 Próximos Passos

1. ✅ Verifique se Facebook Login está adicionado
2. ✅ Configure a URL de redirecionamento
3. ✅ Ative o Facebook Login (se necessário)
4. ✅ Reinicie o servidor backend
5. ✅ Tente conectar Instagram novamente

O problema está na configuração do App, não nas permissões. Depois de configurar o Facebook Login corretamente, deve funcionar!


