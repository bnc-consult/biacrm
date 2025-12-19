#!/bin/bash
# Verificar configuração do Nginx para biacrm.com

echo "========================================"
echo "  CONFIGURAÇÃO DO NGINX - BIACRM.COM"
echo "========================================"
echo ""

echo "1. Arquivo biacrm.com:"
echo "---"
cat /etc/nginx/sites-available/biacrm.com
echo ""
echo "---"
echo ""

echo "2. Arquivo biacrm:"
echo "---"
cat /etc/nginx/sites-available/biacrm
echo ""
echo "---"
echo ""

echo "3. Verificando diretórios mencionados:"
echo ""

# Extrair caminhos root dos arquivos
ROOT_PATHS=$(grep -h "root" /etc/nginx/sites-available/biacrm* 2>/dev/null | grep -v "#" | awk '{print $2}' | sed 's/;//')

for path in $ROOT_PATHS; do
    echo "Verificando: $path"
    if [ -d "$path" ]; then
        echo "  ✅ Diretório existe"
        ls -la "$path" | head -10
    else
        echo "  ❌ Diretório não existe"
    fi
    echo ""
done

echo "4. Procurando index.html nos diretórios encontrados:"
find /var/www -name "index.html" -type f 2>/dev/null | head -10



