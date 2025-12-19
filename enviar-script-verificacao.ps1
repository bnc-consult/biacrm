# Enviar script de verificação para o servidor
$SERVER = "root@92.113.33.226"
$PASSWORD = "IAbots2025-@+"

Write-Host "Enviando script de verificação para o servidor..." -ForegroundColor Yellow
Write-Host "Senha: $PASSWORD" -ForegroundColor Gray

scp verificar-frontend-completo.sh "${SERVER}:/tmp/"
scp descobrir-e-atualizar-frontend.sh "${SERVER}:/tmp/"

Write-Host ""
Write-Host "Agora execute no servidor:" -ForegroundColor Cyan
Write-Host "ssh $SERVER" -ForegroundColor White
Write-Host "bash /tmp/verificar-frontend-completo.sh" -ForegroundColor White
Write-Host ""



