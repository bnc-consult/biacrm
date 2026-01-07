# 📱 Integração com Instagram Pessoal

## ✅ O que mudou?

Agora você pode integrar contas Instagram **pessoais** sem precisar converter para Business ou conectar a uma página do Facebook!

## 🔄 Como funciona?

### Fluxo Simplificado (Recomendado)

1. **Clique em "Conectar Instagram"** na página de Integrações
2. **Informe apenas o username** do Instagram (sem senha)
3. **Autorize com Facebook** - você será redirecionado para autorizar o acesso
4. **Sistema cria a integração automaticamente** usando o token do Facebook

### O que acontece internamente?

- ✅ Sistema busca contas Instagram Business conectadas às suas páginas do Facebook
- ✅ Se não encontrar contas Business, **cria uma integração pessoal** usando o username informado
- ✅ Usa o token do Facebook para acessar dados básicos do Instagram
- ✅ A integração é salva automaticamente no banco de dados

## 📋 Requisitos

1. **Ter uma conta Facebook** (necessário para autorização OAuth)
2. **Informar o username do Instagram** durante a conexão
3. **Autorizar o acesso** quando solicitado pelo Facebook

## ⚠️ Limitações de Contas Pessoais

Contas Instagram pessoais têm **limitações** em relação às Business:

- ❌ Não é possível publicar posts automaticamente
- ❌ Não é possível acessar métricas avançadas (insights)
- ❌ Não é possível gerenciar comentários via API
- ✅ É possível acessar dados básicos do perfil
- ✅ É possível monitorar a conta

## 🔧 Diferenças entre Business e Pessoal

### Instagram Business
- Requer página do Facebook conectada
- Acesso completo à API do Instagram
- Pode publicar, gerenciar comentários, ver insights
- Ideal para empresas e criadores de conteúdo

### Instagram Pessoal
- Não requer página do Facebook
- Acesso limitado à API
- Ideal para uso básico e monitoramento simples
- Usa token do usuário Facebook diretamente

## 🚀 Como usar

1. Acesse **Integrações** → **Instagram**
2. Clique em **"Conectar Instagram"**
3. Informe o **username** do Instagram
4. Clique em **"Conectar"**
5. Autorize o acesso quando solicitado
6. Pronto! A integração será criada automaticamente

## 💡 Dicas

- Se você tem uma página do Facebook conectada ao Instagram, o sistema tentará usar a conta Business primeiro
- Se não encontrar conta Business, criará automaticamente uma integração pessoal
- Você pode ter múltiplas integrações (Business e Pessoais)
- O título da integração mostrará se é "Business" ou "Pessoal"

## 🆘 Problemas Comuns

### "Nenhuma conta Instagram Business encontrada"
- ✅ **Isso é normal!** O sistema criará uma integração pessoal automaticamente
- ✅ Certifique-se de ter informado o username corretamente

### "Erro ao buscar páginas do Facebook"
- Verifique se você autorizou o acesso às páginas do Facebook
- Tente novamente e autorize todas as permissões solicitadas

### "Token inválido"
- O token pode ter expirado
- Desconecte e reconecte a integração
- Verifique se o Facebook App está configurado corretamente

## 📝 Notas Técnicas

- Contas pessoais usam o token do usuário Facebook diretamente
- O `instagram_account_id` para contas pessoais é gerado automaticamente (formato: `personal_{userId}_{timestamp}`)
- O token é armazenado no banco de dados e pode ser usado para acessar dados básicos
- Para funcionalidades avançadas, considere converter a conta para Business





