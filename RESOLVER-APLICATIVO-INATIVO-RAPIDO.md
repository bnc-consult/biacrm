# ⚡ Resolver "Aplicativo Inativo" - Solução Rápida

## ❌ Problema

Erro: **"Aplicativo inativo - Este aplicativo não está acessível no momento"**

**Causa:** O Facebook App está em **modo de desenvolvimento** e só permite **usuários testadores**.

---

## ✅ Solução Rápida (2 minutos)

### Passo 1: Adicionar Usuário como Testador

1. **Acesse:** https://developers.facebook.com/apps
2. **Selecione seu app**
3. **Vá em:** **Funções do app** → **Funções** → **Testadores**
   - Ou procure por: **App Roles** → **Roles** → **Testers**
4. **Clique em:** **"+ Adicionar Testadores"** ou **"+ Add Testers"**
5. **Adicione:**
   - Digite o **email do Facebook** do usuário
   - Ou o **nome completo** do perfil do Facebook
   - Ou o **ID do Facebook** do usuário
6. **Clique em:** **"Adicionar"**

### Passo 2: Usuário Aceita o Convite

1. **O usuário recebe uma notificação** no Facebook
2. **Ou acessa:** https://www.facebook.com/settings?tab=business_tools
3. **Aceita o convite** do app
4. **Aguarda 2-3 minutos**
5. **Testa novamente** a integração

---

## 🔍 Como Encontrar o Email/ID do Usuário

### Opção 1: Pedir ao Usuário
- Peça o **email do Facebook** dele
- Ou peça para acessar: https://www.facebook.com/help/contact/571927962448890 (mostra o ID)

### Opção 2: Usar Nome do Perfil
- Se você souber o nome completo do perfil do Facebook, pode tentar adicionar pelo nome
- O Facebook pode sugerir o perfil correto

---

## ⚠️ Alternativa: Mudar para Produção

Se você quiser que **todos** possam usar (sem adicionar testadores):

⚠️ **ATENÇÃO:** Só faça isso se:
- Todas as permissões necessárias foram aprovadas
- Política de Privacidade e Termos estão configurados
- Você está pronto para uso público

### Como Mudar:

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Configurações** → **Básico**
3. **Role até:** **"Modo do App"**
4. **Clique em:** **"Mudar para Produção"**
5. **Confirme**

---

## 📋 Checklist Rápido

- [ ] Acessou **Funções do app** → **Testadores**
- [ ] Adicionou email/ID do usuário
- [ ] Usuário recebeu o convite
- [ ] Usuário aceitou o convite
- [ ] Aguardou 2-3 minutos após aceitar
- [ ] Testou a integração novamente

---

## 🎯 Resumo Ultra-Rápido

**Para adicionar um novo usuário:**

1. ✅ **Funções do app** → **Testadores** → **"+ Adicionar Testadores"**
2. ✅ **Digite email** ou **ID do Facebook** do usuário
3. ✅ **Usuário aceita** o convite
4. ✅ **Aguarda** alguns minutos
5. ✅ **Testa** novamente

**Tempo total:** ~5 minutos (incluindo aceitar convite)

---

## 📝 Por Que Isso Acontece?

- **Modo Desenvolvimento:** Apenas testadores podem usar
- **Modo Produção:** Todos podem usar (mas requer aprovação de permissões)
- **Você funciona:** Porque você é testador/administrador do app
- **Outros não funcionam:** Porque não são testadores

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Gerenciar Testadores](https://www.facebook.com/settings?tab=business_tools)

---

## ✅ Após Adicionar

1. ✅ Usuário recebe notificação
2. ✅ Usuário aceita convite
3. ✅ Aguarda 2-3 minutos
4. ✅ Testa integração
5. ✅ Deve funcionar!





