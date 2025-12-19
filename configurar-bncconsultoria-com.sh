#!/bin/bash

# Script para configurar bncconsultoria.com para servir a página da BNC Consultoria

set -e

NGINX_CONFIG="/etc/nginx/sites-available/bncconsultoria.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"
BACKUP_DIR="/tmp/nginx-backups"

echo "========================================"
echo "  CONFIGURAR BNCCONSULTORIA.COM"
echo "========================================"
echo ""

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Verificar se index.html existe
if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ index.html não encontrado em $FRONTEND_PATH"
    echo "   Você precisa enviar o build primeiro!"
    exit 1
fi
echo "✅ index.html encontrado"
echo ""

# Criar configuração do Nginx para bncconsultoria.com
echo "📝 Criando configuração do Nginx para bncconsultoria.com..."

# Fazer backup se já existir
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="$BACKUP_DIR/bncconsultoria-com-$(date +%Y%m%d-%H%M%S).conf"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✅ Backup criado: $BACKUP_FILE"
fi

# Criar configuração
cat > "$NGINX_CONFIG" << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name bncconsultoria.com www.bncconsultoria.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bncconsultoria.com www.bncconsultoria.com;
    
    root /domains/biacrm.com/public_html;
    index index.html;

    # SSL Configuration - AJUSTAR CONFORME NECESSÁRIO
    # ssl_certificate /path/to/bncconsultoria.com/cert.pem;
    # ssl_certificate_key /path/to/bncconsultoria.com/key.pem;
    # ssl_protocols TLSv1.2 TLSv1.3;
    # ssl_ciphers HIGH:!aNULL:!MD5;

    # Servir arquivos estáticos PRIMEIRO
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map)$ {
        root /domains/biacrm.com/public_html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Redirecionar raiz para /bncconsultoria
    location = / {
        return 301 /bncconsultoria;
    }

    # SPA Routing - redireciona todas as rotas para index.html
    # Isso permite que /bncconsultoria funcione corretamente
    location / {
        root /domains/biacrm.com/public_html;
        try_files $uri $uri/ /index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
NGINX_EOF

echo "✅ Configuração criada"
echo ""

# Criar link simbólico se não existir
if [ ! -L "/etc/nginx/sites-enabled/bncconsultoria.com" ]; then
    echo "📝 Criando link simbólico..."
    ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/bncconsultoria.com
    echo "✅ Link simbólico criado"
else
    echo "✅ Link simbólico já existe"
fi
echo ""

# Validar configuração
echo "📝 Validando configuração..."
if nginx -t; then
    echo "✅ Configuração válida!"
    echo ""
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado!"
    echo ""
    
    echo "========================================"
    echo "  ✅ CONFIGURAÇÃO CONCLUÍDA!"
    echo "========================================"
    echo ""
    echo "⚠️  IMPORTANTE: Configure o SSL para bncconsultoria.com"
    echo ""
    echo "1. Obtenha certificado SSL (Let's Encrypt):"
    echo "   certbot --nginx -d bncconsultoria.com -d www.bncconsultoria.com"
    echo ""
    echo "2. Ou configure manualmente em:"
    echo "   $NGINX_CONFIG"
    echo ""
    echo "3. Após configurar SSL, edite o arquivo e descomente as linhas SSL"
    echo ""
    echo "Teste a configuração:"
    echo "  curl -I http://localhost/bncconsultoria"
    echo ""
else
    echo "❌ Erro na configuração!"
    if [ -f "$BACKUP_FILE" ]; then
        echo "Restaurando backup..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
    fi
    exit 1
fi

echo "✅ Processo concluído!"

