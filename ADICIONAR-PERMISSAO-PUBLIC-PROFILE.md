# 🔧 Como Adicionar Permissão public_profile Quando Não Aparece

## ❌ Problema

A permissão `public_profile` não aparece na lista de permissões disponíveis.

---

## ✅ Soluções Alternativas

### Solução 1: Habilitar Login do Facebook Primeiro

A permissão `public_profile` pode não aparecer se o **Login do Facebook** não estiver totalmente configurado.

#### Passo a Passo:

1. **Acesse:** https://developers.facebook.com/apps
2. **Selecione seu app**
3. **Vá em:** **Produtos** → **Login do Facebook**
4. **Se aparecer "Configurar" ou "Set Up"**, clique nele
5. **Siga o assistente de configuração:**
   - Configure as URLs de redirecionamento
   - Ative OAuth do Cliente e Web
   - Salve todas as configurações

6. **Depois de configurar**, volte para **Permissões e Recursos**
7. A permissão `public_profile` deve aparecer agora

---

### Solução 2: Adicionar Permissão Manualmente via URL

Se a permissão ainda não aparecer, você pode adicioná-la manualmente:

1. **Vá em:** **Produtos → Login do Facebook → Permissões e Recursos**
2. **Procure por:** **"+ Adicionar Permissão"** ou **"Add Permission"**
3. **Digite manualmente:** `public_profile`
4. **Clique em "Adicionar"**

---

### Solução 3: Configurar App para Usar Permissões Básicas Automaticamente

O Facebook pode usar permissões básicas automaticamente se o app estiver configurado corretamente. Siga estes passos:

#### Passo 1: Configurar Informações Básicas do App

1. **Vá em:** **Configurações → Básico**
2. **Preencha TODOS os campos obrigatórios:**
   - ✅ **Nome de exibição:** Preencha (ex: "BIACRM")
   - ✅ **Categoria:** Selecione uma categoria (ex: "Negócio e Páginas")
   - ✅ **Domínios do aplicativo:** `biacrm.com`
   - ✅ **URL da Política de Privacidade:** `https://biacrm.com/privacy-policy`
   - ✅ **URL dos Termos de Serviço:** `https://biacrm.com/terms-of-service`
   - ✅ **Email de contato:** Seu email
   - ✅ **URL do site:** `https://biacrm.com`

3. **Clique em "Salvar alterações"**

#### Passo 2: Configurar Login do Facebook

1. **Vá em:** **Produtos → Login do Facebook → Configurações**
2. **Ative:**
   - ✅ **Login de OAuth do Cliente:** Sim
   - ✅ **Login de OAuth na Web:** Sim
3. **Configure URLs de redirecionamento:**
   - `https://biacrm.com/api/integrations/facebook/callback`
   - `https://biacrm.com/api/integrations/instagram/callback`
4. **Clique em "Salvar alterações"**

#### Passo 3: Verificar Modo do App

1. **Vá em:** **Configurações → Básico**
2. **Verifique o "Modo do App":**
   - Se estiver em **"Produção"**, mude temporariamente para **"Desenvolvimento"**
   - Apps em desenvolvimento têm menos restrições
3. **Salve**

---

### Solução 4: Usar Permissões Padrão do Facebook

O Facebook pode usar permissões básicas automaticamente sem precisar adicionar manualmente. Para isso:

1. **Certifique-se de que o Login do Facebook está configurado** (Solução 3 acima)
2. **Não é necessário adicionar permissões manualmente**
3. **O Facebook usará `public_profile` automaticamente** quando o usuário autorizar

---

## 🔍 Verificar se Está Funcionando

### Teste Rápido:

1. **Tente fazer a integração do Instagram novamente**
2. **Se aparecer a tela de autorização do Facebook**, significa que está funcionando
3. **O Facebook pode solicitar permissões automaticamente** mesmo sem aparecer na lista

---

## 📋 Checklist Alternativo

Se a permissão não aparecer, verifique:

- [ ] **Login do Facebook** está configurado e ativado
- [ ] **OAuth do Cliente** está ATIVADO
- [ ] **OAuth na Web** está ATIVADO
- [ ] **Categoria do app** está selecionada
- [ ] **Nome de exibição** está preenchido
- [ ] **Política de Privacidade** está configurada
- [ ] **Termos de Serviço** estão configurados
- [ ] **Domínios do aplicativo** estão configurados
- [ ] **URLs de redirecionamento** estão configuradas
- [ ] **Modo do app** está em "Desenvolvimento" (para testes)

---

## ⚠️ Importante

**A permissão `public_profile` pode não aparecer na lista**, mas o Facebook ainda pode usá-la automaticamente se:

1. ✅ O app estiver configurado corretamente
2. ✅ O Login do Facebook estiver ativado
3. ✅ As informações básicas estiverem preenchidas

**Teste a integração mesmo sem ver a permissão na lista!**

---

## 🎯 Resumo

**Se a permissão não aparecer:**

1. ✅ Configure todas as informações básicas do app
2. ✅ Configure e ative o Login do Facebook completamente
3. ✅ Teste a integração - o Facebook pode usar permissões básicas automaticamente
4. ✅ Se ainda não funcionar, mude o modo do app para "Desenvolvimento"

---

## 🔗 Onde Configurar

### Configurar Login do Facebook:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Configurar/Set Up
```

### Configurar Informações Básicas:
```
Facebook Developer → Seu App → Configurações → Básico
```

### Verificar Permissões:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Permissões e Recursos
```

---

## ✅ Próximo Passo

**Após configurar tudo acima:**

1. Aguarde 3-5 minutos
2. Teste a integração do Instagram novamente
3. O Facebook deve permitir o acesso mesmo sem a permissão aparecer explicitamente na lista

Se ainda não funcionar, verifique os logs do backend para ver o erro específico.





