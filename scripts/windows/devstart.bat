@echo off
setlocal

:: Variable paths
set BACKEND_PATH=..\..\backend
set FRONTEND_PATH=..\..\frontend

:: Start backend
start "Backend" cmd /c "cd /d %BACKEND_PATH% && npm install && npm run dev"
timeout /t 2 /nobreak >nul

:: Start frontend
start "Frontend" cmd /c "cd /d %FRONTEND_PATH% && npm install && npm start"
timeout /t 2 /nobreak >nul

:: Wait 
echo.
echo Press any key to stop frontend and backend...
pause >nul

:: Kill all npm processes and child processes
echo Stopping frontend and backend...
taskkill /IM node.exe /F >nul 2>&1
echo All processes stopped.
endlocal
exit