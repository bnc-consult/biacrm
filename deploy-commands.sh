#!/bin/bash
# Comandos SCP para deploy em produção
# Servidor: root@92.113.33.226
# Execute estes comandos na raiz do projeto

# ============================================
# 1. BACKEND - Enviar arquivos compilados
# ============================================
echo "📦 Enviando arquivos do backend..."
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/dist/

# Enviar package.json do backend (necessário para instalar dependências)
scp backend/package.json root@92.113.33.226:/var/www/biacrm/api/

# Enviar package-lock.json (opcional, mas recomendado)
scp backend/package-lock.json root@92.113.33.226:/var/www/biacrm/api/

# ============================================
# 2. FRONTEND - Enviar arquivos estáticos
# ============================================
echo "🌐 Frontend não encontrado no servidor atual"
echo "   O frontend pode estar em outro servidor/domínio"
echo "   Ou ainda não foi feito deploy"
echo ""
echo "   Se precisar fazer deploy do frontend:"
echo "   1. Faça o build: cd frontend && npm run build"
echo "   2. Envie para o servidor apropriado"
# Descomente a linha abaixo se souber o caminho correto do frontend:
# scp -r frontend/dist/* root@92.113.33.226:/var/www/biacrm/dist/

# ============================================
# 3. ARQUIVOS DE CONFIGURAÇÃO (se necessário)
# ============================================
# Descomente as linhas abaixo se precisar enviar arquivos de configuração
# scp backend/.env.example root@92.113.33.226:/var/www/biacrm/backend/.env
# scp backend/tsconfig.json root@92.113.33.226:/var/www/biacrm/backend/

echo "✅ Upload concluído!"

