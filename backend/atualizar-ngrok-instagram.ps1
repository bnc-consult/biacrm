# Script para atualizar INSTAGRAM_REDIRECT_URI com URL do ngrok

Write-Host "=== ATUALIZAR INSTAGRAM_REDIRECT_URI COM NGROK ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar URL do ngrok
Write-Host "Cole a URL do ngrok (ex: https://abc123.ngrok-free.dev):" -ForegroundColor Yellow
$ngrokUrl = Read-Host

if ([string]::IsNullOrWhiteSpace($ngrokUrl)) {
    Write-Host "Erro: URL do ngrok não pode estar vazia!" -ForegroundColor Red
    exit 1
}

# Remover barra final se houver
$ngrokUrl = $ngrokUrl.TrimEnd('/')

# Construir URI completa
$redirectUri = "$ngrokUrl/api/integrations/instagram/callback"
$frontendUrl = $ngrokUrl

Write-Host ""
Write-Host "URL do ngrok: $ngrokUrl" -ForegroundColor Green
Write-Host "Redirect URI completa: $redirectUri" -ForegroundColor Green
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Green
Write-Host ""

# Verificar se .env existe
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "Arquivo .env não encontrado. Criando..." -ForegroundColor Yellow
    New-Item -Path $envPath -ItemType File | Out-Null
}

# Ler conteúdo do .env
$content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
if (-not $content) {
    $content = ""
}

# Atualizar INSTAGRAM_REDIRECT_URI
if ($content -match "INSTAGRAM_REDIRECT_URI\s*=") {
    $content = $content -replace "INSTAGRAM_REDIRECT_URI\s*=.*", "INSTAGRAM_REDIRECT_URI=$redirectUri"
    Write-Host "✓ INSTAGRAM_REDIRECT_URI atualizado" -ForegroundColor Green
} else {
    if (-not [string]::IsNullOrWhiteSpace($content) -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += "INSTAGRAM_REDIRECT_URI=$redirectUri`n"
    Write-Host "✓ INSTAGRAM_REDIRECT_URI adicionado" -ForegroundColor Green
}

# Atualizar FRONTEND_URL (opcional, mas recomendado)
if ($content -match "FRONTEND_URL\s*=") {
    $content = $content -replace "FRONTEND_URL\s*=.*", "FRONTEND_URL=$frontendUrl"
    Write-Host "✓ FRONTEND_URL atualizado" -ForegroundColor Green
} else {
    if (-not [string]::IsNullOrWhiteSpace($content) -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += "FRONTEND_URL=$frontendUrl`n"
    Write-Host "✓ FRONTEND_URL adicionado" -ForegroundColor Green
}

# Salvar arquivo
$content | Set-Content $envPath -NoNewline

Write-Host ""
Write-Host "=== CONFIGURAÇÃO ATUALIZADA ===" -ForegroundColor Green
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. No Facebook Developer, adicione esta URI completa:" -ForegroundColor White
Write-Host "   $redirectUri" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Reinicie o servidor backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Teste a conexão do Instagram" -ForegroundColor White
Write-Host ""


