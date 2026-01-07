#!/bin/bash
# Script para criar os diretórios necessários no servidor
# Execute via SSH no servidor

echo "Criando diretórios no servidor..."

# Criar diretórios do backend
mkdir -p /var/www/biacrm/backend/dist
mkdir -p /var/www/biacrm/backend

# Criar diretórios do frontend
mkdir -p /var/www/biacrm/frontend/dist

# Definir permissões (ajuste conforme necessário)
chown -R root:root /var/www/biacrm
chmod -R 755 /var/www/biacrm

echo "✅ Diretórios criados com sucesso!"
echo ""
echo "Estrutura criada:"
echo "  /var/www/biacrm/backend/dist/"
echo "  /var/www/biacrm/frontend/dist/"








