# 🔧 Configurar Facebook Login para OAuth Web

## ✅ Você Já Tem os Casos de Uso Adicionados

Vejo que você já adicionou todos os casos de uso, incluindo:
- ✅ "Gerenciar mensagens e conteúdo no Instagram"

Mas o erro persiste porque o **Facebook Login precisa estar configurado especificamente para OAuth web**.

## 🔍 O Problema

O caso de uso do Instagram está adicionado, mas o **Facebook Login** (que é usado para OAuth) precisa estar configurado para **uso web** com a **URL de redirecionamento** correta.

## ✅ Solução: Configurar Facebook Login

### Passo 1: Encontrar Facebook Login

No menu lateral do seu App, procure por:

1. **"Login do Facebook"** ou **"Facebook Login"**
   - Pode estar em "Casos de uso"
   - OU pode estar em "Produtos"
   - OU pode estar em "Funções do app"

2. **Se encontrar**, clique nele

3. **Se NÃO encontrar**, pode estar com outro nome:
   - "Autenticação"
   - "OAuth"
   - "Login"
   - Procure por qualquer coisa relacionada a login/autenticação

### Passo 2: Configurar para Web

Quando encontrar o Facebook Login:

1. **Vá em "Configurações"** ou **"Settings"**

2. **Procure por "Configurações de Cliente OAuth"** ou **"OAuth Client Settings"**

3. **Configure:**

   **a) URIs de redirecionamento OAuth válidos:**
   - Clique em **"Adicionar URI"** ou **"Add URI"**
   - Adicione sua URL de callback:
     ```
     https://sua-url-ngrok.ngrok-free.app/api/integrations/instagram/callback
     ```
     OU
     ```
     http://127.0.0.1:3000/api/integrations/instagram/callback
     ```
   - **Salve**

   **b) Verifique se está habilitado para "Web":**
   - Procure por opções como "Web OAuth" ou "OAuth para Web"
   - Certifique-se de que está **habilitado**

### Passo 3: Verificar Domínios

1. **Vá em:** Configurações → Básico → Domínios do App
2. **Adicione:**
   - Se usando ngrok: `sua-url-ngrok.ngrok-free.app` (sem https://)
   - Se usando localhost: `localhost` e `127.0.0.1`
3. **Salve**

## 🔍 Onde Pode Estar o Facebook Login

### Opção 1: No Menu Lateral

Procure no menu lateral por:
- "Login do Facebook"
- "Facebook Login"
- "Autenticação"
- "OAuth"

### Opção 2: Dentro de "Gerenciar mensagens e conteúdo no Instagram"

1. **Clique em "Gerenciar mensagens e conteúdo no Instagram"**
2. **Clique em "Personalizar"**
3. **Procure por configurações de OAuth ou Login**
4. **Configure a URL de redirecionamento lá**

### Opção 3: Em "Funções do app"

1. **Clique em "Funções do app"** no menu lateral (expandir)
2. **Procure por "Login"** ou **"OAuth"**
3. **Configure lá**

## 📋 Checklist Específico

- [ ] Encontrei "Facebook Login" ou similar no menu?
- [ ] Cliquei nele e fui para "Configurações"?
- [ ] Adicionei a URL de redirecionamento em "URIs de redirecionamento OAuth válidos"?
- [ ] Verifiquei se está habilitado para "Web"?
- [ ] Domínios do App estão configurados?
- [ ] Salvei todas as alterações?

## 🆘 Se Não Encontrar Facebook Login

### Alternativa: Configurar no Caso de Uso do Instagram

1. **Clique em "Gerenciar mensagens e conteúdo no Instagram"**
2. **Clique em "Personalizar"**
3. **Procure por:**
   - "Configurações de OAuth"
   - "URL de redirecionamento"
   - "Redirect URI"
   - "Web OAuth"
4. **Configure a URL de redirecionamento lá**

## 💡 Dica Importante

**O caso de uso do Instagram está adicionado, mas:**
- O **Facebook Login** precisa estar configurado **separadamente** para OAuth web
- A **URL de redirecionamento** precisa estar configurada
- Os **domínios** precisam estar configurados

**São configurações diferentes:**
- ✅ Caso de uso do Instagram = Permissões e funcionalidades
- ❌ Facebook Login = OAuth web (ainda precisa ser configurado)

## 🔄 Próximos Passos

1. ✅ Encontre "Facebook Login" no menu
2. ✅ Configure a URL de redirecionamento
3. ✅ Habilite para uso web
4. ✅ Configure domínios
5. ✅ Reinicie o servidor backend
6. ✅ Tente conectar Instagram novamente

O problema é que o **Facebook Login não está configurado para OAuth web**, mesmo com os casos de uso adicionados!


