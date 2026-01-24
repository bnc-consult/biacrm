# 🔧 Corrigir Erro 502 (Bad Gateway)

## Diagnóstico

O erro 502 indica que o servidor backend não está respondendo. Isso pode acontecer após um deploy se:
1. O código tem erro de sintaxe
2. O PM2 não reiniciou corretamente
3. O servidor está com erro e não está rodando

## Passos para corrigir

### 1. Verificar status do PM2

```bash
ssh root@92.113.33.226 "pm2 status"
```

**Se mostrar `errored` ou `stopped`:**
- O servidor não está rodando
- Precisa verificar os logs de erro

### 2. Verificar logs de erro

```bash
ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 50 --err"
```

**Procure por:**
- Erros de sintaxe
- Erros de importação
- Erros de módulos não encontrados

### 3. Tentar reiniciar o PM2

```bash
ssh root@92.113.33.226 "pm2 restart biacrm-backend"
```

**Se não funcionar, tente:**
```bash
ssh root@92.113.33.226 "pm2 delete biacrm-backend && pm2 start /var/www/biacrm/api/dist/index.js --name biacrm-backend"
```

### 4. Verificar se o arquivo foi deployado corretamente

```bash
ssh root@92.113.33.226 "ls -lh /var/www/biacrm/api/dist/routes/facebook.js"
```

**Verifique:**
- Data de modificação (deve ser recente)
- Tamanho do arquivo (deve ser ~50KB)

### 5. Verificar sintaxe do arquivo

```bash
ssh root@92.113.33.226 "node -c /var/www/biacrm/api/dist/routes/facebook.js"
```

**Se mostrar erro:**
- O arquivo tem erro de sintaxe
- Precisa fazer deploy novamente

### 6. Se ainda não funcionar

Verifique se há algum problema no código local antes de fazer deploy:

```powershell
cd backend
npm run build
```

**Se o build falhar:**
- Corrija os erros antes de fazer deploy

## Solução rápida

Execute estes comandos em sequência:

```bash
# 1. Verificar status
ssh root@92.113.33.226 "pm2 status"

# 2. Ver logs de erro
ssh root@92.113.33.226 "pm2 logs biacrm-backend --lines 30 --err"

# 3. Reiniciar
ssh root@92.113.33.226 "pm2 restart biacrm-backend"

# 4. Verificar se iniciou
ssh root@92.113.33.226 "pm2 status"
```

Se ainda não funcionar, me envie os logs de erro para eu ajudar a identificar o problema.
