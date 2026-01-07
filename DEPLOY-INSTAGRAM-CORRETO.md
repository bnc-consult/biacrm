# 📦 Deploy Correto do Instagram.js

## 🔍 Análise dos Arquivos no Servidor

Foram encontrados 3 arquivos `instagram.js`:

1. `/domains/biacrm.com/public_html/routes/instagram.js` (43051 bytes, Dec 26)
   - ❌ Este é do frontend (não é usado pelo backend)

2. `/var/www/biacrm/api/dist/routes/instagram.js` (38945 bytes, Dec 18)
   - ⚠️ Arquivo antigo (não está sendo usado)

3. `/var/www/biacrm/api/routes/instagram.js` (43051 bytes, Dec 26)
   - ✅ **Este é o arquivo correto que o backend está usando!**

---

## ✅ Comando Correto para Deploy

O backend está usando `/var/www/biacrm/api/routes/instagram.js` (sem `dist/`).

### Comando:

```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/routes/instagram.js
```

---

## 📋 Sequência Completa de Deploy

### 1. Gerar Build (se necessário)

```bash
cd backend
npm run build
cd ..
```

### 2. Enviar Arquivo para o Caminho Correto

```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/routes/instagram.js
```

### 3. Verificar se Arquivo Foi Atualizado

```bash
ssh root@92.113.33.226

# Verificar data de modificação (deve ser recente)
ls -lrt /var/www/biacrm/api/routes/instagram.js

# Verificar se contém as permissões corretas
grep "public_profile.*pages_show_list" /var/www/biacrm/api/routes/instagram.js
```

**Deve aparecer:** As permissões `public_profile` e `pages_show_list`

### 4. Reiniciar Backend

```bash
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

### 5. Verificar Logs

```bash
ssh root@92.113.33.226
pm2 logs biacrm-backend --lines 30 | grep -i "instagram\|scope"
```

---

## 🔍 Verificar Qual Arquivo o Backend Está Usando

Para confirmar qual arquivo o backend está realmente usando:

```bash
ssh root@92.113.33.226

# Verificar processo do PM2
pm2 info biacrm-backend

# Verificar arquivo que está sendo executado
lsof -p $(pgrep -f "biacrm-backend") | grep instagram.js

# Ou verificar logs para ver caminho
pm2 logs biacrm-backend --lines 100 | grep -i "instagram\|routes"
```

---

## ⚠️ Importante

O backend parece estar usando `/var/www/biacrm/api/routes/instagram.js` (sem `dist/`), não `/var/www/biacrm/api/dist/routes/instagram.js`.

**Sempre envie para:** `/var/www/biacrm/api/routes/instagram.js`

---

## 🎯 Comando Rápido (Tudo em Um)

```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/routes/instagram.js && \
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

---

## ✅ Checklist

- [ ] Build foi gerado (`backend/dist/routes/instagram.js` existe localmente)
- [ ] Arquivo foi enviado para `/var/www/biacrm/api/routes/instagram.js`
- [ ] Data de modificação está atualizada (verificar com `ls -lrt`)
- [ ] Arquivo contém `public_profile` e `pages_show_list`
- [ ] Backend foi reiniciado
- [ ] Logs mostram as permissões sendo usadas

---

## 📝 Nota

Se o backend estiver configurado para usar `/var/www/biacrm/api/dist/routes/`, você pode:

1. **Opção A:** Enviar para ambos os locais:
   ```bash
   scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/routes/instagram.js
   scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
   ```

2. **Opção B:** Verificar configuração do PM2 para ver qual caminho está sendo usado

---

## 🔗 Verificar Configuração do PM2

```bash
ssh root@92.113.33.226
pm2 show biacrm-backend
cat ~/.pm2/dump.pm2 | grep -A 10 "biacrm-backend"
```

Isso mostrará qual arquivo o PM2 está executando.





