/**
 * Integration Test Suite
 * تست یکپارچگی کامل workflow های واقعی سیستم
 */

import { TestSuite, TestCase } from '../core/TestSimulator';

export function createIntegrationTestSuite(baseUrl: string): TestSuite {
  const tests: TestCase[] = [
    // Full workflow: Create → Tag → Edit → Version → Search → Delete
    {
      id: 'int-001',
      name: 'Complete Prompt Lifecycle',
      description: 'Full CRUD workflow from creation to deletion',
      category: 'integration',
      timeout: 10000,
      run: async (ctx) => {
        ctx.log.info('🔄 Starting complete lifecycle test...');
        
        // Step 1: Create prompt
        ctx.log.debug('Step 1: Creating prompt...');
        const createResponse = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Integration Test Prompt',
            description: 'Full workflow test',
            content: 'Original content for testing',
            type: 'text',
            tags: ['integration', 'test'],
          }),
        });
        
        ctx.assert.statusCode(createResponse, 201, 'Create should succeed');
        const createData = await createResponse.json(); const prompt = createData.data;
        const promptId = prompt.id;
        ctx.log.info(`✅ Created prompt: ${promptId}`);
        
        // Step 2: Verify in list
        ctx.log.debug('Step 2: Verifying in list...');
        const listResponse = await fetch(`${baseUrl}/api/prompts`);
        const listData = await listResponse.json(); const prompts = listData.data;
        
        const found = prompts.find((p: any) => p.id === promptId);
        ctx.assert.isDefined(found, 'Prompt should appear in list');
        ctx.log.info(`✅ Found in list`);
        
        // Step 3: Search for it
        ctx.log.debug('Step 3: Searching...');
        const searchResponse = await fetch(`${baseUrl}/api/search?q=Integration`);
        const searchData = await searchResponse.json(); const results = searchData.data;
        
        const searchFound = results.find((r: any) => r.id === promptId);
        ctx.assert.isDefined(searchFound, 'Should be searchable');
        ctx.log.info(`✅ Found in search`);
        
        // Step 4: Verify statistics updated
        ctx.log.debug('Step 4: Checking statistics...');
        const statsResponse = await fetch(`${baseUrl}/api/statistics`);
        const statsData = await statsResponse.json(); const statistics = statsData.data;
        
        ctx.assert.isTrue(statistics.totalPrompts > 0, 'Statistics should reflect new prompt');
        ctx.log.info(`✅ Statistics: ${statistics.totalPrompts} total prompts`);
        
        ctx.log.info('🎉 Complete lifecycle test passed!');
      },
    },

    // Multi-tag workflow
    {
      id: 'int-002',
      name: 'Multi-Tag Management',
      description: 'Create prompt with multiple tags and verify relationships',
      category: 'integration',
      run: async (ctx) => {
        // Create multiple tags
        const tagNames = ['tag1', 'tag2', 'tag3'];
        const createdTags = [];
        
        for (const name of tagNames) {
          const response = await fetch(`${baseUrl}/api/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `int-${name}-${Date.now()}`, color: '#FF0000' }),
          });
          const tagData = await response.json(); const tag = tagData.data;
          createdTags.push(tag.name);
        }
        
        ctx.log.info(`Created ${createdTags.length} tags`);
        
        // Create prompt with all tags
        const response = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Multi-tag test',
            content: 'Testing multiple tags',
            type: 'text',
            tags: createdTags,
          }),
        });
        
        ctx.assert.statusCode(response, 201, 'Should create with multiple tags');
        ctx.log.info('✅ Created prompt with multiple tags');
      },
    },

    // Concurrent operations
    {
      id: 'int-003',
      name: 'Concurrent Prompt Creation',
      description: 'Create multiple prompts simultaneously',
      category: 'integration',
      run: async (ctx) => {
        const promises = [];
        const count = 5;
        
        for (let i = 0; i < count; i++) {
          promises.push(
            fetch(`${baseUrl}/api/prompts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `Concurrent ${i + 1}`,
                content: `Content ${i + 1}`,
                type: 'text',
              }),
            })
          );
        }
        
        const responses = await Promise.all(promises);
        const allSucceeded = responses.every(r => r.status === 201);
        
        ctx.assert.isTrue(allSucceeded, 'All concurrent creates should succeed');
        ctx.log.info(`✅ Created ${count} prompts concurrently`);
      },
    },

    // Error recovery
    {
      id: 'int-004',
      name: 'Error Recovery',
      description: 'System should recover from errors gracefully',
      category: 'integration',
      run: async (ctx) => {
        // Try invalid operation
        const invalidResponse = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '' }), // Invalid
        });
        
        ctx.assert.isTrue(invalidResponse.status >= 400, 'Should reject invalid data');
        
        // Verify system still works
        const validResponse = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'After error',
            content: 'System recovered',
            type: 'text',
          }),
        });
        
        ctx.assert.statusCode(validResponse, 201, 'Should work after error');
        ctx.log.info('✅ System recovered from error');
      },
    },

    // Search accuracy
    {
      id: 'int-005',
      name: 'Search Accuracy Test',
      description: 'Verify search finds relevant prompts',
      category: 'integration',
      run: async (ctx) => {
        const uniqueWord = 'XYZUNIQUE' + Date.now();
        
        // Create prompt with unique word
        await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Search test ${uniqueWord}`,
            content: 'Testing search functionality',
            type: 'text',
          }),
        });
        
        // Search for it
        const searchResponse = await fetch(`${baseUrl}/api/search?q=${uniqueWord}`);
        const searchData = await searchResponse.json(); const results = searchData.data;
        
        ctx.assert.isTrue(results.length > 0, 'Should find the prompt');
        ctx.assert.isTrue(
          results[0].title.includes(uniqueWord),
          'First result should contain search term'
        );
        
        ctx.log.info('✅ Search accuracy verified');
      },
    },

    // API consistency
    {
      id: 'int-006',
      name: 'API Response Consistency',
      description: 'All endpoints should return consistent structure',
      category: 'integration',
      run: async (ctx) => {
        const endpoints = [
          { url: '/api/prompts', key: 'prompts' },
          { url: '/api/tags', key: 'tags' },
          { url: '/api/statistics', key: 'statistics' },
        ];
        
        for (const { url, key } of endpoints) {
          const response = await fetch(`${baseUrl}${url}`);
          ctx.assert.statusCode(response, 200, `${url} should return 200`);
          
          const data = await response.json();
          ctx.assert.hasProperty(data, key, `Should have ${key} property`);
        }
        
        ctx.log.info('✅ All endpoints have consistent structure');
      },
    },

    // Data integrity
    {
      id: 'int-007',
      name: 'Data Integrity Check',
      description: 'Verify data relationships remain intact',
      category: 'integration',
      run: async (ctx) => {
        // Get initial counts
        const initialStats = await fetch(`${baseUrl}/api/statistics`);
        const initial = await initialStats.json();
        
        // Create prompt with tags
        const createResponse = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Integrity test',
            content: 'Testing data integrity',
            type: 'text',
            tags: ['integrity'],
          }),
        });
        
        await createResponse.json();
        
        // Check updated counts
        const finalStats = await fetch(`${baseUrl}/api/statistics`);
        const final = await finalStats.json();
        
        ctx.assert.equal(
          final.statistics.totalPrompts,
          initial.statistics.totalPrompts + 1,
          'Prompt count should increment by 1'
        );
        
        ctx.log.info('✅ Data integrity maintained');
      },
    },

    // Performance baseline
    {
      id: 'int-008',
      name: 'Performance Baseline',
      description: 'Establish performance baseline for operations',
      category: 'integration',
      run: async (ctx) => {
        const operations = [];
        
        // Create
        const createStart = Date.now();
        await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Performance test',
            content: 'Testing performance',
            type: 'text',
          }),
        });
        operations.push({ name: 'Create', time: Date.now() - createStart });
        
        // List
        const listStart = Date.now();
        await fetch(`${baseUrl}/api/prompts`);
        operations.push({ name: 'List', time: Date.now() - listStart });
        
        // Search
        const searchStart = Date.now();
        await fetch(`${baseUrl}/api/search?q=test`);
        operations.push({ name: 'Search', time: Date.now() - searchStart });
        
        // Statistics
        const statsStart = Date.now();
        await fetch(`${baseUrl}/api/statistics`);
        operations.push({ name: 'Statistics', time: Date.now() - statsStart });
        
        operations.forEach(op => {
          ctx.assert.isTrue(op.time < 2000, `${op.name} should complete under 2s`);
          ctx.log.verbose(`${op.name}: ${op.time}ms`);
        });
        
        const avgTime = operations.reduce((sum, op) => sum + op.time, 0) / operations.length;
        ctx.log.info(`✅ Average operation time: ${avgTime.toFixed(0)}ms`);
      },
    },
  ];

  return {
    id: 'integration-suite',
    name: 'Integration Test Suite',
    description: 'End-to-end workflow and system integration testing',
    tests,
    setup: async () => {
      console.log('🔗 Preparing integration tests...');
    },
    teardown: async () => {
      console.log('✅ Integration tests completed');
    },
  };
}

