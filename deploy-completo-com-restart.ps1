# Script Completo de Deploy com Restart Automático
# Servidor: root@92.113.33.226
# Senha: IAbots2025-@+

$SERVER = "root@92.113.33.226"
$PASSWORD = "IAbots2025-@+"
$BACKEND_PATH = "/var/www/biacrm/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETO COM RESTART" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. BUILD DO BACKEND
# ============================================
Write-Host "📦 Fazendo build do backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

# ============================================
# 2. UPLOAD DOS ARQUIVOS
# ============================================
Write-Host "📤 Enviando arquivos para o servidor..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha 3 vezes: $PASSWORD" -ForegroundColor Gray
Write-Host ""

# Enviar dist/*
Write-Host "[1/3] Enviando backend/dist/*..." -ForegroundColor Cyan
scp -r backend/dist/* "${SERVER}:${BACKEND_PATH}/dist/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar dist/*" -ForegroundColor Red
    exit 1
}

# Enviar package.json
Write-Host "[2/3] Enviando package.json..." -ForegroundColor Cyan
scp backend/package.json "${SERVER}:${BACKEND_PATH}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar package.json" -ForegroundColor Red
    exit 1
}

# Enviar package-lock.json
Write-Host "[3/3] Enviando package-lock.json..." -ForegroundColor Cyan
scp backend/package-lock.json "${SERVER}:${BACKEND_PATH}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar package-lock.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos enviados!" -ForegroundColor Green
Write-Host ""

# ============================================
# 3. INSTALAR DEPENDÊNCIAS E REINICIAR
# ============================================
Write-Host "🔄 Instalando dependências e reiniciando backend..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha SSH novamente" -ForegroundColor Gray
Write-Host ""

$restartCommands = @"
cd $BACKEND_PATH
npm install --production
pm2 restart biacrm-backend
pm2 list
curl -s http://localhost:3000/health
"@

ssh $SERVER $restartCommands

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifique se está funcionando:" -ForegroundColor Yellow
Write-Host "curl http://92.113.33.226:3000/health" -ForegroundColor White
Write-Host ""








