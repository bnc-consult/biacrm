#!/bin/bash
# Script para verificar e corrigir problemas do backend em produção

echo "========================================"
echo "  VERIFICAR BACKEND EM PRODUÇÃO"
echo "========================================"
echo ""

BACKEND_PATH="/var/www/biacrm/api"

# 1. Verificar se o backend está rodando
echo "1. Verificando processos do backend..."
pm2 list | grep biacrm-backend
echo ""

# 2. Verificar logs do PM2
echo "2. Últimas linhas dos logs do backend:"
pm2 logs biacrm-backend --lines 20 --nostream 2>/dev/null || echo "Erro ao ler logs do PM2"
echo ""

# 3. Verificar se a porta 3000 está em uso
echo "3. Verificando porta 3000..."
netstat -tulpn | grep :3000 || ss -tulpn | grep :3000
echo ""

# 4. Testar conexão local
echo "4. Testando conexão local do backend..."
curl -s http://localhost:3000/health || echo "❌ Backend não responde em localhost:3000"
echo ""

# 5. Verificar arquivo .env
echo "5. Verificando arquivo .env..."
if [ -f "$BACKEND_PATH/.env" ]; then
    echo "✅ Arquivo .env existe"
    echo ""
    echo "Conteúdo do .env (sem valores sensíveis):"
    grep -E "^[A-Z_]+=" "$BACKEND_PATH/.env" | sed 's/=.*/=***/' | head -20
    echo ""
    
    # Verificar variáveis importantes
    echo "Variáveis importantes:"
    if grep -q "FACEBOOK_APP_ID" "$BACKEND_PATH/.env"; then
        echo "  ✅ FACEBOOK_APP_ID definida"
    else
        echo "  ❌ FACEBOOK_APP_ID NÃO definida"
    fi
    
    if grep -q "FACEBOOK_APP_SECRET" "$BACKEND_PATH/.env"; then
        echo "  ✅ FACEBOOK_APP_SECRET definida"
    else
        echo "  ❌ FACEBOOK_APP_SECRET NÃO definida"
    fi
    
    if grep -q "JWT_SECRET" "$BACKEND_PATH/.env"; then
        echo "  ✅ JWT_SECRET definida"
    else
        echo "  ❌ JWT_SECRET NÃO definida"
    fi
    
    if grep -q "DATABASE" "$BACKEND_PATH/.env"; then
        echo "  ✅ DATABASE definida"
    else
        echo "  ❌ DATABASE NÃO definida"
    fi
else
    echo "❌ Arquivo .env NÃO existe em $BACKEND_PATH"
    echo "Criando arquivo .env básico..."
    cat > "$BACKEND_PATH/.env" << EOF
# Database
DATABASE_PATH=./database.sqlite

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Server
PORT=3000
NODE_ENV=production

# Facebook Integration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
EOF
    echo "✅ Arquivo .env criado (ATUALIZE OS VALORES!)"
fi
echo ""

# 6. Verificar configuração do Nginx
echo "6. Verificando configuração do Nginx para /api..."
grep -A 10 "location /api" /etc/nginx/sites-available/biacrm.com | head -15
echo ""

# 7. Verificar logs do Nginx
echo "7. Últimas linhas dos logs de erro do Nginx:"
tail -10 /var/log/nginx/error.log | grep -i "502\|upstream\|connect"
echo ""

# 8. Tentar reiniciar o backend
echo "8. Tentando reiniciar o backend..."
pm2 restart biacrm-backend
sleep 2
pm2 status biacrm-backend
echo ""

# 9. Teste final
echo "9. Teste final após reiniciar..."
sleep 2
curl -s http://localhost:3000/health && echo "✅ Backend respondendo!" || echo "❌ Backend ainda não responde"
echo ""

echo "========================================"
echo "  ✅ VERIFICAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Se o backend ainda não funcionar:"
echo "1. Verifique o arquivo .env: nano $BACKEND_PATH/.env"
echo "2. Verifique os logs: pm2 logs biacrm-backend"
echo "3. Verifique se há erros: pm2 logs biacrm-backend --err"
echo ""


