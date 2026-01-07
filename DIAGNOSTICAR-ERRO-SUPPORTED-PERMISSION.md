# 🔍 Diagnosticar Erro "Supported Permission" - Instagram

## ❌ Problema

Mesmo com as permissões no código e backend reiniciado, o erro **"supported permission"** persiste.

---

## 🔍 Verificações Necessárias

### Verificação 1: Verificar Logs do Backend

O backend deve estar logando a URL OAuth completa com as permissões.

#### Como Verificar:

```bash
ssh root@92.113.33.226

# Ver logs recentes do Instagram
pm2 logs biacrm-backend --lines 100 --nostream | grep -i "instagram\|scope\|oauth"

# Ou ver logs em tempo real enquanto tenta integrar
pm2 logs biacrm-backend --lines 0 | grep -i "instagram"
```

**Procure por:**
- `Scopes: public_profile,pages_show_list`
- `OAuth URL completa:`
- `scope=public_profile,pages_show_list`

**Se NÃO aparecer:** O código não está sendo executado ou está usando versão antiga.

---

### Verificação 2: Verificar URL OAuth Gerada

A URL OAuth deve conter o parâmetro `scope` com as permissões.

#### Como Verificar:

1. **Tente integrar o Instagram novamente**
2. **Antes de clicar, copie a URL** que aparece no navegador
3. **Verifique se contém:** `scope=public_profile%2Cpages_show_list`

**Se NÃO contiver:** As permissões não estão sendo adicionadas à URL.

---

### Verificação 3: Verificar Permissões no Facebook App

As permissões precisam estar **disponíveis** no Facebook App.

#### Como Verificar:

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Produtos → Login do Facebook → Permissões e Recursos**
3. **Verifique "Permissões padrão":**
   - ✅ `public_profile` deve aparecer
   - ✅ `pages_show_list` deve aparecer

**Se não aparecerem:**
- Clique em **"+ Adicionar Permissão"**
- Adicione `public_profile`
- Adicione `pages_show_list`
- Salve

---

### Verificação 4: Verificar Código em Execução

O código pode estar sendo carregado de cache ou de outro lugar.

#### Como Verificar:

```bash
ssh root@92.113.33.226

# Verificar qual arquivo o PM2 está executando
pm2 show biacrm-backend | grep "script path"

# Verificar se há múltiplos arquivos instagram.js
find /var/www/biacrm/api -name "instagram.js" -type f

# Verificar data de modificação de todos
find /var/www/biacrm/api -name "instagram.js" -type f -exec ls -lrt {} \;
```

---

## 🔧 Soluções

### Solução 1: Limpar Cache e Reiniciar

```bash
ssh root@92.113.33.226

# Parar backend
pm2 stop biacrm-backend

# Limpar cache do Node.js (se houver)
rm -rf /var/www/biacrm/api/node_modules/.cache

# Reiniciar
pm2 start biacrm-backend --update-env

# Ou usar restart com --update-env
pm2 restart biacrm-backend --update-env
```

---

### Solução 2: Verificar se Código Está Sendo Carregado

```bash
ssh root@92.113.33.226

# Verificar qual arquivo está sendo executado
pm2 show biacrm-backend

# Verificar logs ao iniciar
pm2 logs biacrm-backend --lines 50 --nostream | head -20
```

---

### Solução 3: Adicionar Permissões Manualmente no Facebook App

Mesmo que estejam no código, podem não estar disponíveis no app:

1. **Acesse:** https://developers.facebook.com/apps → Seu App
2. **Vá em:** **Produtos → Login do Facebook → Permissões e Recursos**
3. **Clique em:** **"+ Adicionar Permissão"**
4. **Adicione:**
   - `public_profile`
   - `pages_show_list`
5. **Salve**

---

### Solução 4: Verificar URL OAuth no Código

O código pode não estar adicionando o scope à URL corretamente.

#### Verificar no código:

```bash
ssh root@92.113.33.226

# Verificar como a URL está sendo construída
grep -A 5 "scope=" /var/www/biacrm/api/routes/instagram.js | head -20
```

**Deve aparecer algo como:**
```javascript
authUrl += `&scope=${encodeURIComponent(scopes)}`;
```

---

## 📋 Checklist de Diagnóstico

- [ ] **Logs mostram** as permissões sendo usadas?
- [ ] **URL OAuth contém** `scope=public_profile,pages_show_list`?
- [ ] **Permissões estão disponíveis** no Facebook App?
- [ ] **Código foi atualizado** no servidor?
- [ ] **Backend foi reiniciado** após atualizar?
- [ ] **Não há cache** do Node.js?
- [ ] **Arquivo correto** está sendo executado?

---

## 🎯 Comandos Rápidos para Diagnóstico

```bash
# 1. Ver logs do Instagram
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 100 --nostream | grep -i "instagram\|scope"'

# 2. Verificar arquivo sendo executado
ssh root@92.113.33.226 'pm2 show biacrm-backend'

# 3. Verificar todas as instâncias do arquivo
ssh root@92.113.33.226 'find /var/www/biacrm/api -name "instagram.js" -type f -exec ls -lrt {} \;'

# 4. Verificar código da URL OAuth
ssh root@92.113.33.226 'grep -A 10 "scope=" /var/www/biacrm/api/routes/instagram.js | head -20'
```

---

## ⚠️ Possíveis Problemas

### Problema 1: Código Não Está Sendo Executado

**Sintoma:** Logs não mostram as permissões.

**Solução:** 
- Verificar qual arquivo o PM2 está executando
- Verificar se há múltiplos arquivos instagram.js
- Garantir que está enviando para o arquivo correto

### Problema 2: Permissões Não Estão na URL

**Sintoma:** URL OAuth não contém `scope=`.

**Solução:**
- Verificar código que constrói a URL
- Verificar se `scopes` não está vazio
- Verificar se está sendo adicionado à URL

### Problema 3: Permissões Não Estão Disponíveis no App

**Sintoma:** Facebook rejeita as permissões.

**Solução:**
- Adicionar permissões manualmente no Facebook App
- Verificar se app está ativo
- Verificar se Login do Facebook está configurado

---

## ✅ Próximos Passos

1. ✅ **Execute os comandos de diagnóstico** acima
2. ✅ **Verifique os logs** enquanto tenta integrar
3. ✅ **Copie a URL OAuth** gerada e verifique se contém `scope=`
4. ✅ **Verifique permissões** no Facebook App
5. ✅ **Compartilhe os resultados** para diagnóstico mais específico

---

## 🔗 Links Úteis

- [Facebook Developers](https://developers.facebook.com/apps)
- [Permissões do Facebook](https://developers.facebook.com/docs/permissions/reference)





