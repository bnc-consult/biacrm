# Script de Deploy em Produção - BIA CRM
# Execute este script na raiz do projeto
# Servidor: root@92.113.33.226

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY EM PRODUÇÃO - BIA CRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$SERVER = "root@92.113.33.226"
$BACKEND_PATH = "/var/www/biacrm/backend"
$FRONTEND_PATH = "/var/www/biacrm/frontend"

# ============================================
# 1. BUILD DO BACKEND
# ============================================
Write-Host "📦 Fazendo build do backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do backend!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Build do backend concluído!" -ForegroundColor Green
Set-Location ..

# ============================================
# 2. BUILD DO FRONTEND
# ============================================
Write-Host ""
Write-Host "🌐 Fazendo build do frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do frontend!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Build do frontend concluído!" -ForegroundColor Green
Set-Location ..

# ============================================
# 3. UPLOAD DO BACKEND
# ============================================
Write-Host ""
Write-Host "📤 Enviando arquivos do backend..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha do servidor" -ForegroundColor Gray

# Enviar arquivos compilados
scp -r backend/dist/* "${SERVER}:${BACKEND_PATH}/dist/"

# Enviar package.json
scp backend/package.json "${SERVER}:${BACKEND_PATH}/"

# Enviar package-lock.json
scp backend/package-lock.json "${SERVER}:${BACKEND_PATH}/"

Write-Host "✅ Backend enviado!" -ForegroundColor Green

# ============================================
# 4. UPLOAD DO FRONTEND
# ============================================
Write-Host ""
Write-Host "📤 Enviando arquivos do frontend..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha do servidor" -ForegroundColor Gray

# Enviar arquivos do build
scp -r frontend/dist/* "${SERVER}:${FRONTEND_PATH}/dist/"

Write-Host "✅ Frontend enviado!" -ForegroundColor Green

# ============================================
# RESUMO
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos no servidor:" -ForegroundColor Yellow
Write-Host "1. Conectar: ssh ${SERVER}" -ForegroundColor White
Write-Host "2. Instalar dependências: cd ${BACKEND_PATH} && npm install --production" -ForegroundColor White
Write-Host "3. Executar migrações (se necessário): npm run migrate" -ForegroundColor White
Write-Host "4. Reiniciar o servidor backend: npm start" -ForegroundColor White
Write-Host ""



