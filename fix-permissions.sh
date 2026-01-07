#!/bin/bash
# Script para corrigir permissões do frontend

echo "========================================"
echo "  CORRIGINDO PERMISSÕES"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

echo "1. Corrigindo permissões dos diretórios..."
find $FRONTEND_PATH -type d -exec chmod 755 {} \;
echo "✅ Diretórios corrigidos"

echo ""
echo "2. Corrigindo permissões dos arquivos..."
find $FRONTEND_PATH -type f -exec chmod 644 {} \;
echo "✅ Arquivos corrigidos"

echo ""
echo "3. Verificando permissões..."
echo "Diretório principal:"
ls -ld $FRONTEND_PATH
echo ""
echo "Arquivos principais:"
ls -l $FRONTEND_PATH/*.html $FRONTEND_PATH/*.png 2>/dev/null | head -5
echo ""
echo "Diretório assets:"
ls -ld $FRONTEND_PATH/assets/
echo ""
echo "Arquivos assets:"
ls -l $FRONTEND_PATH/assets/ | head -5

echo ""
echo "4. Recarregando Nginx..."
systemctl reload nginx
echo "✅ Nginx recarregado"

echo ""
echo "========================================"
echo "  ✅ PERMISSÕES CORRIGIDAS!"
echo "========================================"
echo ""
echo "Teste o site:"
echo "  https://biacrm.com"
echo ""
echo "Se ainda não funcionar, limpe o cache do navegador:"
echo "  Ctrl+Shift+R (Windows/Linux)"
echo "  Cmd+Shift+R (Mac)"
echo ""








