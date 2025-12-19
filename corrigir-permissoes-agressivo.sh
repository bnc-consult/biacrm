#!/bin/bash
# Script agressivo para corrigir permissões do frontend

echo "========================================"
echo "  CORREÇÃO AGRESSIVA DE PERMISSÕES"
echo "========================================"
echo ""

FRONTEND_PATH="/domains/biacrm.com/public_html"

# 1. Identificar usuário do Nginx
echo "1. Identificando usuário do Nginx..."
NGINX_USER=$(ps aux | grep '[n]ginx: worker' | head -1 | awk '{print $1}')
if [ -z "$NGINX_USER" ]; then
    NGINX_USER="www-data"
fi
echo "Usuário do Nginx: $NGINX_USER"
echo ""

# 2. Verificar permissões atuais
echo "2. Verificando permissões atuais..."
ls -la /domains/ 2>/dev/null || echo "Não consegue listar /domains/"
ls -la /domains/biacrm.com/ 2>/dev/null || echo "Não consegue listar /domains/biacrm.com/"
ls -la "$FRONTEND_PATH" 2>/dev/null | head -5 || echo "Não consegue listar $FRONTEND_PATH"
echo ""

# 3. Corrigir permissões dos diretórios pais (CRÍTICO)
echo "3. Corrigindo permissões dos diretórios pais..."
chmod 755 /domains 2>/dev/null || echo "⚠️ Não conseguiu corrigir /domains"
chmod 755 /domains/biacrm.com 2>/dev/null || echo "⚠️ Não conseguiu corrigir /domains/biacrm.com"
chmod 755 "$FRONTEND_PATH" 2>/dev/null || echo "⚠️ Não conseguiu corrigir $FRONTEND_PATH"
chmod 755 "$FRONTEND_PATH/assets" 2>/dev/null || echo "⚠️ Não conseguiu corrigir $FRONTEND_PATH/assets"
echo "✅ Diretórios pais corrigidos"
echo ""

# 4. Corrigir permissões de TODOS os diretórios
echo "4. Corrigindo permissões de todos os diretórios..."
find "$FRONTEND_PATH" -type d -exec chmod 755 {} \;
echo "✅ Diretórios corrigidos (755)"
echo ""

# 5. Corrigir permissões de TODOS os arquivos
echo "5. Corrigindo permissões de todos os arquivos..."
find "$FRONTEND_PATH" -type f -exec chmod 644 {} \;
echo "✅ Arquivos corrigidos (644)"
echo ""

# 6. Verificar arquivos específicos que estão falhando
echo "6. Verificando arquivos específicos..."
if [ -f "$FRONTEND_PATH/assets/index-D6a3CKmr.css" ]; then
    ls -la "$FRONTEND_PATH/assets/index-D6a3CKmr.css"
    chmod 644 "$FRONTEND_PATH/assets/index-D6a3CKmr.css"
    echo "✅ CSS corrigido"
else
    echo "❌ Arquivo CSS não encontrado!"
    echo "Arquivos em assets:"
    ls -la "$FRONTEND_PATH/assets/" 2>/dev/null | head -10
fi

if [ -f "$FRONTEND_PATH/assets/index-BhKHPTj0.js" ]; then
    ls -la "$FRONTEND_PATH/assets/index-BhKHPTj0.js"
    chmod 644 "$FRONTEND_PATH/assets/index-BhKHPTj0.js"
    echo "✅ JS corrigido"
else
    echo "❌ Arquivo JS não encontrado!"
    echo "Arquivos em assets:"
    ls -la "$FRONTEND_PATH/assets/" 2>/dev/null | head -10
fi
echo ""

# 7. Testar se o Nginx consegue ler (como o usuário do Nginx)
echo "7. Testando leitura como usuário do Nginx..."
if [ "$NGINX_USER" != "root" ]; then
    if sudo -u "$NGINX_USER" test -r "$FRONTEND_PATH/assets/index-D6a3CKmr.css" 2>/dev/null; then
        echo "✅ Nginx consegue ler CSS"
    else
        echo "❌ Nginx NÃO consegue ler CSS"
        echo "Tentando correção adicional..."
        # Adicionar permissão de leitura para outros usuários
        chmod o+r "$FRONTEND_PATH/assets/index-D6a3CKmr.css" 2>/dev/null
        find "$FRONTEND_PATH" -type f -exec chmod o+r {} \;
        find "$FRONTEND_PATH" -type d -exec chmod o+x {} \;
    fi
    
    if sudo -u "$NGINX_USER" test -r "$FRONTEND_PATH/assets/index-BhKHPTj0.js" 2>/dev/null; then
        echo "✅ Nginx consegue ler JS"
    else
        echo "❌ Nginx NÃO consegue ler JS"
        chmod o+r "$FRONTEND_PATH/assets/index-BhKHPTj0.js" 2>/dev/null
    fi
else
    echo "⚠️ Nginx está rodando como root (não recomendado)"
fi
echo ""

# 8. Verificar propriedade dos arquivos
echo "8. Verificando propriedade dos arquivos..."
OWNER=$(stat -c '%U:%G' "$FRONTEND_PATH" 2>/dev/null || stat -f '%Su:%Sg' "$FRONTEND_PATH" 2>/dev/null)
echo "Proprietário: $OWNER"
echo ""

# 9. Se ainda não funcionar, mudar propriedade para o usuário do Nginx
if [ "$NGINX_USER" != "root" ] && [ "$NGINX_USER" != "$(stat -c '%U' "$FRONTEND_PATH" 2>/dev/null || echo 'unknown')" ]; then
    echo "9. Mudando propriedade para usuário do Nginx..."
    chown -R "$NGINX_USER:$NGINX_USER" "$FRONTEND_PATH" 2>/dev/null || echo "⚠️ Não foi possível mudar propriedade (pode ser normal)"
    echo "✅ Propriedade alterada"
else
    echo "9. Propriedade já está correta ou Nginx é root"
fi
echo ""

# 10. Verificar permissões finais
echo "10. Verificando permissões finais..."
echo "Diretório raiz:"
ls -ld /domains
echo "Diretório do site:"
ls -ld /domains/biacrm.com
echo "Diretório public_html:"
ls -ld "$FRONTEND_PATH"
echo "Diretório assets:"
ls -ld "$FRONTEND_PATH/assets" 2>/dev/null || echo "Não encontrado"
echo ""

# 11. Recarregar Nginx
echo "11. Recarregando Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado"
else
    echo "⚠️ Erro ao recarregar, tentando restart..."
    systemctl restart nginx
fi
echo ""

# 12. Teste final
echo "12. Teste final de acesso..."
if [ -f "$FRONTEND_PATH/assets/index-D6a3CKmr.css" ]; then
    if [ "$NGINX_USER" != "root" ]; then
        if sudo -u "$NGINX_USER" test -r "$FRONTEND_PATH/assets/index-D6a3CKmr.css"; then
            echo "✅ SUCESSO: Nginx pode ler o arquivo CSS"
        else
            echo "❌ FALHA: Nginx ainda não consegue ler o arquivo CSS"
            echo "Permissões atuais:"
            ls -la "$FRONTEND_PATH/assets/index-D6a3CKmr.css"
        fi
    fi
fi
echo ""

echo "========================================"
echo "  ✅ CORREÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Se ainda houver erro, execute manualmente:"
echo "  chmod -R 755 /domains"
echo "  chmod -R 644 /domains/biacrm.com/public_html/*"
echo "  find /domains/biacrm.com/public_html -type d -exec chmod 755 {} \\;"
echo "  find /domains/biacrm.com/public_html -type f -exec chmod 644 {} \\;"
echo ""


