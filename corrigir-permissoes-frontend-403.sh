#!/bin/bash
# Script para corrigir permissões do frontend após deploy

echo "========================================"
echo "  CORRIGINDO PERMISSÕES DO FRONTEND"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

# 1. Verificar se o diretório existe
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "❌ Diretório $FRONTEND_PATH não encontrado!"
    exit 1
fi

# 2. Corrigir permissões de diretórios (755 = rwxr-xr-x)
echo "1. Corrigindo permissões de diretórios..."
find "$FRONTEND_PATH" -type d -exec chmod 755 {} \;
echo "✅ Permissões de diretórios corrigidas (755)"
echo ""

# 3. Corrigir permissões de arquivos (644 = rw-r--r--)
echo "2. Corrigindo permissões de arquivos..."
find "$FRONTEND_PATH" -type f -exec chmod 644 {} \;
echo "✅ Permissões de arquivos corrigidas (644)"
echo ""

# 4. Verificar permissões do diretório principal e pais
echo "3. Verificando permissões dos diretórios pais..."
chmod 755 /domains 2>/dev/null || true
chmod 755 /domains/biacrm.com 2>/dev/null || true
chmod 755 "$FRONTEND_PATH" 2>/dev/null || true
echo "✅ Permissões dos diretórios pais verificadas"
echo ""

# 5. Verificar se o Nginx consegue ler os arquivos
echo "4. Verificando permissões dos arquivos específicos..."
if [ -f "$FRONTEND_PATH/assets/index-D6a3CKmr.css" ]; then
    ls -la "$FRONTEND_PATH/assets/index-D6a3CKmr.css"
    echo "✅ Arquivo CSS encontrado"
else
    echo "⚠️ Arquivo CSS não encontrado: $FRONTEND_PATH/assets/index-D6a3CKmr.css"
fi

if [ -f "$FRONTEND_PATH/assets/index-BhKHPTj0.js" ]; then
    ls -la "$FRONTEND_PATH/assets/index-BhKHPTj0.js"
    echo "✅ Arquivo JS encontrado"
else
    echo "⚠️ Arquivo JS não encontrado: $FRONTEND_PATH/assets/index-BhKHPTj0.js"
fi
echo ""

# 6. Verificar propriedade dos arquivos (deve ser root ou www-data)
echo "5. Verificando propriedade dos arquivos..."
OWNER=$(stat -c '%U' "$FRONTEND_PATH" 2>/dev/null || stat -f '%Su' "$FRONTEND_PATH" 2>/dev/null)
echo "Proprietário do diretório: $OWNER"
echo ""

# 7. Testar se o Nginx consegue ler (como usuário www-data ou nginx)
echo "6. Testando leitura como usuário do Nginx..."
if id -u www-data >/dev/null 2>&1; then
    sudo -u www-data test -r "$FRONTEND_PATH/assets/index-D6a3CKmr.css" && echo "✅ Nginx (www-data) consegue ler CSS" || echo "❌ Nginx (www-data) NÃO consegue ler CSS"
    sudo -u www-data test -r "$FRONTEND_PATH/assets/index-BhKHPTj0.js" && echo "✅ Nginx (www-data) consegue ler JS" || echo "❌ Nginx (www-data) NÃO consegue ler JS"
elif id -u nginx >/dev/null 2>&1; then
    sudo -u nginx test -r "$FRONTEND_PATH/assets/index-D6a3CKmr.css" && echo "✅ Nginx (nginx) consegue ler CSS" || echo "❌ Nginx (nginx) NÃO consegue ler CSS"
    sudo -u nginx test -r "$FRONTEND_PATH/assets/index-BhKHPTj0.js" && echo "✅ Nginx (nginx) consegue ler JS" || echo "❌ Nginx (nginx) NÃO consegue ler JS"
else
    echo "⚠️ Não foi possível identificar o usuário do Nginx"
fi
echo ""

# 8. Recarregar Nginx
echo "7. Recarregando Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado com sucesso"
else
    echo "⚠️ Erro ao recarregar Nginx. Tentando restart..."
    systemctl restart nginx
fi
echo ""

# 9. Verificar logs do Nginx para erros recentes
echo "8. Verificando logs recentes do Nginx..."
tail -20 /var/log/nginx/error.log | grep -i "403\|permission\|forbidden" || echo "Nenhum erro 403 recente encontrado nos logs"
echo ""

echo "========================================"
echo "  ✅ CORREÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "2. Tente acessar https://biacrm.com novamente"
echo "3. Se ainda houver erro, verifique os logs: tail -f /var/log/nginx/error.log"
echo ""







