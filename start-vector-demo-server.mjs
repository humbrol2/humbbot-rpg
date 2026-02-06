#!/usr/bin/env node

/**
 * Vector Memory Demo Server
 * Starts a local server to showcase vector memory functionality
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8888;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    try {
        // Route handling
        if (req.url === '/' || req.url === '/index.html') {
            // Serve the demo page
            const htmlContent = fs.readFileSync(path.join(__dirname, 'vector-memory-demo.html'), 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
            
        } else if (req.url === '/api/search' && req.method === 'POST') {
            // Handle memory search requests
            await handleMemorySearch(req, res);
            
        } else if (req.url === '/api/rpg/action' && req.method === 'POST') {
            // Handle RPG character actions
            await handleRPGAction(req, res);
            
        } else if (req.url === '/api/rpg/context' && req.method === 'POST') {
            // Handle GM context generation
            await handleGMContext(req, res);
            
        } else if (req.url === '/api/memory/add' && req.method === 'POST') {
            // Handle adding new memories
            await handleAddMemory(req, res);
            
        } else if (req.url === '/api/status') {
            // System status check
            await handleStatus(req, res);
            
        } else {
            // 404 for unknown routes
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

// Helper function to parse JSON from request
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

async function handleMemorySearch(req, res) {
    try {
        const { query } = await parseRequestBody(req);
        
        // Import and use the actual vector memory system
        const { EnhancedMemorySystem } = await import('./enhanced-memory-system.mjs');
        const memorySystem = new EnhancedMemorySystem();
        
        const results = await memorySystem.memory_search(query, { maxResults: 5 });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            query: query,
            results: results.map(result => ({
                content: result.content.substring(0, 200),
                source: result.path || result.source,
                score: result.score || result.similarity || 0.5,
                type: result.type || 'unknown'
            }))
        }));
        
    } catch (error) {
        console.error('Memory search error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

async function handleRPGAction(req, res) {
    try {
        const { characterId, action, location, worldType } = await parseRequestBody(req);
        
        const { RPGVectorMemory } = await import('./rpg-vector-enhancement.mjs');
        const rpgMemory = new RPGVectorMemory();
        
        await rpgMemory.initializeSession('demo_session', worldType || 'fantasy');
        
        const memoryId = await rpgMemory.addCharacterAction(characterId, action, {
            location: location,
            outcome: 'action completed',
            emotions: ['determined']
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            memoryId: memoryId,
            message: `Action stored for ${characterId}`
        }));
        
    } catch (error) {
        console.error('RPG action error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

async function handleGMContext(req, res) {
    try {
        const { characterId, situation, location, worldType } = await parseRequestBody(req);
        
        const { RPGVectorMemory } = await import('./rpg-vector-enhancement.mjs');
        const rpgMemory = new RPGVectorMemory();
        
        await rpgMemory.initializeSession('demo_session', worldType || 'fantasy');
        
        const gmContext = await rpgMemory.generateGMPrompt(characterId, situation, location);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            prompt: gmContext.prompt,
            characterHistory: gmContext.characterHistory.length,
            worldContext: gmContext.worldContext.relevantHistory.length
        }));
        
    } catch (error) {
        console.error('GM context error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

async function handleAddMemory(req, res) {
    try {
        const { content, source, type } = await parseRequestBody(req);
        
        const { EnhancedMemorySystem } = await import('./enhanced-memory-system.mjs');
        const memorySystem = new EnhancedMemorySystem();
        
        const memoryId = await memorySystem.addMemory(content, source, type);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            memoryId: memoryId,
            message: 'Memory stored successfully'
        }));
        
    } catch (error) {
        console.error('Add memory error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

async function handleStatus(req, res) {
    try {
        // Check embedding service
        let embeddingStatus = false;
        try {
            const response = await fetch('http://127.0.0.1:8082/v1/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: 'test', model: 'nomic-embed' })
            });
            embeddingStatus = response.ok;
        } catch (error) {
            embeddingStatus = false;
        }
        
        const { EnhancedMemorySystem } = await import('./enhanced-memory-system.mjs');
        const memorySystem = new EnhancedMemorySystem();
        const memoryStats = await memorySystem.getStats();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            embeddingService: embeddingStatus,
            vectorMemory: {
                operational: true,
                memoriesIndexed: memoryStats.vectorMemories,
                isIndexed: memoryStats.isIndexed
            },
            serverTime: new Date().toISOString()
        }));
        
    } catch (error) {
        console.error('Status check error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

server.listen(PORT, () => {
    console.log('🚀 Vector Memory Demo Server Started');
    console.log('=' .repeat(40));
    console.log(`🌐 Demo URL: http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log(`  GET  /              - Demo interface`);
    console.log(`  POST /api/search    - Memory search`);
    console.log(`  POST /api/rpg/action - Add character action`);
    console.log(`  POST /api/rpg/context - Generate GM context`);
    console.log(`  POST /api/memory/add - Add memory entry`);
    console.log(`  GET  /api/status    - System status`);
    console.log('');
    console.log('🎮 Features:');
    console.log('  • Semantic memory search');
    console.log('  • RPG character persistence');
    console.log('  • Real-time vector embeddings');
    console.log('  • GM context generation');
    console.log('');
    console.log('Press Ctrl+C to stop server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down Vector Memory Demo Server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

export default server;