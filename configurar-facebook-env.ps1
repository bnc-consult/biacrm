# Script para configurar variaveis de ambiente do Facebook OAuth
# Execute este script na raiz do projeto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR FACEBOOK OAUTH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = "backend\.env"

# Verificar se arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

# Ler conteudo atual
$content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
if (-not $content) {
    $content = ""
}

# Variaveis a adicionar/atualizar
$variables = @{
    "FACEBOOK_APP_ID" = "seu_app_id_aqui"
    "FACEBOOK_APP_SECRET" = "seu_app_secret_aqui"
    "FACEBOOK_REDIRECT_URI" = "http://localhost:3000/api/integrations/facebook/callback"
    "FRONTEND_URL" = "http://localhost:5173"
}

Write-Host "Configurando variaveis de ambiente..." -ForegroundColor Yellow
Write-Host ""

# Atualizar ou adicionar cada variavel
foreach ($key in $variables.Keys) {
    $value = $variables[$key]
    
    if ($content -match "$key\s*=") {
        # Atualizar variavel existente
        $content = $content -replace "$key\s*=.*", "$key=$value"
        Write-Host "OK $key atualizado" -ForegroundColor Green
    } else {
        # Adicionar nova variavel
        if (-not [string]::IsNullOrWhiteSpace($content) -and -not $content.EndsWith("`n")) {
            $content += "`n"
        }
        $content += "$key=$value`n"
        Write-Host "OK $key adicionado" -ForegroundColor Green
    }
}

# Salvar arquivo
$content | Set-Content $envFile -NoNewline

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Edite o arquivo backend\.env e substitua:" -ForegroundColor White
Write-Host "   - seu_app_id_aqui -> Seu App ID do Facebook" -ForegroundColor Gray
Write-Host "   - seu_app_secret_aqui -> Seu App Secret do Facebook" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure no Facebook Developers:" -ForegroundColor White
Write-Host "   - Acesse: https://developers.facebook.com/" -ForegroundColor Gray
Write-Host "   - Va em: Facebook Login -> Configuracoes" -ForegroundColor Gray
Write-Host "   - Adicione em URIs de redirecionamento OAuth validos:" -ForegroundColor Gray
Write-Host "     http://localhost:3000/api/integrations/facebook/callback" -ForegroundColor Cyan
Write-Host "   - Adicione localhost em Dominios do App" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Reinicie o servidor backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Para mais detalhes, consulte:" -ForegroundColor Cyan
Write-Host "   - SOLUCAO-FACEBOOK-REDIRECT-URI.md" -ForegroundColor White
Write-Host "   - CONFIGURAR-FACEBOOK-DEVELOPERS.md" -ForegroundColor White
Write-Host ""
