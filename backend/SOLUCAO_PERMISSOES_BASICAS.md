# ✅ Solução: Usar Apenas Permissões Básicas

## ⚠️ Problema Identificado

Todas as permissões relacionadas a `pages_` estão sendo rejeitadas como inválidas:
- ❌ `pages_show_list`
- ❌ `pages_read_engagement`
- ❌ `pages_manage_metadata`
- ❌ `business_management`

## 🔧 Solução Aplicada

Mudamos para usar **apenas permissões básicas** do Facebook Login:

```javascript
const scopes = [
  'public_profile',  // Perfil público do usuário
  'email'            // Email do usuário
];
```

## 📝 Como Funciona Agora

1. **Usuário autoriza** com permissões básicas (`public_profile`, `email`)
2. **Sistema obtém** o token de acesso do usuário
3. **Com o token**, fazemos chamadas à API do Facebook para:
   - Listar páginas do usuário (`/me/accounts`)
   - Acessar contas Instagram Business conectadas às páginas
4. **Permissões específicas** são gerenciadas através da API, não no OAuth inicial

## ✅ Vantagens Desta Abordagem

- ✅ **Permissões básicas são sempre válidas**
- ✅ **Não requerem revisão** do Facebook
- ✅ **Funcionam imediatamente** em modo desenvolvimento
- ✅ **Acesso às páginas** é feito através do token do usuário

## 🔍 Como Acessar Páginas e Instagram

Após obter o token básico, fazemos:

```javascript
// 1. Listar páginas do usuário
GET /me/accounts?access_token={token}

// 2. Para cada página, verificar conta Instagram Business
GET /{page_id}?fields=instagram_business_account&access_token={page_token}

// 3. Acessar conta Instagram Business
GET /{instagram_account_id}?access_token={page_token}
```

## 📋 Configuração no Facebook Developers

### Permissões Básicas (Já Incluídas por Padrão):

- ✅ `public_profile` - Sempre disponível
- ✅ `email` - Sempre disponível

**Você NÃO precisa adicionar essas permissões manualmente** - elas já vêm com o Facebook Login!

### O Que Você Precisa Fazer:

1. **Certifique-se de que Facebook Login está adicionado:**
   - Vá em **Produtos** → Verifique se **Facebook Login** está listado
   - Se não estiver, adicione o produto

2. **Configure a URL de redirecionamento:**
   - Vá em **Facebook Login** → **Configurações**
   - Adicione sua URL de callback

3. **Não precisa adicionar permissões específicas!**
   - As permissões básicas já estão incluídas
   - O acesso às páginas será feito através da API

## ✅ Teste Após Correção

1. **Reinicie o servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Tente conectar o Instagram novamente**
3. **O erro de permissões inválidas deve desaparecer**
4. **Apenas permissões básicas serão solicitadas** (public_profile, email)

## 🎯 Próximos Passos

Após conectar com sucesso:

1. ✅ O sistema obterá o token básico
2. ✅ Fará chamadas à API para listar páginas
3. ✅ Encontrará contas Instagram Business conectadas
4. ✅ Conectará automaticamente

## ⚠️ Nota Importante

**Se você precisar de funcionalidades avançadas** (como publicar posts, gerenciar comentários):
- Essas funcionalidades podem requerer permissões adicionais
- Mas para **conectar e ler dados básicos**, apenas as permissões básicas são suficientes

## 🔄 Se Ainda Não Funcionar

Se mesmo com permissões básicas houver erro:

1. **Verifique se o App está em modo Desenvolvimento**
2. **Verifique se Facebook Login está configurado**
3. **Verifique se a URL de redirecionamento está correta**
4. **Tente sem nenhuma permissão** (deixar scopes vazio)

Para deixar scopes vazio, altere para:
```javascript
const scopes = ''; // Sem permissões específicas
```

Mas isso pode limitar o acesso às páginas. Tente primeiro com as permissões básicas!


