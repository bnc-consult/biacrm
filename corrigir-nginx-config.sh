#!/bin/bash
# Script para corrigir configuração do Nginx para servir arquivos JavaScript corretamente

echo "========================================"
echo "  CORRIGINDO CONFIGURAÇÃO DO NGINX"
echo "========================================"
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"

# Backup da configuração atual
echo "1. Fazendo backup da configuração atual..."
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Erro: Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

echo "2. Verificando configuração atual..."
echo ""

# Verificar se já tem a regra para arquivos estáticos
if grep -q "location ~\* \\.(js|css" "$NGINX_CONFIG"; then
    echo "⚠️ Regra para arquivos estáticos já existe"
    echo "Verificando se está correta..."
else
    echo "📝 Adicionando regra para arquivos estáticos..."
    
    # Criar arquivo temporário com a configuração corrigida
    TEMP_FILE=$(mktemp)
    
    # Ler o arquivo e adicionar a regra antes do "location /"
    awk -v frontend_path="$FRONTEND_PATH" '
    /^[[:space:]]*location[[:space:]]+\/[[:space:]]*\{/ {
        # Adicionar regra para arquivos estáticos antes do location /
        print "    # Servir arquivos estáticos com tipos MIME corretos"
        print "    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {"
        print "        root " frontend_path ";"
        print "        expires 1y;"
        print "        add_header Cache-Control \"public, immutable\";"
        print "        access_log off;"
        print "    }"
        print ""
    }
    { print }
    ' "$NGINX_CONFIG" > "$TEMP_FILE"
    
    # Substituir o arquivo original
    mv "$TEMP_FILE" "$NGINX_CONFIG"
    echo "✅ Regra adicionada"
fi

echo ""
echo "3. Verificando configuração..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida"
    echo ""
    echo "4. Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro na configuração do Nginx!"
    echo "Restaurando backup..."
    cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null
    exit 1
fi

echo ""
echo "========================================"
echo "  ✅ CONFIGURAÇÃO CORRIGIDA!"
echo "========================================"
echo ""
echo "Teste o site:"
echo "  https://biacrm.com"
echo ""
echo "Verifique se os arquivos JavaScript estão sendo servidos corretamente:"
echo "  curl -I https://biacrm.com/assets/index-DeamxfB_.js"
echo ""
echo "Deve retornar: Content-Type: application/javascript"
echo ""







