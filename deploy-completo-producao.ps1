# Script completo para deploy em produção
# Envia arquivos e corrige permissões automaticamente

$SERVER = "root@92.113.33.226"
$BACKEND_PATH = "/var/www/biacrm/api"
$FRONTEND_PATH = "/domains/biacrm.com/public_html"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETO EM PRODUÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se os builds existem
if (-not (Test-Path "backend/dist")) {
    Write-Host "❌ Build do backend não encontrado!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend/dist")) {
    Write-Host "❌ Build do frontend não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Enviando arquivos do backend..." -ForegroundColor Yellow
Write-Host "Senha: IAbots2025-@+" -ForegroundColor Gray
Write-Host ""

# Backend
scp -r backend/dist/* "${SERVER}:${BACKEND_PATH}/dist/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar backend/dist/*" -ForegroundColor Red
    exit 1
}

scp backend/package.json "${SERVER}:${BACKEND_PATH}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar package.json" -ForegroundColor Red
    exit 1
}

scp backend/package-lock.json "${SERVER}:${BACKEND_PATH}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar package-lock.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend enviado!" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Enviando arquivos do frontend..." -ForegroundColor Yellow
Write-Host "Senha: IAbots2025-@+" -ForegroundColor Gray
Write-Host ""

# Frontend
scp -r frontend/dist/* "${SERVER}:${FRONTEND_PATH}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar frontend/dist/*" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend enviado!" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Enviando script de correção..." -ForegroundColor Yellow
scp verificar-e-corrigir-producao.sh "${SERVER}:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Erro ao enviar script de correção (continuando...)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ ARQUIVOS ENVIADOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos no servidor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conectar:" -ForegroundColor White
Write-Host "   ssh ${SERVER}" -ForegroundColor Green
Write-Host ""
Write-Host "2. Executar script de correção:" -ForegroundColor White
Write-Host "   bash /tmp/verificar-e-corrigir-producao.sh" -ForegroundColor Green
Write-Host ""
Write-Host "3. Atualizar .env (se necessário):" -ForegroundColor White
Write-Host "   cd ${BACKEND_PATH}" -ForegroundColor Green
Write-Host "   nano .env  # Atualizar FACEBOOK_APP_ID e FACEBOOK_APP_SECRET" -ForegroundColor Green
Write-Host ""
Write-Host "4. Reiniciar backend:" -ForegroundColor White
Write-Host "   pm2 restart biacrm-backend" -ForegroundColor Green
Write-Host ""







