#!/bin/bash
# Script para verificar e corrigir redirecionamento do Facebook

echo "========================================"
echo "  VERIFICAR REDIRECIONAMENTO FACEBOOK"
echo "========================================"
echo ""

BACKEND_PATH="/var/www/biacrm/api"

# 1. Verificar variáveis no .env
echo "1. Verificando variáveis no .env..."
echo ""

if [ -f "$BACKEND_PATH/.env" ]; then
    echo "Variáveis relacionadas ao frontend:"
    grep -E "FRONTEND_URL|CORS_ORIGIN" "$BACKEND_PATH/.env" || echo "⚠️ Nenhuma variável encontrada!"
    echo ""
    
    # Verificar se CORS_ORIGIN está definido
    if grep -q "^CORS_ORIGIN=" "$BACKEND_PATH/.env"; then
        CORS_VALUE=$(grep "^CORS_ORIGIN=" "$BACKEND_PATH/.env" | cut -d'=' -f2)
        echo "✅ CORS_ORIGIN encontrado: $CORS_VALUE"
    else
        echo "❌ CORS_ORIGIN NÃO encontrado no .env"
        echo ""
        echo "Adicionando CORS_ORIGIN ao .env..."
        echo "" >> "$BACKEND_PATH/.env"
        echo "# Frontend URL para redirecionamento" >> "$BACKEND_PATH/.env"
        echo "CORS_ORIGIN=https://biacrm.com" >> "$BACKEND_PATH/.env"
        echo "✅ CORS_ORIGIN adicionado ao .env"
    fi
    
    # Verificar se FRONTEND_URL está definido
    if grep -q "^FRONTEND_URL=" "$BACKEND_PATH/.env"; then
        FRONTEND_VALUE=$(grep "^FRONTEND_URL=" "$BACKEND_PATH/.env" | cut -d'=' -f2)
        echo "✅ FRONTEND_URL encontrado: $FRONTEND_VALUE"
    else
        echo "⚠️ FRONTEND_URL não encontrado (usará CORS_ORIGIN como fallback)"
    fi
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo ""

# 2. Verificar código compilado
echo "2. Verificando código compilado..."
echo ""

if [ -f "$BACKEND_PATH/dist/routes/facebook.js" ]; then
    echo "Verificando se o código usa CORS_ORIGIN..."
    if grep -q "CORS_ORIGIN" "$BACKEND_PATH/dist/routes/facebook.js"; then
        echo "✅ Código compilado usa CORS_ORIGIN"
    else
        echo "❌ Código compilado NÃO usa CORS_ORIGIN - precisa recompilar!"
    fi
    
    echo ""
    echo "Verificando ocorrências de localhost:5173..."
    LOCALHOST_COUNT=$(grep -c "localhost:5173" "$BACKEND_PATH/dist/routes/facebook.js" || echo "0")
    if [ "$LOCALHOST_COUNT" -gt 0 ]; then
        echo "⚠️ Encontradas $LOCALHOST_COUNT ocorrências de localhost:5173 no código compilado"
        echo "   Isso indica que o código antigo ainda está sendo usado"
    else
        echo "✅ Nenhuma ocorrência de localhost:5173 encontrada"
    fi
else
    echo "❌ Arquivo facebook.js não encontrado!"
    exit 1
fi

echo ""

# 3. Verificar logs recentes
echo "3. Verificando logs recentes do backend..."
echo ""
pm2 logs biacrm-backend --lines 30 --nostream 2>/dev/null | grep -i "frontend url\|cors_origin" || echo "Nenhum log relacionado encontrado"
echo ""

# 4. Reiniciar backend para carregar novas variáveis
echo "4. Reiniciando backend para carregar variáveis do .env..."
pm2 restart biacrm-backend
sleep 2
pm2 status biacrm-backend
echo ""

# 5. Teste
echo "5. Testando endpoint de health..."
curl -s http://localhost:3000/health && echo "" || echo "❌ Backend não responde"
echo ""

echo "========================================"
echo "  ✅ VERIFICAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Tente conectar com o Facebook novamente"
echo "2. Verifique os logs: pm2 logs biacrm-backend --lines 50 | grep 'Frontend URL'"
echo "3. Se ainda redirecionar para localhost, verifique se o arquivo foi enviado corretamente"
echo ""







