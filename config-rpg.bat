@echo off
REM HumbBot RPG - Configuration Setup
REM Edit this file to match your system paths

echo 🔧 HumbBot RPG Configuration

echo.
echo Current Configuration:
echo ========================
echo.

REM Default paths - edit these to match your setup
set DEFAULT_LLAMACPP_PATH=C:\llamacpp
set DEFAULT_EMBEDDING_MODEL=nomic-embed-text-v1.5.Q8_0.gguf
set DEFAULT_LLM_MODEL=Qwen2.5-7B-Instruct-Q4_K_M.gguf

echo LlamaCpp Path: %DEFAULT_LLAMACPP_PATH%
echo Embedding Model: %DEFAULT_EMBEDDING_MODEL%
echo LLM Model: %DEFAULT_LLM_MODEL%
echo.

echo Service URLs:
echo ==============
echo Embedding Service: http://127.0.0.1:8082
echo LLM Service: http://127.0.0.1:8080  
echo RPG Server: http://127.0.0.1:3001
echo.

echo GitHub Repository:
echo ==================
git remote get-url origin 2>nul || echo Not a git repository

echo.
echo System Check:
echo =============

REM Check if llamacpp exists
if exist "%DEFAULT_LLAMACPP_PATH%" (
    echo ✅ LlamaCpp directory found
) else (
    echo ❌ LlamaCpp not found at %DEFAULT_LLAMACPP_PATH%
    echo Download from: https://github.com/ggerganov/llama.cpp/releases
)

REM Check if models exist  
if exist "%DEFAULT_LLAMACPP_PATH%\models\%DEFAULT_EMBEDDING_MODEL%" (
    echo ✅ Embedding model found
) else (
    echo ❌ Embedding model not found
    echo Download from: https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF
)

if exist "%DEFAULT_LLAMACPP_PATH%\models\%DEFAULT_LLM_MODEL%" (
    echo ✅ LLM model found
) else (
    echo ⚠️  LLM model not found (optional for memory-only mode)
    echo Download from: https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF
)

echo.
echo Node.js version:
node --version 2>nul || echo ❌ Node.js not installed

echo NPM version:  
npm --version 2>nul || echo ❌ NPM not installed

echo.
echo To customize paths, edit the variables in start-rpg-full.bat
echo.
pause