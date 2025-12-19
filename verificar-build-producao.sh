#!/bin/bash

# Script para verificar se o build do frontend foi enviado e contém os links

echo "========================================"
echo "  VERIFICAR BUILD EM PRODUÇÃO"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

# 1. Verificar se index.html existe
echo "1. Verificando arquivos do frontend..."
if [ -f "$FRONTEND_PATH/index.html" ]; then
    echo "✅ index.html existe"
    MOD_DATE=$(stat -c %y "$FRONTEND_PATH/index.html" 2>/dev/null || stat -f "%Sm" "$FRONTEND_PATH/index.html")
    echo "   Data de modificação: $MOD_DATE"
else
    echo "❌ index.html NÃO existe!"
    echo "   Você precisa enviar o build primeiro!"
    exit 1
fi
echo ""

# 2. Verificar arquivos JS
echo "2. Verificando arquivos JavaScript..."
JS_FILES=$(find "$FRONTEND_PATH/assets" -name "*.js" -type f 2>/dev/null)
if [ -z "$JS_FILES" ]; then
    echo "❌ Nenhum arquivo JS encontrado em $FRONTEND_PATH/assets/"
    echo "   Você precisa enviar o build primeiro!"
    exit 1
else
    echo "✅ Arquivos JS encontrados:"
    for js in $JS_FILES; do
        SIZE=$(du -h "$js" | cut -f1)
        echo "   - $(basename "$js") ($SIZE)"
    done
fi
echo ""

# 3. Verificar se os componentes estão no build
echo "3. Verificando se componentes estão no build..."
JS_FILE=$(echo "$JS_FILES" | head -1)
if [ -f "$JS_FILE" ]; then
    echo "   Verificando arquivo: $(basename "$JS_FILE")"
    
    # Procurar por referências aos componentes
    if grep -q "TermsOfService\|PrivacyPolicy" "$JS_FILE" 2>/dev/null; then
        echo "   ✅ Componentes TermsOfService e PrivacyPolicy encontrados!"
    else
        echo "   ❌ Componentes NÃO encontrados no build!"
        echo "   O build precisa ser regenerado e enviado novamente."
    fi
    
    # Procurar por referências às rotas
    if grep -q "terms-of-service\|privacy-policy" "$JS_FILE" 2>/dev/null; then
        echo "   ✅ Rotas /terms-of-service e /privacy-policy encontradas!"
    else
        echo "   ⚠️  Rotas não encontradas explicitamente (pode ser normal)"
    fi
    
    # Procurar por links no código
    if grep -q "Termos de Serviço\|Política de Privacidade" "$JS_FILE" 2>/dev/null; then
        echo "   ✅ Textos dos links encontrados!"
    else
        echo "   ⚠️  Textos dos links não encontrados (pode estar minificado)"
    fi
fi
echo ""

# 4. Verificar se as rotas respondem
echo "4. Testando rotas..."
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/terms-of-service 2>/dev/null || echo "000")
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/privacy-policy 2>/dev/null || echo "000")

echo "   /terms-of-service: $TERMS_STATUS"
echo "   /privacy-policy: $PRIVACY_STATUS"

if [ "$TERMS_STATUS" = "200" ] && [ "$PRIVACY_STATUS" = "200" ]; then
    echo "   ✅ Rotas respondem corretamente!"
else
    echo "   ❌ Rotas não respondem corretamente!"
fi
echo ""

# 5. Verificar conteúdo HTML retornado
echo "5. Verificando conteúdo HTML retornado..."
TERMS_CONTENT=$(curl -s http://localhost/terms-of-service 2>/dev/null | head -20)
if echo "$TERMS_CONTENT" | grep -q "Termos de Serviço\|TermsOfService\|react"; then
    echo "   ✅ /terms-of-service retorna conteúdo HTML válido"
else
    echo "   ⚠️  /terms-of-service pode não estar retornando HTML correto"
    echo "   Primeiras linhas:"
    echo "$TERMS_CONTENT" | head -5
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
        echo "   ⚠️  Permissões podem estar incorretas"
    fi
fi
echo ""

# 7. Resumo e recomendações
echo "========================================"
echo "  RESUMO E RECOMENDAÇÕES"
echo "========================================"
echo ""

if ! grep -q "TermsOfService\|PrivacyPolicy" "$JS_FILE" 2>/dev/null; then
    echo "❌ PROBLEMA: Build não contém os componentes!"
    echo ""
    echo "SOLUÇÃO:"
    echo "1. Gerar novo build no seu computador:"
    echo "   cd frontend"
    echo "   npm run build"
    echo ""
    echo "2. Enviar build para produção:"
    echo "   scp -r frontend/dist/* root@92.113.33.226:$FRONTEND_PATH/"
    echo ""
    echo "3. Corrigir permissões:"
    echo "   chmod 755 $FRONTEND_PATH"
    echo "   find $FRONTEND_PATH -type d -exec chmod 755 {} \\;"
    echo "   find $FRONTEND_PATH -type f -exec chmod 644 {} \\;"
    echo ""
elif [ "$TERMS_STATUS" != "200" ] || [ "$PRIVACY_STATUS" != "200" ]; then
    echo "❌ PROBLEMA: Rotas não respondem corretamente!"
    echo ""
    echo "SOLUÇÃO:"
    echo "1. Verificar configuração do Nginx:"
    echo "   grep -A 3 'location /' /etc/nginx/sites-available/biacrm.com"
    echo ""
    echo "2. Verificar logs do Nginx:"
    echo "   tail -50 /var/log/nginx/error.log"
    echo ""
else
    echo "✅ Build parece estar correto e rotas funcionam!"
    echo ""
    echo "Se os links não aparecem na interface:"
    echo "1. Limpe o cache do navegador (Ctrl+Shift+R)"
    echo "2. Verifique o console do navegador (F12) para erros JavaScript"
    echo "3. Verifique se está usando o build mais recente"
    echo ""
    echo "Os links devem aparecer em:"
    echo "- Rodapé fixo na parte inferior da página"
    echo "- Rodapé da sidebar (quando expandida)"
    echo "- Página de login"
fi

echo ""
echo "✅ Verificação concluída!"

