# Script para adicionar biacrm.com ao arquivo hosts
# Execute como Administrador

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$ip = "92.113.33.226"
$domain1 = "biacrm.com"
$domain2 = "www.biacrm.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ADICIONANDO ENTRADAS AO HOSTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botão direito e escolha 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green
Write-Host ""

# Ler arquivo hosts atual
Write-Host "Lendo arquivo hosts..." -ForegroundColor Yellow
$hostsContent = Get-Content $hostsPath -ErrorAction Stop

# Verificar se já existe
$alreadyExists = $hostsContent | Select-String -Pattern $domain1 -Quiet

if ($alreadyExists) {
    Write-Host "⚠️  Entrada já existe no arquivo hosts" -ForegroundColor Yellow
    Write-Host "   Removendo entradas antigas..." -ForegroundColor Gray
    
    # Remover entradas antigas
    $hostsContent = $hostsContent | Where-Object { $_ -notmatch $domain1 }
}

# Adicionar novas entradas
Write-Host "Adicionando novas entradas..." -ForegroundColor Yellow
$hostsContent += ""
$hostsContent += "# BIA CRM - Adicionado automaticamente"
$hostsContent += "$ip    $domain1"
$hostsContent += "$ip    $domain2"

# Salvar arquivo
Write-Host "Salvando arquivo hosts..." -ForegroundColor Yellow
$hostsContent | Set-Content $hostsPath -Encoding UTF8

Write-Host "✅ Entradas adicionadas com sucesso!" -ForegroundColor Green
Write-Host ""

# Limpar cache DNS
Write-Host "Limpando cache DNS..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "✅ Cache DNS limpo!" -ForegroundColor Green
Write-Host ""

# Verificar
Write-Host "Verificando resolução..." -ForegroundColor Yellow
$result = Test-NetConnection -ComputerName $domain1 -Port 80 -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null

if ($result) {
    Write-Host "✅ Domínio resolvendo corretamente!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Teste de conexão não funcionou, mas o hosts foi configurado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Feche TODOS os navegadores completamente" -ForegroundColor White
Write-Host "2. Abra o navegador novamente" -ForegroundColor White
Write-Host "3. Acesse: https://biacrm.com" -ForegroundColor White
Write-Host "4. Pressione Ctrl+Shift+R para limpar cache do navegador" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: Isso só funciona neste computador." -ForegroundColor Yellow
Write-Host "      Para outros usuários, aguarde a propagação DNS." -ForegroundColor Yellow
Write-Host ""

pause








