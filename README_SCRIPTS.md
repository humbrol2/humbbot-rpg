# 🎲 HumbBot RPG - One-Click Startup Scripts

## 🚀 **Quick Start** (Choose Your Adventure)

### 🎯 **For Most Users**: `start-rpg.bat`
```batch
# Double-click or run from command line
start-rpg.bat
```
**What it does:**
- ✅ Updates GitHub automatically
- ✅ Checks all required services  
- ✅ Installs dependencies
- ✅ Validates system with tests
- ✅ Starts RPG server
- ✅ Opens browser to http://localhost:3001

### ⚡ **For Advanced Users**: `start-rpg-full.bat`  
```batch
# Starts EVERYTHING automatically
start-rpg-full.bat
```
**What it does:**
- ✅ Everything in standard startup PLUS:
- ✅ Auto-starts embedding service (port 8082)
- ✅ Auto-starts LLM service (port 8080) 
- ✅ Manages all processes automatically

### 🎯 **For Developers**: `start-rpg-simple.bat`
```batch  
# When services already running
start-rpg-simple.bat
```
**What it does:**
- ✅ Quick GitHub update
- ✅ Fast server startup
- ✅ Minimal validation

---

## 🛑 **Stop Everything**: `stop-rpg.bat`
```batch
# Clean shutdown
stop-rpg.bat
```
**What it does:**
- ✅ Stops RPG server
- ✅ Stops embedding service
- ✅ Stops LLM service  
- ✅ Checks port availability

---

## 🔧 **System Check**: `config-rpg.bat`
```batch
# Validate your setup
config-rpg.bat
```
**What it does:**
- ✅ Checks model availability
- ✅ Validates Node.js installation
- ✅ Shows all configuration
- ✅ Tests service connectivity

---

## 🎮 **What You Get**

### **Enhanced RPG Experience**
- 🧠 **Vector Memory System** - AI remembers everything semantically
- 🔍 **Natural Language Search** - Find events by meaning 
- 📚 **Persistent Story** - Adventures continue across sessions
- 🤖 **AI Game Master** - Dynamic responses based on memory

### **Web Interface**: http://localhost:3001
- 🌍 Create worlds and characters
- 🎭 Start enhanced sessions with memory
- 📊 Monitor memory system performance
- 🔍 Search and explore your adventure history

### **API Endpoints**: http://localhost:3001/api/
- `POST /api/enhanced-sessions` - Create memory-enabled sessions
- `POST /api/enhanced-sessions/:id/search` - Search memories
- `GET /api/enhanced-sessions/:id/stats` - Memory statistics
- Full REST API for all RPG operations

---

## ⚠️ **Prerequisites**

### **Required**
- ✅ **Node.js** (Latest LTS)
- ✅ **Embedding Service** on port 8082
  - Download model: [Nomic Embed Text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF)
  - Manual start: `llamacpp-server --model nomic-embed --port 8082 --embedding`

### **Optional** 
- ⚡ **LLM Service** on port 8080 (for full GM responses)
  - Download model: [Qwen 2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF)
  - Manual start: `llamacpp-server --model qwen2.5 --port 8080`

---

## 🎯 **Recommendations**

### **New Users**: 
1. Run `config-rpg.bat` first to check setup
2. Use `start-rpg.bat` for guided startup
3. Follow browser prompts to create your first adventure

### **Advanced Users**:
1. Edit paths in `start-rpg-full.bat` 
2. Use `start-rpg-full.bat` for complete automation
3. Customize service configurations as needed

### **Developers**:
1. Use `start-rpg-simple.bat` for quick iteration
2. Run `stop-rpg.bat` between testing cycles
3. Check logs in separate service windows

---

## 🎉 **Ready to Adventure!**

Your enhanced RPG with AI memory is now one click away:

**`start-rpg.bat`** → **http://localhost:3001** → **Create & Play!** 🗡️⚡