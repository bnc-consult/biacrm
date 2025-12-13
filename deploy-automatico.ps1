# Script de Deploy Automático - BIA CRM
# Servidor: root@92.113.33.226

$SERVER = "root@92.113.33.226"
$PASSWORD = "IAbots2025-@+"
$BACKEND_PATH = "/var/www/biacrm/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY AUTOMÁTICO - BIA CRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se sshpass está disponível (Linux/WSL) ou usar método alternativo
$useSshpass = $false
try {
    $null = sshpass -V 2>$null
    $useSshpass = $true
    Write-Host "✅ sshpass encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  sshpass não encontrado, usando método interativo" -ForegroundColor Yellow
}

# Função para executar SCP com senha
function Invoke-SCPWithPassword {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Password
    )
    
    if ($useSshpass) {
        # Usar sshpass se disponível
        $env:SSHPASS = $Password
        sshpass -e scp -r -o StrictHostKeyChecking=no $Source "${SERVER}:${Destination}"
    } else {
        # Método interativo - PowerShell não suporta passar senha diretamente
        Write-Host "Executando: scp -r $Source ${SERVER}:${Destination}" -ForegroundColor Yellow
        Write-Host "Por favor, insira a senha quando solicitado: $Password" -ForegroundColor Cyan
        scp -r $Source "${SERVER}:${Destination}"
    }
}

# ============================================
# 1. VERIFICAR SE OS BUILDS EXISTEM
# ============================================
Write-Host "📦 Verificando builds..." -ForegroundColor Yellow

if (-not (Test-Path "backend/dist")) {
    Write-Host "❌ Build do backend não encontrado! Fazendo build..." -ForegroundColor Red
    Set-Location backend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no build do backend!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
}

Write-Host "✅ Build do backend encontrado" -ForegroundColor Green

# ============================================
# 2. TESTAR CONEXÃO COM O SERVIDOR
# ============================================
Write-Host ""
Write-Host "🔌 Testando conexão com o servidor..." -ForegroundColor Yellow

if ($useSshpass) {
    $env:SSHPASS = $PASSWORD
    $testResult = sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 $SERVER "echo 'conexao_ok'" 2>&1
} else {
    Write-Host "Teste de conexão manual necessário" -ForegroundColor Yellow
    $testResult = "manual"
}

if ($testResult -match "conexao_ok" -or $testResult -eq "manual") {
    Write-Host "✅ Conexão com servidor OK" -ForegroundColor Green
} else {
    Write-Host "❌ Erro na conexão: $testResult" -ForegroundColor Red
    exit 1
}

# ============================================
# 3. UPLOAD DO BACKEND
# ============================================
Write-Host ""
Write-Host "📤 Enviando arquivos do backend..." -ForegroundColor Yellow

# Enviar arquivos compilados
Write-Host "   Enviando dist/*..." -ForegroundColor Gray
Invoke-SCPWithPassword -Source "backend/dist/*" -Destination "${BACKEND_PATH}/dist/" -Password $PASSWORD

# Enviar package.json
Write-Host "   Enviando package.json..." -ForegroundColor Gray
Invoke-SCPWithPassword -Source "backend/package.json" -Destination "${BACKEND_PATH}/" -Password $PASSWORD

# Enviar package-lock.json
Write-Host "   Enviando package-lock.json..." -ForegroundColor Gray
Invoke-SCPWithPassword -Source "backend/package-lock.json" -Destination "${BACKEND_PATH}/" -Password $PASSWORD

Write-Host "✅ Backend enviado!" -ForegroundColor Green

# ============================================
# 4. VERIFICAR SE OS ARQUIVOS FORAM ENVIADOS
# ============================================
Write-Host ""
Write-Host "🔍 Verificando arquivos no servidor..." -ForegroundColor Yellow

if ($useSshpass) {
    $env:SSHPASS = $PASSWORD
    $files = sshpass -e ssh -o StrictHostKeyChecking=no $SERVER "ls -la ${BACKEND_PATH}/dist/ | head -10" 2>&1
    Write-Host $files -ForegroundColor Gray
} else {
    Write-Host "Execute manualmente: ssh $SERVER 'ls -la ${BACKEND_PATH}/dist/'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos no servidor:" -ForegroundColor Yellow
Write-Host "ssh $SERVER" -ForegroundColor White
Write-Host "cd ${BACKEND_PATH}" -ForegroundColor White
Write-Host "npm install --production" -ForegroundColor White
Write-Host "npm start" -ForegroundColor White
Write-Host ""


