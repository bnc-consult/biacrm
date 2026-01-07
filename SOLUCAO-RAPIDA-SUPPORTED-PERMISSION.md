# ⚡ Solução Rápida: Erro "Supported Permission"

## 🎯 O Que Fazer Agora (Passo a Passo Visual)

### ✅ Passo 1: Adicionar Permissão Básica (2 minutos)

1. **Acesse:** https://developers.facebook.com/apps
2. **Clique no seu app**
3. **No menu lateral esquerdo**, clique em: **"Produtos"**
4. **Procure e clique em:** **"Login do Facebook"**
5. **No submenu**, clique em: **"Permissões e Recursos"** (ou "Permissions and Features")
6. **Na seção "Permissões padrão"** (Standard Permissions):
   - Procure por `public_profile`
   - Se **NÃO aparecer**, clique em **"+ Adicionar Permissão"** ou **"Add Permission"**
   - Digite: `public_profile`
   - Clique em **"Adicionar"** ou **"Add"**
7. **Clique em "Salvar alterações"** no final da página

---

### ✅ Passo 2: Configurar Informações Básicas do App (3 minutos)

1. **No menu lateral**, clique em: **"Configurações"** → **"Básico"**
2. **Preencha/Verifique:**

   **a) Nome de exibição:**
   - Deve ter um nome (ex: "BIACRM" ou "BIACRM - Test1")
   - Se estiver vazio, preencha

   **b) Categoria:**
   - Clique no dropdown **"Categoria"**
   - Selecione uma categoria (ex: "Negócio e Páginas" ou "Business")
   - **OBRIGATÓRIO** - não pode estar vazio

   **c) Domínios do aplicativo:**
   - Deve conter: `biacrm.com`
   - Se não tiver, adicione

   **d) URL da Política de Privacidade:**
   - Deve ser: `https://biacrm.com/privacy-policy`
   - Se não estiver, adicione

   **e) URL dos Termos de Serviço:**
   - Deve ser: `https://biacrm.com/terms-of-service`
   - Se não estiver, adicione

3. **Clique em "Salvar alterações"**

---

### ✅ Passo 3: Verificar OAuth (1 minuto)

1. **No menu lateral**, clique em: **"Produtos"** → **"Login do Facebook"** → **"Configurações"**
2. **Verifique se está ATIVADO:**
   - ✅ **Login de OAuth do Cliente:** Deve estar **"Sim"** (ativado)
   - ✅ **Login de OAuth na Web:** Deve estar **"Sim"** (ativado)
3. **Se não estiver ativado**, clique nos toggles para ativar
4. **Clique em "Salvar alterações"**

---

### ✅ Passo 4: Aguardar e Testar

1. **Aguarde 3-5 minutos** para o Facebook processar as alterações
2. **Feche e abra novamente** a página de configurações para confirmar que foi salvo
3. **Teste novamente** a integração do Instagram

---

## 📋 Checklist Rápido

Marque cada item após completar:

- [ ] Permissão `public_profile` adicionada em **Permissões e Recursos**
- [ ] **Categoria do app** selecionada em **Configurações → Básico**
- [ ] **Nome de exibição** preenchido
- [ ] **Domínios do aplicativo** contém `biacrm.com`
- [ ] **Política de Privacidade** configurada: `https://biacrm.com/privacy-policy`
- [ ] **Termos de Serviço** configurados: `https://biacrm.com/terms-of-service`
- [ ] **OAuth do Cliente** está ATIVADO
- [ ] **OAuth na Web** está ATIVADO
- [ ] Todas as alterações foram **salvas**
- [ ] Aguardou **3-5 minutos** após salvar

---

## 🔍 Onde Encontrar Cada Configuração

### Adicionar Permissão:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Permissões e Recursos
```

### Configurar Categoria:
```
Facebook Developer → Seu App → Configurações → Básico → Categoria
```

### Configurar Política e Termos:
```
Facebook Developer → Seu App → Configurações → Básico → URL da Política de Privacidade / URL dos Termos de Serviço
```

### Ativar OAuth:
```
Facebook Developer → Seu App → Produtos → Login do Facebook → Configurações → Configurações de Cliente OAuth
```

---

## ⚠️ Se Ainda Não Funcionar

### Verifique:
1. ✅ Todas as alterações foram **salvas** (não apenas preenchidas)
2. ✅ Aguardou **pelo menos 5 minutos** após salvar
3. ✅ **Recarregou a página** de configurações para confirmar que foi salvo
4. ✅ O app não está em **modo de manutenção** ou **desativado**

### Se o erro persistir:
1. Verifique os **logs do backend** para ver se há mais informações:
   ```bash
   ssh root@92.113.33.226
   pm2 logs biacrm-backend --lines 50 | grep -i "instagram\|error"
   ```

2. Verifique se o **modo do app** está correto:
   - **Desenvolvimento**: OK para testes
   - **Produção**: Requer que permissões sejam aprovadas

---

## 🎯 Resumo Ultra-Rápido

**Faça estas 3 coisas:**

1. ✅ **Adicione permissão `public_profile`** em Permissões e Recursos
2. ✅ **Configure categoria do app** em Configurações → Básico
3. ✅ **Preencha Política e Termos** em Configurações → Básico

**Depois:** Aguarde 5 minutos e teste novamente!

---

## 📝 Por Que Este Erro Acontece?

O Facebook requer que **todo app tenha:**
- ✅ Pelo menos **uma permissão básica** configurada (`public_profile`)
- ✅ **Categoria** definida
- ✅ **Informações básicas** preenchidas (nome, política, termos)

Sem isso, o Facebook bloqueia o app com a mensagem "supported permission".

---

## ✅ Após Resolver

Quando o erro for resolvido, você verá a tela de autorização do Facebook pedindo permissão para acessar sua conta e páginas.

Se ainda houver problemas, verifique os logs do backend para mais detalhes sobre o erro específico.





