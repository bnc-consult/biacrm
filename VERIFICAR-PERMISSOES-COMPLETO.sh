#!/bin/bash
# Verificação completa de permissões

echo "========================================"
echo "  VERIFICAÇÃO COMPLETA DE PERMISSÕES"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

# 1. Verificar usuário do Nginx
echo "1. Usuário do Nginx:"
ps aux | grep nginx | grep -v grep | head -1
echo ""

# 2. Verificar permissões do caminho completo
echo "2. Permissões do caminho completo:"
ls -ld /domains/
ls -ld /domains/biacrm.com/
ls -ld /domains/biacrm.com/public_html/
ls -ld /domains/biacrm.com/public_html/assets/
echo ""

# 3. Verificar permissões dos arquivos
echo "3. Permissões dos arquivos assets:"
ls -la /domains/biacrm.com/public_html/assets/
echo ""

# 4. Testar acesso como usuário do Nginx
echo "4. Testando acesso como usuário do Nginx:"
NGINX_USER=$(ps aux | grep 'nginx: worker' | head -1 | awk '{print $1}')
echo "Usuário Nginx: $NGINX_USER"

if [ "$NGINX_USER" = "www-data" ] || [ "$NGINX_USER" = "nginx" ]; then
    echo "Testando acesso com sudo -u $NGINX_USER:"
    sudo -u $NGINX_USER test -r /domains/biacrm.com/public_html/assets/index-B3IYLqaJ.js && echo "✅ Arquivo legível" || echo "❌ Arquivo NÃO legível"
    sudo -u $NGINX_USER test -x /domains/biacrm.com/public_html/assets && echo "✅ Diretório acessível" || echo "❌ Diretório NÃO acessível"
else
    echo "⚠️  Nginx não está rodando como www-data ou nginx"
fi
echo ""

# 5. Verificar logs mais recentes
echo "5. Logs mais recentes do Nginx (últimas 5 linhas):"
tail -5 /var/log/nginx/error.log
echo ""

# 6. Verificar se há SELinux ou AppArmor
echo "6. Verificando SELinux/AppArmor:"
if command -v getenforce &> /dev/null; then
    echo "SELinux: $(getenforce)"
fi
if command -v aa-status &> /dev/null; then
    echo "AppArmor: $(aa-status | head -1)"
fi
echo ""

# 7. Corrigir permissões de forma mais agressiva
echo "7. Corrigindo permissões de forma mais agressiva..."
chmod -R 755 /domains/
chmod -R 755 /domains/biacrm.com/
chmod -R 755 /domains/biacrm.com/public_html/
find /domains/biacrm.com/public_html -type f -exec chmod 644 {} \;
find /domains/biacrm.com/public_html -type d -exec chmod 755 {} \;
echo "✅ Permissões corrigidas"
echo ""

# 8. Verificar configuração do Nginx
echo "8. Verificando configuração do Nginx para biacrm.com:"
grep -r "biacrm.com" /etc/nginx/sites-enabled/ | head -10
echo ""

echo "========================================"
echo "  PRÓXIMOS PASSOS"
echo "========================================"
echo ""
echo "1. Teste o site novamente:"
echo "   https://biacrm.com"
echo ""
echo "2. Monitore os logs em tempo real:"
echo "   tail -f /var/log/nginx/error.log"
echo ""
echo "3. Se ainda não funcionar, verifique:"
echo "   - Se o usuário do Nginx tem acesso ao diretório /domains/"
echo "   - Se há regras de firewall bloqueando"
echo "   - Se há configuração de SELinux/AppArmor"
echo ""








