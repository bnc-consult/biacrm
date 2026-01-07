#!/bin/bash
# Script completo para verificar onde está o frontend

echo "========================================"
echo "  VERIFICAÇÃO COMPLETA DO FRONTEND"
echo "========================================"
echo ""

echo "1. Estrutura de /var/www/biacrm/"
ls -la /var/www/biacrm/
echo ""

echo "2. Procurando index.html..."
find /var/www -name "index.html" -type f 2>/dev/null
echo ""

echo "3. Configuração do Nginx..."
if [ -d "/etc/nginx/sites-enabled" ]; then
    for file in /etc/nginx/sites-enabled/*; do
        if [ -f "$file" ]; then
            echo "--- $file ---"
            cat "$file" | grep -A 10 -B 5 "biacrm\|root\|location"
            echo ""
        fi
    done
fi

echo "4. Processos nas portas web..."
echo "Porta 80:"
lsof -i :80 2>/dev/null || echo "Nenhum"
echo ""
echo "Porta 443:"
lsof -i :443 2>/dev/null || echo "Nenhum"
echo ""

echo "5. Verificando /var/www/html/"
if [ -d "/var/www/html" ]; then
    ls -la /var/www/html/ | head -20
fi
echo ""

echo "6. Verificando se há processo serve/vite rodando..."
ps aux | grep -E "serve|vite|node.*frontend" | grep -v grep
echo ""

echo "========================================"
echo "  ANÁLISE"
echo "========================================"
echo ""
echo "Com base nas informações acima, identifique:"
echo "- Onde está o index.html do frontend"
echo "- Qual servidor web está servindo (Nginx/Apache)"
echo "- Qual diretório root está configurado"
echo ""








