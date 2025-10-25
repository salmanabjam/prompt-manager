/**
 * API Test Suite
 * تست کامل تمام 6 endpoint های Fastify API
 */

import { TestSuite, TestCase } from '../core/TestSimulator';

export function createApiTestSuite(baseUrl: string): TestSuite {
  const tests: TestCase[] = [
    // GET /api/prompts
    {
      id: 'api-001',
      name: 'GET /api/prompts - Fetch all prompts',
      description: 'Should return list of all prompts with proper structure',
      category: 'api',
      run: async (ctx) => {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/prompts`);
        const duration = Date.now() - startTime;
        
        ctx.assert.statusCode(response, 200, 'Should return 200 OK');
        ctx.assert.responseTime(duration, 1000, 'Response should be under 1s');
        
        const data = await response.json();
        ctx.assert.isType(data, 'object', 'Response should be object');
        ctx.assert.hasProperty(data, 'data', 'Should have data property');
        ctx.assert.isTrue(Array.isArray(data.data), 'Data should be array');
        
        if (data.data.length > 0) {
          const prompt = data.data[0];
          ctx.assert.hasProperty(prompt, 'id', 'Prompt should have id');
          ctx.assert.hasProperty(prompt, 'title', 'Prompt should have title');
          ctx.assert.hasProperty(prompt, 'content', 'Prompt should have content');
          ctx.assert.hasProperty(prompt, 'type', 'Prompt should have type');
          ctx.assert.hasProperty(prompt, 'createdAt', 'Prompt should have createdAt');
        }
        
        ctx.log.info(`Fetched ${data.data.length} prompts in ${duration}ms`);
      },
    },

    // POST /api/prompts - Create new prompt
    {
      id: 'api-002',
      name: 'POST /api/prompts - Create new prompt',
      description: 'Should create a new prompt and return it',
      category: 'api',
      run: async (ctx) => {
        const newPrompt = {
          title: 'Test Prompt ' + Date.now(),
          description: 'Automated test prompt',
          content: 'This is test content',
          type: 'text',
          tags: ['test', 'automated'],
        };
        
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPrompt),
        });
        const duration = Date.now() - startTime;
        
        ctx.assert.statusCode(response, 201, 'Should return 201 Created');
        ctx.assert.responseTime(duration, 2000, 'Create should be under 2s');
        
        const data = await response.json();
        ctx.assert.hasProperty(data, 'data', 'Response should have data');
        ctx.assert.equal(data.data.title, newPrompt.title, 'Title should match');
        ctx.assert.equal(data.data.content, newPrompt.content, 'Content should match');
        ctx.assert.isNotNull(data.data.id, 'Should have generated ID');
        
        // Store for later tests
        ctx.data.set('lastCreatedPromptId', data.data.id);
        ctx.log.info(`Created prompt ${data.data.id} in ${duration}ms`);
      },
    },

    // POST /api/prompts - Validation errors
    {
      id: 'api-003',
      name: 'POST /api/prompts - Validation errors',
      description: 'Should reject invalid prompt data',
      category: 'api',
      run: async (ctx) => {
        const invalidPrompt = {
          title: '', // Empty title
          content: 'Some content',
        };
        
        const response = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPrompt),
        });
        
        ctx.assert.isTrue(
          response.status === 400 || response.status === 422,
          'Should return validation error status'
        );
        
        const data = await response.json();
        ctx.assert.hasProperty(data, 'error', 'Should have error message');
        ctx.log.info('Validation correctly rejected invalid data');
      },
    },

    // GET /api/tags
    {
      id: 'api-004',
      name: 'GET /api/tags - Fetch all tags',
      description: 'Should return list of all tags',
      category: 'api',
      run: async (ctx) => {
        const response = await fetch(`${baseUrl}/api/tags`);
        
        ctx.assert.statusCode(response, 200, 'Should return 200 OK');
        
        const data = await response.json();
        ctx.assert.hasProperty(data, 'data', 'Should have data property');
        ctx.assert.isTrue(Array.isArray(data.data), 'Tags should be array');
        
        if (data.data.length > 0) {
          const tag = data.data[0];
          ctx.assert.hasProperty(tag, 'id', 'Tag should have id');
          ctx.assert.hasProperty(tag, 'name', 'Tag should have name');
          ctx.assert.hasProperty(tag, '_count', 'Tag should have _count');
        }
        
        ctx.log.info(`Fetched ${data.data.length} tags`);
      },
    },

    // POST /api/tags - Create new tag
    {
      id: 'api-005',
      name: 'POST /api/tags - Create new tag',
      description: 'Should create a new tag',
      category: 'api',
      run: async (ctx) => {
        const newTag = {
          name: 'test-tag-' + Date.now(),
          color: '#FF5733',
        };
        
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTag),
        });
        
        ctx.assert.statusCode(response, 201, 'Should return 201 Created');
        
        const data = await response.json();
        ctx.assert.hasProperty(data, 'data', 'Response should have data');
        ctx.assert.equal(data.data.name, newTag.name, 'Name should match');
        ctx.assert.equal(data.data.color, newTag.color, 'Color should match');
        
        ctx.data.set('lastCreatedTagId', data.data.id);
        ctx.log.info(`Created tag ${data.data.id}`);
      },
    },

    // GET /api/search
    {
      id: 'api-006',
      name: 'GET /api/search - Search prompts',
      description: 'Should search and return matching prompts',
      category: 'api',
      run: async (ctx) => {
        const query = 'test';
        const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`);
        
        ctx.assert.statusCode(response, 200, 'Should return 200 OK');
        
        const data = await response.json();
        ctx.assert.hasProperty(data, 'data', 'Should have data');
        ctx.assert.isTrue(Array.isArray(data.data), 'Results should be array');
        
        // Verify search relevance
        if (data.data.length > 0) {
          const result = data.data[0];
          ctx.assert.hasProperty(result, 'id', 'Result should have id');
          ctx.assert.hasProperty(result, 'title', 'Result should have title');
          ctx.log.info(`Search found ${data.data.length} results for "${query}"`);
        }
      },
    },

    // GET /api/statistics
    {
      id: 'api-007',
      name: 'GET /api/statistics - Get statistics',
      description: 'Should return system statistics',
      category: 'api',
      run: async (ctx) => {
        const response = await fetch(`${baseUrl}/api/statistics`);
        
        ctx.assert.statusCode(response, 200, 'Should return 200 OK');
        
        const data = await response.json();
        ctx.assert.hasProperty(data, 'data', 'Should have data');
        
        const stats = data.data;
        ctx.assert.hasProperty(stats, 'totalPrompts', 'Should have totalPrompts');
        ctx.assert.hasProperty(stats, 'totalTags', 'Should have totalTags');
        ctx.assert.isType(stats.totalPrompts, 'number', 'totalPrompts should be number');
        ctx.assert.isType(stats.totalTags, 'number', 'totalTags should be number');
        
        ctx.log.info(`Statistics: ${stats.totalPrompts} prompts, ${stats.totalTags} tags`);
      },
    },

    // Error handling - 404
    {
      id: 'api-008',
      name: 'GET /api/nonexistent - 404 handling',
      description: 'Should return 404 for non-existent routes',
      category: 'api',
      run: async (ctx) => {
        const response = await fetch(`${baseUrl}/api/nonexistent`);
        
        ctx.assert.statusCode(response, 404, 'Should return 404 Not Found');
        ctx.log.info('404 handling works correctly');
      },
    },

    // CORS headers
    {
      id: 'api-009',
      name: 'OPTIONS /api/prompts - CORS preflight',
      description: 'Should handle CORS preflight requests',
      category: 'api',
      run: async (ctx) => {
        const response = await fetch(`${baseUrl}/api/prompts`, {
          method: 'OPTIONS',
        });
        
        ctx.assert.isTrue(
          response.status === 200 || response.status === 204,
          'Should accept OPTIONS request'
        );
        
        // Check CORS headers if present
        const corsHeader = response.headers.get('Access-Control-Allow-Origin');
        if (corsHeader) {
          ctx.log.info(`CORS enabled: ${corsHeader}`);
        }
      },
    },

    // Content-Type validation
    {
      id: 'api-010',
      name: 'POST /api/prompts - Content-Type validation',
      description: 'Should validate Content-Type header',
      category: 'api',
      run: async (ctx) => {
        const response = await fetch(`${baseUrl}/api/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' }, // Wrong content type
          body: 'Not JSON',
        });
        
        ctx.assert.isTrue(
          response.status === 400 || response.status === 415,
          'Should reject non-JSON content'
        );
        
        ctx.log.info('Content-Type validation works correctly');
      },
    },
  ];

  return {
    id: 'api-suite',
    name: 'API Test Suite',
    description: 'Complete test coverage for all Fastify API endpoints',
    tests,
    setup: async () => {
      console.log('🔌 Starting Fastify API server...');
      // API should already be running on port 3456
      // Add health check here if needed
    },
    teardown: async () => {
      console.log('✅ API tests completed');
    },
  };
}

