# 🚀 Deploy Final - Correção Permissões Facebook

## ✅ Código corrigido

O arquivo `backend/dist/routes/facebook.js` está correto com apenas:
- `public_profile`
- `pages_show_list`

**Sem** as permissões inválidas (`pages_read_engagement`, `leads_retrieval`).

## 📋 Passos para deploy

### 1. Copiar arquivo para o servidor

```powershell
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/
```

### 2. Verificar se foi copiado corretamente

```bash
ssh root@92.113.33.226 "grep -A 3 'const scopes' /var/www/biacrm/api/dist/routes/facebook.js | head -5"
```

**Deve mostrar apenas:**
- `public_profile`
- `pages_show_list`

**NÃO deve mostrar:**
- `pages_read_engagement`
- `leads_retrieval`

### 3. Reiniciar PM2

```bash
ssh root@92.113.33.226 "pm2 restart biacrm-backend"
```

### 4. Verificar se iniciou sem erros

```bash
ssh root@92.113.33.226 "pm2 status"
ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 10 --nostream"
```

### 5. Testar novamente

1. **Limpar cache do navegador** (Ctrl + Shift + Delete)
2. **Fazer hard refresh** (Ctrl + F5)
3. **Desconectar integração atual do Facebook** (se houver)
4. **Conectar Facebook novamente**
5. **Autorizar** (agora deve aceitar sem erro de escopos inválidos)
6. **Selecionar página** e verificar se os formulários aparecem

## ⚠️ Importante

Após o deploy, você precisa **reconectar o Facebook** porque:
- O código antigo gerou um token com escopos inválidos
- O novo código vai gerar um token correto
- Mas o token antigo ainda está sendo usado

## 🔍 Se ainda não funcionar

Verifique se a página tem formulários cadastrados:
- Acesse: https://www.facebook.com/[SUA_PAGINA]/forms
- Se não houver formulários, crie um primeiro

## ✅ Checklist

- [ ] Arquivo `facebook.js` copiado para servidor
- [ ] Verificado que não tem permissões inválidas no servidor
- [ ] PM2 reiniciado
- [ ] Servidor iniciou sem erros
- [ ] Cache do navegador limpo
- [ ] Facebook desconectado e reconectado
- [ ] Testado selecionar página e ver formulários
