# Comandos SCP para Deploy em Produção

## Servidor: `root@92.113.33.226`

### ✅ Caminhos corretos no servidor:
- **Backend**: `/var/www/biacrm/api/`
- **Frontend**: `/var/www/biacrm/` (ou `/var/www/biacrm/dist/`)

---

## 📦 1. BACKEND - Enviar arquivos compilados

```bash
# Enviar arquivos compilados do backend
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/dist/

# Enviar package.json (necessário para instalar dependências de produção)
scp backend/package.json root@92.113.33.226:/var/www/biacrm/api/

# Enviar package-lock.json (recomendado para garantir versões corretas)
scp backend/package-lock.json root@92.113.33.226:/var/www/biacrm/api/
```

---

## 🌐 2. FRONTEND - Enviar arquivos estáticos

```bash
# Enviar todos os arquivos do build do frontend
scp -r frontend/dist/* root@92.113.33.226:/var/www/biacrm/dist/
```

---

## 🔧 3. Comandos adicionais (opcionais)

### Enviar arquivo de exemplo de configuração
```bash
# Se você tiver um arquivo .env.example
scp backend/.env.example root@92.113.33.226:/var/www/biacrm/api/.env
```

### Enviar tsconfig.json (se necessário para referência)
```bash
scp backend/tsconfig.json root@92.113.33.226:/var/www/biacrm/api/
```

---

## 📋 Comandos completos em uma única execução

### Opção 1: Executar todos os comandos de uma vez
```bash
# Backend
scp -r backend/dist/* root@92.113.33.226:/var/www/biacrm/api/dist/ && \
scp backend/package.json root@92.113.33.226:/var/www/biacrm/api/ && \
scp backend/package-lock.json root@92.113.33.226:/var/www/biacrm/api/

# Frontend
scp -r frontend/dist/* root@92.113.33.226:/var/www/biacrm/dist/
```

### Opção 2: Usar o script deploy-commands.sh
```bash
# Dar permissão de execução
chmod +x deploy-commands.sh

# Editar o arquivo e ajustar os caminhos
nano deploy-commands.sh

# Executar
./deploy-commands.sh
```

---

## 🚀 Após o upload - Comandos no servidor

### 1. Conectar ao servidor
```bash
ssh root@92.113.33.226
```

### 2. Instalar dependências do backend (apenas produção)
```bash
cd /var/www/biacrm/api
npm install --production
```

### 3. Executar migrações do banco de dados (se necessário)
```bash
cd /var/www/biacrm/api
npm run migrate
```

### 4. Iniciar o servidor backend
```bash
cd /var/www/biacrm/api
npm start
```

### 5. Configurar servidor web para servir o frontend
- Configure Nginx/Apache para servir os arquivos de `/var/www/biacrm/dist/`
- Ou use um servidor Node.js como `serve`:
  ```bash
  npm install -g serve
  serve -s /var/www/biacrm/dist -l 80
  ```

---

## ⚙️ Configuração de variáveis de ambiente

Crie o arquivo `.env` no servidor com as seguintes variáveis:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=sqlite:./database.sqlite
# OU para PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Facebook OAuth (usado também para Instagram)
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret

# Instagram Redirect URI
INSTAGRAM_REDIRECT_URI=https://seu-dominio.com/api/integrations/instagram/callback

# Frontend URL
FRONTEND_URL=https://seu-dominio.com
```

---

## 📝 Checklist de Deploy

- [ ] Build do backend executado (`npm run build` no backend)
- [ ] Build do frontend executado (`npm run build` no frontend)
- [ ] Arquivos enviados via SCP
- [ ] Dependências instaladas no servidor (`npm install --production`)
- [ ] Arquivo `.env` configurado no servidor
- [ ] Migrações do banco executadas (`npm run migrate`)
- [ ] Servidor backend iniciado (`npm start`)
- [ ] Servidor web configurado para servir o frontend
- [ ] Testes de funcionamento realizados

---

## 🔍 Verificação

### Testar backend
```bash
curl http://92.113.33.226:3000/health
```

### Testar frontend
Acesse `http://92.113.33.226` no navegador

---

## 🆘 Troubleshooting

### Erro de permissão
```bash
# Verificar permissões dos arquivos
ls -la /var/www/biacrm/api/dist/
chmod +x /var/www/biacrm/api/dist/index.js
```

### Erro de porta em uso
```bash
# Verificar processos usando a porta 3000
lsof -i :3000
# Ou
netstat -tulpn | grep :3000
```

### Erro de banco de dados
```bash
# Verificar se o arquivo database.sqlite existe
ls -la /var/www/biacrm/api/database.sqlite
# Se não existir, executar migrações
cd /var/www/biacrm/api
npm run migrate
```

