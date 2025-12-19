#!/bin/bash
# Verificar se o backend está servindo o frontend

echo "Verificando se o backend serve arquivos estáticos..."
echo ""

# Verificar arquivo index.ts do backend
if [ -f "/var/www/biacrm/api/dist/index.js" ]; then
    echo "=== Verificando se há configuração de arquivos estáticos no backend ==="
    grep -i "static\|express.static\|dist\|public" /var/www/biacrm/api/dist/index.js | head -5
fi

echo ""
echo "=== Verificando estrutura completa ==="
ls -la /var/www/biacrm/

echo ""
echo "=== Verificando se há diretório dist na raiz ==="
if [ -d "/var/www/biacrm/dist" ]; then
    echo "✅ /var/www/biacrm/dist existe"
    ls -la /var/www/biacrm/dist/
fi

echo ""
echo "=== Verificando configuração do Nginx completa ==="
cat /etc/nginx/sites-enabled/default 2>/dev/null | grep -A 10 -B 10 "biacrm\|root\|location"



