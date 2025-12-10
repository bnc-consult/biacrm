@echo off
echo Iniciando Backend e Frontend...
start "Backend - Porta 3000" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend - Porta 5173" cmd /k "cd frontend && npm run dev"
echo.
echo Servidores iniciados!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul

