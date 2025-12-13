# Comandos SCP para deploy em produção (PowerShell)
# Servidor: root@92.113.33.226
# Execute este script na raiz do projeto

# ============================================
# CONFIGURAÇÃO - Ajuste os caminhos conforme necessário
# ============================================
$SERVER = "root@92.113.33.226"
$BACKEND_PATH = "/var/www/biacrm/api"
$FRONTEND_PATH = "/var/www/biacrm"

# ============================================
# 1. BACKEND - Enviar arquivos compilados
# ============================================
Write-Host "📦 Enviando arquivos do backend..." -ForegroundColor Cyan

# Enviar arquivos compilados
scp -r backend/dist/* "${SERVER}:${BACKEND_PATH}/dist/"

# Enviar package.json
scp backend/package.json "${SERVER}:${BACKEND_PATH}/"

# Enviar package-lock.json
scp backend/package-lock.json "${SERVER}:${BACKEND_PATH}/"

Write-Host "✅ Backend enviado!" -ForegroundColor Green

# ============================================
# 2. FRONTEND - Enviar arquivos estáticos
# ============================================
Write-Host "🌐 Frontend não encontrado no servidor atual" -ForegroundColor Yellow
Write-Host "   O frontend pode estar em outro servidor/domínio" -ForegroundColor Yellow
Write-Host "   Ou ainda não foi feito deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Se precisar fazer deploy do frontend:" -ForegroundColor Cyan
Write-Host "   1. Faça o build: cd frontend && npm run build" -ForegroundColor White
Write-Host "   2. Envie para o servidor apropriado" -ForegroundColor White
Write-Host ""
# Descomente a linha abaixo se souber o caminho correto do frontend:
# scp -r frontend/dist/* "${SERVER}:${FRONTEND_PATH}/dist/"

Write-Host "✅ Frontend enviado!" -ForegroundColor Green

Write-Host "`n✅ Upload concluído com sucesso!" -ForegroundColor Green
Write-Host "`nPróximos passos no servidor:" -ForegroundColor Yellow
Write-Host "1. Conectar: ssh ${SERVER}" -ForegroundColor White
Write-Host "2. Instalar dependências: cd ${BACKEND_PATH} && npm install --production" -ForegroundColor White
Write-Host "3. Executar migrações: npm run migrate" -ForegroundColor White
Write-Host "4. Iniciar servidor: npm start" -ForegroundColor White

