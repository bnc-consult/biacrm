# Script de Deploy Corrigido - BIA CRM
# Execute este script na raiz do projeto
# Servidor: root@92.113.33.226

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY EM PRODUÇÃO - BIA CRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$SERVER = "root@92.113.33.226"
$BACKEND_PATH = "/var/www/biacrm/backend"
$FRONTEND_PATH = "/var/www/biacrm/frontend"

# ============================================
# VERIFICAR/CRIAR DIRETÓRIOS NO SERVIDOR
# ============================================
Write-Host "📁 Verificando/Criando diretórios no servidor..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha do servidor" -ForegroundColor Gray

# Criar diretórios via SSH
ssh $SERVER "mkdir -p ${BACKEND_PATH}/dist && mkdir -p ${FRONTEND_PATH}/dist && echo 'Diretórios criados/verificados'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Não foi possível criar os diretórios automaticamente." -ForegroundColor Yellow
    Write-Host "   Execute manualmente no servidor:" -ForegroundColor Yellow
    Write-Host "   ssh ${SERVER}" -ForegroundColor White
    Write-Host "   mkdir -p ${BACKEND_PATH}/dist" -ForegroundColor White
    Write-Host "   mkdir -p ${FRONTEND_PATH}/dist" -ForegroundColor White
    Write-Host ""
    $continuar = Read-Host "Deseja continuar mesmo assim? (S/N)"
    if ($continuar -ne "S" -and $continuar -ne "s") {
        exit 1
    }
}

# ============================================
# UPLOAD DO BACKEND
# ============================================
Write-Host ""
Write-Host "📤 Enviando arquivos do backend..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha do servidor" -ForegroundColor Gray

# Enviar arquivos compilados (sem o /* para evitar erro se diretório não existir)
scp -r backend/dist root@92.113.33.226:/var/www/biacrm/backend/

# Enviar package.json
scp backend/package.json "${SERVER}:${BACKEND_PATH}/"

# Enviar package-lock.json
scp backend/package-lock.json "${SERVER}:${BACKEND_PATH}/"

Write-Host "✅ Backend enviado!" -ForegroundColor Green

# ============================================
# UPLOAD DO FRONTEND
# ============================================
Write-Host ""
Write-Host "📤 Enviando arquivos do frontend..." -ForegroundColor Yellow
Write-Host "   Você precisará inserir a senha do servidor" -ForegroundColor Gray

# Enviar arquivos do build (sem o /* para evitar erro se diretório não existir)
scp -r frontend/dist root@92.113.33.226:/var/www/biacrm/frontend/

Write-Host "✅ Frontend enviado!" -ForegroundColor Green

# ============================================
# RESUMO
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos no servidor:" -ForegroundColor Yellow
Write-Host "1. Conectar: ssh ${SERVER}" -ForegroundColor White
Write-Host "2. Instalar dependências: cd ${BACKEND_PATH} && npm install --production" -ForegroundColor White
Write-Host "3. Executar migrações (se necessário): npm run migrate" -ForegroundColor White
Write-Host "4. Reiniciar o servidor backend: npm start" -ForegroundColor White
Write-Host ""








