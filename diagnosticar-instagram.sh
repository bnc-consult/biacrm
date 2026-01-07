#!/bin/bash

echo "========================================"
echo "DIAGNOSTICAR INTEGRACAO INSTAGRAM"
echo "========================================"
echo ""

echo "1. Verificando arquivo instagram.js no servidor..."
echo ""
echo "Arquivo em /var/www/biacrm/api/routes/instagram.js:"
if [ -f "/var/www/biacrm/api/routes/instagram.js" ]; then
    echo "✅ Arquivo existe"
    echo "   Data: $(ls -lrt /var/www/biacrm/api/routes/instagram.js | awk '{print $6, $7, $8}')"
    echo "   Tamanho: $(ls -lh /var/www/biacrm/api/routes/instagram.js | awk '{print $5}')"
    echo ""
    echo "   Verificando permissões no código:"
    if grep -q "public_profile" /var/www/biacrm/api/routes/instagram.js; then
        echo "   ✅ public_profile encontrado"
    else
        echo "   ❌ public_profile NÃO encontrado"
    fi
    if grep -q "pages_show_list" /var/www/biacrm/api/routes/instagram.js; then
        echo "   ✅ pages_show_list encontrado"
    else
        echo "   ❌ pages_show_list NÃO encontrado"
    fi
else
    echo "❌ Arquivo NÃO existe"
fi

echo ""
echo "2. Verificando todas as instâncias do arquivo..."
find /var/www/biacrm/api -name "instagram.js" -type f -exec ls -lrt {} \;

echo ""
echo "3. Verificando qual arquivo o PM2 está executando..."
pm2 show biacrm-backend | grep -E "script path|exec cwd"

echo ""
echo "4. Últimas linhas dos logs do Instagram..."
pm2 logs biacrm-backend --lines 200 --nostream | grep -i "instagram\|scope\|oauth" | tail -20

echo ""
echo "5. Verificando código que constrói URL OAuth..."
if [ -f "/var/www/biacrm/api/routes/instagram.js" ]; then
    echo ""
    echo "   Buscando construção da URL OAuth:"
    grep -A 5 "scope=" /var/www/biacrm/api/routes/instagram.js | head -10
fi

echo ""
echo "========================================"
echo "✅ DIAGNOSTICO CONCLUIDO!"
echo "========================================"





