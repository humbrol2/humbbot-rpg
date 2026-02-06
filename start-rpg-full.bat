@echo off
setlocal enabledelayedexpansion
REM HumbBot RPG - Full Environment Startup Script
REM Starts embedding service, LLM service, and RPG server

echo.
echo ========================================
echo   🎲 HumbBot RPG - Full Environment
echo ========================================
echo.

color 0A

REM Configuration - adjust these paths as needed
set LLAMACPP_PATH=C:\llamacpp
set EMBEDDING_MODEL_PATH=%LLAMACPP_PATH%\models\nomic-embed-text-v1.5.Q8_0.gguf
set LLM_MODEL_PATH=%LLAMACPP_PATH%\models\Qwen2.5-7B-Instruct-Q4_K_M.gguf

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Not in HumbBot RPG directory
    echo Please run this script from the humbbot-rpg folder
    pause
    exit /b 1
)

echo 🔍 Updating GitHub repository...
git add .
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "🔄 Auto-commit before full RPG startup - %date% %time%"
    echo ✅ Changes committed
)
git push origin main
if errorlevel 1 (
    echo ⚠️  GitHub push failed - continuing anyway
) else (
    echo ✅ GitHub updated successfully
)

echo.
echo 🔧 Checking and starting required services...

REM Check/Start Embedding Service (Port 8082)
echo.
echo 🧠 Checking embedding service...
netstat -an | find ":8082" >nul
if errorlevel 1 (
    echo Starting embedding service on port 8082...
    if exist "%EMBEDDING_MODEL_PATH%" (
        start "Embedding Service (Port 8082)" /D "%LLAMACPP_PATH%" ^
            llamacpp-server.exe ^
            --model "%EMBEDDING_MODEL_PATH%" ^
            --port 8082 ^
            --embedding ^
            --log-disable ^
            --host 127.0.0.1
        echo ✅ Embedding service starting...
        timeout /t 5 >nul
    ) else (
        echo ❌ Embedding model not found: %EMBEDDING_MODEL_PATH%
        echo Please download nomic-embed-text model or adjust EMBEDDING_MODEL_PATH
        echo Download from: https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF
        set /p continue="Continue without embedding service? (y/N): "
        if /I not "!continue!"=="y" (
            echo Startup cancelled
            pause
            exit /b 1
        )
    )
) else (
    echo ✅ Embedding service already running on port 8082
)

REM Check/Start Main LLM Service (Port 8080) - Optional
echo.
echo 🤖 Checking main LLM service...
netstat -an | find ":8080" >nul
if errorlevel 1 (
    echo Main LLM service not running on port 8080
    set /p start_llm="Start LLM service for full GM responses? (Y/n): "
    if /I not "!start_llm!"=="n" (
        if exist "%LLM_MODEL_PATH%" (
            start "LLM Service (Port 8080)" /D "%LLAMACPP_PATH%" ^
                llamacpp-server.exe ^
                --model "%LLM_MODEL_PATH%" ^
                --port 8080 ^
                --host 127.0.0.1 ^
                --ctx-size 4096 ^
                --threads 4 ^
                --log-disable
            echo ✅ LLM service starting...
            timeout /t 8 >nul
        ) else (
            echo ❌ LLM model not found: %LLM_MODEL_PATH%
            echo Please download a model or adjust LLM_MODEL_PATH
            echo Continuing with memory-only mode...
        )
    )
) else (
    echo ✅ Main LLM service already running on port 8080
)

echo.
echo 🏗️  Installing dependencies and running tests...
call npm install --silent
cd server
call npm install --silent
cd ..

REM Quick system validation
echo.
echo 🧪 Validating system...
node simple-test.mjs
if errorlevel 1 (
    echo ⚠️  System test failed - some features may not work
) else (
    echo ✅ All systems validated
)

echo.
echo 🎮 Starting HumbBot RPG Server...
echo.
echo ========================================
echo   🚀 SYSTEM STATUS
echo ========================================
echo.
echo 🌐 Web Interface: http://localhost:3001
echo 📡 API Base URL:  http://localhost:3001/api/
echo 🧠 Memory System: Enhanced Vector Memory Enabled
echo.
echo 🔌 Service Status:
netstat -an | find ":8082" >nul && echo   ✅ Embedding Service: Running (Port 8082) || echo   ❌ Embedding Service: Not Running
netstat -an | find ":8080" >nul && echo   ✅ LLM Service: Running (Port 8080) || echo   ❌ LLM Service: Not Running (Memory-only mode)
echo.
echo 🎯 Quick Start:
echo   1. Open http://localhost:3001 in your browser
echo   2. Create a world and character
echo   3. Start an enhanced session for vector memory
echo   4. Begin your AI-powered RPG adventure!
echo.
echo 📚 API Examples:
echo   • Health: GET /api/health
echo   • Create Enhanced Session: POST /api/enhanced-sessions
echo   • Search Memories: POST /api/enhanced-sessions/:id/search
echo   • Memory Stats: GET /api/enhanced-sessions/:id/stats
echo.
echo Press Ctrl+C in the server window to stop
echo ========================================
echo.

REM Start the RPG server
cd server
start "🎲 HumbBot RPG Server" /D "%cd%" npm start

REM Wait a moment then open browser
timeout /t 5 >nul
start http://localhost:3001

echo.
echo 🎉 HumbBot RPG Full Environment Started!
echo.
echo All services are running in separate windows.
echo Check individual windows for detailed logs.
echo.
echo To stop all services:
echo   1. Press Ctrl+C in each service window, or
echo   2. Run: taskkill /F /IM llamacpp-server.exe /IM node.exe
echo.

pause