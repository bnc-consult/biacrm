# Script de Diagnóstico para Integração Instagram
# Execute: .\diagnostico-instagram.ps1

Write-Host "=== DIAGNÓSTICO INTEGRAÇÃO INSTAGRAM ===" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".env"

# Verificar arquivo .env
Write-Host "1. Verificando arquivo .env..." -ForegroundColor Yellow
if (Test-Path $envFile) {
    Write-Host "   ✓ Arquivo .env encontrado" -ForegroundColor Green
    
    $content = Get-Content $envFile -Raw
    
    # Verificar variáveis
    $vars = @{
        "FACEBOOK_APP_ID" = $content -match "FACEBOOK_APP_ID\s*="
        "FACEBOOK_APP_SECRET" = $content -match "FACEBOOK_APP_SECRET\s*="
        "INSTAGRAM_REDIRECT_URI" = $content -match "INSTAGRAM_REDIRECT_URI\s*="
    }
    
    foreach ($var in $vars.Keys) {
        if ($vars[$var]) {
            Write-Host "   ✓ $var configurado" -ForegroundColor Green
            $value = (Get-Content $envFile | Select-String "$var\s*=").ToString()
            Write-Host "     $value" -ForegroundColor Gray
        } else {
            Write-Host "   ✗ $var NÃO configurado" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✗ Arquivo .env NÃO encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Verificando servidor backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Servidor está rodando" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Servidor NÃO está rodando" -ForegroundColor Red
    Write-Host "     Execute: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Verificando endpoint de callback..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/integrations/instagram/callback" -TimeoutSec 2 -ErrorAction Stop
    if ($response.Content -match "Código de autorização") {
        Write-Host "   ✓ Endpoint está funcionando" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Endpoint respondeu mas com conteúdo inesperado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Endpoint não está acessível" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RECOMENDAÇÕES ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se o erro de domínio persistir:" -ForegroundColor Yellow
Write-Host "1. Use ngrok (mais confiável):" -ForegroundColor White
Write-Host "   - Baixe: https://ngrok.com/download" -ForegroundColor Gray
Write-Host "   - Execute: ngrok http 3000" -ForegroundColor Gray
Write-Host "   - Use a URL gerada no Facebook e no .env" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verifique no Facebook Developers:" -ForegroundColor White
Write-Host "   - Domínios do App: localhost, 127.0.0.1" -ForegroundColor Gray
Write-Host "   - URIs de redirecionamento: http://127.0.0.1:3000/api/integrations/instagram/callback" -ForegroundColor Gray
Write-Host "   - Modo do App: Desenvolvimento" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Veja backend/SOLUCAO_DEFINITIVA_DOMINIO.md para guia completo" -ForegroundColor Cyan


