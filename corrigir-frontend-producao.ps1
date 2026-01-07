# Script para corrigir problema de MIME type no frontend em produção
# Execute este script após fazer o build

$SERVER = "root@92.113.33.226"
$FRONTEND_PATH = "/domains/biacrm.com/public_html"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRIGINDO FRONTEND EM PRODUÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o build existe
if (-not (Test-Path "frontend/dist")) {
    Write-Host "❌ Build não encontrado! Fazendo build..." -ForegroundColor Red
    Set-Location frontend
    npm run build
    Set-Location ..
}

Write-Host "📤 Enviando arquivos do frontend..." -ForegroundColor Yellow
Write-Host "Senha: IAbots2025-@+" -ForegroundColor Gray
Write-Host ""

# Enviar todos os arquivos do frontend
scp -r frontend/dist/* "${SERVER}:${FRONTEND_PATH}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Arquivos enviados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao enviar arquivos" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ ARQUIVOS ENVIADOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos no servidor:" -ForegroundColor Yellow
Write-Host "1. Conectar: ssh ${SERVER}" -ForegroundColor White
Write-Host "2. Verificar arquivos: ls -lh ${FRONTEND_PATH}/assets/*.js" -ForegroundColor White
Write-Host "3. Corrigir configuração do Nginx (veja SOLUCAO-ERRO-MIME-TYPE.md)" -ForegroundColor White
Write-Host "4. Recarregar Nginx: systemctl reload nginx" -ForegroundColor White
Write-Host ""







