# 🚀 Deploy - Suporte a Instagram Pessoal

## 📋 Arquivos Modificados

- ✅ `backend/src/routes/instagram.ts` - Suporte a contas pessoais
- ✅ `frontend/src/pages/Integrations.tsx` - Tratamento de contas pessoais

## 🔧 Comandos de Deploy

### 1. Deploy do Backend (Instagram)

```powershell
# Deploy do arquivo instagram.js atualizado
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js
```

### 2. Deploy do Frontend

```powershell
# Deploy de todos os arquivos do frontend
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### 3. Reiniciar Backend no Servidor

```powershell
# Reiniciar PM2 com atualização de variáveis de ambiente
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

## 📝 Comandos Completos (Copiar e Colar)

### Windows PowerShell (Execute um por vez)

```powershell
# 1. Deploy Backend
scp backend/dist/routes/instagram.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/instagram.js

# 2. Deploy Frontend
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/

# 3. Reiniciar Backend
ssh root@92.113.33.226 'pm2 restart biacrm-backend --update-env'
```

## ✅ Verificação Pós-Deploy

### Verificar se o arquivo foi atualizado no servidor:

```powershell
ssh root@92.113.33.226 'grep -A 5 "is_personal" /var/www/biacrm/api/dist/routes/instagram.js | head -10'
```

### Verificar logs do backend:

```powershell
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 20 --nostream'
```

### Verificar se o backend está rodando:

```powershell
ssh root@92.113.33.226 'pm2 status'
```

## 🧪 Teste Após Deploy

1. Acesse: `https://biacrm.com/entrada-saida`
2. Vá em **Integrações** → **Instagram**
3. Clique em **"Conectar Instagram"**
4. Informe apenas o **username** do Instagram (sem senha)
5. Clique em **"Conectar"**
6. Autorize com Facebook quando solicitado
7. ✅ A integração será criada automaticamente (mesmo para contas pessoais)

## 🔍 O que foi implementado?

- ✅ Suporte a contas Instagram **pessoais** (sem necessidade de Business)
- ✅ Criação automática de integração quando não há contas Business
- ✅ Uso do username informado para criar integração pessoal
- ✅ Tratamento adequado no frontend para contas pessoais
- ✅ Mensagens informativas sobre contas pessoais vs Business

## ⚠️ Notas Importantes

- O sistema tentará primeiro encontrar contas Business conectadas às páginas do Facebook
- Se não encontrar, criará automaticamente uma integração pessoal
- Contas pessoais têm limitações em relação às Business (não podem publicar via API, etc.)
- O título da integração mostrará se é "Business" ou "Pessoal"

## 🆘 Em caso de problemas

Se algo não funcionar após o deploy:

1. Verifique os logs: `ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 50'`
2. Verifique se o arquivo foi atualizado: `ssh root@92.113.33.226 'ls -lrt /var/www/biacrm/api/dist/routes/instagram.js'`
3. Reinicie o backend novamente: `ssh root@92.113.33.226 'pm2 restart biacrm-backend'`
4. Limpe o cache do navegador e teste novamente





