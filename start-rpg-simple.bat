@echo off
REM HumbBot RPG - Simple Startup (assumes services already running)

echo 🎲 HumbBot RPG - Quick Start

REM Quick GitHub update
git add . >nul 2>&1
git commit -m "Auto-commit %date% %time%" >nul 2>&1
git push origin main >nul 2>&1

REM Check embedding service
netstat -an | find ":8082" >nul
if errorlevel 1 (
    echo ❌ Embedding service not running on port 8082
    echo Start with: llamacpp-server --model nomic-embed --port 8082 --embedding
    pause
    exit /b 1
)

echo ✅ Starting RPG server...
cd server
start "HumbBot RPG" npm start
timeout /t 3 >nul
start http://localhost:3001

echo ✅ HumbBot RPG started at http://localhost:3001