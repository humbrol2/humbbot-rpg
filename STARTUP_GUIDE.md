# 🎲 HumbBot RPG - Startup Scripts Guide

## 📁 **Available Scripts**

### 🚀 **start-rpg.bat** - Standard Startup
**Best for most users**
- Updates GitHub repository
- Checks required services
- Installs dependencies
- Runs system tests
- Starts RPG server
- Opens browser automatically

### ⚡ **start-rpg-full.bat** - Complete Environment
**For advanced users with local models**
- Everything in standard startup PLUS:
- Automatically starts embedding service (port 8082)
- Optionally starts LLM service (port 8080)  
- Configurable model paths
- Full service management

### 🎯 **start-rpg-simple.bat** - Quick Start
**When services are already running**
- Minimal startup for development
- Assumes embedding service already running
- Quick GitHub update
- Fast server start

### 🛑 **stop-rpg.bat** - Cleanup
- Stops all RPG-related processes
- Kills Node.js servers
- Kills LlamaCpp servers
- Checks port availability

### 🔧 **config-rpg.bat** - System Check
- Validates configuration
- Checks model availability
- Tests Node.js/NPM installation
- Shows current paths and URLs

---

## ⚙️ **Setup Requirements**

### **Required Services**
1. **Node.js** - For running the RPG server
2. **Embedding Service** - For vector memory (port 8082)
   - Download: [Nomic Embed Text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF)
   - Start with: `llamacpp-server --model nomic-embed-text --port 8082 --embedding`

### **Optional Services** 
3. **LLM Service** - For GM responses (port 8080)
   - Download: [Qwen 2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF)
   - Start with: `llamacpp-server --model qwen2.5-7b --port 8080`

---

## 🎮 **Quick Start Guide**

### **Option 1: Full Automatic Setup**
```batch
# Run this for complete automated setup
start-rpg-full.bat
```

### **Option 2: Manual Service Setup**
```batch
# 1. Start embedding service manually
llamacpp-server --model your-embedding-model --port 8082 --embedding

# 2. Run standard startup  
start-rpg.bat
```

### **Option 3: Development Mode**
```batch
# 1. Ensure services are running (check with config-rpg.bat)
# 2. Quick start for development
start-rpg-simple.bat
```

---

## 📊 **What Gets Started**

### **Core Services**
- **RPG Server**: `http://localhost:3001`
  - Web interface for RPG sessions
  - REST API for all RPG operations
  - Enhanced memory integration

### **API Endpoints**
- **Health Check**: `GET /api/health`
- **Create Enhanced Session**: `POST /api/enhanced-sessions`
- **Memory Search**: `POST /api/enhanced-sessions/:id/search`
- **Memory Stats**: `GET /api/enhanced-sessions/:id/stats`

### **Memory Features**
- **Vector Semantic Search** - Find events by meaning, not just keywords
- **Persistent Memory** - Story continues across sessions
- **Context-Aware Retrieval** - GM gets relevant memories for current scene
- **Natural Language Queries** - Search like "dragon battle" or "wizard conversation"

---

## 🔧 **Customization**

### **Edit Paths in start-rpg-full.bat**
```batch
REM Adjust these paths to match your system
set LLAMACPP_PATH=C:\your\llamacpp\path
set EMBEDDING_MODEL_PATH=%LLAMACPP_PATH%\models\your-embedding-model.gguf
set LLM_MODEL_PATH=%LLAMACPP_PATH%\models\your-llm-model.gguf
```

### **Port Configuration**
- **Embedding Service**: Port 8082 (required for vector memory)
- **LLM Service**: Port 8080 (optional, for GM responses)
- **RPG Server**: Port 3001 (web interface and API)

---

## 🐛 **Troubleshooting**

### **Common Issues**

**"Embedding service not running"**
- Run `config-rpg.bat` to check setup
- Download embedding model from HuggingFace
- Ensure llamacpp-server is in PATH or adjust script paths

**"npm install failed"**  
- Update Node.js to latest LTS version
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**"Port already in use"**
- Run `stop-rpg.bat` to clean up processes
- Check task manager for hung processes
- Restart if necessary

**"Git push failed"**
- Check internet connection
- Verify GitHub credentials
- May need to pull latest changes first

### **System Requirements**
- **RAM**: 4GB minimum, 8GB recommended (for local models)
- **CPU**: Modern multi-core processor
- **Disk**: 2GB free space for models
- **OS**: Windows 10/11 (batch files are Windows-specific)

---

## 🎯 **Usage Examples**

### **Create an Enhanced RPG Session**
1. Run `start-rpg.bat`
2. Open `http://localhost:3001`
3. Create a world and character
4. Start enhanced session with vector memory
5. Begin your AI-powered adventure!

### **Search RPG Memories**
```javascript
// Via API
POST /api/enhanced-sessions/your-session-id/search
{
  "query": "ancient dragon in the cave",
  "limit": 5
}
```

### **Monitor Memory System**
```javascript  
// Get memory statistics
GET /api/enhanced-sessions/your-session-id/stats
// Returns: memory events, vector storage, performance metrics
```

---

## 🔄 **GitHub Integration**

All startup scripts automatically:
- ✅ Stage any uncommitted changes
- ✅ Commit with timestamp
- ✅ Push to main branch
- ✅ Continue even if GitHub operations fail

This ensures your RPG development and content is always backed up to GitHub.

---

**Happy adventuring! 🗡️⚡🧙‍♂️**