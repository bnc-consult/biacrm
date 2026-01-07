#!/bin/bash
# Script completo para verificar e corrigir problemas em produção

echo "========================================"
echo "  VERIFICAR E CORRIGIR PRODUÇÃO"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"
NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"

# 1. Verificar se os arquivos foram enviados
echo "1. Verificando arquivos do frontend..."
echo ""

if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ ERRO: index.html não encontrado!"
    echo "Conteúdo de $FRONTEND_PATH:"
    ls -la "$FRONTEND_PATH" 2>/dev/null || echo "Diretório não existe ou sem permissão"
    exit 1
fi

echo "✅ index.html encontrado"
ls -lh "$FRONTEND_PATH/index.html"
echo ""

# Verificar arquivos JavaScript
JS_FILE=$(find "$FRONTEND_PATH/assets" -name "*.js" 2>/dev/null | head -1)
CSS_FILE=$(find "$FRONTEND_PATH/assets" -name "*.css" 2>/dev/null | head -1)

if [ -z "$JS_FILE" ]; then
    echo "❌ ERRO: Nenhum arquivo JavaScript encontrado!"
    echo "Conteúdo de $FRONTEND_PATH/assets:"
    ls -la "$FRONTEND_PATH/assets" 2>/dev/null || echo "Diretório assets não existe"
    exit 1
fi

if [ -z "$CSS_FILE" ]; then
    echo "❌ ERRO: Nenhum arquivo CSS encontrado!"
    exit 1
fi

echo "✅ Arquivos encontrados:"
echo "   JS:  $JS_FILE"
echo "   CSS: $CSS_FILE"
echo ""

# 2. Verificar permissões atuais
echo "2. Verificando permissões atuais..."
echo ""

echo "Diretórios:"
ls -ld "$FRONTEND_PATH" "$FRONTEND_PATH/assets" 2>/dev/null
echo ""

echo "Arquivos:"
ls -lh "$JS_FILE" "$CSS_FILE" 2>/dev/null
echo ""

# 3. Corrigir permissões dos diretórios pais
echo "3. Corrigindo permissões dos diretórios pais..."
chmod 755 /domains 2>/dev/null
chmod 755 /domains/biacrm.com 2>/dev/null
chmod 755 "$FRONTEND_PATH" 2>/dev/null
chmod 755 "$FRONTEND_PATH/assets" 2>/dev/null
echo "✅ Permissões dos diretórios corrigidas"
echo ""

# 4. Corrigir permissões dos arquivos
echo "4. Corrigindo permissões dos arquivos..."
find "$FRONTEND_PATH" -type d -exec chmod 755 {} \;
find "$FRONTEND_PATH" -type f -exec chmod 644 {} \;
echo "✅ Permissões dos arquivos corrigidas"
echo ""

# 5. Verificar se o Nginx pode ler os arquivos
echo "5. Verificando acesso do Nginx..."
NGINX_USER=$(ps aux | grep '[n]ginx: worker' | head -1 | awk '{print $1}')
if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
fi

echo "Usuário do Nginx: $NGINX_USER"

# Permitir que outros leiam (se necessário)
chmod -R o+r "$FRONTEND_PATH"
find "$FRONTEND_PATH" -type d -exec chmod o+x {} \;
echo "✅ Permissões de leitura públicas adicionadas"
echo ""

# 6. Verificar configuração do Nginx
echo "6. Verificando configuração do Nginx..."
echo ""

# Verificar se tem a regra para arquivos estáticos
if grep -q "location ~\* \\.(js|css" "$NGINX_CONFIG"; then
    echo "✅ Regra para arquivos estáticos encontrada"
    echo ""
    echo "Configuração atual:"
    grep -A 8 "location ~\* \\.(js|css" "$NGINX_CONFIG"
else
    echo "⚠️ Regra para arquivos estáticos NÃO encontrada!"
    echo "Adicionando regra..."
    
    # Backup
    cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Adicionar regra antes do "location /"
    sed -i '/^[[:space:]]*location[[:space:]]\+\/[[:space:]]*{/i\
    # Servir arquivos estáticos com tipos MIME corretos\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {\
        root /domains/biacrm.com/public_html;\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
        access_log off;\
    }\
' "$NGINX_CONFIG"
    
    echo "✅ Regra adicionada"
fi

echo ""

# 7. Testar configuração do Nginx
echo "7. Testando configuração do Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

echo "✅ Configuração válida"
echo ""

# 8. Recarregar Nginx
echo "8. Recarregando Nginx..."
systemctl reload nginx

if [ $? -ne 0 ]; then
    echo "❌ Erro ao recarregar Nginx!"
    exit 1
fi

echo "✅ Nginx recarregado"
echo ""

# 9. Verificar permissões finais
echo "9. Verificando permissões finais..."
echo ""
echo "Diretório principal:"
ls -ld "$FRONTEND_PATH"
echo ""
echo "Diretório assets:"
ls -ld "$FRONTEND_PATH/assets"
echo ""
echo "Arquivos principais:"
ls -lh "$JS_FILE" "$CSS_FILE" "$FRONTEND_PATH/index.html"
echo ""

# 10. Testar acesso
echo "10. Testando acesso aos arquivos..."
echo ""

echo "Testando JavaScript:"
curl -I "https://biacrm.com/assets/$(basename $JS_FILE)" 2>&1 | head -3
echo ""

echo "Testando CSS:"
curl -I "https://biacrm.com/assets/$(basename $CSS_FILE)" 2>&1 | head -3
echo ""

echo "========================================"
echo "  ✅ VERIFICAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Se ainda houver erro 403, verifique:"
echo "1. Logs do Nginx: tail -30 /var/log/nginx/error.log"
echo "2. SELinux (se ativo): getenforce"
echo "3. Firewall: iptables -L -n | grep 443"
echo ""







