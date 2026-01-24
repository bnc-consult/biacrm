# 🚀 Deploy - Correção Rota /forms

## ✅ Problema corrigido

A rota `/forms` estava sendo capturada por `/:integrationId` porque estava definida **depois** das rotas com parâmetros. 

**Ordem corrigida:**
1. `/pages` (linha 596)
2. `/forms` (linha 629) ✅
3. `/users` (linha 721)
4. `/:integrationId` (linha 818)

## 📋 Passos para deploy

### 1. Verificar se o arquivo foi compilado corretamente

```powershell
# Verificar se o arquivo dist existe
ls backend/dist/routes/facebook.js
```

### 2. Fazer deploy do arquivo

```powershell
# Copiar arquivo para o servidor
scp backend/dist/routes/facebook.js root@92.113.33.226:/var/www/biacrm/api/dist/routes/
```

### 3. Verificar se o arquivo foi copiado

```powershell
# Conectar ao servidor e verificar
ssh root@92.113.33.226 'ls -lh /var/www/biacrm/api/dist/routes/facebook.js'
```

### 4. Reiniciar o PM2

```powershell
# Reiniciar o backend
ssh root@92.113.33.226 'pm2 restart biacrm-backend'
```

### 5. Verificar logs para confirmar

```powershell
# Ver logs do PM2
ssh root@92.113.33.226 'pm2 logs biacrm-backend --lines 20 --nostream'
```

### 6. Testar a rota diretamente

```powershell
# Testar se a rota está funcionando (substituir TOKEN e PAGE_ID)
curl "https://biacrm.com/api/integrations/facebook/forms?access_token=TOKEN&page_id=PAGE_ID" -H "Authorization: Bearer SEU_TOKEN_AUTH"
```

## 🔍 Verificação no servidor

Após o deploy, verificar se a ordem das rotas está correta:

```bash
# Conectar ao servidor
ssh root@92.113.33.226

# Verificar ordem das rotas no arquivo compilado
grep -n "router.get" /var/www/biacrm/api/dist/routes/facebook.js | grep -E "(forms|pages|users|integrationId)"
```

**Ordem esperada:**
- `/pages` deve aparecer ANTES de `/:integrationId`
- `/forms` deve aparecer ANTES de `/:integrationId`
- `/users` deve aparecer ANTES de `/:integrationId`

## ⚠️ Se ainda não funcionar

1. **Verificar se o PM2 está usando o arquivo correto:**
   ```bash
   pm2 show biacrm-backend | grep "script path"
   ```
   Deve mostrar: `/var/www/biacrm/api/dist/index.js`

2. **Verificar se há cache:**
   ```bash
   # Limpar cache do Node.js (se houver)
   pm2 restart biacrm-backend --update-env
   ```

3. **Verificar logs em tempo real:**
   ```bash
   pm2 logs biacrm-backend --lines 50
   ```
   Depois fazer uma requisição e ver o que aparece nos logs.

4. **Verificar se a rota está registrada:**
   ```bash
   # Verificar se o Express está registrando a rota
   pm2 logs biacrm-backend | grep -i "forms\|facebook"
   ```

## ✅ Checklist

- [ ] Arquivo `backend/dist/routes/facebook.js` existe localmente
- [ ] Arquivo foi copiado para o servidor
- [ ] PM2 foi reiniciado
- [ ] Logs mostram que o servidor iniciou corretamente
- [ ] Teste da rota `/forms` retorna sucesso (não mais 404)

## 🆘 Se o problema persistir

1. Verificar se há múltiplas instâncias do PM2 rodando
2. Verificar se há algum proxy/load balancer na frente
3. Verificar se o arquivo foi realmente atualizado no servidor
4. Coletar logs completos do PM2 e enviar para análise
