# 🔍 Verificar Deploy e Configuração do Instagram

## ❌ Erro Persistente

O erro **"supported permission"** ainda aparece após a correção.

---

## ✅ Verificações Necessárias

### Verificação 1: Deploy Foi Feito?

O código corrigido precisa estar no servidor.

#### Como Verificar:

```bash
ssh root@92.113.33.226

# Verificar código compilado
grep -n "public_profile.*pages_show_list" /var/www/biacrm/api/dist/routes/instagram.js
```

**Deve aparecer:** As permissões `public_profile` e `pages_show_list` no código.

**Se não aparecer:** O deploy não foi feito ou o código não foi compilado corretamente.

---

### Verificação 2: Backend Foi Reiniciado?

O backend precisa ser reiniciado para carregar o novo código.

#### Como Verificar:

```bash
ssh root@92.113.33.226

# Verificar quando foi reiniciado
pm2 list
pm2 info biacrm-backend

# Verificar logs recentes
pm2 logs biacrm-backend --lines 20 --nostream | grep -i "instagram\|scope\|permission"
```

**Deve aparecer:** Logs mostrando as permissões sendo usadas.

---

### Verificação 3: Permissões Estão no Facebook App?

As permissões precisam estar disponíveis no Facebook App.

#### Como Verificar:

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Produtos → Login do Facebook → Permissões e Recursos**
3. **Verifique "Permissões padrão":**
   - ✅ `public_profile` deve estar disponível
   - ✅ `pages_show_list` deve estar disponível

**Se não aparecerem:**
- Adicione manualmente em **"+ Adicionar Permissão"**
- Ou certifique-se de que o Login do Facebook está totalmente configurado

---

### Verificação 4: App Está Ativo?

O app precisa estar ativo e configurado.

#### Como Verificar:

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Configurações → Básico**
3. **Verifique:**
   - ✅ Status: **"Ativo"**
   - ✅ Categoria: Selecionada
   - ✅ Nome de exibição: Preenchido
   - ✅ Política de Privacidade: Configurada
   - ✅ Termos de Serviço: Configurados

---

## 🔧 Solução Passo a Passo

### Passo 1: Fazer Deploy (Se Não Foi Feito)

```bash
# No seu computador local
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### Passo 2: Reiniciar Backend

```bash
ssh root@92.113.33.226
pm2 restart biacrm-backend --update-env
```

### Passo 3: Verificar Logs

```bash
pm2 logs biacrm-backend --lines 50 | grep -i "instagram\|scope"
```

Procure por:
```
Scopes: public_profile,pages_show_list
```

### Passo 4: Verificar Permissões no Facebook App

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Produtos → Login do Facebook → Permissões e Recursos**
3. **Verifique se aparecem:**
   - `public_profile`
   - `pages_show_list`

4. **Se não aparecerem:**
   - Clique em **"+ Adicionar Permissão"**
   - Adicione `public_profile`
   - Adicione `pages_show_list`
   - Salve

### Passo 5: Testar Novamente

1. Aguarde 2-3 minutos após reiniciar
2. Tente integrar o Instagram novamente
3. O Facebook deve solicitar as permissões `public_profile` e `pages_show_list`

---

## 📋 Checklist Completo

- [ ] **Deploy foi feito** (código atualizado no servidor)
- [ ] **Backend foi reiniciado** com `--update-env`
- [ ] **Logs mostram** as permissões sendo usadas
- [ ] **Permissões no Facebook App:**
  - [ ] `public_profile` está disponível
  - [ ] `pages_show_list` está disponível
- [ ] **App está ativo** e configurado
- [ ] **Aguardou 2-3 minutos** após reiniciar
- [ ] **Testou novamente** a integração

---

## 🎯 Comandos Rápidos

**Verificar se deploy foi feito:**
```bash
ssh root@92.113.33.226
grep "public_profile.*pages_show_list" /var/www/biacrm/api/dist/routes/instagram.js
```

**Se não aparecer, fazer deploy:**
```bash
# No seu computador
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

**Verificar logs:**
```bash
ssh root@92.113.33.226
pm2 logs biacrm-backend --lines 30 | grep -i "instagram\|scope"
```

---

## ⚠️ Se Ainda Não Funcionar

1. **Verifique se o usuário é testador** (se app está em desenvolvimento)
2. **Verifique se o usuário aceitou** as permissões quando solicitadas
3. **Limpe o cache do navegador** e tente novamente
4. **Verifique os logs** para ver se há outros erros

---

## ✅ Resumo

**O mais provável é que:**
1. O deploy não foi feito ainda, OU
2. O backend não foi reiniciado, OU
3. As permissões não estão disponíveis no Facebook App

**Execute os comandos acima para verificar e corrigir!**





