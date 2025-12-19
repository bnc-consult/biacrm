#!/bin/bash

# Script simples para adicionar try_files ao Nginx para rotas SPA

set -e

NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
BACKUP_DIR="/tmp/nginx-backups"

echo "========================================"
echo "  CORRIGIR NGINX PARA ROTAS SPA"
echo "========================================"
echo ""

# Criar backup
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/nginx-config-$(date +%Y%m%d-%H%M%S).conf"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se já tem try_files
if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
    echo "⚠️  try_files já existe, mas vamos garantir que está correto..."
    
    # Verificar se está correto
    if grep -q "try_files \$uri \$uri/ /index.html" "$NGINX_CONFIG"; then
        echo "✅ try_files está correto!"
        echo ""
        echo "Testando configuração..."
        if nginx -t; then
            echo "✅ Configuração válida!"
            echo ""
            echo "Recarregando Nginx..."
            systemctl reload nginx
            echo "✅ Nginx recarregado!"
            echo ""
            echo "Teste as URLs:"
            echo "  curl -I http://localhost/terms-of-service"
            echo "  curl -I http://localhost/privacy-policy"
            exit 0
        fi
    else
        echo "📝 Corrigindo try_files..."
        # Substituir try_files incorreto
        sed -i 's/try_files.*index.html/try_files $uri $uri\/ \/index.html;/g' "$NGINX_CONFIG"
    fi
else
    echo "📝 Adicionando try_files para rotas SPA..."
    
    # Procurar por location / e adicionar try_files dentro dele
    # Usar uma abordagem mais segura com awk
    TEMP_FILE=$(mktemp)
    IN_LOCATION_ROOT=0
    
    while IFS= read -r line; do
        # Detectar início de location /
        if echo "$line" | grep -qE "^\s*location\s+/\s*\{"; then
            IN_LOCATION_ROOT=1
            echo "$line" >> "$TEMP_FILE"
            continue
        fi
        
        # Dentro do location /, adicionar try_files antes do fechamento
        if [ $IN_LOCATION_ROOT -eq 1 ]; then
            # Se encontrou o fechamento do location /, adicionar try_files antes
            if echo "$line" | grep -qE "^\s*\}"; then
                # Verificar se já tem root dentro do location
                if ! grep -q "root" "$TEMP_FILE" | tail -10; then
                    echo "        root /domains/biacrm.com/public_html;" >> "$TEMP_FILE"
                fi
                echo "        try_files \$uri \$uri/ /index.html;" >> "$TEMP_FILE"
                IN_LOCATION_ROOT=0
            fi
        fi
        
        echo "$line" >> "$TEMP_FILE"
    done < "$NGINX_CONFIG"
    
    mv "$TEMP_FILE" "$NGINX_CONFIG"
fi

# Verificar se location / existe, se não, adicionar
if ! grep -qE "^\s*location\s+/\s*\{" "$NGINX_CONFIG"; then
    echo "⚠️  location / não encontrado, adicionando..."
    
    # Adicionar após o root ou antes do último }
    TEMP_FILE=$(mktemp)
    ADDED=0
    
    while IFS= read -r line; do
        echo "$line" >> "$TEMP_FILE"
        
        # Adicionar após encontrar root
        if echo "$line" | grep -qE "^\s*root\s+" && [ $ADDED -eq 0 ]; then
            echo "" >> "$TEMP_FILE"
            echo "    # SPA Routing - redireciona todas as rotas para index.html" >> "$TEMP_FILE"
            echo "    location / {" >> "$TEMP_FILE"
            echo "        try_files \$uri \$uri/ /index.html;" >> "$TEMP_FILE"
            echo "    }" >> "$TEMP_FILE"
            ADDED=1
        fi
    done < "$NGINX_CONFIG"
    
    mv "$TEMP_FILE" "$NGINX_CONFIG"
fi

# Validar e aplicar
echo ""
echo "📝 Validando configuração..."
if nginx -t; then
    echo "✅ Configuração válida!"
    echo ""
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado!"
    echo ""
    
    echo "🧪 Testando rotas..."
    sleep 1
    TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/terms-of-service 2>/dev/null || echo "000")
    PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/privacy-policy 2>/dev/null || echo "000")
    
    echo "   /terms-of-service: $TERMS_STATUS"
    echo "   /privacy-policy: $PRIVACY_STATUS"
    echo ""
    
    echo "========================================"
    echo "  ✅ CONFIGURAÇÃO CORRIGIDA!"
    echo "========================================"
    echo ""
    echo "Teste as URLs em produção:"
    echo "  https://biacrm.com/terms-of-service"
    echo "  https://biacrm.com/privacy-policy"
    echo ""
else
    echo "❌ Erro na configuração! Restaurando backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

echo "✅ Processo concluído!"

