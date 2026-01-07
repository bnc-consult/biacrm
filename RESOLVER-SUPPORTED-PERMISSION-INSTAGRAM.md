# 🔧 Resolver Erro "Supported Permission" - Instagram

## ❌ Erro Atual

Você está vendo o erro:
> **"Parece que esse app não está disponível - Este app precisa pelo menos do supported permission."**

Este erro significa que o Facebook App precisa ter **pelo menos uma permissão básica** configurada, mesmo que seja apenas `public_profile`.

---

## ✅ Solução: Configurar Permissões Básicas

### Passo 1: Acessar Configurações de Permissões

1. Acesse: **https://developers.facebook.com/apps**
2. Selecione seu app
3. Vá em: **Produtos → Login do Facebook → Permissões e Recursos** (Permissions and Features)

---

### Passo 2: Verificar Permissões Básicas

Na seção **"Permissões padrão"** (Standard Permissions), verifique se pelo menos estas permissões estão disponíveis:

#### Permissões Básicas (Não requerem revisão):
- ✅ `public_profile` - **OBRIGATÓRIA** (perfil público do usuário)
- ✅ `email` - Email do usuário (opcional, mas recomendado)

#### Permissões para Instagram:
- ✅ `pages_show_list` - Listar páginas do Facebook (necessário para Instagram Business)
- ✅ `pages_read_engagement` - Ler engajamento de páginas (pode requerer revisão)

---

### Passo 3: Adicionar Permissões Básicas

Se as permissões não estiverem disponíveis:

1. Na seção **"Permissões padrão"**, procure por `public_profile`
2. Se não aparecer, clique em **"+ Adicionar Permissão"** ou **"Add Permission"**
3. Procure e adicione:
   - `public_profile` (perfil público)
   - `email` (email - opcional)
   - `pages_show_list` (listar páginas)

4. Clique em **"Salvar alterações"**

---

### Passo 4: Verificar Configurações do App

1. Vá em: **Configurações → Básico**
2. Verifique se:
   - ✅ **Nome de exibição** está preenchido
   - ✅ **Categoria do app** está selecionada
   - ✅ **Domínios do aplicativo** contém `biacrm.com`
   - ✅ **URL da Política de Privacidade** está configurada: `https://biacrm.com/privacy-policy`
   - ✅ **URL dos Termos de Serviço** está configurada: `https://biacrm.com/terms-of-service`

---

### Passo 5: Verificar Modo do App

1. Ainda em **Configurações → Básico**
2. Verifique o **"Modo do App"**:
   - Se estiver em **"Desenvolvimento"**: OK para testes
   - Se estiver em **"Produção"**: Certifique-se de que todas as permissões necessárias foram aprovadas

---

### Passo 6: Verificar Login do Facebook

1. Vá em: **Produtos → Login do Facebook → Configurações**
2. Certifique-se de que:
   - ✅ **Login de OAuth do Cliente** está **ATIVADO**
   - ✅ **Login de OAuth na Web** está **ATIVADO**
   - ✅ **URIs de redirecionamento OAuth válidos** contém:
     - `https://biacrm.com/api/integrations/facebook/callback`
     - `https://biacrm.com/api/integrations/instagram/callback`

---

### Passo 7: Adicionar Permissões no Código (Opcional)

Se quiser solicitar permissões específicas no código, você pode modificar o escopo OAuth. Mas para começar, o Facebook pode funcionar sem escopos explícitos se as permissões básicas estiverem configuradas.

---

## 📋 Checklist Completo

Antes de testar novamente:

- [ ] **Permissão `public_profile`** está disponível em Permissões e Recursos
- [ ] **Permissão `pages_show_list`** está disponível (para Instagram Business)
- [ ] **Nome de exibição** do app está preenchido
- [ ] **Categoria do app** está selecionada
- [ ] **Domínios do aplicativo** contém `biacrm.com`
- [ ] **Política de Privacidade** está configurada
- [ ] **Termos de Serviço** estão configurados
- [ ] **OAuth do Cliente** está ATIVADO
- [ ] **OAuth na Web** está ATIVADO
- [ ] **URLs de redirecionamento** estão configuradas
- [ ] Aguardou alguns minutos após salvar

---

## 🔍 Como Verificar Permissões

### Verificar Permissões Disponíveis:
1. Vá em: **Produtos → Login do Facebook → Permissões e Recursos**
2. Procure na seção **"Permissões padrão"**
3. Deve aparecer pelo menos: `public_profile`

### Verificar Status das Permissões:
- ✅ **Verde/Ativo**: Permissão disponível e funcionando
- ⚠️ **Amarelo/Pendente**: Permissão requer revisão do Facebook
- ❌ **Vermelho/Desativado**: Permissão não disponível

---

## ⚠️ Erros Comuns e Soluções

### Erro: "Supported permission" persiste
- **Causa**: Permissões básicas não estão configuradas ou app não tem categoria
- **Solução**: 
  1. Adicione `public_profile` em Permissões e Recursos
  2. Configure categoria do app em Configurações → Básico
  3. Aguarde alguns minutos e teste novamente

### Erro: Permissão não aparece na lista
- **Causa**: Pode estar em outra seção ou requer configuração adicional
- **Solução**: 
  1. Procure em "Permissões padrão" e "Permissões avançadas"
  2. Se não encontrar, o Facebook pode adicionar automaticamente após primeira autorização

### Erro: App não está disponível
- **Causa**: App pode estar desativado ou em modo de manutenção
- **Solução**: 
  1. Verifique se o app está ativo em Configurações → Básico
  2. Verifique se não há avisos ou bloqueios no app
  3. Certifique-se de que todas as informações básicas estão preenchidas

---

## 🎯 Resumo Rápido

**O que fazer:**
1. ✅ Adicionar permissão `public_profile` em **Permissões e Recursos**
2. ✅ Configurar **categoria do app** em **Configurações → Básico**
3. ✅ Preencher **Nome de exibição** do app
4. ✅ Configurar **Política de Privacidade** e **Termos de Serviço**
5. ✅ Salvar todas as alterações
6. ✅ Aguardar alguns minutos
7. ✅ Testar novamente

---

## 📸 Onde Encontrar no Facebook Developer

### Adicionar Permissões:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Permissões e Recursos → Permissões padrão
```

### Configurar Categoria:
```
Facebook Developer → Seu App → Configurações → Básico → Categoria
```

### Configurar Política e Termos:
```
Facebook Developer → Seu App → Configurações → Básico → URL da Política de Privacidade / URL dos Termos de Serviço
```

---

## 🚀 Após Configurar

1. ✅ **Salve todas as alterações**
2. ✅ **Aguarde 3-5 minutos** para propagação
3. ✅ **Teste novamente** a integração do Instagram
4. ✅ Se ainda der erro, verifique os logs do backend para mais detalhes

---

## 📝 Notas Importantes

- O erro "supported permission" geralmente significa que o app precisa de **pelo menos uma permissão básica** configurada
- A permissão `public_profile` é **obrigatória** e não requer revisão
- O app precisa ter **categoria** e **nome de exibição** configurados
- **Política de Privacidade** e **Termos de Serviço** são obrigatórios para produção

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Permissões do Facebook Login](https://developers.facebook.com/docs/permissions/reference)
- [Configuração de App Básica](https://developers.facebook.com/docs/apps/manage-app-details)





