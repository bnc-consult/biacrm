# Script de Deploy do Frontend - biacrm.com
# Caminho correto: /domains/biacrm.com/public_html/

$SERVER = "root@92.113.33.226"
$PASSWORD = "IAbots2025-@+"
$FRONTEND_PATH = "/domains/biacrm.com/public_html"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY DO FRONTEND - BIACRM.COM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. BUILD DO FRONTEND
# ============================================
Write-Host "📦 Fazendo build do frontend..." -ForegroundColor Yellow
Set-Location frontend
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
Write-Host "📤 Enviando arquivos do frontend..." -ForegroundColor Yellow
Write-Host "   Caminho: ${SERVER}:${FRONTEND_PATH}/" -ForegroundColor Gray
Write-Host "   Você precisará inserir a senha: $PASSWORD" -ForegroundColor Gray
Write-Host ""

scp -r frontend/dist/* "${SERVER}:${FRONTEND_PATH}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend enviado!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao enviar frontend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY DO FRONTEND CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Limpe o cache do navegador:" -ForegroundColor Yellow
Write-Host "   - Pressione Ctrl+Shift+R" -ForegroundColor White
Write-Host "   - OU teste em modo anônimo/privado" -ForegroundColor White
Write-Host ""
Write-Host "Verificar no servidor:" -ForegroundColor Cyan
Write-Host "ssh ${SERVER}" -ForegroundColor White
Write-Host "ls -lrt ${FRONTEND_PATH}/" -ForegroundColor White
Write-Host ""



