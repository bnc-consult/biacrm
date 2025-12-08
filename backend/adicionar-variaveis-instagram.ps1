# Script para adicionar variáveis do Instagram ao arquivo .env
# Execute este script no PowerShell: .\adicionar-variaveis-instagram.ps1

$envFile = Join-Path $PSScriptRoot ".env"

Write-Host "=== Configuração de Variáveis do Instagram ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
if (-not (Test-Path $envFile)) {
    Write-Host "ERRO: Arquivo .env não encontrado em: $envFile" -ForegroundColor Red
    Write-Host "Crie o arquivo .env primeiro ou execute este script na pasta backend" -ForegroundColor Yellow
    exit 1
}

# Ler o conteúdo atual do .env
$content = Get-Content $envFile -Raw

# Verificar se as variáveis já existem
$hasFacebookAppId = $content -match "FACEBOOK_APP_ID\s*="
$hasInstagramRedirect = $content -match "INSTAGRAM_REDIRECT_URI\s*="

if ($hasFacebookAppId -and $hasInstagramRedirect) {
    Write-Host "AVISO: As variáveis do Instagram já parecem estar configuradas." -ForegroundColor Yellow
    Write-Host "Verifique o arquivo .env manualmente." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Deseja adicionar mesmo assim? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 0
    }
}

Write-Host "Adicionando variáveis ao arquivo .env..." -ForegroundColor Green
Write-Host ""

# Variáveis a adicionar
# NOTA: Usando 127.0.0.1 ao invés de localhost porque o Facebook aceita melhor
$variablesToAdd = @"

# Facebook OAuth (usado também para Instagram)
FACEBOOK_APP_ID=seu_facebook_app_id_aqui
FACEBOOK_APP_SECRET=seu_facebook_app_secret_aqui
FACEBOOK_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/facebook/callback

# Instagram OAuth (usa Facebook se INSTAGRAM_APP_ID não for configurado)
# NOTA: Use 127.0.0.1 ao invés de localhost (Facebook aceita melhor)
INSTAGRAM_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/instagram/callback
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=token_aleatorio_seguro_$(Get-Random -Minimum 10000 -Maximum 99999)

# Frontend URL
FRONTEND_URL=http://127.0.0.1:5173
"@

# Adicionar ao final do arquivo se não existir
if (-not ($content -match "FACEBOOK_APP_ID")) {
    Add-Content -Path $envFile -Value $variablesToAdd
    Write-Host "✓ Variáveis adicionadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "AVISO: FACEBOOK_APP_ID já existe no arquivo." -ForegroundColor Yellow
    Write-Host "Adicione manualmente as variáveis que faltam:" -ForegroundColor Yellow
    Write-Host $variablesToAdd
}

Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Abra o arquivo .env e substitua 'seu_facebook_app_id_aqui' e 'seu_facebook_app_secret_aqui'" -ForegroundColor White
Write-Host "   pelos valores reais do seu App do Facebook Developers" -ForegroundColor White
Write-Host "2. Configure no Facebook Developers:" -ForegroundColor White
Write-Host "   - Vá em Configurações > Básico > Domínios do App" -ForegroundColor Yellow
Write-Host "   - Adicione: localhost e 127.0.0.1" -ForegroundColor Yellow
Write-Host "   - Certifique-se de que o App está em modo DESENVOLVIMENTO" -ForegroundColor Yellow
Write-Host "   - Vá em Facebook Login > Configurações" -ForegroundColor Yellow
Write-Host "   - Adicione em 'URIs de redirecionamento OAuth válidos':" -ForegroundColor Yellow
Write-Host "     http://127.0.0.1:3000/api/integrations/instagram/callback" -ForegroundColor Yellow
Write-Host "3. Se estiver em produção, atualize INSTAGRAM_REDIRECT_URI e FRONTEND_URL" -ForegroundColor White
Write-Host "4. Reinicie o servidor backend" -ForegroundColor White
Write-Host ""
Write-Host "Para obter as credenciais:" -ForegroundColor Cyan
Write-Host "- Acesse: https://developers.facebook.com/" -ForegroundColor White
Write-Host "- Crie um App ou selecione um existente" -ForegroundColor White
Write-Host "- Adicione o produto 'Instagram Graph API'" -ForegroundColor White
Write-Host "- Copie o App ID e App Secret" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "Se o Facebook não aceitar a URL de redirecionamento, veja:" -ForegroundColor Yellow
Write-Host "  backend/SOLUCAO_REDIRECT_URI_INSTAGRAM.md" -ForegroundColor White
Write-Host ""
Write-Host "Veja backend/CONFIGURAR_CREDENCIAIS_INSTAGRAM.md para instruções detalhadas." -ForegroundColor Cyan

