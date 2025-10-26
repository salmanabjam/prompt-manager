/**
 * Test Runner - Entry Point
 * اجرای کامل تمام Test Suite ها
 */

import { TestSimulator } from './core/TestSimulator';
import { createApiTestSuite } from './suites/api.suite';
import { createIntegrationTestSuite } from './suites/integration.suite';
import { createFavoritesTestSuite } from './suites/favorites.suite';

async function main() {
  console.log('🚀 Prompt Management System - Test Simulator');
  console.log('═'.repeat(80));
  console.log('');

  // Configuration
  const config = {
    apiBaseUrl: process.env.API_URL || 'http://localhost:3456',
    databasePath: './prisma/prompts.db',
    concurrentTests: 1, // Run sequentially for now
    timeout: 30000,
    retryAttempts: 0,
    logLevel: (process.env.LOG_LEVEL || 'info') as any,
    generateReport: true,
    reportFormat: 'all' as any,
  };

  // Create simulator
  const simulator = new TestSimulator(config);

  // Register test suites
  console.log('📦 Registering test suites...\n');
  
  simulator.suite(createApiTestSuite(config.apiBaseUrl));
  simulator.suite(createIntegrationTestSuite(config.apiBaseUrl));
  simulator.suite(createFavoritesTestSuite(config.apiBaseUrl));

  console.log('');

  // Run tests
  try {
    const results = await simulator.run();
    
    // Exit with appropriate code
    const failed = results.filter(r => r.status === 'failed').length;
    const exitCode = failed > 0 ? 1 : 0;
    
    console.log('');
    if (exitCode === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log(`❌ ${failed} test(s) failed`);
    }
    
    process.exit(exitCode);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run
main();
