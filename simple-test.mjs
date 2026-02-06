#!/usr/bin/env node

import VectorMemoryEnhancer from './server/services/vector-memory.js';

console.log('🧪 Simple Vector Memory Test');

try {
  const vectorMemory = new VectorMemoryEnhancer({
    vectorStorePath: './data/simple-test',
    embeddingServiceUrl: 'http://127.0.0.1:8082/v1/embeddings'
  });
  
  await vectorMemory.initialize();
  console.log('✓ Vector memory initialized');
  
  // Test basic embedding
  const embedding = await vectorMemory.generateEmbedding('test text');
  console.log('✓ Generated embedding:', embedding ? embedding.length + ' dimensions' : 'failed');
  
  // Test event storage
  const stored = await vectorMemory.storeEvent('test-001', 
    { type: 'test', data: 'test data' }, 
    'This is a test event for vector storage'
  );
  console.log('✓ Stored event:', stored);
  
  // Test search
  const results = await vectorMemory.semanticSearch('test event', 5);
  console.log('✓ Search results:', results.length);
  
  console.log('🎉 Simple test completed successfully');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}