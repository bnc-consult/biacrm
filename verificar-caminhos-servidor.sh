#!/bin/bash
# Script para verificar os caminhos corretos no servidor
# Execute via SSH no servidor

echo "Verificando estrutura de diretórios no servidor..."
echo ""

echo "=== Estrutura em /var/www/biacrm/ ==="
ls -la /var/www/biacrm/

echo ""
echo "=== Verificando se existe dist/ ==="
if [ -d "/var/www/biacrm/dist" ]; then
    echo "✅ /var/www/biacrm/dist existe"
    ls -la /var/www/biacrm/dist/
else
    echo "❌ /var/www/biacrm/dist não existe"
fi

echo ""
echo "=== Verificando se existe frontend/ ==="
if [ -d "/var/www/biacrm/frontend" ]; then
    echo "✅ /var/www/biacrm/frontend existe"
    ls -la /var/www/biacrm/frontend/
else
    echo "❌ /var/www/biacrm/frontend não existe"
fi

echo ""
echo "=== Verificando configuração do Nginx/Apache ==="
echo "Procurando configurações que apontam para o frontend..."
grep -r "biacrm" /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nginx não encontrado ou sem permissão"
grep -r "biacrm" /etc/apache2/sites-enabled/ 2>/dev/null || echo "Apache não encontrado ou sem permissão"


