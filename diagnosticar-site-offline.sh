#!/bin/bash
# Script para diagnosticar por que o site biacrm.com está offline

echo "========================================"
echo "  DIAGNÓSTICO - SITE OFFLINE"
echo "========================================"
echo ""

# 1. Verificar se Nginx está rodando
echo "1. Status do Nginx:"
systemctl status nginx --no-pager | head -10
echo ""

# 2. Verificar se backend está rodando
echo "2. Status do Backend (PM2):"
pm2 list
echo ""

# 3. Verificar processos Node.js
echo "3. Processos Node.js na porta 3000:"
lsof -i :3000 || echo "Nenhum processo na porta 3000"
echo ""

# 4. Testar backend localmente
echo "4. Testando backend localmente:"
curl -s http://localhost:3000/health || echo "❌ Backend não está respondendo"
echo ""

# 5. Verificar configuração do Nginx
echo "5. Verificando configuração do Nginx:"
nginx -t
echo ""

# 6. Verificar logs do Nginx
echo "6. Últimas linhas do log de erro do Nginx:"
tail -20 /var/log/nginx/error.log
echo ""

# 7. Verificar se arquivos do frontend existem
echo "7. Verificando arquivos do frontend:"
ls -la /domains/biacrm.com/public_html/
echo ""

# 8. Verificar se Nginx está escutando nas portas corretas
echo "8. Portas que o Nginx está escutando:"
netstat -tulpn | grep nginx || ss -tulpn | grep nginx
echo ""

# 9. Verificar certificados SSL
echo "9. Verificando certificados SSL:"
ls -la /etc/letsencrypt/live/biacrm.com/ 2>/dev/null || echo "Certificados não encontrados"
echo ""

echo "========================================"
echo "  PRÓXIMOS PASSOS"
echo "========================================"
echo ""
echo "Se o Nginx não estiver rodando:"
echo "  systemctl start nginx"
echo ""
echo "Se o backend não estiver rodando:"
echo "  cd /var/www/biacrm/api"
echo "  pm2 restart biacrm-backend"
echo ""
echo "Se houver erros no Nginx:"
echo "  nginx -t"
echo "  systemctl reload nginx"
echo ""








