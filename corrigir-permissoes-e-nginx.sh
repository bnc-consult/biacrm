#!/bin/bash
# Script completo para corrigir permissões e configuração do Nginx

echo "========================================"
echo "  CORRIGINDO PERMISSÕES E NGINX"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"
NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
NGINX_USER=$(ps aux | grep '[n]ginx: worker' | head -1 | awk '{print $1}')

if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
fi

echo "Usuário do Nginx: $NGINX_USER"
echo ""

# 1. Verificar se os arquivos existem
echo "1. Verificando arquivos..."
if [ ! -d "$FRONTEND_PATH/assets" ]; then
    echo "❌ Erro: Diretório assets não encontrado em $FRONTEND_PATH"
    echo "Listando conteúdo de $FRONTEND_PATH:"
    ls -la "$FRONTEND_PATH" | head -10
    exit 1
fi

JS_FILES=$(find "$FRONTEND_PATH/assets" -name "*.js" 2>/dev/null | head -3)
if [ -z "$JS_FILES" ]; then
    echo "❌ Erro: Nenhum arquivo JavaScript encontrado"
    echo "Conteúdo de $FRONTEND_PATH/assets:"
    ls -la "$FRONTEND_PATH/assets" 2>/dev/null || echo "Diretório não existe ou não tem permissão"
    exit 1
fi

echo "✅ Arquivos JavaScript encontrados:"
echo "$JS_FILES"
echo ""

# 2. Corrigir permissões
echo "2. Corrigindo permissões..."
echo "   Diretórios: 755"
find "$FRONTEND_PATH" -type d -exec chmod 755 {} \;
echo "   Arquivos: 644"
find "$FRONTEND_PATH" -type f -exec chmod 644 {} \;
echo "✅ Permissões corrigidas"
echo ""

# 3. Verificar permissões do diretório pai
echo "3. Verificando permissões do diretório pai..."
PARENT_DIRS=("/domains" "/domains/biacrm.com")
for dir in "${PARENT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   Corrigindo $dir..."
        chmod 755 "$dir"
        chown root:root "$dir"
    fi
done
echo "✅ Diretórios pais corrigidos"
echo ""

# 4. Verificar configuração do Nginx
echo "4. Verificando configuração do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Erro: Arquivo de configuração não encontrado"
    exit 1
fi

# Verificar se a configuração tem a regra correta
if ! grep -q "location ~\* \\.(js|css" "$NGINX_CONFIG"; then
    echo "⚠️ Regra para arquivos estáticos não encontrada"
    echo "Adicionando regra..."
    
    # Criar backup
    cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Adicionar regra antes do "location /"
    sed -i '/location \/ {/i\
    # Servir arquivos estáticos com tipos MIME corretos\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {\
        root /domains/biacrm.com/public_html;\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
        access_log off;\
    }\
' "$NGINX_CONFIG"
    
    echo "✅ Regra adicionada"
else
    echo "✅ Regra para arquivos estáticos já existe"
fi

echo ""
echo "5. Verificando configuração do Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

echo "✅ Configuração válida"
echo ""

# 6. Verificar se o Nginx pode ler os arquivos
echo "6. Testando acesso do Nginx aos arquivos..."
if [ "$NGINX_USER" != "root" ]; then
    # Testar se o usuário do Nginx pode ler os arquivos
    sudo -u "$NGINX_USER" test -r "$FRONTEND_PATH/assets/index-DeamxfB_.js" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️ Nginx não consegue ler os arquivos"
        echo "Ajustando permissões para permitir leitura..."
        # Permitir que outros usuários leiam
        chmod -R o+r "$FRONTEND_PATH"
        find "$FRONTEND_PATH" -type d -exec chmod o+x {} \;
    else
        echo "✅ Nginx pode ler os arquivos"
    fi
fi
echo ""

# 7. Recarregar Nginx
echo "7. Recarregando Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro ao recarregar Nginx"
    exit 1
fi

echo ""
echo "========================================"
echo "  ✅ CORREÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Verificando arquivos:"
ls -lh "$FRONTEND_PATH/assets"/*.js | head -3
echo ""
echo "Testando acesso:"
curl -I https://biacrm.com/assets/index-DeamxfB_.js 2>&1 | head -5
echo ""
echo "Se ainda retornar 403, verifique:"
echo "1. Permissões: ls -la $FRONTEND_PATH"
echo "2. Configuração: cat $NGINX_CONFIG | grep -A 10 'location ~'"
echo "3. Logs do Nginx: tail -20 /var/log/nginx/error.log"
echo ""







