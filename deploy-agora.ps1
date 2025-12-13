# Script de Deploy - Execute e insira a senha quando solicitado
# Senha: IAbots2025-@+

$SERVER = "root@92.113.33.226"
$BACKEND_PATH = "/var/www/biacrm/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY EM PRODUCAO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Senha do servidor: IAbots2025-@+" -ForegroundColor Yellow
Write-Host "Voce precisara inserir a senha 3 vezes (uma para cada comando)" -ForegroundColor Yellow
Write-Host ""

# Verificar se build existe
if (-not (Test-Path "backend/dist")) {
    Write-Host "Build nao encontrado! Fazendo build..." -ForegroundColor Red
    Set-Location backend
    npm run build
    Set-Location ..
}

Write-Host "Enviando arquivos..." -ForegroundColor Yellow
Write-Host ""

# Comando 1: Enviar dist/*
$dest1 = "${SERVER}:${BACKEND_PATH}/dist/"
Write-Host "[1/3] Enviando backend/dist/* para $dest1" -ForegroundColor Cyan
Write-Host "      Senha: IAbots2025-@+" -ForegroundColor Gray
scp -r backend/dist/* $dest1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Arquivos dist/* enviados!" -ForegroundColor Green
} else {
    Write-Host "Erro ao enviar dist/*" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Comando 2: Enviar package.json
$dest2 = "${SERVER}:${BACKEND_PATH}/"
Write-Host "[2/3] Enviando package.json para $dest2" -ForegroundColor Cyan
Write-Host "      Senha: IAbots2025-@+" -ForegroundColor Gray
scp backend/package.json $dest2

if ($LASTEXITCODE -eq 0) {
    Write-Host "package.json enviado!" -ForegroundColor Green
} else {
    Write-Host "Erro ao enviar package.json" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Comando 3: Enviar package-lock.json
Write-Host "[3/3] Enviando package-lock.json para $dest2" -ForegroundColor Cyan
Write-Host "      Senha: IAbots2025-@+" -ForegroundColor Gray
scp backend/package-lock.json $dest2

if ($LASTEXITCODE -eq 0) {
    Write-Host "package-lock.json enviado!" -ForegroundColor Green
} else {
    Write-Host "Erro ao enviar package-lock.json" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos no servidor:" -ForegroundColor Yellow
Write-Host "ssh $SERVER" -ForegroundColor White
Write-Host "cd $BACKEND_PATH" -ForegroundColor White
Write-Host "npm install --production" -ForegroundColor White
Write-Host "npm start" -ForegroundColor White
Write-Host ""
