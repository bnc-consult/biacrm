Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Corrigindo Dependências" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar versão do Node.js
Write-Host "Verificando versão do Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Corrigir dependências do backend
Write-Host "Corrigindo dependências do backend..." -ForegroundColor Yellow
Set-Location backend

Write-Host "Removendo node_modules..." -ForegroundColor Gray
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

Write-Host "Removendo package-lock.json..." -ForegroundColor Gray
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

Write-Host "Instalando dependências..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Recompilando better-sqlite3..." -ForegroundColor Yellow
npm rebuild better-sqlite3

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Dependências corrigidas!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Agora você pode iniciar os servidores com:" -ForegroundColor Yellow
Write-Host "  .\start-servers.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

