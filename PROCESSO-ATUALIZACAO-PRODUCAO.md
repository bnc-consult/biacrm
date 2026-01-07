# Processo de Atualização em Produção

## ⚠️ IMPORTANTE: Sim, é necessário reiniciar o backend!

Quando você atualiza os arquivos no servidor, o Node.js **não recarrega automaticamente** os arquivos JavaScript compilados. É necessário reiniciar o processo do backend.

---

## 🔄 Processo Recomendado de Atualização

### Opção 1: Reiniciar o processo Node.js (Recomendado)

```bash
# 1. Conectar ao servidor
ssh root@92.113.33.226

# 2. Ir para o diretório do backend
cd /var/www/biacrm/api

# 3. Fazer o deploy dos arquivos (via SCP do seu computador)
# (Execute os comandos SCP do seu computador local)

# 4. Instalar novas dependências (se houver mudanças no package.json)
npm install --production

# 5. Reiniciar o backend
# Se estiver usando PM2:
pm2 restart biacrm-api
# OU
pm2 restart all

# Se estiver usando systemd:
systemctl restart biacrm-api
# OU
systemctl restart node-api

# Se estiver rodando diretamente com node:
# Primeiro, pare o processo atual (Ctrl+C ou kill)
pkill -f "node.*dist/index.js"
# Depois, inicie novamente:
npm start
# OU
node dist/index.js
```

---

## 🔍 Como descobrir como o backend está rodando?

Execute no servidor:

```bash
ssh root@92.113.33.226

# Verificar processos Node.js rodando
ps aux | grep node

# Verificar se está usando PM2
pm2 list

# Verificar se está usando systemd
systemctl status biacrm-api
systemctl status node-api

# Verificar processos na porta 3000
lsof -i :3000
# OU
netstat -tulpn | grep :3000
```

---

## 📋 Processo Completo de Deploy (Passo a Passo)

### 1. No seu computador local:
```powershell
# Fazer build
cd backend
npm run build
cd ..

# Enviar arquivos
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/dist/
scp backend/package.json root@92.113.33.226:/var/www/biacrm/api/
scp backend/package-lock.json root@92.113.33.226:/var/www/biacrm/api/
```

### 2. No servidor:
```bash
ssh root@92.113.33.226
cd /var/www/biacrm/api

# Instalar dependências (se necessário)
npm install --production

# Reiniciar o backend (escolha o método correto baseado no que descobrir acima)
# Método mais comum:
pm2 restart biacrm-api
# OU se não usar PM2:
pkill -f node
npm start &
```

---

## ⚡ Atualização Sem Downtime (Avançado)

Se quiser evitar downtime, você pode:

1. **Usar PM2 com reload** (recomendado):
```bash
pm2 reload biacrm-api  # Zero downtime
```

2. **Usar cluster mode do PM2**:
```bash
pm2 start dist/index.js -i max --name biacrm-api
pm2 reload biacrm-api  # Atualiza sem parar
```

---

## 🎯 Sobre o Frontend

**Frontend geralmente NÃO precisa reiniciar** porque:
- Arquivos estáticos são servidos diretamente pelo servidor web (Nginx/Apache)
- Basta fazer upload dos novos arquivos
- O servidor web serve os arquivos atualizados automaticamente

**Mas pode ser necessário:**
- Limpar cache do navegador (Ctrl+F5)
- Ou reiniciar o servidor web se houver problemas:
  ```bash
  systemctl restart nginx
  # OU
  systemctl restart apache2
  ```

---

## ✅ Checklist de Atualização

- [ ] Build feito localmente (`npm run build`)
- [ ] Arquivos enviados via SCP
- [ ] Dependências atualizadas no servidor (`npm install --production`)
- [ ] Backend reiniciado
- [ ] Verificar se está funcionando (`curl http://localhost:3000/health`)
- [ ] Testar a aplicação

---

## 🆘 Troubleshooting

### Backend não está respondendo após reiniciar:
```bash
# Verificar logs
pm2 logs biacrm-api
# OU
journalctl -u biacrm-api -f
# OU se rodando diretamente:
tail -f /var/www/biacrm/api/nohup.out
```

### Porta 3000 já está em uso:
```bash
# Encontrar processo usando a porta
lsof -i :3000
# Matar o processo
kill -9 <PID>
```

### Erro de permissão:
```bash
chmod +x /var/www/biacrm/api/dist/index.js
```








