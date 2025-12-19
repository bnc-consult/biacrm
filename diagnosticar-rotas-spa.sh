#!/bin/bash

# Script para diagnosticar por que as rotas SPA não estão funcionando

echo "========================================"
echo "  DIAGNÓSTICO: ROTAS SPA NÃO FUNCIONANDO"
echo "========================================"
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/biacrm.com"
FRONTEND_PATH="/domains/biacrm.com/public_html"

# 1. Verificar se index.html existe
echo "1. Verificando se index.html existe..."
if [ -f "$FRONTEND_PATH/index.html" ]; then
    echo "✅ index.html existe em $FRONTEND_PATH"
    ls -lh "$FRONTEND_PATH/index.html"
else
    echo "❌ index.html NÃO existe em $FRONTEND_PATH"
    echo "   Arquivos no diretório:"
    ls -la "$FRONTEND_PATH/" 2>/dev/null || echo "   Diretório não existe!"
fi
echo ""

# 2. Verificar se arquivos assets existem
echo "2. Verificando arquivos assets..."
if [ -d "$FRONTEND_PATH/assets" ]; then
    echo "✅ Diretório assets existe"
    echo "   Arquivos encontrados:"
    ls -lh "$FRONTEND_PATH/assets/" | head -10
else
    echo "❌ Diretório assets NÃO existe"
fi
echo ""

# 3. Verificar configuração do Nginx
echo "3. Verificando configuração do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONFIG"
    echo "   Procurando configurações alternativas..."
    find /etc/nginx -name "*biacrm*" -type f 2>/dev/null
else
    echo "✅ Arquivo de configuração encontrado"
    echo ""
    
    # Verificar se tem try_files
    echo "   Verificando try_files..."
    if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
        echo "   ✅ try_files configurado"
        grep "try_files" "$NGINX_CONFIG" | head -3
    else
        echo "   ❌ try_files NÃO configurado!"
    fi
    echo ""
    
    # Verificar ordem das location blocks
    echo "   Verificando ordem das location blocks..."
    echo "   Ordem atual:"
    grep -n "location" "$NGINX_CONFIG" | head -10
    echo ""
    
    # Verificar se arquivos estáticos estão antes do location /
    echo "   Verificando se arquivos estáticos estão configurados..."
    if grep -q "location ~\* \\\\.(js|css" "$NGINX_CONFIG"; then
        echo "   ✅ Regra para arquivos estáticos encontrada"
        grep -A 5 "location ~\* \\\\.(js|css" "$NGINX_CONFIG" | head -7
    else
        echo "   ⚠️  Regra para arquivos estáticos NÃO encontrada"
    fi
    echo ""
fi
echo ""

# 4. Testar se Nginx está servindo index.html na raiz
echo "4. Testando se Nginx serve index.html na raiz..."
ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$ROOT_RESPONSE" = "200" ]; then
    echo "✅ Nginx retorna 200 para /"
else
    echo "❌ Nginx retorna $ROOT_RESPONSE para /"
fi
echo ""

# 5. Testar rota SPA
echo "5. Testando rota SPA (/terms-of-service)..."
SPA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/terms-of-service)
if [ "$SPA_RESPONSE" = "200" ]; then
    echo "✅ Nginx retorna 200 para /terms-of-service"
    echo "   Primeiras linhas da resposta:"
    curl -s http://localhost/terms-of-service | head -5
else
    echo "❌ Nginx retorna $SPA_RESPONSE para /terms-of-service"
    echo "   Resposta completa:"
    curl -s http://localhost/terms-of-service | head -10
fi
echo ""

# 6. Verificar se Nginx está rodando
echo "6. Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "❌ Nginx NÃO está rodando!"
fi
echo ""

# 7. Verificar logs de erro do Nginx
echo "7. Últimas linhas dos logs de erro do Nginx..."
tail -20 /var/log/nginx/error.log | grep -E "terms-of-service|privacy-policy|404|403" | tail -10 || echo "Nenhum erro relacionado encontrado"
echo ""

# 8. Verificar permissões
echo "8. Verificando permissões..."
if [ -d "$FRONTEND_PATH" ]; then
    echo "   Permissões do diretório:"
    ls -ld "$FRONTEND_PATH"
    echo ""
    echo "   Permissões do index.html:"
    ls -l "$FRONTEND_PATH/index.html" 2>/dev/null || echo "   index.html não existe"
fi
echo ""

# 9. Verificar configuração do root no Nginx
echo "9. Verificando configuração do root no Nginx..."
if grep -q "root.*biacrm\|root.*public_html" "$NGINX_CONFIG"; then
    echo "✅ Root configurado:"
    grep "root" "$NGINX_CONFIG" | head -3
else
    echo "❌ Root não encontrado na configuração"
fi
echo ""

# 10. Resumo e recomendações
echo "========================================"
echo "  RESUMO E RECOMENDAÇÕES"
echo "========================================"
echo ""

if [ ! -f "$FRONTEND_PATH/index.html" ]; then
    echo "❌ PROBLEMA: index.html não existe"
    echo "   SOLUÇÃO: Envie os arquivos do build para $FRONTEND_PATH"
    echo "   Comando: scp -r frontend/dist/* root@92.113.33.226:$FRONTEND_PATH/"
    echo ""
fi

if ! grep -q "try_files.*index.html" "$NGINX_CONFIG" 2>/dev/null; then
    echo "❌ PROBLEMA: try_files não configurado"
    echo "   SOLUÇÃO: Execute o script corrigir-nginx-spa-routes.sh"
    echo ""
fi

if [ "$SPA_RESPONSE" != "200" ]; then
    echo "❌ PROBLEMA: Rotas SPA não retornam 200"
    echo "   SOLUÇÃO: Verifique a configuração do Nginx e execute:"
    echo "   1. bash /tmp/corrigir-nginx-spa-routes.sh"
    echo "   2. nginx -t"
    echo "   3. systemctl reload nginx"
    echo ""
fi

echo "✅ Diagnóstico concluído!"
echo ""

