#!/bin/bash
# Script rápido de deploy - Execute na raiz do projeto
# Requer: sshpass instalado (sudo apt-get install sshpass)

SERVER="root@92.113.33.226"
PASSWORD="IAbots2025-@+"
BACKEND_PATH="/var/www/biacrm/api"

echo "========================================"
echo "  DEPLOY RÁPIDO"
echo "========================================"
echo ""

# Build
echo "📦 Fazendo build..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi
cd ..

# Upload
echo "📤 Enviando arquivos..."
export SSHPASS="$PASSWORD"

sshpass -e scp -r backend/dist/* ${SERVER}:${BACKEND_PATH}/dist/
sshpass -e scp backend/package.json ${SERVER}:${BACKEND_PATH}/
sshpass -e scp backend/package-lock.json ${SERVER}:${BACKEND_PATH}/

# Instalar e reiniciar
echo "🔄 Reiniciando backend..."
sshpass -e ssh ${SERVER} "cd ${BACKEND_PATH} && npm install --production && pm2 restart biacrm-backend && pm2 list && curl -s http://localhost:3000/health"

echo ""
echo "✅ Deploy concluído!"


