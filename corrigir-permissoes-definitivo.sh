#!/bin/bash
# Script definitivo para corrigir permissões - resolve erro 13 (Permission denied)

echo "========================================"
echo "  CORREÇÃO DEFINITIVA DE PERMISSÕES"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

# Identificar usuário do Nginx
NGINX_USER=$(ps aux | grep '[n]ginx: worker' | head -1 | awk '{print $1}')
if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
fi

echo "Usuário do Nginx: $NGINX_USER"
echo ""

# 1. Verificar permissões atuais
echo "1. Verificando permissões atuais..."
ls -ld /domains /domains/biacrm.com "$FRONTEND_PATH" "$FRONTEND_PATH/assets" 2>/dev/null
echo ""

# 2. Corrigir permissões dos diretórios pais (CRÍTICO)
echo "2. Corrigindo permissões dos diretórios pais..."
chmod 755 /domains
chmod 755 /domains/biacrm.com
chmod 755 "$FRONTEND_PATH"
chmod 755 "$FRONTEND_PATH/assets" 2>/dev/null

# Garantir que o Nginx pode atravessar os diretórios
chmod o+x /domains
chmod o+x /domains/biacrm.com
chmod o+x "$FRONTEND_PATH"

echo "✅ Diretórios pais corrigidos"
echo ""

# 3. Corrigir permissões de TODOS os arquivos e diretórios
echo "3. Corrigindo permissões recursivamente..."
find "$FRONTEND_PATH" -type d -exec chmod 755 {} \;
find "$FRONTEND_PATH" -type f -exec chmod 644 {} \;

# Garantir permissões de leitura pública
chmod -R u+r "$FRONTEND_PATH"
chmod -R g+r "$FRONTEND_PATH"
chmod -R o+r "$FRONTEND_PATH"

# Garantir permissões de execução nos diretórios
find "$FRONTEND_PATH" -type d -exec chmod o+x {} \;

echo "✅ Permissões recursivas corrigidas"
echo ""

# 4. Verificar ownership (proprietário)
echo "4. Verificando proprietário dos arquivos..."
ls -ld "$FRONTEND_PATH" | awk '{print "Proprietário: " $3 ":" $4}'
echo ""

# Se o Nginx não for root, garantir que pode ler
if [ "$NGINX_USER" != "root" ]; then
    echo "5. Ajustando permissões para usuário $NGINX_USER..."
    
    # Adicionar grupo do Nginx se necessário
    if getent group "$NGINX_USER" > /dev/null 2>&1; then
        echo "   Grupo $NGINX_USER existe"
    else
        echo "   Grupo $NGINX_USER não existe, usando permissões públicas"
    fi
    
    # Garantir que outros podem ler e executar
    chmod -R o+r "$FRONTEND_PATH"
    find "$FRONTEND_PATH" -type d -exec chmod o+x {} \;
    
    echo "✅ Permissões ajustadas para $NGINX_USER"
fi
echo ""

# 5. Verificar se o Nginx pode ler os arquivos
echo "6. Testando acesso do Nginx..."
JS_FILE=$(find "$FRONTEND_PATH/assets" -name "*.js" 2>/dev/null | head -1)
CSS_FILE=$(find "$FRONTEND_PATH/assets" -name "*.css" 2>/dev/null | head -1)

if [ -n "$JS_FILE" ]; then
    echo "   Testando: $JS_FILE"
    if [ -r "$JS_FILE" ]; then
        echo "   ✅ Arquivo é legível"
    else
        echo "   ❌ Arquivo NÃO é legível!"
        chmod 644 "$JS_FILE"
        chmod o+r "$JS_FILE"
    fi
fi

if [ -n "$CSS_FILE" ]; then
    echo "   Testando: $CSS_FILE"
    if [ -r "$CSS_FILE" ]; then
        echo "   ✅ Arquivo é legível"
    else
        echo "   ❌ Arquivo NÃO é legível!"
        chmod 644 "$CSS_FILE"
        chmod o+r "$CSS_FILE"
    fi
fi
echo ""

# 6. Verificar permissões finais
echo "7. Verificando permissões finais..."
echo ""
echo "Diretórios:"
ls -ld /domains /domains/biacrm.com "$FRONTEND_PATH" "$FRONTEND_PATH/assets" 2>/dev/null
echo ""
echo "Arquivos principais:"
if [ -n "$JS_FILE" ]; then
    ls -lh "$JS_FILE"
fi
if [ -n "$CSS_FILE" ]; then
    ls -lh "$CSS_FILE"
fi
if [ -f "$FRONTEND_PATH/index.html" ]; then
    ls -lh "$FRONTEND_PATH/index.html"
fi
echo ""

# 7. Aplicar correção agressiva se necessário
echo "8. Aplicando correção agressiva..."
# Garantir que TODOS podem ler
chmod -R a+r "$FRONTEND_PATH"
find "$FRONTEND_PATH" -type d -exec chmod a+x {} \;

# Garantir diretórios pais
chmod a+x /domains
chmod a+x /domains/biacrm.com
chmod a+x "$FRONTEND_PATH"

echo "✅ Correção agressiva aplicada"
echo ""

# 8. Recarregar Nginx
echo "9. Recarregando Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro ao recarregar Nginx"
fi
echo ""

# 9. Teste final
echo "10. Teste final..."
echo ""
echo "Permissões dos diretórios no caminho:"
namei -l /domains/biacrm.com/public_html/assets 2>/dev/null || {
    echo "Comando namei não disponível, usando ls:"
    ls -ld /domains
    ls -ld /domains/biacrm.com
    ls -ld "$FRONTEND_PATH"
    ls -ld "$FRONTEND_PATH/assets"
}
echo ""

echo "========================================"
echo "  ✅ CORREÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Se ainda houver erro 403, execute manualmente:"
echo "  chmod -R 755 /domains"
echo "  chmod -R 644 /domains/biacrm.com/public_html/*"
echo "  find /domains/biacrm.com/public_html -type d -exec chmod 755 {} \\;"
echo "  find /domains/biacrm.com/public_html -type f -exec chmod 644 {} \\;"
echo "  systemctl restart nginx"
echo ""


