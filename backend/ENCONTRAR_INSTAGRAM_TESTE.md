# 🔍 Como Encontrar Instagram Graph API nos Testes

## 📋 O Que Você Está Vendo

Na tela de "Testar os casos de uso", você vê:
- ✅ Acessar a API do Threads
- ✅ Conectar-se com clientes pelo WhatsApp
- ❓ Instagram Graph API (não aparece?)

## 🔍 Onde Pode Estar o Instagram Graph API

### Opção 1: Pode Estar em Outro Lugar

O Instagram Graph API pode não aparecer como um caso de uso separado. Ele pode estar:

1. **Integrado ao Facebook Login:**
   - Quando você testa Facebook Login, o Instagram fica disponível automaticamente
   - Não precisa de caso de uso separado

2. **Como parte de outro caso de uso:**
   - Pode estar dentro de "Conectar-se com clientes pelo WhatsApp"
   - Ou em outro caso de uso relacionado

### Opção 2: Usar Graph API Explorer Diretamente

Como mencionado na tela, você pode usar o **Graph API Explorer** diretamente:

1. **Clique em "Abrir o Explorador da Graph API"** (botão no canto direito)
2. **No Graph API Explorer:**
   - Selecione seu App: **BIA Crm**
   - Selecione "Token do usuário"
   - Vá na aba **"Permissions"**
   - Veja quais permissões estão disponíveis/marcadas
   - Teste endpoints do Instagram diretamente

## 🎯 Permissões que Provavelmente Funcionaram

Baseado no que vejo na sua tela, você tem:
- `public_profile` ✅ (sempre funciona)
- `whatsapp_business_management`
- `whatsapp_business_messaging`

Para Instagram Graph API, as permissões mais comuns que funcionam são:

### Opção 1: Apenas Permissões Básicas
```javascript
const scopes = 'public_profile';
```

### Opção 2: Sem Permissões Específicas
```javascript
const scopes = ''; // Token básico sem permissões específicas
```

## 📝 O Que Você Precisa Fazer Agora

### Passo 1: Abrir Graph API Explorer

1. **Na tela de testes**, clique em **"Abrir o Explorador da Graph API"**
2. **OU acesse diretamente:** https://developers.facebook.com/tools/explorer/

### Passo 2: Verificar Permissões

No Graph API Explorer:

1. **Selecione seu App:** BIA Crm (dropdown no topo)
2. **Selecione tipo de token:** "Token do usuário"
3. **Clique em "Generate Access Token"**
4. **Veja quais permissões são solicitadas** durante a autorização
5. **Anote essas permissões**

### Passo 3: Testar Endpoint do Instagram

No Graph API Explorer, teste:

1. **Endpoint:** `/me/accounts`
2. **Fields:** `id,name,instagram_business_account`
3. **Veja se retorna dados** das páginas e Instagram

## ✅ Solução Rápida: Usar Apenas public_profile

Como `public_profile` está listado na sua tela e é uma permissão básica, vamos usar apenas ela:

```javascript
const scopes = 'public_profile';
```

Isso deve funcionar porque:
- ✅ É uma permissão básica sempre válida
- ✅ Não requer revisão
- ✅ Permite obter token e acessar API básica
- ✅ O acesso ao Instagram é feito através das páginas do Facebook

## 🔄 Próximos Passos

1. **Atualizei o código** para usar apenas `public_profile`
2. **Reinicie o servidor backend**
3. **Tente conectar o Instagram novamente**
4. **Se funcionar**, perfeito!
5. **Se não funcionar**, me diga qual erro aparece

## 💡 Dica

**Se você conseguir gerar um token no Graph API Explorer que funciona para Instagram:**
- Copie esse token
- Me diga quais permissões foram solicitadas durante a geração
- Atualizo o código para usar as mesmas permissões

## 🆘 Se Não Encontrar Instagram Graph API

**Não se preocupe!** O Instagram Graph API pode não aparecer como caso de uso separado porque:

1. **É acessado através do Facebook Login**
2. **Não precisa de caso de uso específico**
3. **Funciona automaticamente quando você tem Facebook Login configurado**

O importante é que o **token funcione** para acessar dados do Instagram através da API.


