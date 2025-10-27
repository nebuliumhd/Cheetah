@echo off
setlocal

:: Variable paths
set BACKEND_PATH=..\..\backend
set FRONTEND_PATH=..\..\frontend

:: Start backend
start "Backend Tests" cmd /c "cd /d %BACKEND_PATH% && npm install && npm test"
timeout /t 2 /nobreak >nul

:: Start frontend
start "Frontend Tests" cmd /c "cd /d %FRONTEND_PATH% && npm install && npm test"
timeout /t 2 /nobreak >nul

:: Wait 
echo.
echo Press any key to finish...
pause >nul

:: Kill all npm processes and child processes
echo Stopping frontend and backend...
taskkill /IM node.exe /F >nul 2>&1
echo All processes stopped.
endlocal
exit