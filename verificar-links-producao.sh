#!/bin/bash

# Script para verificar se os links de Termo de Serviço e Política de Privacidade estão funcionando em produção

echo "========================================"
echo "  VERIFICAR LINKS EM PRODUÇÃO"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

# 1. Verificar se os arquivos foram enviados
echo "1. Verificando se os arquivos do build foram enviados..."
if [ -f "$FRONTEND_PATH/index.html" ]; then
    echo "✅ index.html existe"
    echo "   Data de modificação: $(stat -c %y "$FRONTEND_PATH/index.html" 2>/dev/null || stat -f "%Sm" "$FRONTEND_PATH/index.html")"
else
    echo "❌ index.html NÃO existe!"
fi
echo ""

# 2. Verificar se as rotas estão no código
echo "2. Verificando se as rotas estão no código..."
if grep -q "terms-of-service\|privacy-policy" "$FRONTEND_PATH/index.html" 2>/dev/null; then
    echo "✅ Rotas encontradas no HTML"
else
    echo "⚠️  Rotas não encontradas no HTML (pode ser normal se estiverem no JS)"
fi

# Verificar nos arquivos JS
JS_FILE=$(find "$FRONTEND_PATH/assets" -name "*.js" -type f | head -1)
if [ -f "$JS_FILE" ]; then
    echo "   Verificando arquivo JS: $(basename "$JS_FILE")"
    if grep -q "terms-of-service\|privacy-policy\|Termos\|Política" "$JS_FILE" 2>/dev/null; then
        echo "✅ Referências encontradas no JS"
    else
        echo "⚠️  Referências não encontradas no JS"
    fi
fi
echo ""

# 3. Testar se as rotas respondem corretamente
echo "3. Testando rotas..."
echo "   Testando /terms-of-service..."
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://biacrm.com/terms-of-service 2>/dev/null || echo "000")
if [ "$TERMS_STATUS" = "200" ]; then
    echo "   ✅ /terms-of-service retorna 200"
else
    echo "   ❌ /terms-of-service retorna $TERMS_STATUS"
fi

echo "   Testando /privacy-policy..."
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://biacrm.com/privacy-policy 2>/dev/null || echo "000")
if [ "$PRIVACY_STATUS" = "200" ]; then
    echo "   ✅ /privacy-policy retorna 200"
else
    echo "   ❌ /privacy-policy retorna $PRIVACY_STATUS"
fi
echo ""

# 4. Verificar configuração do Nginx
echo "4. Verificando configuração do Nginx..."
if grep -q "try_files.*index.html" /etc/nginx/sites-available/biacrm.com 2>/dev/null; then
    echo "✅ Nginx configurado para SPA (try_files encontrado)"
else
    echo "❌ Nginx NÃO configurado para SPA!"
    echo "   Execute: bash /tmp/corrigir-tudo-spa.sh"
fi
echo ""

# 5. Verificar se os componentes existem
echo "5. Verificando componentes React..."
if [ -f "$FRONTEND_PATH/assets"/*.js ]; then
    JS_SIZE=$(du -h "$FRONTEND_PATH/assets"/*.js 2>/dev/null | head -1 | awk '{print $1}')
    echo "   Arquivo JS encontrado: $JS_SIZE"
    
    # Verificar se contém referências aos componentes
    if grep -q "TermsOfService\|PrivacyPolicy" "$FRONTEND_PATH/assets"/*.js 2>/dev/null; then
        echo "   ✅ Componentes encontrados no JS"
    else
        echo "   ⚠️  Componentes não encontrados no JS"
    fi
fi
echo ""

# 6. Verificar permissões
echo "6. Verificando permissões..."
if [ -f "$FRONTEND_PATH/index.html" ]; then
    PERMS=$(stat -c %a "$FRONTEND_PATH/index.html" 2>/dev/null || stat -f "%OLp" "$FRONTEND_PATH/index.html")
    echo "   Permissões do index.html: $PERMS"
    if [ "$PERMS" = "644" ] || [ "$PERMS" = "755" ]; then
        echo "   ✅ Permissões corretas"
    else
        echo "   ⚠️  Permissões podem estar incorretas (deve ser 644)"
    fi
fi
echo ""

# 7. Resumo e recomendações
echo "========================================"
echo "  RESUMO E RECOMENDAÇÕES"
echo "========================================"
echo ""

if [ "$TERMS_STATUS" != "200" ] || [ "$PRIVACY_STATUS" != "200" ]; then
    echo "❌ PROBLEMA: Rotas não estão respondendo corretamente"
    echo ""
    echo "SOLUÇÕES:"
    echo ""
    echo "1. Verificar se o build foi enviado:"
    echo "   ls -lh $FRONTEND_PATH/index.html"
    echo ""
    echo "2. Corrigir configuração do Nginx para SPA:"
    echo "   bash /tmp/corrigir-tudo-spa.sh"
    echo ""
    echo "3. Verificar logs do Nginx:"
    echo "   tail -50 /var/log/nginx/error.log | grep -i 'terms\|privacy\|404'"
    echo ""
    echo "4. Reenviar build se necessário:"
    echo "   # No seu computador:"
    echo "   scp -r frontend/dist/* root@92.113.33.226:$FRONTEND_PATH/"
    echo ""
else
    echo "✅ Rotas estão respondendo corretamente!"
    echo ""
    echo "Se os links não aparecem na interface:"
    echo "1. Limpe o cache do navegador (Ctrl+Shift+R)"
    echo "2. Verifique se o build mais recente foi enviado"
    echo "3. Verifique o console do navegador para erros JavaScript"
fi

echo ""
echo "✅ Verificação concluída!"

