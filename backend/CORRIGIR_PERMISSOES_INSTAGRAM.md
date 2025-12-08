# 🔧 Correção de Permissões do Instagram

## Erro Encontrado
```
Invalid Scopes: instagram_basic, instagram_content_publish, instagram_manage_comments, 
instagram_manage_insights, pages_show_list, pages_read_engagement
```

## Problema
As permissões específicas do Instagram (`instagram_basic`, `instagram_content_publish`, etc.) **não são mais válidas** no OAuth do Facebook. 

O Instagram Graph API funciona através das **páginas do Facebook**, então você precisa solicitar permissões do Facebook Pages, não permissões específicas do Instagram.

## Solução Aplicada

### Permissões Corretas
As permissões foram atualizadas para:

```javascript
const scopes = [
  'pages_show_list',        // Listar páginas do Facebook
  'pages_read_engagement', // Ler engajamento das páginas
  'pages_manage_metadata',  // Gerenciar metadados das páginas
  'business_management'     // Gerenciar negócios (necessário para Instagram Business)
];
```

### Por que essas permissões?
1. **pages_show_list**: Necessário para listar as páginas do Facebook do usuário
2. **pages_read_engagement**: Permite ler dados de engajamento
3. **pages_manage_metadata**: Permite gerenciar informações da página
4. **business_management**: Necessário para acessar contas Instagram Business conectadas às páginas

### Como Funciona
1. Usuário autoriza acesso às páginas do Facebook
2. Sistema lista as páginas do usuário
3. Para cada página, verifica se há uma conta Instagram Business conectada
4. Acessa a conta Instagram através da API da página

## Configuração no Facebook Developers

### 1. Adicionar Permissões ao App

1. Acesse: https://developers.facebook.com/
2. Vá em **Meus Apps** → Selecione seu App
3. Vá em **Permissões e Recursos**
4. Adicione as seguintes permissões:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`
   - `business_management`

### 2. Verificar Produtos Adicionados

Certifique-se de que os seguintes produtos estão adicionados:
- ✅ **Facebook Login** (para OAuth)
- ✅ **Instagram Graph API** (para acessar Instagram Business)

### 3. Configurar Revisão de Permissões (se necessário)

Algumas permissões podem precisar de revisão do Facebook:
- `pages_manage_metadata` - pode precisar de revisão
- `business_management` - pode precisar de revisão

Para desenvolvimento, você pode usar o App em modo **Desenvolvimento** sem revisão.

## Teste Após Correção

1. **Limpe o cache do navegador**
2. **Tente conectar o Instagram novamente**
3. **Autorize as permissões solicitadas**
4. **Verifique se as contas Instagram aparecem**

## Permissões Depreciadas

As seguintes permissões **não devem mais ser usadas**:
- ❌ `instagram_basic` (depreciada)
- ❌ `instagram_content_publish` (depreciada)
- ❌ `instagram_manage_comments` (depreciada)
- ❌ `instagram_manage_insights` (depreciada)

## Documentação Oficial

Para mais informações sobre permissões válidas:
- https://developers.facebook.com/docs/facebook-login/permissions
- https://developers.facebook.com/docs/instagram-api/getting-started

## Próximos Passos

Após corrigir as permissões:
1. ✅ Teste a conexão do Instagram
2. ✅ Verifique se as contas Instagram Business aparecem
3. ✅ Teste funcionalidades como comentários e insights


