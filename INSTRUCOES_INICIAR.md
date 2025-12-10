# Como Iniciar a Aplicação CRM BIA

## Método 1: Script PowerShell (Recomendado)

Execute no PowerShell (como Administrador, se necessário):

```powershell
powershell -ExecutionPolicy Bypass -File .\start-servers.ps1
```

## Método 2: Scripts Batch

Execute o arquivo:
```
start-all.bat
```

Ou execute separadamente:
- `start-backend.bat` - Para iniciar apenas o backend
- `start-frontend.bat` - Para iniciar apenas o frontend

## Método 3: Manual (2 Terminais)

### Terminal 1 - Backend:
```bash
cd backend
npm install  # Se ainda não instalou
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install  # Se ainda não instalou
npm run dev
```

## Verificar se está funcionando:

1. **Backend**: Acesse http://localhost:3000/health
   - Deve retornar: `{"status":"ok","database":"connected"}`

2. **Frontend**: Acesse http://localhost:5173
   - Deve abrir a tela de login

## Problemas Comuns:

### Erro: "Cannot find module"
**Solução**: Execute `npm install` na pasta do backend e frontend

### Erro: "Port already in use"
**Solução**: Feche outros processos usando as portas 3000 ou 5173:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### Erro: "Database connection error"
**Solução**: Verifique se o arquivo `backend/database.sqlite` existe. Se não existir, o servidor criará automaticamente.

## URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

