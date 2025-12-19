#!/bin/bash

# Script para corrigir configuração do Nginx para rotas SPA (Single Page Application)
# Garante que rotas como /terms-of-service e /privacy-policy funcionem corretamente

set -e

NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"
BACKUP_DIR="/tmp/nginx-backups"

echo "========================================"
echo "CORRIGINDO NGINX PARA ROTAS SPA"
echo "========================================"
echo ""

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Fazer backup da configuração atual
BACKUP_FILE="$BACKUP_DIR/nginx-config-$(date +%Y%m%d-%H%M%S).conf"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONFIG"
    echo ""
    echo "Procurando configurações alternativas..."
    find /etc/nginx -name "*biacrm*" -type f 2>/dev/null | head -5
    exit 1
fi

echo "📝 Verificando configuração atual..."
echo ""

# Verificar se já tem a configuração correta
if grep -q "try_files.*index.html" "$NGINX_CONFIG" && grep -q "location ~\* \\\\.(js|css" "$NGINX_CONFIG"; then
    echo "⚠️  Configuração parece estar correta, mas vamos garantir..."
    echo ""
fi

# Criar configuração temporária corrigida
TEMP_CONFIG="/tmp/nginx-config-temp.conf"

# Ler configuração atual e criar versão corrigida
cat > "$TEMP_CONFIG" << 'NGINX_CONFIG_EOF'
# Configuração corrigida para SPA com suporte a rotas como /terms-of-service e /privacy-policy

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name biacrm.com www.biacrm.com;
    
    root /domains/biacrm.com/public_html;
    index index.html;

    # SSL Configuration (ajuste conforme necessário)
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;

    # IMPORTANTE: Servir arquivos estáticos ANTES da regra de SPA
    # Isso garante que arquivos .js, .css, imagens, etc. sejam servidos corretamente
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map)$ {
        root /domains/biacrm.com/public_html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Content-Type "";
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

    # Proxy para API - deve vir ANTES da regra de SPA
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
    # O React Router então gerencia o roteamento no lado do cliente
    location / {
        root /domains/biacrm.com/public_html;
        try_files $uri $uri/ /index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache para HTML (mas não muito longo para permitir atualizações)
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Redirecionar HTTP para HTTPS (se necessário)
    # if ($scheme != "https") {
    #     return 301 https://$server_name$request_uri;
    # }
}

# Configuração HTTP (redirecionar para HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name biacrm.com www.biacrm.com;
    
    return 301 https://$server_name$request_uri;
}
NGINX_CONFIG_EOF

echo "📋 Configuração corrigida criada em: $TEMP_CONFIG"
echo ""

# Verificar se a configuração está correta
echo "🔍 Validando configuração..."
if nginx -t -c "$TEMP_CONFIG" 2>/dev/null; then
    echo "✅ Configuração válida!"
    echo ""
    
    # Aplicar configuração
    echo "📝 Aplicando configuração..."
    
    # Tentar preservar configurações SSL existentes
    if grep -q "ssl_certificate" "$NGINX_CONFIG"; then
        echo "⚠️  Preservando configurações SSL existentes..."
        # Extrair linhas SSL e adicionar ao novo config
        grep -E "(ssl_certificate|ssl_trusted_certificate|ssl_protocols|ssl_ciphers|ssl_prefer_server_ciphers)" "$NGINX_CONFIG" >> "$TEMP_CONFIG" || true
    fi
    
    # Substituir configuração
    cp "$TEMP_CONFIG" "$NGINX_CONFIG"
    echo "✅ Configuração aplicada!"
    echo ""
    
    # Testar configuração final
    echo "🧪 Testando configuração final..."
    if nginx -t; then
        echo "✅ Configuração válida!"
        echo ""
        
        # Recarregar Nginx
        echo "🔄 Recarregando Nginx..."
        systemctl reload nginx
        echo "✅ Nginx recarregado!"
        echo ""
        
        echo "========================================"
        echo "✅ CONFIGURAÇÃO CORRIGIDA COM SUCESSO!"
        echo "========================================"
        echo ""
        echo "Agora as rotas SPA devem funcionar:"
        echo "  - https://biacrm.com/terms-of-service"
        echo "  - https://biacrm.com/privacy-policy"
        echo "  - https://biacrm.com/login"
        echo "  - https://biacrm.com/ (qualquer rota)"
        echo ""
        echo "Teste acessando:"
        echo "  curl -I https://biacrm.com/terms-of-service"
        echo ""
        echo "Deve retornar status 200 e Content-Type: text/html"
        echo ""
    else
        echo "❌ Erro na configuração! Restaurando backup..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        echo "✅ Backup restaurado"
        exit 1
    fi
else
    echo "❌ Configuração inválida! Não aplicando alterações."
    echo ""
    echo "Verifique o arquivo temporário: $TEMP_CONFIG"
    exit 1
fi

# Limpar arquivo temporário
rm -f "$TEMP_CONFIG"

echo "✅ Processo concluído!"

