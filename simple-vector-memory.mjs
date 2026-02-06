
/**
 * Simple In-Memory Vector Store
 * Uses local embeddings without external dependencies
 */

class SimpleVectorMemory {
    constructor() {
        this.memories = [];
        this.embeddingUrl = 'http://127.0.0.1:8082/v1/embeddings';
    }
    
    async addMemory(content, source, type = 'general') {
        try {
            const embedding = await this.generateEmbedding(content);
            const memory = {
                id: Date.now().toString(),
                content,
                source,
                type,
                embedding,
                timestamp: Date.now()
            };
            
            this.memories.push(memory);
            return memory.id;
        } catch (error) {
            console.error('Failed to add memory:', error.message);
            return null;
        }
    }
    
    async generateEmbedding(text) {
        const response = await fetch(this.embeddingUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: text,
                model: 'nomic-embed'
            })
        });
        
        if (!response.ok) {
            throw new Error('Embedding generation failed');
        }
        
        const result = await response.json();
        return result.data[0].embedding;
    }
    
    async searchMemory(query, options = {}) {
        const { limit = 5, minSimilarity = 0.7 } = options;
        
        try {
            const queryEmbedding = await this.generateEmbedding(query);
            
            const similarities = this.memories.map(memory => ({
                ...memory,
                similarity: this.cosineSimilarity(queryEmbedding, memory.embedding)
            }));
            
            return similarities
                .filter(m => m.similarity >= minSimilarity)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Search failed:', error.message);
            return [];
        }
    }
    
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

export { SimpleVectorMemory };
