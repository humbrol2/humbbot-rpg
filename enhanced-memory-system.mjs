#!/usr/bin/env node

/**
 * Enhanced Memory System with Vector Integration
 * 
 * Upgrades OpenClaw's memory_search with semantic vector capabilities
 * while maintaining file-based fallback compatibility.
 */

import { SimpleVectorMemory } from './simple-vector-memory.mjs';
import fs from 'fs';
import path from 'path';

class EnhancedMemorySystem {
    constructor(options = {}) {
        this.vectorMemory = new SimpleVectorMemory();
        this.memoryPaths = options.memoryPaths || [
            'MEMORY.md',
            'memory/',
            'research/',
            'projects/'
        ];
        this.isIndexed = false;
        this.indexingInProgress = false;
    }
    
    /**
     * Enhanced memory_search replacement with vector capabilities
     */
    async memory_search(query, options = {}) {
        const {
            maxResults = 10,
            minScore = 0.6,
            vectorSearch = true,
            fallbackToFiles = true
        } = options;
        
        console.log(`🔍 Enhanced memory search: "${query}"`);
        
        // Ensure vector index is populated
        if (!this.isIndexed && !this.indexingInProgress) {
            await this.indexExistingMemories();
        }
        
        let results = [];
        
        if (vectorSearch) {
            try {
                // Vector-based semantic search
                const vectorResults = await this.vectorMemory.searchMemory(query, {
                    limit: maxResults,
                    minSimilarity: minScore
                });
                
                results = vectorResults.map(result => ({
                    path: result.source,
                    content: result.content,
                    score: result.similarity,
                    lines: this.estimateLines(result.content),
                    type: result.type,
                    timestamp: result.timestamp,
                    searchType: 'vector'
                }));
                
                console.log(`✅ Vector search found ${results.length} results`);
                
            } catch (error) {
                console.warn('Vector search failed:', error.message);
            }
        }
        
        // Fallback to traditional file search if needed
        if (results.length === 0 && fallbackToFiles) {
            results = await this.traditionalFileSearch(query, maxResults);
            console.log(`📁 File search found ${results.length} results`);
        }
        
        return results;
    }
    
    /**
     * Add new memory entry to both vector and file storage
     */
    async addMemory(content, source, memoryType = 'general') {
        try {
            // Add to vector memory
            const vectorId = await this.vectorMemory.addMemory(content, source, memoryType);
            
            // Also append to appropriate file for persistence
            await this.appendToFile(content, source, memoryType);
            
            console.log(`💾 Memory added: ${source} (vector: ${vectorId})`);
            return vectorId;
            
        } catch (error) {
            console.error('Failed to add memory:', error.message);
            throw error;
        }
    }
    
    /**
     * Index existing memory files into vector storage
     */
    async indexExistingMemories() {
        if (this.indexingInProgress) return;
        
        console.log('📦 Indexing existing memories into vector storage...');
        this.indexingInProgress = true;
        
        try {
            let indexed = 0;
            
            for (const memoryPath of this.memoryPaths) {
                if (fs.existsSync(memoryPath)) {
                    const stat = fs.statSync(memoryPath);
                    
                    if (stat.isDirectory()) {
                        indexed += await this.indexDirectory(memoryPath);
                    } else if (stat.isFile()) {
                        indexed += await this.indexFile(memoryPath);
                    }
                }
            }
            
            this.isIndexed = true;
            console.log(`✅ Indexed ${indexed} memory entries`);
            
        } catch (error) {
            console.error('Memory indexing failed:', error.message);
        } finally {
            this.indexingInProgress = false;
        }
    }
    
    async indexDirectory(dirPath) {
        let indexed = 0;
        
        try {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isFile() && this.isMemoryFile(file)) {
                    indexed += await this.indexFile(filePath);
                }
            }
        } catch (error) {
            console.warn(`Error indexing directory ${dirPath}:`, error.message);
        }
        
        return indexed;
    }
    
    async indexFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const sections = this.splitIntoSections(content, filePath);
            
            let indexed = 0;
            
            for (const section of sections) {
                if (section.content.trim().length > 100) { // Only index substantial content
                    await this.vectorMemory.addMemory(
                        section.content,
                        filePath,
                        this.determineMemoryType(filePath, section.content)
                    );
                    indexed++;
                }
            }
            
            return indexed;
            
        } catch (error) {
            console.warn(`Error indexing file ${filePath}:`, error.message);
            return 0;
        }
    }
    
    splitIntoSections(content, filePath) {
        const sections = [];
        
        if (filePath.endsWith('.md')) {
            // Split Markdown by headers
            const lines = content.split('\\n');
            let currentSection = { heading: '', content: [] };
            
            for (const line of lines) {
                if (line.startsWith('##') && currentSection.content.length > 0) {
                    sections.push({
                        heading: currentSection.heading,
                        content: currentSection.content.join('\\n')
                    });
                    currentSection = { heading: line, content: [] };
                } else if (line.startsWith('##')) {
                    currentSection.heading = line;
                } else {
                    currentSection.content.push(line);
                }
            }
            
            if (currentSection.content.length > 0) {
                sections.push({
                    heading: currentSection.heading,
                    content: currentSection.content.join('\\n')
                });
            }
        } else {
            // Split by paragraphs for non-Markdown files
            const paragraphs = content.split('\\n\\n');
            paragraphs.forEach(paragraph => {
                if (paragraph.trim().length > 50) {
                    sections.push({
                        heading: '',
                        content: paragraph.trim()
                    });
                }
            });
        }
        
        return sections;
    }
    
    determineMemoryType(filePath, content) {
        if (filePath === 'MEMORY.md') return 'long_term';
        if (filePath.includes('daily') || filePath.includes('2026-')) return 'daily';
        if (filePath.includes('research')) return 'research';
        if (filePath.includes('project')) return 'project';
        if (content.toLowerCase().includes('lesson') || content.toLowerCase().includes('learned')) return 'lesson';
        if (content.toLowerCase().includes('technical') || content.toLowerCase().includes('implementation')) return 'technical';
        return 'general';
    }
    
    isMemoryFile(filename) {
        const relevantExtensions = ['.md', '.txt'];
        return relevantExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
    
    async traditionalFileSearch(query, maxResults) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const memoryPath of this.memoryPaths) {
            if (fs.existsSync(memoryPath)) {
                const stat = fs.statSync(memoryPath);
                
                if (stat.isDirectory()) {
                    const dirResults = await this.searchDirectory(memoryPath, queryLower);
                    results.push(...dirResults);
                } else if (stat.isFile()) {
                    const fileResults = await this.searchFile(memoryPath, queryLower);
                    results.push(...fileResults);
                }
            }
        }
        
        return results.slice(0, maxResults);
    }
    
    async searchDirectory(dirPath, queryLower) {
        const results = [];
        
        try {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isFile() && this.isMemoryFile(file)) {
                    const fileResults = await this.searchFile(filePath, queryLower);
                    results.push(...fileResults);
                }
            }
        } catch (error) {
            console.warn(`Error searching directory ${dirPath}:`, error.message);
        }
        
        return results;
    }
    
    async searchFile(filePath, queryLower) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const contentLower = content.toLowerCase();
            
            if (contentLower.includes(queryLower)) {
                return [{
                    path: filePath,
                    content: content.substring(0, 500) + '...',
                    score: 0.5, // Default score for text search
                    lines: this.estimateLines(content),
                    type: 'file',
                    timestamp: fs.statSync(filePath).mtime.getTime(),
                    searchType: 'text'
                }];
            }
        } catch (error) {
            console.warn(`Error searching file ${filePath}:`, error.message);
        }
        
        return [];
    }
    
    estimateLines(content) {
        const lineCount = content.split('\\n').length;
        return `1-${lineCount}`;
    }
    
    async appendToFile(content, source, memoryType) {
        const today = new Date().toISOString().split('T')[0];
        let targetFile;
        
        if (memoryType === 'daily') {
            targetFile = `memory/${today}.md`;
        } else if (memoryType === 'long_term') {
            targetFile = 'MEMORY.md';
        } else {
            targetFile = `memory/vector-${today}.md`;
        }
        
        const entry = `\\n## Vector Memory Entry\\n**Source**: ${source}\\n**Type**: ${memoryType}\\n**Time**: ${new Date().toISOString()}\\n\\n${content}\\n`;
        
        // Ensure directory exists
        const dir = path.dirname(targetFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.appendFileSync(targetFile, entry);
    }
    
    /**
     * Get system statistics
     */
    async getStats() {
        return {
            vectorMemories: this.vectorMemory.memories.length,
            isIndexed: this.isIndexed,
            indexingInProgress: this.indexingInProgress,
            memoryPaths: this.memoryPaths,
            lastIndexed: this.isIndexed ? new Date().toISOString() : null
        };
    }
    
    /**
     * Search for specific memory types
     */
    async searchByType(memoryType, limit = 10) {
        const allMemories = this.vectorMemory.memories
            .filter(memory => memory.type === memoryType)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
            
        return allMemories.map(memory => ({
            path: memory.source,
            content: memory.content,
            score: 1.0, // Full score for exact type match
            type: memory.type,
            timestamp: memory.timestamp,
            searchType: 'type_filter'
        }));
    }
}

export { EnhancedMemorySystem };

// Use test-enhanced-memory.mjs for testing