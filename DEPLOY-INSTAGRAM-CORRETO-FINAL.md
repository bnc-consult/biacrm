# 📦 Deploy Correto do Instagram.js - SOLUÇÃO FINAL

## ❌ Problema Identificado

O PM2 está executando `/var/www/biacrm/api/dist/index.js`, então o código usado está em:
- ✅ **Correto:** `/var/www/biacrm/api/dist/routes/instagram.js`
- ❌ **Errado:** `/var/www/biacrm/api/routes/instagram.js` (este não é usado!)

---

## ✅ Comando Correto para Deploy

### Enviar para o Arquivo Correto:

```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
```

---

## 📋 Sequência Completa Correta

### 1. Gerar Build (se necessário)

```bash
cd backend
npm run build
cd ..
```

### 2. Enviar para o Arquivo Correto

```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
```

### 3. Verificar se Arquivo Foi Atualizado

```bash
ssh root@92.113.33.226

# Verificar data de modificação (deve ser recente)
ls -lrt /var/www/biacrm/api/dist/routes/instagram.js

# Verificar se contém as permissões
grep public_profile /var/www/biacrm/api/dist/routes/instagram.js
grep pages_show_list /var/www/biacrm/api/dist/routes/instagram.js
```

### 4. Reiniciar Backend

```bash
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

### 5. Verificar Logs

```bash
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 50 --nostream | grep -i "instagram\|scope" | tail -20'
```

**Procure por:**
- `Scopes: public_profile,pages_show_list`
- URL OAuth deve conter `&scope=public_profile%2Cpages_show_list`

---

## 🔍 Verificar Estrutura no Servidor

Para confirmar qual arquivo está sendo usado:

```bash
ssh root@92.113.33.226

# Verificar qual arquivo o PM2 está executando
pm2 show biacrm-backend | grep "script path"

# Verificar todos os arquivos instagram.js
find /var/www/biacrm/api -name "instagram.js" -type f -exec ls -lrt {} \;

# Verificar qual está sendo importado pelo index.js
grep -r "instagram" /var/www/biacrm/api/dist/index.js
```

---

## ⚠️ Importante

**O PM2 executa:** `/var/www/biacrm/api/dist/index.js`

**Que importa de:** `/var/www/biacrm/api/dist/routes/instagram.js`

**NÃO de:** `/var/www/biacrm/api/routes/instagram.js`

---

## 🎯 Comando Rápido (Tudo em Um)

```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js && \
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

---

## ✅ Checklist

- [ ] Build foi gerado (`backend/dist/routes/instagram.js` existe localmente)
- [ ] Arquivo foi enviado para `/var/www/biacrm/api/dist/routes/instagram.js` (COM dist/)
- [ ] Data de modificação está atualizada
- [ ] Arquivo contém `public_profile` e `pages_show_list`
- [ ] Backend foi reiniciado
- [ ] Logs mostram `Scopes: public_profile,pages_show_list`
- [ ] URL OAuth contém `&scope=public_profile%2Cpages_show_list`

---

## 📝 Nota Final

**Sempre envie para:** `/var/www/biacrm/api/dist/routes/instagram.js`

**NÃO para:** `/var/www/biacrm/api/routes/instagram.js`

O PM2 executa o código de `dist/`, não de `routes/`!





