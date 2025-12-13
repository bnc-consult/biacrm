#!/bin/bash
# Script para descobrir onde o frontend está e atualizá-lo
# Execute no servidor

echo "========================================"
echo "  DESCOBRINDO ONDE ESTÁ O FRONTEND"
echo "========================================"
echo ""

# 1. Verificar estrutura de diretórios
echo "1. Verificando /var/www/biacrm/"
ls -la /var/www/biacrm/
echo ""

# 2. Procurar index.html
echo "2. Procurando index.html do frontend..."
find /var/www -name "index.html" -type f 2>/dev/null | head -10
echo ""

# 3. Verificar configuração do Nginx
echo "3. Verificando configuração do Nginx..."
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "Arquivos de configuração do Nginx:"
    ls -la /etc/nginx/sites-enabled/
    echo ""
    echo "Conteúdo dos arquivos (procurando por biacrm):"
    grep -r "biacrm\|root\|location" /etc/nginx/sites-enabled/ 2>/dev/null | head -20
fi
echo ""

# 4. Verificar processos servindo frontend
echo "4. Processos que podem estar servindo o frontend:"
ps aux | grep -E "serve|vite|nginx|apache" | grep -v grep
echo ""

# 5. Verificar porta 80/443
echo "5. Processos nas portas 80 e 443:"
lsof -i :80 2>/dev/null || echo "Nenhum processo na porta 80"
lsof -i :443 2>/dev/null || echo "Nenhum processo na porta 443"
echo ""

echo "========================================"
echo "  PRÓXIMOS PASSOS"
echo "========================================"
echo ""
echo "Com base nas informações acima, identifique:"
echo "1. Onde está o index.html do frontend"
echo "2. Qual servidor web está servindo (Nginx/Apache)"
echo "3. Qual diretório está configurado no servidor web"
echo ""


