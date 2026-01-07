#!/bin/bash
# Script para reiniciar o backend no servidor
# Execute no servidor: bash reiniciar-backend-servidor.sh

echo "========================================"
echo "  REINICIANDO BACKEND"
echo "========================================"
echo ""

cd /var/www/biacrm/api

# Verificar se usa PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 encontrado"
    PM2_PROCESS=$(pm2 list | grep -i "biacrm\|api\|index.js" | head -1)
    if [ ! -z "$PM2_PROCESS" ]; then
        echo "Reiniciando via PM2..."
        pm2 restart all
        pm2 list
        echo ""
        echo "✅ Backend reiniciado via PM2"
        exit 0
    fi
fi

# Verificar se usa systemd
if systemctl list-units --type=service | grep -q "biacrm\|node-api"; then
    echo "✅ Systemd service encontrado"
    SERVICE_NAME=$(systemctl list-units --type=service | grep -E "biacrm|node-api" | awk '{print $1}' | head -1)
    if [ ! -z "$SERVICE_NAME" ]; then
        echo "Reiniciando via systemd: $SERVICE_NAME"
        systemctl restart $SERVICE_NAME
        systemctl status $SERVICE_NAME
        echo ""
        echo "✅ Backend reiniciado via systemd"
        exit 0
    fi
fi

# Se não encontrou PM2 nem systemd, matar e reiniciar manualmente
echo "⚠️  Gerenciador de processos não encontrado"
echo "Parando processos Node.js..."

# Matar processos relacionados
pkill -f "node.*dist/index.js"
pkill -f "node.*dist/main"

# Aguardar um pouco
sleep 2

# Verificar se parou
if pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "❌ Processo ainda está rodando, forçando..."
    pkill -9 -f "node.*dist/index.js"
    sleep 1
fi

# Instalar dependências se necessário
echo "Instalando dependências..."
npm install --production

# Iniciar novamente
echo "Iniciando backend..."
nohup node dist/index.js > /var/www/biacrm/api/app.log 2>&1 &

sleep 2

# Verificar se iniciou
if pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "✅ Backend reiniciado manualmente"
    ps aux | grep "node.*dist/index.js" | grep -v grep
else
    echo "❌ Erro ao iniciar backend"
    echo "Verifique os logs: tail -f /var/www/biacrm/api/app.log"
    exit 1
fi

echo ""
echo "========================================"
echo "  VERIFICAÇÃO"
echo "========================================"
echo ""
echo "Processos Node.js rodando:"
ps aux | grep node | grep -v grep
echo ""
echo "Teste de saúde:"
curl -s http://localhost:3000/health || echo "❌ Backend não está respondendo"








