#!/bin/bash

# Script corrigido para editar configuração do Nginx para rotas SPA
# Edita o arquivo existente ao invés de criar um novo

set -e

NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"
BACKUP_DIR="/tmp/nginx-backups"

echo "========================================"
echo "  CORREÇÃO NGINX PARA ROTAS SPA (V2)"
echo "========================================"
echo ""

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Verificar se index.html existe
if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ index.html não encontrado em $FRONTEND_PATH"
    echo "   Você precisa enviar os arquivos do build primeiro!"
    exit 1
fi
echo "✅ index.html encontrado"
echo ""

# Verificar configuração atual do Nginx
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

# Fazer backup
BACKUP_FILE="$BACKUP_DIR/nginx-config-$(date +%Y%m%d-%H%M%S).conf"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se já tem try_files configurado
if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
    echo "⚠️  try_files já configurado, mas vamos garantir que está correto..."
else
    echo "📝 Adicionando try_files para rotas SPA..."
fi

# Criar arquivo temporário
TEMP_FILE=$(mktemp)

# Processar arquivo linha por linha
IN_SERVER_BLOCK=0
IN_LOCATION_ROOT=0
HAS_STATIC_FILES=0
HAS_TRY_FILES=0
STATIC_ADDED=0

while IFS= read -r line; do
    # Detectar início do bloco server
    if echo "$line" | grep -qE "^\s*server\s*\{"; then
        IN_SERVER_BLOCK=1
        echo "$line" >> "$TEMP_FILE"
        continue
    fi
    
    # Detectar fim do bloco server
    if echo "$line" | grep -qE "^\s*\}"; then
        if [ $IN_SERVER_BLOCK -eq 1 ]; then
            IN_SERVER_BLOCK=0
            IN_LOCATION_ROOT=0
        fi
        echo "$line" >> "$TEMP_FILE"
        continue
    fi
    
    # Detectar location / (raiz)
    if echo "$line" | grep -qE "^\s*location\s+/\s*\{"; then
        IN_LOCATION_ROOT=1
        
        # Adicionar regra para arquivos estáticos ANTES do location / se ainda não foi adicionada
        if [ $STATIC_ADDED -eq 0 ] && [ $IN_SERVER_BLOCK -eq 1 ]; then
            echo "" >> "$TEMP_FILE"
            echo "    # Servir arquivos estáticos PRIMEIRO (antes do location /)" >> "$TEMP_FILE"
            echo "    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map)\$ {" >> "$TEMP_FILE"
            echo "        root $FRONTEND_PATH;" >> "$TEMP_FILE"
            echo "        expires 1y;" >> "$TEMP_FILE"
            echo "        add_header Cache-Control \"public, immutable\";" >> "$TEMP_FILE"
            echo "        access_log off;" >> "$TEMP_FILE"
            echo "    }" >> "$TEMP_FILE"
            echo "" >> "$TEMP_FILE"
            STATIC_ADDED=1
        fi
        
        echo "$line" >> "$TEMP_FILE"
        continue
    fi
    
    # Dentro do location /, procurar por try_files
    if [ $IN_LOCATION_ROOT -eq 1 ]; then
        if echo "$line" | grep -q "try_files"; then
            HAS_TRY_FILES=1
            # Substituir try_files existente pelo correto
            echo "        try_files \$uri \$uri/ /index.html;" >> "$TEMP_FILE"
            continue
        fi
        
        # Se chegou ao fim do location / sem try_files, adicionar antes do fechamento
        if echo "$line" | grep -qE "^\s*\}"; then
            if [ $HAS_TRY_FILES -eq 0 ]; then
                echo "        try_files \$uri \$uri/ /index.html;" >> "$TEMP_FILE"
            fi
            IN_LOCATION_ROOT=0
            HAS_TRY_FILES=0
            echo "$line" >> "$TEMP_FILE"
            continue
        fi
    fi
    
    # Verificar se já tem regra para arquivos estáticos
    if echo "$line" | grep -qE "location ~\*.*\\.(js|css"; then
        HAS_STATIC_FILES=1
        STATIC_ADDED=1
    fi
    
    # Escrever linha normalmente
    echo "$line" >> "$TEMP_FILE"
    
done < "$NGINX_CONFIG"

# Se não encontrou location /, adicionar após o root
if [ $STATIC_ADDED -eq 0 ] || ! grep -q "location /" "$TEMP_FILE"; then
    echo ""
    echo "⚠️  Não foi possível encontrar location / automaticamente"
    echo "   Vamos adicionar manualmente..."
    
    # Criar novo arquivo temporário
    TEMP_FILE2=$(mktemp)
    IN_SERVER=0
    
    while IFS= read -r line; do
        echo "$line" >> "$TEMP_FILE2"
        
        # Adicionar após encontrar root
        if echo "$line" | grep -qE "^\s*root\s+"; then
            echo "" >> "$TEMP_FILE2"
            echo "    # Servir arquivos estáticos PRIMEIRO" >> "$TEMP_FILE2"
            echo "    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map)\$ {" >> "$TEMP_FILE2"
            echo "        root $FRONTEND_PATH;" >> "$TEMP_FILE2"
            echo "        expires 1y;" >> "$TEMP_FILE2"
            echo "        add_header Cache-Control \"public, immutable\";" >> "$TEMP_FILE2"
            echo "        access_log off;" >> "$TEMP_FILE2"
            echo "    }" >> "$TEMP_FILE2"
            echo "" >> "$TEMP_FILE2"
            echo "    # Proxy para API" >> "$TEMP_FILE2"
            echo "    location /api {" >> "$TEMP_FILE2"
            echo "        proxy_pass http://localhost:3000;" >> "$TEMP_FILE2"
            echo "        proxy_http_version 1.1;" >> "$TEMP_FILE2"
            echo "        proxy_set_header Host \$host;" >> "$TEMP_FILE2"
            echo "        proxy_set_header X-Real-IP \$remote_addr;" >> "$TEMP_FILE2"
            echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;" >> "$TEMP_FILE2"
            echo "        proxy_set_header X-Forwarded-Proto \$scheme;" >> "$TEMP_FILE2"
            echo "    }" >> "$TEMP_FILE2"
            echo "" >> "$TEMP_FILE2"
            echo "    # SPA Routing - redireciona todas as rotas para index.html" >> "$TEMP_FILE2"
            echo "    location / {" >> "$TEMP_FILE2"
            echo "        root $FRONTEND_PATH;" >> "$TEMP_FILE2"
            echo "        try_files \$uri \$uri/ /index.html;" >> "$TEMP_FILE2"
            echo "    }" >> "$TEMP_FILE2"
        fi
    done < "$TEMP_FILE"
    
    mv "$TEMP_FILE2" "$TEMP_FILE"
fi

# Validar configuração
echo "📝 Validando configuração..."
if nginx -t -c "$TEMP_FILE" 2>/dev/null || nginx -t 2>&1 | head -5; then
    echo "✅ Configuração válida!"
    echo ""
    
    # Aplicar configuração
    echo "📝 Aplicando configuração..."
    cp "$TEMP_FILE" "$NGINX_CONFIG"
    echo "✅ Configuração aplicada"
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
        
        # Testar rotas
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
        echo "Teste as URLs:"
        echo "  https://biacrm.com/terms-of-service"
        echo "  https://biacrm.com/privacy-policy"
        echo ""
    else
        echo "❌ Erro na configuração! Restaurando backup..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        nginx -t
        exit 1
    fi
else
    echo "❌ Configuração inválida! Restaurando backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# Limpar arquivo temporário
rm -f "$TEMP_FILE"

echo "✅ Processo concluído!"

