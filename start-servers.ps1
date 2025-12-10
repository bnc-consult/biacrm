Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servidores CRM BIA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar dependências do backend
Write-Host ""
Write-Host "Verificando dependências do backend..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "Dependências do backend OK" -ForegroundColor Green
} else {
    Write-Host "Instalando dependências do backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Verificar dependências do frontend
Write-Host ""
Write-Host "Verificando dependências do frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "Dependências do frontend OK" -ForegroundColor Green
} else {
    Write-Host "Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Iniciar backend
Write-Host ""
Write-Host "Iniciando Backend na porta 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '=== BACKEND - Porta 3000 ===' -ForegroundColor Cyan; npm run dev"

# Aguardar 3 segundos
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "Iniciando Frontend na porta 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '=== FRONTEND - Porta 5173 ===' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servidores iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Verifique as janelas do PowerShell que foram abertas" -ForegroundColor Yellow
Write-Host "para ver os logs e possíveis erros." -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

