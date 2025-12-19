#!/bin/bash
# Script definitivo para corrigir redirecionamento do Facebook

echo "========================================"
echo "  CORREÇÃO DEFINITIVA REDIRECIONAMENTO"
echo "========================================"
echo ""

BACKEND_PATH="/var/www/biacrm/api"

# 1. Verificar e garantir que CORS_ORIGIN está no .env
echo "1. Verificando .env..."
if [ -f "$BACKEND_PATH/.env" ]; then
    # Remover linhas comentadas duplicadas
    sed -i '/^#CORS_ORIGIN=/d' "$BACKEND_PATH/.env"
    sed -i '/^#FRONTEND_URL=/d' "$BACKEND_PATH/.env"
    
    # Garantir que CORS_ORIGIN está definido e não comentado
    if ! grep -q "^CORS_ORIGIN=https://biacrm.com" "$BACKEND_PATH/.env"; then
        # Remover qualquer CORS_ORIGIN existente (mesmo comentado)
        sed -i '/^CORS_ORIGIN=/d' "$BACKEND_PATH/.env"
        # Adicionar no final
        echo "" >> "$BACKEND_PATH/.env"
        echo "# Frontend URL para redirecionamento" >> "$BACKEND_PATH/.env"
        echo "CORS_ORIGIN=https://biacrm.com" >> "$BACKEND_PATH/.env"
        echo "✅ CORS_ORIGIN adicionado ao .env"
    else
        echo "✅ CORS_ORIGIN já está definido corretamente"
    fi
    
    # Garantir que FRONTEND_URL está definido
    if ! grep -q "^FRONTEND_URL=https://biacrm.com" "$BACKEND_PATH/.env"; then
        sed -i '/^FRONTEND_URL=/d' "$BACKEND_PATH/.env"
        echo "FRONTEND_URL=https://biacrm.com" >> "$BACKEND_PATH/.env"
        echo "✅ FRONTEND_URL adicionado ao .env"
    else
        echo "✅ FRONTEND_URL já está definido corretamente"
    fi
    
    # Garantir que NODE_ENV está definido como production
    if ! grep -q "^NODE_ENV=production" "$BACKEND_PATH/.env"; then
        sed -i '/^NODE_ENV=/d' "$BACKEND_PATH/.env"
        echo "NODE_ENV=production" >> "$BACKEND_PATH/.env"
        echo "✅ NODE_ENV=production adicionado ao .env"
    else
        echo "✅ NODE_ENV já está definido como production"
    fi
    
    echo ""
    echo "Variáveis finais no .env:"
    grep -E "^CORS_ORIGIN=|^FRONTEND_URL=|^NODE_ENV=" "$BACKEND_PATH/.env"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo ""

# 2. Verificar código compilado
echo "2. Verificando código compilado..."
if [ -f "$BACKEND_PATH/dist/routes/facebook.js" ]; then
    LOCALHOST_COUNT=$(grep -c "localhost:5173" "$BACKEND_PATH/dist/routes/facebook.js" || echo "0")
    echo "Ocorrências de localhost:5173: $LOCALHOST_COUNT"
    
    if [ "$LOCALHOST_COUNT" -gt 0 ]; then
        echo "⚠️ Código compilado ainda tem localhost:5173"
        echo "   Isso é normal se for usado apenas como fallback em desenvolvimento"
        echo "   O importante é que use CORS_ORIGIN quando definido"
    fi
else
    echo "❌ Arquivo facebook.js não encontrado!"
    exit 1
fi

echo ""

# 3. Verificar se PM2 está carregando variáveis do .env
echo "3. Verificando configuração do PM2..."
pm2 show biacrm-backend | grep -E "exec_mode|env:" || echo "PM2 não está mostrando variáveis de ambiente"
echo ""

# 4. Reiniciar PM2 com --update-env para carregar novas variáveis
echo "4. Reiniciando PM2 com --update-env..."
pm2 restart biacrm-backend --update-env
sleep 3
pm2 status biacrm-backend
echo ""

# 5. Verificar se backend está rodando
echo "5. Verificando se backend está respondendo..."
curl -s http://localhost:3000/health && echo "" || echo "❌ Backend não responde"
echo ""

# 6. Testar variáveis de ambiente
echo "6. Testando se variáveis estão sendo carregadas..."
echo "Execute este comando para verificar:"
echo "  pm2 logs biacrm-backend --lines 100 | grep -E 'CORS_ORIGIN|FRONTEND_URL|NODE_ENV'"
echo ""

echo "========================================"
echo "  ✅ CORREÇÃO APLICADA!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Tente conectar com o Facebook novamente"
echo "2. Verifique os logs: pm2 logs biacrm-backend --lines 100 | grep 'Frontend URL'"
echo "3. Os logs devem mostrar:"
echo "   - CORS_ORIGIN: https://biacrm.com"
echo "   - FRONTEND_URL: https://biacrm.com"
echo "   - URL final de redirecionamento: https://biacrm.com"
echo ""


