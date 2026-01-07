# 🔧 Resolver Erro "Aplicativo Inativo" - Facebook

## ❌ Erro Atual

Você está vendo o erro:
> **"Aplicativo inativo - Este aplicativo não está acessível no momento e o desenvolvedor do aplicativo já está ciente do problema."**

**Causa:** O Facebook App está em **modo de desenvolvimento** e só permite acesso para **usuários testadores** configurados.

---

## ✅ Solução: Adicionar Usuários como Testadores

### Opção 1: Adicionar Usuários Específicos como Testadores (Recomendado)

Esta é a melhor opção para desenvolvimento e testes.

#### Passo a Passo:

1. **Acesse:** https://developers.facebook.com/apps
2. **Selecione seu app**
3. **Vá em:** **Funções do app** → **Funções** → **Testadores** (ou **App Roles** → **Roles** → **Testers**)
4. **Clique em:** **"+ Adicionar Testadores"** ou **"+ Add Testers"**
5. **Adicione os usuários:**
   - Digite o **email** ou **nome do Facebook** do usuário
   - Ou use o **ID do Facebook** do usuário
   - Você pode adicionar múltiplos usuários
6. **Clique em:** **"Adicionar"** ou **"Add"**
7. **Os usuários receberão um convite** para aceitar o acesso ao app

#### Como Encontrar o ID do Facebook do Usuário:

1. Peça ao usuário para acessar: https://www.facebook.com/help/contact/571927962448890
2. Ou use ferramentas online para encontrar o ID do Facebook pelo nome/perfil

---

### Opção 2: Adicionar Usuários como Administradores/Desenvolvedores

Se você quiser dar acesso completo ao app:

1. **Acesse:** https://developers.facebook.com/apps
2. **Selecione seu app**
3. **Vá em:** **Funções do app** → **Funções** → **Administradores** (ou **App Roles** → **Roles** → **Administrators**)
4. **Clique em:** **"+ Adicionar"** ou **"+ Add"**
5. **Adicione o email do usuário**
6. **Selecione a função:** **Administrador** ou **Desenvolvedor**
7. **Clique em:** **"Adicionar"**

---

### Opção 3: Mudar App para Modo Produção (Avançado)

⚠️ **ATENÇÃO:** Só faça isso se:
- Todas as permissões necessárias foram aprovadas pelo Facebook
- Política de Privacidade e Termos de Serviço estão configurados
- Você está pronto para uso público

#### Passo a Passo:

1. **Acesse:** https://developers.facebook.com/apps
2. **Selecione seu app**
3. **Vá em:** **Configurações** → **Básico**
4. **Role até:** **"Modo do App"** (App Mode)
5. **Clique em:** **"Mudar para Produção"** ou **"Switch to Production"**
6. **Confirme a mudança**

⚠️ **IMPORTANTE:** 
- Em produção, o app fica disponível para todos
- Mas algumas permissões podem precisar de revisão do Facebook
- Certifique-se de que tudo está configurado antes de mudar

---

## 📋 Checklist para Adicionar Testadores

- [ ] Acessou **Funções do app** → **Testadores**
- [ ] Adicionou email ou ID do Facebook do usuário
- [ ] Usuário recebeu e aceitou o convite
- [ ] Aguardou alguns minutos após adicionar
- [ ] Testou novamente a integração

---

## 🔍 Como Verificar Usuários Testadores

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Funções do app** → **Funções** → **Testadores**
3. **Verifique a lista** de usuários adicionados
4. **Status deve ser:** "Ativo" ou "Active"

---

## ⚠️ Erros Comuns

### Erro: "Usuário não encontrado"
- **Causa**: Email ou ID incorreto
- **Solução**: Verifique o email ou peça o ID do Facebook do usuário

### Erro: "Convite não aceito"
- **Causa**: Usuário não aceitou o convite
- **Solução**: 
  1. Verifique se o usuário recebeu o convite
  2. Peça para aceitar em: https://www.facebook.com/settings?tab=business_tools
  3. Ou reenvie o convite

### Erro: "Aplicativo inativo" persiste após adicionar
- **Causa**: Usuário não aceitou o convite ou app ainda em desenvolvimento
- **Solução**: 
  1. Verifique se o usuário aceitou o convite
  2. Aguarde alguns minutos após aceitar
  3. Se necessário, mude o app para produção (se estiver pronto)

---

## 🎯 Resumo Rápido

**Para adicionar um novo usuário:**

1. ✅ **Acesse:** Funções do app → Testadores
2. ✅ **Adicione** email ou ID do Facebook
3. ✅ **Usuário aceita** o convite
4. ✅ **Aguarde** alguns minutos
5. ✅ **Teste** a integração

---

## 📝 Notas Importantes

- **Modo Desenvolvimento:** Apenas testadores podem usar o app
- **Modo Produção:** Todos podem usar o app (mas requer aprovação de permissões)
- **Testadores:** Podem usar o app sem restrições em modo desenvolvimento
- **Convites:** Usuários precisam aceitar o convite antes de usar

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Gerenciar Testadores](https://developers.facebook.com/docs/apps/manage-app-details/app-roles)
- [Mudar para Produção](https://developers.facebook.com/docs/apps/manage-app-details/app-mode)

---

## ✅ Próximos Passos

1. ✅ Adicione os usuários como testadores
2. ✅ Aguarde eles aceitarem o convite
3. ✅ Teste a integração novamente
4. ✅ Se precisar acesso público, considere mudar para produção (após aprovação de permissões)





