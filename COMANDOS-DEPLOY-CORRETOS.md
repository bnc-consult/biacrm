# 📦 Comandos Corretos para Deploy

## 📁 Estrutura de Diretórios

### Local (Desenvolvimento):
```
backend/dist/
  ├── routes/
  │   ├── instagram.js
  │   ├── facebook.js
  │   └── ...
  ├── index.js
  └── ...
```

### Servidor (Produção):
```
/var/www/biacrm/api/
  ├── dist/
  │   ├── routes/
  │   │   ├── instagram.js
  │   │   ├── facebook.js
  │   │   └── ...
  │   ├── index.js
  │   └── ...
  ├── .env
  └── ...
```

---

## ✅ Comandos Corretos para Deploy

### Opção 1: Deploy Completo (Recomendado)

Este comando preserva a estrutura de diretórios:

```bash
# Enviar todo o conteúdo de backend/dist/ para /var/www/biacrm/api/
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/
```

**Isso vai:**
- Enviar `backend/dist/routes/instagram.js` → `/var/www/biacrm/api/dist/routes/instagram.js`
- Enviar `backend/dist/index.js` → `/var/www/biacrm/api/dist/index.js`
- Preservar toda a estrutura de diretórios

---

### Opção 2: Deploy Apenas do Instagram (Rápido)

Se você só quer atualizar o arquivo do Instagram:

```bash
# Enviar apenas o arquivo instagram.js
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
```

---

### Opção 3: Deploy com Verificação

Deploy com verificação se o diretório existe:

```bash
# Criar diretório se não existir e enviar arquivos
ssh root@92.113.33.226 'mkdir -p /var/www/biacrm/api/dist/routes'
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/facebook.js
```

---

## 🔍 Verificar se Deploy Foi Feito Corretamente

Após fazer o deploy, verifique:

```bash
ssh root@92.113.33.226

# Verificar se arquivo existe
ls -la /var/www/biacrm/api/dist/routes/instagram.js

# Verificar conteúdo (deve conter public_profile e pages_show_list)
grep -n "public_profile.*pages_show_list" /var/www/biacrm/api/dist/routes/instagram.js
```

**Se aparecer as permissões:** ✅ Deploy foi feito corretamente!

**Se não aparecer:** ❌ Deploy não foi feito ou arquivo está no lugar errado.

---

## 📋 Sequência Completa de Deploy

### 1. Gerar Build (se ainda não fez)

```bash
cd backend
npm run build
cd ..
```

### 2. Enviar Arquivos para Servidor

```bash
# Opção A: Deploy completo (recomendado)
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/

# Opção B: Apenas Instagram (mais rápido)
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
```

### 3. Verificar se Arquivo Foi Enviado

```bash
ssh root@92.113.33.226
grep "public_profile.*pages_show_list" /var/www/biacrm/api/dist/routes/instagram.js
```

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

## ⚠️ Problemas Comuns

### Problema: Arquivo não encontrado no servidor

**Solução:**
```bash
# Verificar estrutura de diretórios no servidor
ssh root@92.113.33.226
ls -la /var/www/biacrm/api/
ls -la /var/www/biacrm/api/dist/
ls -la /var/www/biacrm/api/dist/routes/
```

### Problema: Permissões não aparecem no código

**Solução:**
1. Verifique se o build foi feito corretamente:
   ```bash
   grep "public_profile.*pages_show_list" backend/dist/routes/instagram.js
   ```

2. Se aparecer localmente, faça o deploy novamente:
   ```bash
   scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
   ```

### Problema: Estrutura de diretórios diferente

**Solução:**
Se o servidor tem estrutura diferente, ajuste o caminho:
```bash
# Verificar estrutura real no servidor
ssh root@92.113.33.226
find /var/www/biacrm/api -name "instagram.js" -type f
```

---

## 🎯 Comando Rápido (Tudo em Um)

```bash
# Gerar build, fazer deploy e reiniciar
cd backend && npm run build && cd .. && \
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js && \
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

---

## ✅ Checklist

- [ ] Build foi gerado (`backend/dist/routes/instagram.js` existe localmente)
- [ ] Arquivo foi enviado para servidor
- [ ] Arquivo existe em `/var/www/biacrm/api/dist/routes/instagram.js`
- [ ] Arquivo contém `public_profile` e `pages_show_list`
- [ ] Backend foi reiniciado
- [ ] Logs mostram as permissões sendo usadas

---

## 📝 Nota Importante

O comando `scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/` **deve funcionar** porque:
- `backend/dist/*` inclui todos os arquivos e diretórios dentro de `dist/`
- O `-r` (recursivo) preserva a estrutura
- Os arquivos vão para `/var/www/biacrm/api/dist/routes/` automaticamente

Se não funcionar, use o comando específico:
```bash
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
```





