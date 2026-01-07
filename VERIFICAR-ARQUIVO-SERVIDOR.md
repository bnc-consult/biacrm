# 🔍 Verificar Arquivo no Servidor

## ❌ Problema

Mesmo após enviar o arquivo, os logs ainda mostram `Scopes: (nenhum)`.

---

## ✅ Verificações Necessárias

### Verificação 1: Arquivo Foi Atualizado?

```bash
ssh root@92.113.33.226
ls -lrt /var/www/biacrm/api/dist/routes/instagram.js
```

**Deve mostrar data recente** (agora, não Dec 18).

---

### Verificação 2: Arquivo Contém as Permissões?

```bash
ssh root@92.113.33.226

# Verificar public_profile
grep public_profile /var/www/biacrm/api/dist/routes/instagram.js

# Verificar pages_show_list
grep pages_show_list /var/www/biacrm/api/dist/routes/instagram.js
```

**Deve aparecer:**
```
'public_profile', // Perfil público do usuário (sempre válida)
'pages_show_list' // Listar páginas do Facebook (necessária para Instagram Business)
```

---

### Verificação 3: Código que Define Scopes

```bash
ssh root@92.113.33.226
grep -B 2 -A 5 "const scopes" /var/www/biacrm/api/dist/routes/instagram.js | head -10
```

**Deve aparecer:**
```javascript
const scopes = [
    'public_profile',
    'pages_show_list'
].join(',');
```

**NÃO deve aparecer:**
```javascript
const scopes = ''; // ou const scopes: string = '';
```

---

### Verificação 4: Limpar Cache e Reiniciar

Se o arquivo está correto mas ainda não funciona, pode ser cache:

```bash
ssh root@92.113.33.226

# Parar backend
pm2 stop biacrm-backend

# Limpar cache do Node.js (se houver)
rm -rf /var/www/biacrm/api/node_modules/.cache

# Reiniciar
pm2 start biacrm-backend --update-env

# Ou usar restart
pm2 restart biacrm-backend --update-env
```

---

### Verificação 5: Verificar Qual Arquivo Está Sendo Executado

```bash
ssh root@92.113.33.226

# Verificar processo
ps aux | grep node | grep biacrm

# Verificar arquivos abertos pelo processo
lsof -p $(pgrep -f "biacrm-backend") | grep instagram.js
```

---

## 🔧 Se Arquivo Não Tem as Permissões

### Opção 1: Enviar Novamente

```bash
# No seu computador
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js

# Verificar se foi enviado
ssh root@92.113.33.226 'ls -lrt /var/www/biacrm/api/dist/routes/instagram.js'
```

### Opção 2: Verificar Se Há Múltiplos Arquivos

```bash
ssh root@92.113.33.226
find /var/www/biacrm/api -name "instagram.js" -type f -exec ls -lrt {} \;
```

Pode haver múltiplos arquivos e o PM2 pode estar usando outro.

---

## 📋 Checklist

- [ ] Arquivo foi enviado para `/var/www/biacrm/api/dist/routes/instagram.js`
- [ ] Data de modificação está atualizada (verificar com `ls -lrt`)
- [ ] Arquivo contém `public_profile`
- [ ] Arquivo contém `pages_show_list`
- [ ] Código mostra `const scopes = ['public_profile', 'pages_show_list'].join(',')`
- [ ] Backend foi reiniciado
- [ ] Cache foi limpo (se necessário)
- [ ] Logs mostram `Scopes: public_profile,pages_show_list`

---

## 🎯 Comandos Rápidos

```bash
# 1. Verificar arquivo
ssh root@92.113.33.226 'ls -lrt /var/www/biacrm/api/dist/routes/instagram.js && grep public_profile /var/www/biacrm/api/dist/routes/instagram.js'

# 2. Se não tiver, enviar novamente
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js

# 3. Reiniciar com limpeza de cache
ssh root@92.113.33.226 'pm2 stop biacrm-backend && pm2 start biacrm-backend --update-env'

# 4. Verificar logs
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 30 --nostream | grep -i scope'
```

---

## ⚠️ Se Ainda Não Funcionar

1. **Verifique se há múltiplos arquivos** instagram.js
2. **Verifique qual arquivo o processo está usando** com `lsof`
3. **Limpe todo o cache** e reinicie
4. **Verifique se o código TypeScript foi compilado corretamente** antes de enviar





