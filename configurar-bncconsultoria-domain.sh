#!/bin/bash

# Script para configurar o domínio bncconsultoria.com para servir a página da BNC Consultoria

set -e

NGINX_CONFIG="/etc/nginx/sites-available/bncconsultoria.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"
BACKUP_DIR="/tmp/nginx-backups"

echo "========================================"
echo "  CONFIGURAR DOMÍNIO BNCCONSULTORIA.COM"
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

# Verificar se já existe configuração
if [ -f "$NGINX_CONFIG" ]; then
    BACKUP_FILE="$BACKUP_DIR/bncconsultoria-config-$(date +%Y%m%d-%H%M%S).conf"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✅ Backup da configuração existente criado: $BACKUP_FILE"
fi

# Criar configuração do Nginx
cat > "$NGINX_CONFIG" << 'NGINX_EOF'
# Configuração para bncconsultoria.com
# Serve a mesma aplicação React do biacrm.com, mas com rota inicial para /bncconsultoria

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bncconsultoria.com www.bncconsultoria.com;
    
    root /domains/biacrm.com/public_html;
    index index.html;

    # SSL Configuration - você precisará configurar os certificados SSL para este domínio
    # ssl_certificate /path/to/bncconsultoria.com/cert.pem;
    # ssl_certificate_key /path/to/bncconsultoria.com/key.pem;

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
    # A aplicação React Router vai gerenciar as rotas
    location / {
        root /domains/biacrm.com/public_html;
        try_files $uri $uri/ /index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name bncconsultoria.com www.bncconsultoria.com;
    
    return 301 https://$server_name$request_uri;
}
NGINX_EOF

echo "✅ Configuração criada em $NGINX_CONFIG"
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
    echo "⚠️  IMPORTANTE: Você precisa configurar:"
    echo ""
    echo "1. DNS:"
    echo "   - Configure o DNS de bncconsultoria.com para apontar para o IP do servidor"
    echo "   - Adicione registro A: bncconsultoria.com -> 92.113.33.226"
    echo "   - Adicione registro A: www.bncconsultoria.com -> 92.113.33.226"
    echo ""
    echo "2. SSL Certificate:"
    echo "   - Configure certificado SSL para bncconsultoria.com"
    echo "   - Use Let's Encrypt: certbot --nginx -d bncconsultoria.com -d www.bncconsultoria.com"
    echo ""
    echo "3. Atualizar configuração do Nginx:"
    echo "   - Descomente e configure as linhas ssl_certificate no arquivo:"
    echo "     $NGINX_CONFIG"
    echo ""
    echo "Após configurar DNS e SSL, a página estará disponível em:"
    echo "  https://bncconsultoria.com/"
    echo ""
    echo "A página será redirecionada automaticamente para /bncconsultoria"
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

