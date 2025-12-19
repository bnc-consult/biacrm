# 📦 Como Atualizar Frontend em Produção

## ❌ NÃO precisa reiniciar o frontend!

O frontend em produção **não é um processo** que precisa ser reiniciado. Ele é composto apenas de **arquivos estáticos** (HTML, CSS, JS) servidos diretamente pelo Nginx.

## ✅ Processo de Atualização

### 1. Gerar novo build (no seu computador)
```bash
cd frontend
npm run build
```

### 2. Enviar arquivos para o servidor
```powershell
# Windows PowerShell
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/
```

### 3. Corrigir permissões (no servidor)
```bash
ssh root@92.113.33.226
chmod 755 /domains/biacrm.com/public_html
chmod 644 /domains/biacrm.com/public_html/*
chmod 755 /domains/biacrm.com/public_html/assets
chmod 644 /domains/biacrm.com/public_html/assets/*
```

### 4. Recarregar Nginx (apenas se necessário)
```bash
# Apenas se você alterou configuração do Nginx
systemctl reload nginx
```

**Normalmente não é necessário** - o Nginx serve os novos arquivos automaticamente!

## 🔄 Quando Recarregar Nginx?

Você só precisa recarregar o Nginx se:
- ✅ Alterou a configuração do Nginx (`/etc/nginx/sites-available/biacrm.com`)
- ✅ Alterou configurações de SSL
- ✅ Alterou regras de proxy ou roteamento

**NÃO precisa recarregar** se apenas:
- ❌ Enviou novos arquivos do frontend
- ❌ Atualizou HTML/CSS/JS
- ❌ Fez novo build

## 🧹 Limpar Cache

### Cache do Navegador
Após atualizar, os usuários podem precisar limpar o cache:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### Cache do Nginx (se configurado)
Se você configurou cache no Nginx, pode precisar limpar:
```bash
# Não há comando direto, mas você pode:
# 1. Recarregar Nginx (força limpeza de cache)
systemctl reload nginx

# 2. Ou ajustar headers de cache no build
```

## 📋 Resumo: Frontend vs Backend

| Componente | Tipo | Precisa Reiniciar? |
|------------|------|-------------------|
| **Frontend** | Arquivos estáticos | ❌ Não - apenas substituir arquivos |
| **Backend** | Processo Node.js (PM2) | ✅ Sim - `pm2 restart biacrm-backend` |
| **Nginx** | Servidor web | ✅ Sim (apenas se mudou config) - `systemctl reload nginx` |

## 🚀 Fluxo Completo de Deploy

### Atualizar Frontend:
```bash
# 1. Build local
cd frontend
npm run build

# 2. Enviar arquivos
scp -r frontend/dist/* root@92.113.33.226:/domains/biacrm.com/public_html/

# 3. Corrigir permissões (no servidor)
ssh root@92.113.33.226
chmod 755 /domains/biacrm.com/public_html
find /domains/biacrm.com/public_html -type d -exec chmod 755 {} \;
find /domains/biacrm.com/public_html -type f -exec chmod 644 {} \;

# 4. Pronto! Não precisa reiniciar nada
```

### Atualizar Backend:
```bash
# 1. Conectar ao servidor
ssh root@92.113.33.226

# 2. Ir para diretório do backend
cd /var/www/biacrm/api

# 3. Atualizar código (git pull, scp, etc.)

# 4. Instalar dependências (se necessário)
npm install --production

# 5. Recompilar (se necessário)
npm run build

# 6. REINICIAR o processo PM2
pm2 restart biacrm-backend --update-env

# 7. Verificar
pm2 status biacrm-backend
pm2 logs biacrm-backend --lines 30
```

## ⚠️ Importante

- **Frontend**: Apenas arquivos estáticos → Substituir arquivos = atualizado
- **Backend**: Processo Node.js → Precisa reiniciar PM2 para aplicar mudanças
- **Nginx**: Servidor web → Precisa recarregar apenas se mudou configuração

## 🔍 Verificar se Frontend Foi Atualizado

```bash
# Ver data de modificação do index.html
ls -lh /domains/biacrm.com/public_html/index.html

# Ver hash dos arquivos JS (muda a cada build)
ls -lh /domains/biacrm.com/public_html/assets/*.js
```

Se os arquivos têm data/hash novos, o frontend foi atualizado!

