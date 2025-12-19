#!/bin/bash

# Script completo para corrigir problemas de rotas SPA
# Faz tudo automaticamente: verifica, corrige e testa

set -e

NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"
BACKUP_DIR="/tmp/nginx-backups"

echo "========================================"
echo "  CORREÇÃO COMPLETA: ROTAS SPA"
echo "========================================"
echo ""

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# 1. Verificar se index.html existe
echo "1. Verificando arquivos do frontend..."
if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ index.html não encontrado em $FRONTEND_PATH"
    echo "   Você precisa enviar os arquivos do build primeiro!"
    echo ""
    echo "   Execute no seu computador:"
    echo "   scp -r frontend/dist/* root@92.113.33.226:$FRONTEND_PATH/"
    echo ""
    exit 1
fi
echo "✅ index.html encontrado"
echo ""

# 2. Verificar configuração atual do Nginx
echo "2. Verificando configuração atual do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONFIG"
    echo "   Procurando configurações alternativas..."
    find /etc/nginx -name "*biacrm*" -type f 2>/dev/null | head -5
    exit 1
fi

# Fazer backup
BACKUP_FILE="$BACKUP_DIR/nginx-config-$(date +%Y%m%d-%H%M%S).conf"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 3. Verificar se já está configurado corretamente
HAS_TRY_FILES=$(grep -c "try_files.*index.html" "$NGINX_CONFIG" || echo "0")
HAS_STATIC_FILES=$(grep -c "location ~\* \\\\.(js|css" "$NGINX_CONFIG" || echo "0")

if [ "$HAS_TRY_FILES" -gt 0 ] && [ "$HAS_STATIC_FILES" -gt 0 ]; then
    echo "⚠️  Configuração parece estar correta, mas vamos verificar e garantir..."
    echo ""
fi

# 4. Criar configuração corrigida
echo "3. Criando configuração corrigida..."

# Ler configuração atual para preservar SSL e outras configurações
SSL_CONFIG=$(grep -E "(ssl_certificate|ssl_trusted_certificate|ssl_protocols|ssl_ciphers|ssl_prefer_server_ciphers)" "$NGINX_CONFIG" || true)

# Criar configuração temporária
TEMP_CONFIG="/tmp/nginx-spa-fixed.conf"

cat > "$TEMP_CONFIG" << 'NGINX_EOF'
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name biacrm.com www.biacrm.com;
    
    root /domains/biacrm.com/public_html;
    index index.html;

    # SSL Configuration será preservada abaixo

    # CRÍTICO: Servir arquivos estáticos PRIMEIRO
    # Esta regra deve vir ANTES do location / para garantir que arquivos .js, .css sejam servidos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map)$ {
        root /domains/biacrm.com/public_html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # Garantir tipos MIME corretos
        types {
            application/javascript js;
            text/css css;
            image/png png;
            image/jpeg jpg jpeg;
            image/svg+xml svg;
            application/json json;
        }
    }

    # Proxy para API - deve vir ANTES do location /
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # SPA Routing - CRÍTICO para rotas como /terms-of-service e /privacy-policy
    # Esta regra redireciona TODAS as rotas que não são arquivos estáticos para index.html
    location / {
        root /domains/biacrm.com/public_html;
        try_files $uri $uri/ /index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache para HTML
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name biacrm.com www.biacrm.com;
    
    return 301 https://$server_name$request_uri;
}
NGINX_EOF

# Adicionar configurações SSL preservadas
if [ ! -z "$SSL_CONFIG" ]; then
    echo "" >> "$TEMP_CONFIG"
    echo "# Configurações SSL preservadas:" >> "$TEMP_CONFIG"
    echo "$SSL_CONFIG" >> "$TEMP_CONFIG"
fi

echo "✅ Configuração criada"
echo ""

# 5. Validar configuração
echo "4. Validando configuração..."
if nginx -t -c "$TEMP_CONFIG" 2>/dev/null; then
    echo "✅ Configuração válida!"
    echo ""
else
    echo "❌ Configuração inválida! Verificando erros..."
    nginx -t -c "$TEMP_CONFIG" 2>&1 | head -20
    echo ""
    echo "Restaurando backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# 6. Aplicar configuração
echo "5. Aplicando configuração..."
cp "$TEMP_CONFIG" "$NGINX_CONFIG"
echo "✅ Configuração aplicada"
echo ""

# 7. Testar configuração final
echo "6. Testando configuração final..."
if nginx -t; then
    echo "✅ Configuração válida!"
    echo ""
else
    echo "❌ Erro na configuração! Restaurando backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

# 8. Recarregar Nginx
echo "7. Recarregando Nginx..."
systemctl reload nginx
sleep 2
echo "✅ Nginx recarregado"
echo ""

# 9. Verificar permissões
echo "8. Verificando e corrigindo permissões..."
chmod 755 "$FRONTEND_PATH" 2>/dev/null || true
chmod 644 "$FRONTEND_PATH/index.html" 2>/dev/null || true
if [ -d "$FRONTEND_PATH/assets" ]; then
    chmod 755 "$FRONTEND_PATH/assets" 2>/dev/null || true
    chmod 644 "$FRONTEND_PATH/assets"/* 2>/dev/null || true
fi
echo "✅ Permissões verificadas"
echo ""

# 10. Testar rotas
echo "9. Testando rotas..."
sleep 1

echo "   Testando /..."
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$ROOT_STATUS" = "200" ]; then
    echo "   ✅ / retorna 200"
else
    echo "   ⚠️  / retorna $ROOT_STATUS"
fi

echo "   Testando /terms-of-service..."
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/terms-of-service || echo "000")
if [ "$TERMS_STATUS" = "200" ]; then
    echo "   ✅ /terms-of-service retorna 200"
else
    echo "   ⚠️  /terms-of-service retorna $TERMS_STATUS"
fi

echo "   Testando /privacy-policy..."
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/privacy-policy || echo "000")
if [ "$PRIVACY_STATUS" = "200" ]; then
    echo "   ✅ /privacy-policy retorna 200"
else
    echo "   ⚠️  /privacy-policy retorna $PRIVACY_STATUS"
fi
echo ""

# 11. Resumo final
echo "========================================"
echo "  ✅ CORREÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Configuração aplicada com sucesso!"
echo ""
echo "Teste as URLs:"
echo "  - https://biacrm.com/"
echo "  - https://biacrm.com/terms-of-service"
echo "  - https://biacrm.com/privacy-policy"
echo ""
echo "Se ainda não funcionar:"
echo "  1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "  2. Verifique os logs: tail -f /var/log/nginx/error.log"
echo "  3. Execute o diagnóstico: bash /tmp/diagnosticar-rotas-spa.sh"
echo ""
echo "Backup salvo em: $BACKUP_FILE"
echo ""

# Limpar arquivo temporário
rm -f "$TEMP_CONFIG"

