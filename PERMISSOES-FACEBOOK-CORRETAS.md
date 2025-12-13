# ✅ Permissões Corretas do Facebook

## ⚠️ Erro Encontrado

O Facebook retornou erro indicando que essas permissões são inválidas:
- ❌ `pages_read_engagement`
- ❌ `leads_retrieval`
- ❌ `pages_read_user_content`
- ❌ `pages_manage_ads`

## 🔧 Solução Aplicada

As permissões foram atualizadas para usar apenas **permissões válidas e básicas**:

```javascript
const scopes = [
  'public_profile',      // Perfil público do usuário (sempre válida)
  'pages_show_list'       // Listar páginas do Facebook (válida e necessária)
];
```

## ✅ Por que apenas essas?

1. **`public_profile`**: 
   - ✅ Sempre disponível, não requer revisão
   - Permite acessar informações básicas do perfil
   - Incluída automaticamente pelo Facebook Login

2. **`pages_show_list`**: 
   - ✅ Permissão válida e básica
   - Necessária para listar as páginas do Facebook do usuário
   - Através das páginas, podemos acessar leads e outras informações

## ⚠️ Permissão `email` Removida

A permissão `email` foi removida porque:
- Pode não estar disponível dependendo da configuração do app no Facebook Developers
- Não é estritamente necessária para a funcionalidade principal (acesso a páginas e leads)
- O email pode ser obtido através de outras APIs se necessário

## 📝 Como Funciona Agora

1. **Usuário autoriza** com permissões básicas (`public_profile`, `email`, `pages_show_list`)
2. **Sistema obtém** o token de acesso do usuário
3. **Com o token**, fazemos chamadas à API do Facebook para:
   - Listar páginas do usuário (`/me/accounts`)
   - Acessar informações das páginas através do token da página
   - Acessar leads através da API da página (não requer permissão específica no OAuth)

## 🔍 Permissões Removidas (Inválidas)

- ❌ `pages_read_engagement` - Não é válida para OAuth básico
- ❌ `pages_manage_metadata` - Requer revisão e não é necessária
- ❌ `leads_retrieval` - Não é uma permissão válida de OAuth
- ❌ `pages_read_user_content` - Não é válida
- ❌ `pages_manage_ads` - Requer revisão e não é necessária para acesso básico

## ✅ Vantagens

- ✅ **Permissões básicas são sempre válidas**
- ✅ **Não requerem revisão** do Facebook
- ✅ **Funcionam imediatamente** em modo desenvolvimento
- ✅ **Acesso às páginas e leads** é feito através do token da página

## 📋 Nota Importante

As permissões removidas (`leads_retrieval`, `pages_read_user_content`, etc.) podem ser acessadas através do **token da página** (`page_access_token`) que é retornado quando listamos as páginas do usuário. Não é necessário solicitá-las no OAuth inicial.

