# Script Completo de Deploy do Frontend
# Caminho: /domains/biacrm.com/public_html/

$SERVER = "root@92.113.33.226"
$PASSWORD = "IAbots2025-@+"
$FRONTEND_PATH = "/domains/biacrm.com/public_html"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETO DO FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. BUILD DO FRONTEND
# ============================================
Write-Host "📦 Fazendo build do frontend..." -ForegroundColor Yellow
Set-Location frontend

# Limpar build anterior
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Write-Host "   Build anterior removido" -ForegroundColor Gray
}

# Fazer novo build
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

# Verificar arquivos gerados
Write-Host "Arquivos gerados:" -ForegroundColor Cyan
Get-ChildItem dist -Recurse | Select-Object FullName, LastWriteTime | Format-Table -AutoSize
Write-Host ""

Set-Location ..

# ============================================
# 2. BACKUP DOS ARQUIVOS ANTIGOS (OPCIONAL)
# ============================================
Write-Host "💾 Fazendo backup dos arquivos antigos..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha SSH" -ForegroundColor Gray
ssh ${SERVER} "cd ${FRONTEND_PATH} && mkdir -p ../backup_$(date +%Y%m%d_%H%M%S) && cp -r * ../backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true"
Write-Host "✅ Backup criado" -ForegroundColor Green
Write-Host ""

# ============================================
# 3. UPLOAD DOS ARQUIVOS
# ============================================
Write-Host "📤 Enviando arquivos do frontend..." -ForegroundColor Yellow
Write-Host "   Caminho: ${SERVER}:${FRONTEND_PATH}/" -ForegroundColor Gray
Write-Host "   Você precisará inserir a senha: $PASSWORD" -ForegroundColor Gray
Write-Host ""

# Enviar todos os arquivos
scp -r frontend/dist/* "${SERVER}:${FRONTEND_PATH}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Arquivos enviados!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao enviar arquivos" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 4. VERIFICAR NO SERVIDOR
# ============================================
Write-Host "🔍 Verificando arquivos no servidor..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha SSH novamente" -ForegroundColor Gray
ssh ${SERVER} "ls -lrt ${FRONTEND_PATH}/ && echo '' && echo 'Arquivos assets:' && ls -la ${FRONTEND_PATH}/assets/ 2>/dev/null || echo 'Diretório assets não encontrado'"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE - LIMPAR CACHE:" -ForegroundColor Yellow
Write-Host "   1. Pressione Ctrl+Shift+R no navegador" -ForegroundColor White
Write-Host "   2. OU abra em modo anônimo/privado" -ForegroundColor White
Write-Host "   3. OU limpe o cache do navegador completamente" -ForegroundColor White
Write-Host ""
Write-Host "Testar:" -ForegroundColor Cyan
Write-Host "   Acesse: https://biacrm.com" -ForegroundColor White
Write-Host "   Pressione Ctrl+Shift+R para forçar reload" -ForegroundColor White
Write-Host ""


