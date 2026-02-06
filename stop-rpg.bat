@echo off
REM HumbBot RPG - Stop All Services

echo 🛑 Stopping HumbBot RPG Services...

echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes to stop
) else (
    echo ✅ Node.js processes stopped
)

echo Stopping llamacpp-server processes...
taskkill /F /IM llamacpp-server.exe 2>nul
if errorlevel 1 (
    echo No llamacpp-server processes to stop
) else (
    echo ✅ LlamaCpp server processes stopped
)

echo Stopping any Python processes (if using Python embedding)...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *embedding*" 2>nul

echo.
echo 🎯 Checking ports...
netstat -an | find ":3001" >nul && echo ⚠️  Port 3001 still in use || echo ✅ Port 3001 free
netstat -an | find ":8080" >nul && echo ⚠️  Port 8080 still in use || echo ✅ Port 8080 free  
netstat -an | find ":8082" >nul && echo ⚠️  Port 8082 still in use || echo ✅ Port 8082 free

echo.
echo ✅ HumbBot RPG services stopped
pause