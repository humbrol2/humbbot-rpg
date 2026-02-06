@echo off
REM HumbBot RPG - Complete Startup Script
REM Starts all required services and ensures GitHub is updated

echo.
echo ========================================
echo   🎲 HumbBot RPG - Complete Startup
echo ========================================
echo.

REM Set color for better visibility
color 0A

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Not in HumbBot RPG directory
    echo Please run this script from the humbbot-rpg folder
    pause
    exit /b 1
)

echo 🔍 Checking repository status...
git status

echo.
echo 💾 Committing any uncommitted changes...
git add .
git diff --cached --quiet
if errorlevel 1 (
    set /p commit_msg="Enter commit message (or press Enter for auto-generated): "
    if "!commit_msg!"=="" (
        set commit_msg=🔄 Auto-commit before RPG startup - %date% %time%
    )
    git commit -m "!commit_msg!"
    echo ✅ Changes committed
) else (
    echo ✅ No changes to commit
)

echo.
echo 🚀 Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ⚠️  Push failed - continuing anyway
) else (
    echo ✅ GitHub updated
)

echo.
echo 🔌 Checking required services...

REM Check if embedding service (port 8082) is running
echo Checking embedding service on port 8082...
netstat -an | find ":8082" >nul
if errorlevel 1 (
    echo ❌ Embedding service not running on port 8082
    echo Please start your local embedding server:
    echo   llamacpp-server --model nomic-embed-text --port 8082
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /I not "!continue!"=="y" (
        echo Startup cancelled
        pause
        exit /b 1
    )
) else (
    echo ✅ Embedding service detected on port 8082
)

REM Check if main LLM service (port 8080) is running
echo Checking main LLM service on port 8080...
netstat -an | find ":8080" >nul
if errorlevel 1 (
    echo ❌ Main LLM service not running on port 8080
    echo This is optional for memory-only testing
    echo To start: llamacpp-server --model your-model --port 8080
) else (
    echo ✅ Main LLM service detected on port 8080
)

echo.
echo 🏗️  Installing/updating dependencies...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed
    pause
    exit /b 1
)

echo.
echo 📚 Initializing database...
cd server
call npm install
if errorlevel 1 (
    echo ❌ Server npm install failed
    pause
    exit /b 1
)

echo.
echo 🧪 Running quick system test...
cd ..
node simple-test.mjs
if errorlevel 1 (
    echo ❌ System test failed - check embedding service
    set /p continue="Continue anyway? (y/N): "
    if /I not "!continue!"=="y" (
        echo Startup cancelled
        pause
        exit /b 1
    )
) else (
    echo ✅ System test passed
)

echo.
echo 🎮 Starting HumbBot RPG Server...
echo.
echo Server will start on: http://localhost:3001
echo Client (if built) will be served from: http://localhost:3001
echo API endpoints available at: http://localhost:3001/api/
echo.
echo ⚡ Enhanced Memory Features:
echo   • Vector semantic search enabled
echo   • Persistent RPG memory across sessions  
echo   • Natural language memory queries
echo   • Automatic memory compression and aging
echo.
echo 🔧 Useful API Endpoints:
echo   • GET  /api/health - Health check
echo   • POST /api/enhanced-sessions - Create session with memory
echo   • POST /api/enhanced-sessions/:id/search - Search memories
echo   • GET  /api/enhanced-sessions/:id/stats - Memory statistics
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd server
start "HumbBot RPG Server" /D "%cd%" npm start

echo.
echo 🌐 Opening browser...
timeout /t 3 >nul
start http://localhost:3001

echo.
echo ========================================
echo   🎉 HumbBot RPG Started Successfully!
echo ========================================
echo.
echo The server is now running in a separate window.
echo Check the server window for detailed logs.
echo.
echo 📊 To monitor the system:
echo   • Server logs in the HumbBot RPG Server window
echo   • API health: http://localhost:3001/api/health
echo   • Create sessions via API or web interface
echo.

pause