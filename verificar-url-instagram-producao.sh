#!/bin/bash

echo "========================================"
echo "VERIFICAR URL INSTAGRAM EM PRODUÇÃO"
echo "========================================"
echo ""

echo "1. Verificando variável INSTAGRAM_REDIRECT_URI no .env..."
if grep -q "INSTAGRAM_REDIRECT_URI" /var/www/biacrm/api/.env; then
    echo "✅ INSTAGRAM_REDIRECT_URI encontrada:"
    grep "INSTAGRAM_REDIRECT_URI" /var/www/biacrm/api/.env | grep -v "^#"
else
    echo "⚠️ INSTAGRAM_REDIRECT_URI não encontrada no .env"
fi

echo ""
echo "2. Verificando variável FACEBOOK_REDIRECT_URI no .env..."
if grep -q "FACEBOOK_REDIRECT_URI" /var/www/biacrm/api/.env; then
    echo "✅ FACEBOOK_REDIRECT_URI encontrada:"
    grep "FACEBOOK_REDIRECT_URI" /var/www/biacrm/api/.env | grep -v "^#"
else
    echo "⚠️ FACEBOOK_REDIRECT_URI não encontrada no .env"
fi

echo ""
echo "3. Verificando código compilado..."
if [ -f "/var/www/biacrm/api/dist/routes/instagram.js" ]; then
    echo "✅ Arquivo instagram.js encontrado"
    echo ""
    echo "Buscando INSTAGRAM_REDIRECT_URI no código:"
    grep -n "INSTAGRAM_REDIRECT_URI\|instagram.*callback" /var/www/biacrm/api/dist/routes/instagram.js | head -5
else
    echo "❌ Arquivo instagram.js não encontrado"
fi

echo ""
echo "4. Últimas linhas dos logs do backend (pode mostrar a URL sendo usada):"
pm2 logs biacrm-backend --lines 50 --nostream | grep -i "redirect\|instagram\|callback" | tail -10

echo ""
echo "========================================"
echo "✅ VERIFICAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "URL esperada no Facebook App:"
echo "https://biacrm.com/api/integrations/instagram/callback"
echo ""
echo "Se a URL no .env for diferente, atualize para:"
echo "INSTAGRAM_REDIRECT_URI=https://biacrm.com/api/integrations/instagram/callback"
echo ""
echo "Depois reinicie o backend:"
echo "pm2 restart biacrm-backend --update-env"





