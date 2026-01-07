#!/bin/bash
# Script para verificar configuração DNS e servidor

echo "========================================"
echo "  VERIFICAÇÃO DNS E SERVIDOR"
echo "========================================"
echo ""

SERVER_IP="92.113.33.226"
DOMAIN="biacrm.com"

# 1. Verificar se servidor responde no IP
echo "1. Testando acesso direto ao IP:"
echo "   curl -I http://${SERVER_IP}"
curl -I http://${SERVER_IP} 2>&1 | head -5
echo ""

# 2. Verificar configuração do Nginx
echo "2. Verificando configuração do Nginx:"
if [ -f "/etc/nginx/sites-available/biacrm" ]; then
    echo "   Arquivo de configuração encontrado:"
    grep -E "server_name|listen" /etc/nginx/sites-available/biacrm | head -10
else
    echo "   ⚠️  Arquivo de configuração não encontrado"
fi
echo ""

# 3. Verificar certificados SSL
echo "3. Verificando certificados SSL:"
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo "   ✅ Certificados encontrados:"
    ls -la /etc/letsencrypt/live/${DOMAIN}/ | grep -E "cert|chain|privkey"
else
    echo "   ⚠️  Certificados não encontrados"
fi
echo ""

# 4. Verificar se Nginx está escutando nas portas corretas
echo "4. Portas que o Nginx está escutando:"
netstat -tulpn | grep nginx | grep -E ":80|:443" || ss -tulpn | grep nginx | grep -E ":80|:443"
echo ""

# 5. Testar resolução DNS local
echo "5. Testando resolução DNS local:"
if command -v dig &> /dev/null; then
    echo "   dig ${DOMAIN}:"
    dig ${DOMAIN} +short
elif command -v nslookup &> /dev/null; then
    echo "   nslookup ${DOMAIN}:"
    nslookup ${DOMAIN} | grep -A 2 "Name:"
else
    echo "   ⚠️  Ferramentas DNS não disponíveis"
fi
echo ""

# 6. Verificar logs do Nginx para acessos
echo "6. Últimos acessos no log de acesso:"
if [ -f "/var/log/nginx/access.log" ]; then
    tail -5 /var/log/nginx/access.log | grep -E "${DOMAIN}|${SERVER_IP}"
else
    echo "   ⚠️  Log de acesso não encontrado"
fi
echo ""

echo "========================================"
echo "  PRÓXIMOS PASSOS"
echo "========================================"
echo ""
echo "1. Verificar DNS externamente:"
echo "   https://www.whatsmydns.net/#A/${DOMAIN}"
echo ""
echo "2. Se DNS não está configurado, configure no provedor:"
echo "   Tipo: A"
echo "   Nome: @"
echo "   Valor: ${SERVER_IP}"
echo ""
echo "3. Para acesso temporário, adicione ao hosts:"
echo "   ${SERVER_IP}    ${DOMAIN}"
echo ""








