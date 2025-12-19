# 🔄 Comandos para Reiniciar Backend em Produção

## 🚀 Comando Principal

```bash
pm2 restart biacrm-backend
```

## 📋 Outros Comandos Úteis

### Ver Status do Backend
```bash
pm2 status biacrm-backend
# ou
pm2 list
```

### Reiniciar com Atualização de Variáveis de Ambiente
```bash
pm2 restart biacrm-backend --update-env
```
**Use este quando alterar o arquivo `.env`** para garantir que as novas variáveis sejam carregadas.

### Ver Logs do Backend
```bash
# Logs em tempo real
pm2 logs biacrm-backend

# Últimas 50 linhas
pm2 logs biacrm-backend --lines 50

# Apenas erros
pm2 logs biacrm-backend --err

# Últimas linhas sem streaming
pm2 logs biacrm-backend --lines 20 --nostream
```

### Parar e Iniciar (ao invés de reiniciar)
```bash
# Parar
pm2 stop biacrm-backend

# Iniciar
pm2 start biacrm-backend
```

### Reiniciar Todos os Processos PM2
```bash
pm2 restart all
```

### Recarregar (Zero Downtime)
```bash
pm2 reload biacrm-backend
```
**Melhor opção** - Atualiza sem interromper requisições em andamento.

## 🔍 Verificar se Está Funcionando

### Testar Health Check
```bash
curl http://localhost:3000/health
```

### Ver Informações Detalhadas
```bash
pm2 show biacrm-backend
```

### Verificar Porta 3000
```bash
netstat -tulpn | grep :3000
# ou
ss -tulpn | grep :3000
```

## 📝 Sequência Completa de Atualização

Se você fez alterações no código e precisa atualizar:

```bash
# 1. Conectar ao servidor
ssh root@92.113.33.226

# 2. Ir para o diretório do backend
cd /var/www/biacrm/api

# 3. Fazer pull das alterações (se usar git)
git pull

# 4. Instalar dependências (se necessário)
npm install --production

# 5. Recompilar TypeScript (se necessário)
npm run build

# 6. Reiniciar com atualização de variáveis
pm2 restart biacrm-backend --update-env

# 7. Verificar status
pm2 status biacrm-backend

# 8. Ver logs para confirmar que iniciou corretamente
pm2 logs biacrm-backend --lines 30
```

## ⚠️ Troubleshooting

### Backend não inicia
```bash
# Ver logs de erro
pm2 logs biacrm-backend --err

# Verificar se há processos duplicados
pm2 list

# Deletar processo e recriar
pm2 delete biacrm-backend
pm2 start dist/index.js --name biacrm-backend
```

### Backend não carrega variáveis do .env
```bash
# Reiniciar com --update-env
pm2 restart biacrm-backend --update-env

# Verificar variáveis carregadas
pm2 show biacrm-backend | grep env
```

### Backend está usando porta errada
```bash
# Verificar configuração
pm2 show biacrm-backend

# Verificar arquivo .env
cat /var/www/biacrm/api/.env | grep PORT
```

## 📍 Localização dos Arquivos

- **Diretório do backend**: `/var/www/biacrm/api`
- **Arquivo .env**: `/var/www/biacrm/api/.env`
- **Código compilado**: `/var/www/biacrm/api/dist/`
- **Logs do PM2**: `~/.pm2/logs/`

