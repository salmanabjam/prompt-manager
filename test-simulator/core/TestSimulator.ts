/**
 * Advanced Test Simulator for Prompt Management System
 * ساخته شده برای تست کامل و خودکار تمامی عملکردها
 */

import { EventEmitter } from 'events';

export interface TestConfig {
  apiBaseUrl: string;
  databasePath: string;
  concurrentTests: number;
  timeout: number;
  retryAttempts: number;
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  generateReport: boolean;
  reportFormat: 'json' | 'html' | 'csv' | 'all';
}

export interface TestResult {
  id: string;
  name: string;
  category: 'api' | 'database' | 'integration' | 'performance' | 'stress';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration: number;
  startTime: Date;
  endTime?: Date;
  error?: Error;
  details?: any;
  assertions: {
    total: number;
    passed: number;
    failed: number;
  };
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestResult['category'];
  timeout?: number;
  skip?: boolean;
  only?: boolean;
  run: (context: TestContext) => Promise<void>;
}

export interface TestContext {
  assert: AssertionHelpers;
  log: Logger;
  data: Map<string, any>;
  config: TestConfig;
}

export interface AssertionHelpers {
  equal: (actual: any, expected: any, message?: string) => void;
  notEqual: (actual: any, expected: any, message?: string) => void;
  deepEqual: (actual: any, expected: any, message?: string) => void;
  strictEqual: (actual: any, expected: any, message?: string) => void;
  isTrue: (value: boolean, message?: string) => void;
  isFalse: (value: boolean, message?: string) => void;
  isNull: (value: any, message?: string) => void;
  isNotNull: (value: any, message?: string) => void;
  isDefined: (value: any, message?: string) => void;
  isUndefined: (value: any, message?: string) => void;
  includes: (haystack: any[], needle: any, message?: string) => void;
  matches: (value: string, regex: RegExp, message?: string) => void;
  throws: (fn: () => void, message?: string) => void;
  doesNotThrow: (fn: () => void, message?: string) => void;
  isEmpty: (value: any, message?: string) => void;
  isNotEmpty: (value: any, message?: string) => void;
  lengthOf: (value: any[], length: number, message?: string) => void;
  hasProperty: (obj: any, property: string, message?: string) => void;
  isType: (value: any, type: string, message?: string) => void;
  // HTTP specific assertions
  statusCode: (response: any, code: number, message?: string) => void;
  hasHeader: (response: any, header: string, message?: string) => void;
  jsonSchema: (data: any, schema: any, message?: string) => void;
  responseTime: (duration: number, maxTime: number, message?: string) => void;
}

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  verbose: (message: string, ...args: any[]) => void;
}

export class TestSimulator extends EventEmitter {
  private config: TestConfig;
  private suites: Map<string, TestSuite> = new Map();
  private results: TestResult[] = [];
  private globalData: Map<string, any> = new Map();
  private logger: Logger;
  private startTime?: Date;
  private endTime?: Date;

  constructor(config: Partial<TestConfig> = {}) {
    super();
    
    this.config = {
      apiBaseUrl: 'http://localhost:3456',
      databasePath: './prisma/prompts.db',
      concurrentTests: 5,
      timeout: 30000,
      retryAttempts: 3,
      logLevel: 'info',
      generateReport: true,
      reportFormat: 'all',
      ...config,
    };

    this.logger = this.createLogger();
    this.setupEventHandlers();
  }

  private createLogger(): Logger {
    const levels = ['silent', 'error', 'warn', 'info', 'debug', 'verbose'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);

    const shouldLog = (level: string) => {
      return levels.indexOf(level) <= currentLevelIndex;
    };

    const formatMessage = (level: string, message: string, ...args: any[]) => {
      const timestamp = new Date().toISOString();
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        verbose: '📝',
      }[level] || '•';
      
      const formattedArgs = args.length > 0 ? ' ' + JSON.stringify(args, null, 2) : '';
      return `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}${formattedArgs}`;
    };

    return {
      debug: (message, ...args) => {
        if (shouldLog('debug')) {
          console.log(formatMessage('debug', message, ...args));
        }
      },
      info: (message, ...args) => {
        if (shouldLog('info')) {
          console.log(formatMessage('info', message, ...args));
        }
      },
      warn: (message, ...args) => {
        if (shouldLog('warn')) {
          console.warn(formatMessage('warn', message, ...args));
        }
      },
      error: (message, ...args) => {
        if (shouldLog('error')) {
          console.error(formatMessage('error', message, ...args));
        }
      },
      verbose: (message, ...args) => {
        if (shouldLog('verbose')) {
          console.log(formatMessage('verbose', message, ...args));
        }
      },
    };
  }

  private setupEventHandlers() {
    this.on('suite:start', (suite: TestSuite) => {
      this.logger.info(`📦 Suite Started: ${suite.name}`);
    });

    this.on('suite:end', (suite: TestSuite) => {
      this.logger.info(`✅ Suite Completed: ${suite.name}`);
    });

    this.on('test:start', (test: TestCase) => {
      this.logger.debug(`🧪 Test Started: ${test.name}`);
    });

    this.on('test:pass', (result: TestResult) => {
      this.logger.info(`✅ Test Passed: ${result.name} (${result.duration}ms)`);
    });

    this.on('test:fail', (result: TestResult) => {
      this.logger.error(`❌ Test Failed: ${result.name}`, result.error?.message);
    });

    this.on('test:skip', (test: TestCase) => {
      this.logger.warn(`⏭️  Test Skipped: ${test.name}`);
    });
  }

  /**
   * Register a test suite
   */
  public suite(suite: TestSuite): void {
    this.suites.set(suite.id, suite);
    this.logger.debug(`Registered suite: ${suite.name} (${suite.tests.length} tests)`);
  }

  /**
   * Run all registered test suites
   */
  public async run(): Promise<TestResult[]> {
    this.startTime = new Date();
    this.results = [];
    
    this.logger.info('🚀 Starting Test Simulator...');
    this.logger.info(`Configuration: ${JSON.stringify(this.config, null, 2)}`);
    
    try {
      for (const [id, suite] of this.suites) {
        await this.runSuite(suite);
      }
      
      this.endTime = new Date();
      this.logger.info('🏁 All tests completed');
      
      await this.generateReports();
      this.printSummary();
      
      return this.results;
    } catch (error) {
      this.logger.error('Fatal error during test execution', error);
      throw error;
    }
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite): Promise<void> {
    this.emit('suite:start', suite);
    
    try {
      // Setup
      if (suite.setup) {
        this.logger.debug(`Running setup for suite: ${suite.name}`);
        await suite.setup();
      }

      // Run tests
      const testsToRun = suite.tests.filter(t => !t.skip);
      const onlyTests = testsToRun.filter(t => t.only);
      const finalTests = onlyTests.length > 0 ? onlyTests : testsToRun;

      for (const test of finalTests) {
        await this.runTest(test, suite);
      }

      // Teardown
      if (suite.teardown) {
        this.logger.debug(`Running teardown for suite: ${suite.name}`);
        await suite.teardown();
      }

      this.emit('suite:end', suite);
    } catch (error) {
      this.logger.error(`Suite failed: ${suite.name}`, error);
      throw error;
    }
  }

  /**
   * Run a single test case
   */
  private async runTest(test: TestCase, suite: TestSuite): Promise<void> {
    if (test.skip) {
      this.emit('test:skip', test);
      this.results.push({
        id: test.id,
        name: test.name,
        category: test.category,
        status: 'skipped',
        duration: 0,
        startTime: new Date(),
        assertions: { total: 0, passed: 0, failed: 0 },
      });
      return;
    }

    const result: TestResult = {
      id: test.id,
      name: test.name,
      category: test.category,
      status: 'running',
      duration: 0,
      startTime: new Date(),
      assertions: { total: 0, passed: 0, failed: 0 },
    };

    this.emit('test:start', test);

    const timeout = test.timeout || this.config.timeout;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
    });

    try {
      const context = this.createTestContext(result);
      await Promise.race([test.run(context), timeoutPromise]);
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.status = 'passed';
      
      this.emit('test:pass', result);
    } catch (error) {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.status = 'failed';
      result.error = error as Error;
      
      this.emit('test:fail', result);
    }

    this.results.push(result);
  }

  /**
   * Create test context with assertion helpers
   */
  private createTestContext(result: TestResult): TestContext {
    const assert: AssertionHelpers = {
      equal: (actual, expected, message) => {
        result.assertions.total++;
        if (actual == expected) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected ${actual} to equal ${expected}`);
        }
      },
      notEqual: (actual, expected, message) => {
        result.assertions.total++;
        if (actual != expected) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected ${actual} to not equal ${expected}`);
        }
      },
      deepEqual: (actual, expected, message) => {
        result.assertions.total++;
        if (JSON.stringify(actual) === JSON.stringify(expected)) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Deep equality failed`);
        }
      },
      strictEqual: (actual, expected, message) => {
        result.assertions.total++;
        if (actual === expected) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected ${actual} to strictly equal ${expected}`);
        }
      },
      isTrue: (value, message) => {
        result.assertions.total++;
        if (value === true) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected true but got ${value}`);
        }
      },
      isFalse: (value, message) => {
        result.assertions.total++;
        if (value === false) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected false but got ${value}`);
        }
      },
      isNull: (value, message) => {
        result.assertions.total++;
        if (value === null) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected null but got ${value}`);
        }
      },
      isNotNull: (value, message) => {
        result.assertions.total++;
        if (value !== null) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected not null`);
        }
      },
      isDefined: (value, message) => {
        result.assertions.total++;
        if (value !== undefined) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected defined value`);
        }
      },
      isUndefined: (value, message) => {
        result.assertions.total++;
        if (value === undefined) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected undefined but got ${value}`);
        }
      },
      includes: (haystack, needle, message) => {
        result.assertions.total++;
        if (haystack.includes(needle)) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected array to include ${needle}`);
        }
      },
      matches: (value, regex, message) => {
        result.assertions.total++;
        if (regex.test(value)) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected ${value} to match ${regex}`);
        }
      },
      throws: (fn, message) => {
        result.assertions.total++;
        try {
          fn();
          result.assertions.failed++;
          throw new Error(message || `Expected function to throw`);
        } catch (error) {
          result.assertions.passed++;
        }
      },
      doesNotThrow: (fn, message) => {
        result.assertions.total++;
        try {
          fn();
          result.assertions.passed++;
        } catch (error) {
          result.assertions.failed++;
          throw new Error(message || `Expected function not to throw`);
        }
      },
      isEmpty: (value, message) => {
        result.assertions.total++;
        const empty = Array.isArray(value) ? value.length === 0 : 
                     typeof value === 'object' ? Object.keys(value).length === 0 :
                     !value;
        if (empty) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected empty value`);
        }
      },
      isNotEmpty: (value, message) => {
        result.assertions.total++;
        const empty = Array.isArray(value) ? value.length === 0 : 
                     typeof value === 'object' ? Object.keys(value).length === 0 :
                     !value;
        if (!empty) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected non-empty value`);
        }
      },
      lengthOf: (value, length, message) => {
        result.assertions.total++;
        if (value.length === length) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected length ${length} but got ${value.length}`);
        }
      },
      hasProperty: (obj, property, message) => {
        result.assertions.total++;
        if (property in obj) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected object to have property ${property}`);
        }
      },
      isType: (value, type, message) => {
        result.assertions.total++;
        if (typeof value === type) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected type ${type} but got ${typeof value}`);
        }
      },
      statusCode: (response, code, message) => {
        result.assertions.total++;
        if (response.status === code) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected status ${code} but got ${response.status}`);
        }
      },
      hasHeader: (response, header, message) => {
        result.assertions.total++;
        if (response.headers && header in response.headers) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Expected header ${header}`);
        }
      },
      jsonSchema: (data, schema, message) => {
        result.assertions.total++;
        // Simple schema validation - can be extended with ajv
        const valid = Object.keys(schema).every(key => key in data);
        if (valid) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `JSON schema validation failed`);
        }
      },
      responseTime: (duration, maxTime, message) => {
        result.assertions.total++;
        if (duration <= maxTime) {
          result.assertions.passed++;
        } else {
          result.assertions.failed++;
          throw new Error(message || `Response time ${duration}ms exceeded ${maxTime}ms`);
        }
      },
    };

    return {
      assert,
      log: this.logger,
      data: this.globalData,
      config: this.config,
    };
  }

  /**
   * Generate test reports
   */
  private async generateReports(): Promise<void> {
    if (!this.config.generateReport) return;

    this.logger.info('📊 Generating reports...');
    
    // Will be implemented in ReportGenerator class
    this.emit('reports:start');
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    
    const totalDuration = this.endTime && this.startTime 
      ? this.endTime.getTime() - this.startTime.getTime()
      : 0;

    const totalAssertions = this.results.reduce((sum, r) => sum + r.assertions.total, 0);
    const passedAssertions = this.results.reduce((sum, r) => sum + r.assertions.passed, 0);
    const failedAssertions = this.results.reduce((sum, r) => sum + r.assertions.failed, 0);

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`\nAssertions: ${passedAssertions}/${totalAssertions} passed`);
    console.log(`Duration: ${(totalDuration/1000).toFixed(2)}s`);
    console.log('='.repeat(80) + '\n');

    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  • ${r.name}: ${r.error?.message}`);
      });
      console.log('');
    }
  }

  /**
   * Get test results
   */
  public getResults(): TestResult[] {
    return this.results;
  }

  /**
   * Get statistics
   */
  public getStatistics() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    
    const byCategory = {
      api: this.results.filter(r => r.category === 'api'),
      database: this.results.filter(r => r.category === 'database'),
      integration: this.results.filter(r => r.category === 'integration'),
      performance: this.results.filter(r => r.category === 'performance'),
      stress: this.results.filter(r => r.category === 'stress'),
    };

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: (passed / total) * 100,
      byCategory,
      avgDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / total,
    };
  }
}
