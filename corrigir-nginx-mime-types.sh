#!/bin/bash
# Script para corrigir tipos MIME e configuração do Nginx

echo "========================================"
echo "  CORRIGINDO NGINX - TIPOS MIME"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"
NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"

echo "1. Verificando arquivos do frontend..."
if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ Erro: index.html não encontrado em $FRONTEND_PATH"
    exit 1
fi

echo "✅ index.html encontrado"
ls -lh $FRONTEND_PATH/index.html
echo ""

echo "2. Verificando arquivos JavaScript..."
JS_FILES=$(find $FRONTEND_PATH/assets -name "*.js" 2>/dev/null | head -3)
if [ -z "$JS_FILES" ]; then
    echo "❌ Erro: Nenhum arquivo JavaScript encontrado em $FRONTEND_PATH/assets/"
    exit 1
fi

echo "✅ Arquivos JavaScript encontrados:"
echo "$JS_FILES"
echo ""

echo "3. Verificando configuração atual do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Erro: Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

echo "Configuração atual:"
grep -A 20 "location /" $NGINX_CONFIG | head -25
echo ""

echo "4. Verificando tipos MIME no Nginx..."
if grep -q "types_hash_max_size" /etc/nginx/nginx.conf; then
    echo "✅ Configuração de tipos MIME encontrada"
else
    echo "⚠️ Configuração de tipos MIME não encontrada"
fi

echo ""
echo "5. Testando se os arquivos estão acessíveis..."
curl -I https://biacrm.com/assets/index-DeamxfB_.js 2>&1 | head -5
echo ""

echo "6. Verificando permissões dos arquivos..."
ls -lh $FRONTEND_PATH/assets/*.js | head -3
echo ""

echo "========================================"
echo "  PRÓXIMOS PASSOS"
echo "========================================"
echo ""
echo "Se os arquivos JavaScript retornarem HTML em vez de JavaScript,"
echo "a configuração do Nginx precisa ser ajustada."
echo ""
echo "Execute este comando para ver a configuração completa:"
echo "  cat $NGINX_CONFIG"
echo ""
echo "A configuração deve ter algo como:"
echo "  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {"
echo "    root $FRONTEND_PATH;"
echo "    expires 1y;"
echo "    add_header Cache-Control \"public, immutable\";"
echo "  }"
echo ""
echo "E a configuração de SPA routing deve ser:"
echo "  location / {"
echo "    try_files \$uri \$uri/ /index.html;"
echo "  }"
echo ""


